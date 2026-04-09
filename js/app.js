import { buildPrompt, generateStory } from "./story-api.js";

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
    const { title, story } = await generateStory(prompt);

    localStorage.setItem("generatedStoryTitle", title);
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
