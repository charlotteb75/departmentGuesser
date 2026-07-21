const API_BASE_URL = "http://127.0.0.1:5000/api";

const openLoginModalButton = document.querySelector("#open-login-modal");
const loginModal = document.querySelector("#login-modal");
const closeLoginModalButton = document.querySelector("#close-login-modal");
const loginForm = document.querySelector("#login-form");
const loginUsernameInput = document.querySelector("#login-username");
const loginPasswordInput = document.querySelector("#login-password");
const authError = document.querySelector("#auth-error");
const authModalTitle = document.querySelector("#login-modal-title");
const authSubmitButton = document.querySelector("#auth-submit-button");
const authSwitchText = document.querySelector("#auth-switch-text");
const toggleAuthModeButton = document.querySelector("#toggle-auth-mode");
const passwordPolicy = document.querySelector("#password-policy");
const userMenu = document.querySelector("#user-menu");
const currentUsername = document.querySelector("#current-username");
const logoutButton = document.querySelector("#logout-button");
const gamesSidebar = document.querySelector("#games-sidebar");
const gamesList = document.querySelector("#games-list");
const gameModal = document.querySelector("#game-modal");
const closeGameModalButton = document.querySelector("#close-game-modal");
const gameForm = document.querySelector("#game-form");
const gameNameInput = document.querySelector("#game-name");
const gameError = document.querySelector("#game-error");
const anonymousSaveNotice = document.querySelector("#anonymous-save-notice");
const openRegisterModalButton = document.querySelector("#open-register-modal");

let authMode = "login";
let currentGameId = null;
let userGames = [];
let saveGameQueue = Promise.resolve();
let displayGameOnBoard = () => {};
let clearGameBoard = () => {};
let hasAnonymousProgress = () => false;

function getToken() {
  return localStorage.getItem("access_token");
}

function setToken(token) {
  localStorage.setItem("access_token", token);
}

function clearToken() {
  localStorage.removeItem("access_token");
}

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
  const confirmed = window.confirm(`Supprimer définitivement la partie « ${game.name} » ?`);

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
  displayGameOnBoard(game.found_department_ids || []);
  renderGamesList();
}

async function loadUserGames(preferredGameId = null) {
  const data = await apiFetch("/games");
  userGames = data.games;
  gamesSidebar.hidden = false;

  if (userGames.length === 0) {
    currentGameId = null;
    clearGameBoard();
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

async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}

openLoginModalButton.addEventListener("click", () => {
  setAuthMode("login");
  loginModal.hidden = false;
});

closeLoginModalButton.addEventListener("click", () => {
  loginModal.hidden = true;
});

document.querySelector("[data-close-login-modal]").addEventListener("click", () => {
  loginModal.hidden = true;
});

closeGameModalButton.addEventListener("click", () => {
  gameModal.hidden = true;
});

document.querySelector("[data-close-game-modal]").addEventListener("click", () => {
  if (gameModal.dataset.required !== "true") {
    gameModal.hidden = true;
  }
});

openRegisterModalButton.addEventListener("click", () => {
  anonymousSaveNotice.hidden = true;
  setAuthMode("register");
  loginModal.hidden = false;
  loginUsernameInput.focus();
});

function setAuthMode(mode) {
  authMode = mode;
  const isRegisterMode = authMode === "register";

  authModalTitle.textContent = isRegisterMode ? "Créer un compte" : "Connexion";
  authSubmitButton.textContent = isRegisterMode ? "Créer mon compte" : "Se connecter";
  authSwitchText.textContent = isRegisterMode ? "Déjà un compte ?" : "Pas encore de compte ?";
  toggleAuthModeButton.textContent = isRegisterMode ? "Se connecter" : "Créer un compte";
  loginPasswordInput.autocomplete = isRegisterMode ? "new-password" : "current-password";
  loginPasswordInput.minLength = isRegisterMode ? 12 : 0;
  loginUsernameInput.minLength = isRegisterMode ? 3 : 0;
  passwordPolicy.hidden = !isRegisterMode;
  authError.textContent = "";
  loginForm.reset();
}

toggleAuthModeButton.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
  loginUsernameInput.focus();
});

function renderAuthenticatedUser(user) {
  currentUsername.textContent = user.username;
  openLoginModalButton.hidden = true;
  userMenu.hidden = false;
  anonymousSaveNotice.hidden = true;
}

