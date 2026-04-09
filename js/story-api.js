import { API_KEY } from "./config.js";

const MODEL = "gemini-2.5-flash";

export function buildPrompt({ section, grade, textType, wordCount, topic, wordList, extra }) {
  let prompt = `Write a ${textType || ""} reading passage for a student at the ${section} of grade ${grade} level. `;
  prompt += `The passage should be ${wordCount} words. `;

  if (topic) {
    prompt += `The topic is: ${topic}. `;
  }

  if (wordList) {
    prompt += `Use these vocabulary words naturally if possible: ${wordList}. `;
  }

  if (extra) {
    prompt += `Additional requirements: ${extra}. `;
  }

  prompt += `Also create a concise and engaging title (maximum 8 words). `;
  prompt += `Return ONLY valid JSON using this exact shape: {"title":"...","story":"..."}. `;
  prompt += `Do not include markdown code fences or any extra text outside the JSON.`;

  return prompt;
}

export function buildRegenerationPrompt({
  meta = {},
  currentTitle,
  currentStory,
  instruction,
}) {
  const section = meta.section ?? "";
  const grade = meta.grade ?? "";
  const textType = meta.textType ?? "";
  const wordCount = meta.wordCount ?? "";
  const topic = meta.topic ?? "";
  const wordList = meta.wordList ?? "";
  const extra = meta.extra ?? "";

  let prompt =
    "Revise the EXISTING reading passage below according to the user's instruction. " +
    "Apply targeted edits; keep the same overall topic, characters, and purpose unless the instruction explicitly asks to change them. " +
    "Do not replace the passage with an unrelated new story unless the user clearly requests a full rewrite on a different subject.\n\n";

  prompt += "Original teacher constraints (preserve reading level, length target, vocabulary, and other requirements unless the user explicitly asks to change them):\n";
  prompt += `- Reading level: ${section} of grade ${grade}\n`;
  prompt += `- Text type: ${textType}\n`;
  prompt += `- Target length: ${wordCount} words\n`;
  if (topic) prompt += `- Topic: ${topic}\n`;
  if (wordList) prompt += `- Vocabulary to use when natural: ${wordList}\n`;
  if (extra) prompt += `- Additional requirements: ${extra}\n`;
  prompt += "\n";

  prompt += `Current title: ${currentTitle}\n\n`;
  prompt += "Current story:\n";
  prompt += `${currentStory}\n\n`;

  prompt += `User instruction: ${instruction}\n\n`;

  prompt +=
    "Return a revised title if needed and the full revised story. " +
    "Return ONLY valid JSON using this exact shape: {\"title\":\"...\",\"story\":\"...\"}. " +
    "Do not include markdown code fences or any extra text outside the JSON.";

  return prompt;
}

export async function generateStory(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || "Gemini API request failed.";
    throw new Error(message);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

  if (!text) {
    throw new Error("Model returned empty text.");
  }

  const parsed = parseStoryPayload(text);

  if (!parsed.title || !parsed.story) {
    throw new Error("Model output was missing title or story.");
  }

  return parsed;
}

function parseStoryPayload(text) {
  const cleaned = text.trim().replace(/^```json\s*|\s*```$/g, "");

  try {
    const payload = JSON.parse(cleaned);
    const title = String(payload?.title || "").trim();
    const story = String(payload?.story || "").trim();

    return {
      title: title.slice(0, 80),
      story,
    };
  } catch (error) {
    throw new Error("Model returned invalid format. Please try again.");
  }
}
