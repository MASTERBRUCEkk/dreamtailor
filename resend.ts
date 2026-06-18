import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const BREATHING_EXERCISE = `Let's take three slow breaths together before sleep. Breathe in for four counts... hold for two... and breathe out for six. One more time. And one more. Good. Sweet dreams.`;

export async function sendStoryEmail(input: {
  storyId: string;
  to: string;
  cc?: string[];
  parentName?: string | null;
  childName: string;
  title: string;
  story: string;
  affirmation?: string;
  discussionQuestions?: string[];
  coloringPrompt?: string;
  audioUrl?: string | null;
  pdfUrl?: string | null;
  readUrl?: string | null;
}) {
  const {
    storyId,
    to,
    cc,
    parentName,
    childName,
    title,
    story,
    affirmation,
    discussionQuestions,
    coloringPrompt,
    audioUrl,
    pdfUrl,
    readUrl,
  } = input;

  const wordCount = story.split(/\s+/).length;
  const readingMinutes = Math.max(2, Math.round(wordCount / 150));

  const safeParentName = escapeHtml(parentName || "there");
  const safeChildName = escapeHtml(childName);
  const safeTitle = escapeHtml(title);
  const safeStory = escapeHtml(story);

  const actionLinks: string[] = [];
  if (readUrl) actionLinks.push(`<a href="${readUrl}" style="margin-right:16px;">Read now</a>`);
  if (audioUrl) actionLinks.push(`<a href="${audioUrl}" style="margin-right:16px;">Listen now</a>`);
  if (pdfUrl) actionLinks.push(`<a href="${pdfUrl}">Download PDF</a>`);

  const discussionHtml =
    discussionQuestions && discussionQuestions.length
      ? `<div style="margin-top:24px; padding:16px; background:#f4f1ea; border-radius:8px;">
           <p style="margin:0 0 8px; font-weight:bold;">Talk about it</p>
           <ul style="margin:0; padding-left:20px;">
             ${discussionQuestions.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}
           </ul>
         </div>`
      : "";

  const coloringHtml = coloringPrompt
    ? `<p style="margin-top:16px; color:#555;"><em>Coloring page idea: ${escapeHtml(coloringPrompt)}</em></p>`
    : "";

  const affirmationHtml = affirmation
    ? `<p style="margin-top:20px; font-style:italic; color:#7a4a3a;">"${escapeHtml(affirmation)}"</p>`
    : "";

  const html = `
    <div style="font-family: Georgia, serif; max-width:560px; margin:0 auto; padding:24px; color:#1a1a2e;">
      <p>Hi ${safeParentName},</p>
      <p>Tonight's story for ${safeChildName} is ready — about ${readingMinutes} minute${readingMinutes === 1 ? "" : "s"} to read aloud.</p>
      ${actionLinks.length ? `<p>${actionLinks.join(" ")}</p>` : ""}
      <h2 style="font-style:italic; font-weight:500;">${safeTitle}</h2>
      <p style="white-space:pre-wrap; line-height:1.7;">${safeStory}</p>
      ${affirmationHtml}
      ${discussionHtml}
      ${coloringHtml}
      <p style="margin-top:24px; padding-top:16px; border-top:1px solid #ddd; color:#555;">
        ${BREATHING_EXERCISE}
      </p>
      <p>— DreamTailor</p>
    </div>
  `;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "stories@dreamtailor.app",
    to,
    cc: cc && cc.length ? cc : undefined,
    subject: `Tonight's story for ${childName}: ${title}`,
    html,
    tags: [{ name: "story_id", value: storyId }],
    // Open tracking itself is enabled per-domain in the Resend dashboard
    // (Settings → your domain → Open tracking), not per-send.
  });
}
