import { API_KEY } from "./config.js";

const MODEL = "gemini-2.5-flash";

const generateButton = document.querySelector(".form-button--generate");

generateButton.addEventListener("click", async () => {
  const section = document.getElementById("story-section").value;
  const grade = document.getElementById("story-grade").value;
  const textType = document.getElementById("story-text-type").value;
  const wordCount = document.getElementById("story-word-count").value;
  const topic = document.getElementById("story-topic").value.trim();
  const wordList = document.getElementById("story-word-list").value.trim();
  const extra = document.getElementById("story-additional-requirements").value.trim();

  if (!section || !grade || !wordCount) {
    alert("Please complete Reading Level and Word Count.");
    return;
  }

  const prompt = buildPrompt({
    section,
    grade,
    textType,
    wordCount,
    topic,
    wordList,
    extra,
  });

  const originalText = generateButton.textContent;
  generateButton.disabled = true;
  generateButton.textContent = "Generating...";

  try {
    const story = await generateStory(prompt);

    localStorage.setItem("generatedStory", story);
    localStorage.setItem(
      "generatedStoryMeta",
      JSON.stringify({
        section,
        grade,
        textType,
        wordCount,
        topic,
        wordList,
        extra,
      })
    );

    window.location.href = "doc-viewer.html";
  } catch (error) {
    alert(error.message || "Something went wrong while generating the story.");
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = originalText;
  }
});

function buildPrompt({ section, grade, textType, wordCount, topic, wordList, extra }) {
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

  prompt += `Return only the final passage text. Do not include a title unless requested.`;

  return prompt;
}

async function generateStory(prompt) {
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

  return text;
}