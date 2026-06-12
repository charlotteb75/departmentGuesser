
// Metadata for department labels
let departmentLabelMetadataById = {};

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
  const departments = document.querySelectorAll(".map-container path");
  const form = document.querySelector("#guess-form");
  const input = document.querySelector("#department-guess");
  const tooltip = document.querySelector("#tooltip");

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

      // On mouse hover, if department is found, the name appears
      department.addEventListener("mouseenter", () => {
        if (!department.classList.contains("found")) {
          return;
        }

        const name = departmentLabelMetadataById[department.id].name;

        tooltip.textContent = name;
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

      
    }
  });

}


