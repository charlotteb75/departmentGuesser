import { apiFetch, getToken } from "../api/client.js";

export function createGamesController({ board }) {
  const gamesSidebar = document.querySelector("#games-sidebar");
  const gamesList = document.querySelector("#games-list");
  const gameModal = document.querySelector("#game-modal");
  const closeGameModalButton = document.querySelector("#close-game-modal");
  const gameForm = document.querySelector("#game-form");
  const gameNameInput = document.querySelector("#game-name");
  const gameError = document.querySelector("#game-error");

  let currentGameId = null;
  let userGames = [];
  let saveGameQueue = Promise.resolve();

  function getSuggestedGameName() {
    const existingNames = new Set(userGames.map((game) => game.name));

    if (!existingNames.has("Nouvelle partie")) {
      return "Nouvelle partie";
    }

    let suffix = 2;
    while (existingNames.has(`Nouvelle partie ${suffix}`)) {
      suffix += 1;
    }

    return `Nouvelle partie ${suffix}`;
  }

  function openGameModal(isRequired = false) {
    gameError.textContent = "";
    gameNameInput.value = getSuggestedGameName();
    gameModal.dataset.required = String(isRequired);
    closeGameModalButton.hidden = isRequired;
    gameModal.hidden = false;
    gameNameInput.focus();
    gameNameInput.select();
  }

  function resizeGameNameField(field) {
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }

  function renderGamesList() {
    gamesList.replaceChildren();

    userGames.forEach((game) => {
      const row = document.createElement("div");
      const gameItem = document.createElement("div");
      const nameInput = document.createElement("textarea");
      const selectButton = document.createElement("button");
      const score = document.createElement("small");
      const actions = document.createElement("div");
      const deleteButton = document.createElement("button");

      row.className = "game-list-row";
      gameItem.className = "game-list-item";
      gameItem.classList.toggle("active", game.id === currentGameId);

      nameInput.className = "game-name-input";
      nameInput.value = game.name;
      nameInput.maxLength = 120;
      nameInput.rows = 1;
      nameInput.setAttribute("aria-label", `Renommer ${game.name}`);
      nameInput.addEventListener("focus", () => nameInput.select());
      nameInput.addEventListener("input", () => resizeGameNameField(nameInput));
      nameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          nameInput.blur();
        } else if (event.key === "Escape") {
          nameInput.dataset.cancelled = "true";
          nameInput.value = game.name;
          nameInput.blur();
        }
      });
      nameInput.addEventListener("blur", () => renameGame(game, nameInput));

      selectButton.type = "button";
      selectButton.className = "game-select-button";
      score.textContent = `${game.score} département${game.score > 1 ? "s" : ""}`;
      selectButton.append(score);
      selectButton.addEventListener("click", () => selectGame(game.id));

      actions.className = "game-list-actions";
      deleteButton.type = "button";
      deleteButton.className = "game-action-button game-delete-button";
      deleteButton.textContent = "×";
      deleteButton.title = `Supprimer ${game.name}`;
      deleteButton.setAttribute("aria-label", `Supprimer ${game.name}`);
      deleteButton.addEventListener("click", () => deleteGame(game));

      gameItem.append(nameInput, selectButton);
      actions.append(deleteButton);
      row.append(gameItem, actions);
      gamesList.append(row);
      resizeGameNameField(nameInput);
    });
  }

  async function renameGame(game, input) {
    if (input.dataset.cancelled === "true") {
      delete input.dataset.cancelled;
      return;
    }

    const name = input.value.trim().replace(/\s+/g, " ");
    if (!name || name === game.name) {
      input.value = game.name;
      return;
    }

    try {
      const data = await apiFetch(`/games/${game.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          found_department_ids: game.found_department_ids || [],
        }),
      });
      const gameIndex = userGames.findIndex((candidate) => candidate.id === game.id);
      if (gameIndex !== -1) {
        userGames[gameIndex] = data.game;
      }
      renderGamesList();
    } catch (error) {
      input.value = game.name;
      window.alert("Impossible de renommer la partie.");
      console.error(error);
    }
  }

  async function deleteGame(game) {
    const confirmed = window.confirm(
      `Supprimer définitivement la partie « ${game.name} » ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/games/${game.id}`, { method: "DELETE" });
      await loadUserGames();
    } catch (error) {
      console.error("Impossible de supprimer la partie :", error);
    }
  }

  function selectGame(gameId) {
    const game = userGames.find((candidate) => candidate.id === gameId);

    if (!game) {
      return;
    }

    currentGameId = game.id;
    board.display(game.found_department_ids || []);
    renderGamesList();
  }

  async function loadUserGames(preferredGameId = null) {
    const data = await apiFetch("/games");
    userGames = data.games;
    gamesSidebar.hidden = false;

    if (userGames.length === 0) {
      currentGameId = null;
      board.clear();
      renderGamesList();
      openGameModal(true);
      return;
    }

    const preferredGame = userGames.find((game) => game.id === preferredGameId);
    selectGame((preferredGame || userGames[0]).id);
  }

  function saveCurrentGame(foundDepartmentIds) {
    const gameId = currentGameId;

    if (!getToken() || !gameId) {
      return;
    }

    const savedDepartmentIds = [...foundDepartmentIds];
    saveGameQueue = saveGameQueue
      .then(async () => {
        const data = await apiFetch(`/games/${gameId}`, {
          method: "PATCH",
          body: JSON.stringify({
            found_department_ids: savedDepartmentIds,
          }),
        });
        const gameIndex = userGames.findIndex((game) => game.id === gameId);

        if (gameIndex !== -1) {
          userGames[gameIndex] = data.game;
          renderGamesList();
        }
      })
      .catch((error) => {
        console.error("La sauvegarde automatique a échoué :", error);
      });
  }

  function reset() {
    gamesSidebar.hidden = true;
    userGames = [];
    currentGameId = null;
    gamesList.replaceChildren();
  }

  closeGameModalButton.addEventListener("click", () => {
    gameModal.hidden = true;
  });

  document.querySelector("[data-close-game-modal]").addEventListener("click", () => {
    if (gameModal.dataset.required !== "true") {
      gameModal.hidden = true;
    }
  });

  gameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    gameError.textContent = "";

    const name = gameNameInput.value.trim();
    if (!name) {
      gameError.textContent = "Veuillez donner un nom à la partie.";
      return;
    }

    try {
      const data = await apiFetch("/games", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      gameModal.hidden = true;
      await loadUserGames(data.game.id);
    } catch (error) {
      gameError.textContent = "Impossible de créer la partie.";
      console.error(error);
    }
  });

  return {
    loadUserGames,
    openGameModal,
    reset,
    saveCurrentGame,
  };
}
