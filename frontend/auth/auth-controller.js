import {
  apiFetch,
  clearToken,
  getToken,
  setToken,
} from "../api/client.js";

export function createAuthController({ board, games }) {
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
  const anonymousSaveNotice = document.querySelector("#anonymous-save-notice");
  const openRegisterModalButton = document.querySelector("#open-register-modal");

  let authMode = "login";

  function setAuthMode(mode) {
    authMode = mode;
    const isRegisterMode = authMode === "register";

    authModalTitle.textContent = isRegisterMode ? "Créer un compte" : "Connexion";
    authSubmitButton.textContent = isRegisterMode
      ? "Créer mon compte"
      : "Se connecter";
    authSwitchText.textContent = isRegisterMode
      ? "Déjà un compte ?"
      : "Pas encore de compte ?";
    toggleAuthModeButton.textContent = isRegisterMode
      ? "Se connecter"
      : "Créer un compte";
    loginPasswordInput.autocomplete = isRegisterMode
      ? "new-password"
      : "current-password";
    loginPasswordInput.minLength = isRegisterMode ? 12 : 0;
    loginUsernameInput.minLength = isRegisterMode ? 3 : 0;
    passwordPolicy.hidden = !isRegisterMode;
    authError.textContent = "";
    loginForm.reset();
  }

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
    games.reset();
  }

  async function loadCurrentUser() {
    if (!getToken()) {
      renderAnonymousUser();
      return;
    }

    try {
      const data = await apiFetch("/auth/me");
      renderAuthenticatedUser(data.user);
      await games.loadUserGames();
    } catch (error) {
      clearToken();
      renderAnonymousUser();
    }
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

  openRegisterModalButton.addEventListener("click", () => {
    anonymousSaveNotice.hidden = true;
    setAuthMode("register");
    loginModal.hidden = false;
    loginUsernameInput.focus();
  });

  toggleAuthModeButton.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
    loginUsernameInput.focus();
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
      authError.textContent =
        "Le nom d'utilisateur doit contenir au moins 3 caractères.";
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
          body: JSON.stringify({ username, password }),
        });
      }

      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setToken(data.access_token);
      renderAuthenticatedUser(data.user);
      await games.loadUserGames();
      loginModal.hidden = true;
      loginForm.reset();
    } catch (error) {
      if (authMode === "register" && error?.errors?.username) {
        authError.textContent = "Ce nom d'utilisateur est déjà utilisé.";
      } else if (authMode === "register" && error?.errors?.password) {
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

  logoutButton.addEventListener("click", () => {
    clearToken();
    renderAnonymousUser();
    board.clear();
  });

  return {
    loadCurrentUser,
  };
}
