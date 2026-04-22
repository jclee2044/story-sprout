import { buildRegenerationPrompt, generateStory } from "./story-api.js";

const titleEl = document.getElementById("storyTitle");
const storyBodyEl = document.getElementById("storyBody");
const storyEl = document.getElementById("storyDocument");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const saveStoryBtn = document.getElementById("saveStoryBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");

saveStoryBtn.addEventListener("click", () => {
  const title = localStorage.getItem("generatedStoryTitle");
  const body = localStorage.getItem("generatedStory");
  let savedStories = JSON.parse(localStorage.getItem("savedStories")) || {};
  const newId = Object.keys(savedStories).length + 1;
  savedStories[newId] = { title, body };
  localStorage.setItem("savedStories", JSON.stringify(savedStories));
});

exportPdfBtn.addEventListener("click", () => {
  window.print();
});

console.log("Testtest")
function loadStoryFromStorage() {
  const selectedStoryId = localStorage.getItem("selectedStoryId");
  const savedStoriesRaw = localStorage.getItem("savedStories");
  const savedStories = savedStoriesRaw ? JSON.parse(savedStoriesRaw) || {} : {};
  const selectedStory = selectedStoryId ? savedStories[selectedStoryId] : null;
  console.log("selectedStory", selectedStory);

  let title = localStorage.getItem("generatedStoryTitle");
  let story = localStorage.getItem("generatedStory");

  if (selectedStory) {
    title = selectedStory.title || "";
    story = selectedStory.body || "";
    localStorage.setItem("generatedStoryTitle", title);
    localStorage.setItem("generatedStory", story);
    localStorage.removeItem("selectedStoryId");
  }

  if (titleEl) {
    titleEl.textContent =
      title && title.trim() ? title.trim() : "Generated Story";
  }

  if (storyBodyEl) {
    storyBodyEl.textContent = story || "";
  } else if (storyEl) {
    storyEl.textContent = story
      ? story
      : "No story has been generated yet.";
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

loadStoryFromStorage();

sendChatBtn?.addEventListener("click", async () => {
  const instruction = chatInput.value.trim();
  if (!instruction) {
    return;
  }

  const bodyEl = document.getElementById("storyBody");
  const currentStory = (
    bodyEl?.textContent?.trim() ||
    localStorage.getItem("generatedStory") ||
    ""
  ).trim();
  if (!currentStory) {
    return;
  }

  const currentTitle =
    document.getElementById("storyTitle")?.textContent?.trim() ||
    (localStorage.getItem("generatedStoryTitle") || "").trim() ||
    "Untitled";

  const originalBtnText = sendChatBtn.textContent;
  sendChatBtn.disabled = true;
  sendChatBtn.textContent = "Generating...";

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

    if (titleEl) {
      titleEl.textContent = title.trim() || "Generated Story";
    }
    if (storyBodyEl) {
      storyBodyEl.textContent = story;
    } else if (storyEl) {
      storyEl.textContent = story;
    }

    chatInput.value = "";
  } catch (error) {
    console.error(error);
  } finally {
    sendChatBtn.disabled = false;
    sendChatBtn.textContent = originalBtnText;
  }
});
