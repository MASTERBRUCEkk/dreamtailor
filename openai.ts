import OpenAI from "openai";

// To switch to Gemini: replace this client and the call below.
// Nothing outside this file needs to change — every route imports
// generateStory(), not OpenAI directly.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SAFETY_SYSTEM_PROMPT = `You write short bedtime stories for young children, ages 2 to 10.

Hard rules — never include any of the following, under any circumstance:
- violence or threats of violence
- scary, frightening, or suspenseful content
- romantic or sexual content of any kind
- unsafe behavior a child could imitate (e.g. talking to strangers, climbing somewhere dangerous)
- negative stereotypes about any group of people
- real brand names or copyrighted characters

Every story must:
- naturally include the child's name
- use age-appropriate language for the stated age
- carry one small, positive lesson, shown through the story rather than stated as a moral
- have a clear beginning, middle, and end
- end calmly, in a way that helps a child settle down to sleep

Keep the story between 500 and 800 words.`;

export async function generateStory(input: {
  childName: string;
  age: number;
  favoriteAnimal?: string | null;
  mood?: string;
}) {
  const { childName, age, favoriteAnimal, mood } = input;

  const userPrompt = `Write a bedtime story for ${childName}, age ${age}.
Favorite animal: ${favoriteAnimal || "not specified — choose something gentle"}.
Tonight's mood: ${mood || "calm"}.

Return only a JSON object with exactly two string fields, "title" and "story". No other text.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SAFETY_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.9,
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);

  if (!parsed.title || !parsed.story) {
    throw new Error("Story generation returned an unexpected shape.");
  }

  // Output moderation: never let a generated story reach a child unchecked.
  // For a production launch, anything flagged here should go to the human
  // review queue (see README backlog) instead of failing silently.
  const moderation = await openai.moderations.create({ input: parsed.story });
  if (moderation.results[0]?.flagged) {
    throw new Error("Generated story did not pass content moderation.");
  }

  return { title: parsed.title as string, story: parsed.story as string };
}
