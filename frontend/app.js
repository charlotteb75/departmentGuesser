import { getToken } from "./api/client.js";
import { createAuthController } from "./auth/auth-controller.js";
import { createGamesController } from "./games/games-controller.js";
import { createMapGame } from "./map/map-game.js";

async function loadDepartmentMetadata() {
  const response = await fetch("./data/departments.json");

  if (!response.ok) {
    throw new Error("Impossible de charger les données des départements.");
  }

  return response.json();
}

async function startApplication() {
  const departmentMetadataById = await loadDepartmentMetadata();
  let games;

  const board = createMapGame({
    departmentMetadataById,
    isAuthenticated: () => Boolean(getToken()),
    onProgress: (foundDepartmentIds) => {
      games.saveCurrentGame(foundDepartmentIds);
    },
    onAuthenticatedRestart: () => {
      games.openGameModal();
    },
  });

  games = createGamesController({ board });
  const auth = createAuthController({ board, games });

  window.addEventListener("beforeunload", (event) => {
    if (!getToken() && board.hasProgress()) {
      event.preventDefault();
    }
  });

  await auth.loadCurrentUser();
}

startApplication().catch((error) => {
  console.error("L'application n'a pas pu démarrer :", error);
});
