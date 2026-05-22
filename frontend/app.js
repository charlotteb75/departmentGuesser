
const departmentsById = {
"dep_01" : "Ain",
"dep_02" : "Aisne",
"dep_03" : "Allier",
"dep_04" : "Alpes-de-Haute-Provence",
"dep_05" : "Hautes-Alpes"
};

function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

let selectedDepartment = null;

const departments = document.querySelectorAll(".map-container path");

departments.forEach((department) => {
  department.addEventListener("click", () => {
    // If a department is currently selected
    if (selectedDepartment) {
        selectedDepartment.classList.remove("selected");
    }

    selectedDepartment = department;
    selectedDepartment.classList.add("selected");

    const form = document.querySelector("#guess-form");
    const input = document.querySelector("#department-guess");

    form.addEventListener("submit", (event) => {
    event.preventDefault();

    const expectedName = departmentsById[selectedDepartment.id];
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
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        // Create SVG text
        const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
        );
    }
    });

  });
});