function renderAnonymousUser() {
  currentUsername.textContent = "";
  openLoginModalButton.hidden = false;
  userMenu.hidden = true;
  gamesSidebar.hidden = true;
  userGames = [];
  currentGameId = null;
}

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

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  authError.textContent = "";

  const username = loginUsernameInput.value.trim();
  const password = loginPasswordInput.value;

  if (!username || !password) {
    authError.textContent = "Veuillez remplir tous les champs.";
    return;
  }

  if (authMode === "register" && username.length < 3) {
    authError.textContent = "Le nom d'utilisateur doit contenir au moins 3 caractères.";
    loginUsernameInput.focus();
    return;
  }

  const passwordIsStrong =
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password);

  if (authMode === "register" && !passwordIsStrong) {
    authError.textContent =
      "Le mot de passe doit contenir au moins 12 caractères, une majuscule, un chiffre et un caractère spécial.";
    loginPasswordInput.focus();
    return;
  }

  try {
    if (authMode === "register") {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
      });
    }

    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    });

    setToken(data.access_token);

    renderAuthenticatedUser(data.user);
    await loadUserGames();

    loginModal.hidden = true;
    loginForm.reset();

    console.log("Utilisateur connecté :", data.user);
  } catch (error) {
    if (authMode === "register" && error.errors?.username) {
      authError.textContent = "Ce nom d'utilisateur est déjà utilisé.";
    } else if (authMode === "register" && error.errors?.password) {
      authError.textContent =
        "Le mot de passe doit contenir au moins 12 caractères, une majuscule, un chiffre et un caractère spécial.";
    } else if (authMode === "register") {
      authError.textContent = "Impossible de créer le compte.";
    } else {
      authError.textContent = "Identifiants invalides.";
    }
    console.error(error);
  }
});

async function loadCurrentUser() {
  if (!getToken()) {
    renderAnonymousUser();
    return;
  }

  try {
    const data = await apiFetch("/auth/me");
    renderAuthenticatedUser(data.user);
    await loadUserGames();
  } catch (error) {
    clearToken();
    currentGameId = null;
    renderAnonymousUser();
  }
}

logoutButton.addEventListener("click", () => {
  clearToken();
  renderAnonymousUser();
  clearGameBoard();
});

window.addEventListener("beforeunload", (event) => {
  if (!getToken() && hasAnonymousProgress()) {
    event.preventDefault();
    event.returnValue = true;
  }
});

// Metadata for department labels
let departmentLabelMetadataById = {};

// Retrieve department metadata
fetch("./data/departments.json")
  .then((response) => response.json())
  .then((data) => {
    departmentLabelMetadataById = data;
    initGame();
  });

// attempted answer to lowercase, remove accents and hyphens
function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ");
}

function initGame() {

  let selectedDepartment = null;
  const foundDepartmentIds = new Set();
  const departments = document.querySelectorAll('.map-container path[id^="dep_"]');
  const form = document.querySelector("#guess-form");
  const input = document.querySelector("#department-guess");
  const tooltip = document.querySelector("#tooltip");
  const restartButton = document.querySelector("#restart-button");
  const totalDepartments = departments.length;

  function updateScore() {
    score.textContent = `Départements trouvés : ${foundDepartmentIds.size} / ${totalDepartments}`;
  }

  const score = document.querySelector("#score");

  clearGameBoard = () => {
    foundDepartmentIds.clear();
    selectedDepartment = null;
    input.value = "";
    departments.forEach((department) => {
      department.classList.remove("found", "selected");
    });
    updateScore();
  };

  displayGameOnBoard = (savedDepartmentIds) => {
    clearGameBoard();
    const savedDepartmentIdSet = new Set(savedDepartmentIds);

    departments.forEach((department) => {
      if (savedDepartmentIdSet.has(department.id)) {
        department.classList.add("found");
        foundDepartmentIds.add(department.id);
      }
    });

    updateScore();
  };

  hasAnonymousProgress = () => foundDepartmentIds.size > 0;
  updateScore();

  // Listening to zone click
  departments.forEach((department) => {
    department.addEventListener("click", () => {

      // If the department has already been found
      if (department.classList.contains("found")) {
        return;
      }
      // Clear the input field
      input.value = "";

      // If a department is currently selected
      if (selectedDepartment) {
          selectedDepartment.classList.remove("selected");
      }

      selectedDepartment = department;
      selectedDepartment.classList.add("selected");
      input.focus();

      });

      // On mouse hover, if department is found, the name appears, otherwise hint appears
      department.addEventListener("mouseenter", () => {
        const metadata = departmentLabelMetadataById[department.id];

        const textToDisplay = department.classList.contains("found")
          ? metadata.name
          : metadata.hint;

        tooltip.textContent = textToDisplay;
        tooltip.style.display = "block";
      });

      department.addEventListener("mousemove", (event) => {
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
      });

      department.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });
    });

  // Listening to validation submit
  form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!selectedDepartment) {
    return;
  }

  const expectedName = departmentLabelMetadataById[selectedDepartment.id].name;
  const userGuess = input.value;

  const normalizedGuess = normalizeString(userGuess);
  const normalizedExpected = normalizeString(expectedName);

  if (normalizedGuess === normalizedExpected) {
      console.log("You guessed right !");
      selectedDepartment.classList.remove("selected");
      selectedDepartment.classList.add("found");
      foundDepartmentIds.add(selectedDepartment.id);
      updateScore();
      saveCurrentGame(foundDepartmentIds);
      anonymousSaveNotice.hidden = Boolean(getToken());
      selectedDepartment = null;
    }
  });

  // Start a separate game
  restartButton.addEventListener("click", () => {
    if (getToken()) {
      openGameModal();
      return;
    }

    clearGameBoard();
    anonymousSaveNotice.hidden = true;
  });

  loadCurrentUser();

}
