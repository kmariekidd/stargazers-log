const statusMessage = document.querySelector("#status");
const repositoryList = document.querySelector("#repositories");

function isRepositoryEntry(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value;
  if (
    typeof entry.repository !== "string" ||
    typeof entry.url !== "string" ||
    typeof entry.description !== "string" ||
    typeof entry.starredAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(entry.starredAt)
  ) {
    return false;
  }

  const date = new Date(`${entry.starredAt}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== entry.starredAt) {
    return false;
  }

  try {
    const url = new URL(entry.url);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function loadRepositories() {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
    statusMessage.textContent = "Loading repositories timed out. Please try again.";
  }, 10000);

  try {
    const response = await fetch("events.json", { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const repositories = await response.json();
    if (!Array.isArray(repositories)) {
      throw new Error("Repository data must be a list.");
    }

    if (!repositories.every(isRepositoryEntry)) {
      throw new Error("Repository data contains an invalid entry.");
    }

    const items = document.createDocumentFragment();
    for (const repository of repositories) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = repository.url;
      link.textContent = repository.repository;

      const description = document.createElement("p");
      description.textContent = repository.description;

      const date = document.createElement("time");
      date.dateTime = repository.starredAt;
      date.textContent = `Starred on ${repository.starredAt}`;

      item.append(link, description, date);
      items.append(item);
    }

    repositoryList.append(items);
    statusMessage.textContent = repositories.length
      ? ""
      : "No starred repositories yet.";
  } catch (error) {
    console.error("Could not load starred repositories:", error);
    if (!timedOut) {
      statusMessage.textContent = "Could not load starred repositories.";
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

loadRepositories();
