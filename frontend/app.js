const API_BASE_URL = "http://127.0.0.1:5000/api";

const openLoginModalButton = document.querySelector("#open-login-modal");
const loginModal = document.querySelector("#login-modal");
const closeLoginModalButton = document.querySelector("#close-login-modal");
const loginForm = document.querySelector("#login-form");
const loginUsernameInput = document.querySelector("#login-username");
const loginPasswordInput = document.querySelector("#login-password");
const authError = document.querySelector("#auth-error");
const userMenu = document.querySelector("#user-menu");
const currentUsername = document.querySelector("#current-username");
const logoutButton = document.querySelector("#logout-button");

function getToken() {
  return localStorage.getItem("access_token");
}

function setToken(token) {
  localStorage.setItem("access_token", token);
}

function clearToken() {
  localStorage.removeItem("access_token");
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
  loginModal.hidden = false;
});

closeLoginModalButton.addEventListener("click", () => {
  loginModal.hidden = true;
});

function renderAuthenticatedUser(user) {
  currentUsername.textContent = user.username;
  openLoginModalButton.hidden = true;
  userMenu.hidden = false;
}

function renderAnonymousUser() {
  currentUsername.textContent = "";
  openLoginModalButton.hidden = false;
  userMenu.hidden = true;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  authError.textContent = "";

  const username = loginUsernameInput.value.trim();
  const password = loginPasswordInput.value;

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    });

    setToken(data.access_token);

    renderAuthenticatedUser(data.user);

    loginModal.hidden = true;
    loginForm.reset();

    console.log("Utilisateur connecté :", data.user);
  } catch (error) {
    authError.textContent = "Identifiants invalides.";
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
  } catch (error) {
    clearToken();
    renderAnonymousUser();
  }
}

logoutButton.addEventListener("click", () => {
  clearToken();
  renderAnonymousUser();
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
  const departments = document.querySelectorAll(".map-container path");
  const form = document.querySelector("#guess-form");
  const input = document.querySelector("#department-guess");
  const tooltip = document.querySelector("#tooltip");
  const restartButton = document.querySelector("#restart-button");
  const totalDepartments = departments.length;

  loadCurrentUser();

  function updateScore() {
  score.textContent = `Départements trouvés : ${foundDepartmentIds.size} / ${totalDepartments}`;
  }

  const score = document.querySelector("#score");
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
      
    }
  });

  // Reset everything to restart game
  restartButton.addEventListener("click", () => {
    foundDepartmentIds.clear();
    updateScore();
    input.value = "";
    departments.forEach((department) => {
    department.classList.remove("found");
    department.classList.remove("selected");
    });
  });

}


