import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AUDIO_BUCKET = "story-audio";

// Requires a public Storage bucket named "story-audio" in Supabase
// (Storage → New bucket → name it exactly this → make it public).
// See README "Setting up audio narration."
export async function generateAndUploadAudio(input: {
  storyId: string;
  text: string;
  voice?: string;
}) {
  const voice = input.voice || "alloy";

  const speech = await openai.audio.speech.create({
    model: "tts-1",
    voice: voice as any,
    input: input.text,
  });

  const buffer = Buffer.from(await speech.arrayBuffer());
  const path = `${input.storyId}.mp3`;

  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, buffer, { contentType: "audio/mpeg", upsert: true });

  if (error) {
    throw new Error(`Audio upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
