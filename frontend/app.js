
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

      // Get width, height and position of path (departement)
      const bbox = selectedDepartment.getBBox();
      // Get center of path (department)
      let centerX = bbox.x + bbox.width / 2;
      let centerY = bbox.y + bbox.height / 2;

      // If we have set a custom position for the answer
      const customPosition = departmentLabelMetadataById[selectedDepartment.id].customPosition;
      if (customPosition) {
        centerX += customPosition.xOffset;
        centerY += customPosition.yOffset;
      }

      // Create SVG text
      const text = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
      );

      // We place the answer inside the department
      text.setAttribute("x", centerX);
      text.setAttribute("y", centerY);

      // If we have set a custom font size for the answer
      const fontSize = departmentLabelMetadataById[selectedDepartment.id].fontSize;
      if (fontSize) {
        text.setAttribute("font-size", fontSize);
      }
      
      // For long department names, we divide in lines
      const answerDivision = departmentLabelMetadataById[selectedDepartment.id].lines;
      if(answerDivision) {
        answerDivision.forEach((line, index) => {
          const tspan = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan"
          );
          tspan.textContent = line;
          tspan.setAttribute("x", centerX);
          tspan.setAttribute("dy", index === 0 ? "0" : "12");

          text.appendChild(tspan);
        });
      } else {
        text.textContent = expectedName;
      }
      // Adding the answer to the map
      const group = selectedDepartment.parentElement;
      group.appendChild(text);
    }
  });
}


