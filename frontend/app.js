
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


