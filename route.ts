import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runStoryWorkflow } from "@/lib/storyWorkflow";
import { getLocalTimeParts, isWithinSendWindow } from "@/lib/schedule";

// Runs every 15 minutes (see vercel.json). For each tick, checks every
// active child to see whether it's currently within 15 minutes of their
// local bedtime, and that they haven't already been sent one today.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: activeSubs } = await supabase
    .from("subscriptions")
    .select("parent_id, plan, status")
    .in("status", ["active", "trialing"]);

  if (!activeSubs || activeSubs.length === 0) {
    return NextResponse.json({ sent: 0, note: "No active subscriptions." });
  }

  const planByParent = new Map(activeSubs.map((s) => [s.parent_id, s.plan]));
  const activeParentIds = activeSubs.map((s) => s.parent_id);

  const { data: children } = await supabase
    .from("children")
    .select(
      "id, name, age, favorite_animal, parent_id, timezone, bedtime, last_sent_date, language, voice, story_memory, custom_character, grandparent_emails, profiles ( name, email )"
    )
    .in("parent_id", activeParentIds);

  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const child of children || []) {
    const parent = (child as any).profiles;
    if (!parent?.email) continue;

    const { dateStr, minutesSinceMidnight } = getLocalTimeParts(child.timezone);

    if (child.last_sent_date === dateStr) {
      continue; // already sent today, local time
    }
    if (!isWithinSendWindow(child.bedtime, minutesSinceMidnight)) {
      skipped++;
      continue; // not bedtime yet for this child
    }

    const plan = planByParent.get(child.parent_id) || "starter";

    const result = await runStoryWorkflow({ child: child as any, parent, plan });

    if (result.ok) {
      sent++;
      await supabase.from("children").update({ last_sent_date: dateStr }).eq("id", child.id);
    } else if (result.reason !== "quota_exceeded") {
      // Quota hits are expected and not failures worth logging loudly.
      failures.push(`${child.id}: ${result.message}`);
    }
  }

  return NextResponse.json({ sent, skipped, failures });
}
