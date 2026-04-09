import { buildRegenerationPrompt, generateStory } from "./story-api.js";

const titleEl = document.getElementById("storyTitle");
const storyEl = document.getElementById("storyDocument");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");

function loadStoryFromStorage() {
  const title = localStorage.getItem("generatedStoryTitle");
  const story = localStorage.getItem("generatedStory");

  if (title && title.trim()) {
    titleEl.textContent = title.trim();
  } else {
    titleEl.textContent = "Generated Story";
  }

  if (story) {
    storyEl.textContent = story;
  } else {
    storyEl.textContent = "No story has been generated yet.";
  }
}

function parseMeta() {
  const raw = localStorage.getItem("generatedStoryMeta");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function appendChatLine(text) {
  const p = document.createElement("p");
  p.textContent = text;
  chatMessages.appendChild(p);
}

loadStoryFromStorage();

sendChatBtn.addEventListener("click", async () => {
  const instruction = chatInput.value.trim();
  if (!instruction) {
    return;
  }

  const currentStory = localStorage.getItem("generatedStory");
  if (!currentStory || !currentStory.trim()) {
    appendChatLine("No story to revise yet. Generate one from the form first.");
    return;
  }

  const currentTitle = (localStorage.getItem("generatedStoryTitle") || "").trim() || "Untitled";

  appendChatLine(instruction);
  chatInput.value = "";

  const originalBtnText = sendChatBtn.textContent;
  sendChatBtn.disabled = true;
  sendChatBtn.textContent = "…";

  try {
    const prompt = buildRegenerationPrompt({
      meta: parseMeta(),
      currentTitle,
      currentStory,
      instruction,
    });

    const { title, story } = await generateStory(prompt);

    localStorage.setItem("generatedStoryTitle", title);
    localStorage.setItem("generatedStory", story);

    titleEl.textContent = title.trim() || "Generated Story";
    storyEl.textContent = story;

    appendChatLine("Story updated.");
  } catch (error) {
    appendChatLine(error.message || "Could not update the story.");
  } finally {
    sendChatBtn.disabled = false;
    sendChatBtn.textContent = originalBtnText;
  }
});
