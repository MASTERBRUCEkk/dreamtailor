import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendStoryEmail(input: {
  to: string;
  parentName?: string | null;
  childName: string;
  title: string;
  story: string;
}) {
  const { to, parentName, childName, title, story } = input;
  const wordCount = story.split(/\s+/).length;
  const readingMinutes = Math.max(2, Math.round(wordCount / 150));

  const safeParentName = escapeHtml(parentName || "there");
  const safeChildName = escapeHtml(childName);
  const safeTitle = escapeHtml(title);
  const safeStory = escapeHtml(story);

  const html = `
    <div style="font-family: Georgia, serif; max-width:560px; margin:0 auto; padding:24px; color:#1a1a2e;">
      <p>Hi ${safeParentName},</p>
      <p>Tonight's story for ${safeChildName} is ready — about ${readingMinutes} minute${readingMinutes === 1 ? "" : "s"} to read aloud.</p>
      <h2 style="font-style:italic; font-weight:500;">${safeTitle}</h2>
      <p style="white-space:pre-wrap; line-height:1.7;">${safeStory}</p>
      <p>— DreamTailor</p>
    </div>
  `;

  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "stories@dreamtailor.app",
    to,
    subject: `Tonight's story for ${childName}: ${title}`,
    html,
  });
}
