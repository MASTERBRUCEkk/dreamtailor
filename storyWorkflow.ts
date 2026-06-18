import { createServiceClient } from "@/lib/supabase/server";
import { generateStory, moderateText } from "@/lib/openai";
import { sendStoryEmail } from "@/lib/resend";
import { generateAndUploadAudio } from "@/lib/tts";
import { getPlanLimits } from "@/lib/plans";

type ChildRow = {
  id: string;
  name: string;
  age: number;
  favorite_animal: string | null;
  parent_id: string;
  language: string;
  voice: string;
  story_memory: string | null;
  custom_character: any;
  grandparent_emails: string[];
};

type ParentRow = { name: string | null; email: string };

export type WorkflowResult =
  | { ok: true; storyId: string }
  | {
      ok: false;
      reason: "quota_exceeded" | "flagged" | "error";
      message: string;
    };

export async function runStoryWorkflow(input: {
  child: ChildRow;
  parent: ParentRow;
  plan: string;
  mood?: string;
  lessonTopic?: string;
}): Promise<WorkflowResult> {
  const supabase = createServiceClient();
  const { child, parent, plan } = input;

  const limits = getPlanLimits(plan);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: storiesThisWeek } = await supabase
    .from("stories")
    .select("id", { count: "exact", head: true })
    .eq("child_id", child.id)
    .not("sent_at", "is", null)
    .gte("sent_at", sevenDaysAgo);

  if ((storiesThisWeek || 0) >= limits.maxStoriesPerWeek) {
    return {
      ok: false,
      reason: "quota_exceeded",
      message: `The ${limits.label} plan includes ${limits.maxStoriesPerWeek} stories a week, and that's been used up for now.`,
    };
  }

  const { data: pendingMemory } = await supabase
    .from("family_memories")
    .select("id, note")
    .eq("child_id", child.id)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Input moderation: check every free-text field a parent typed in
  // *before* it ever reaches the prompt, not just the story afterward.
  const inputsToCheck: Array<{ label: string; text: string | undefined | null }> = [
    { label: "favorite animal", text: child.favorite_animal },
    { label: "custom character", text: child.custom_character?.description },
    { label: "family memory note", text: pendingMemory?.note },
    { label: "lesson topic", text: input.lessonTopic },
  ];

  for (const field of inputsToCheck) {
    if (!field.text) continue;
    const fieldModeration = await moderateText(field.text);
    await supabase.from("moderation_logs").insert({
      child_id: child.id,
      target: "input",
      flagged: fieldModeration.flagged,
      categories: fieldModeration.categories,
    });
    if (fieldModeration.flagged) {
      return {
        ok: false,
        reason: "flagged",
        message: `The ${field.label} you entered couldn't be used — try rewording it.`,
      };
    }
  }

  try {
    const result = await generateStory({
      childName: child.name,
      age: child.age,
      favoriteAnimal: child.favorite_animal,
      mood: input.mood,
      language: child.language,
      storyMemory: child.story_memory,
      customCharacter: child.custom_character,
      familyMemoryNote: pendingMemory?.note,
      lessonTopic: input.lessonTopic,
    });

    const moderation = await moderateText(result.story);
    await supabase.from("moderation_logs").insert({
      child_id: child.id,
      target: "output",
      flagged: moderation.flagged,
      categories: moderation.categories,
    });

    if (moderation.flagged) {
      await supabase.from("flagged_stories").insert({
        child_id: child.id,
        title: result.title,
        content: result.story,
        moderation_categories: moderation.categories,
      });
      return {
        ok: false,
        reason: "flagged",
        message: "Tonight's story was held for review instead of being sent.",
      };
    }

    const { data: saved, error: saveError } = await supabase
      .from("stories")
      .insert({
        child_id: child.id,
        title: result.title,
        content: result.story,
        mood: input.mood || null,
        lesson_topic: input.lessonTopic || null,
        affirmation: result.affirmation,
        discussion_questions: result.discussionQuestions,
        coloring_prompt: result.coloringPrompt,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Audio is best-effort — a failure here shouldn't block the email.
    let audioUrl: string | null = null;
    try {
      audioUrl = await generateAndUploadAudio({
        storyId: saved.id,
        text: result.story,
        voice: child.voice,
      });
      await supabase.from("stories").update({ audio_url: audioUrl }).eq("id", saved.id);
    } catch (audioErr) {
      console.error("Audio generation failed, continuing without it:", audioErr);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    await sendStoryEmail({
      storyId: saved.id,
      to: parent.email,
      cc: child.grandparent_emails,
      parentName: parent.name,
      childName: child.name,
      title: result.title,
      story: result.story,
      affirmation: result.affirmation,
      discussionQuestions: result.discussionQuestions,
      coloringPrompt: result.coloringPrompt,
      audioUrl,
      pdfUrl: `${appUrl}/api/stories/${saved.id}/pdf`,
      readUrl: `${appUrl}/read/${saved.id}`,
    });

    await supabase.from("stories").update({ sent_at: new Date().toISOString() }).eq("id", saved.id);

    if (result.memoryUpdate) {
      await supabase.from("children").update({ story_memory: result.memoryUpdate }).eq("id", child.id);
    }
    if (pendingMemory) {
      await supabase.from("family_memories").update({ used: true }).eq("id", pendingMemory.id);
    }

    return { ok: true, storyId: saved.id };
  } catch (err: any) {
    return { ok: false, reason: "error", message: err.message || "Could not generate tonight's story" };
  }
}
