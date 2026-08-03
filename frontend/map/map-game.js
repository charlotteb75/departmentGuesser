function normalizeString(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ");
}

export function createMapGame({
  departmentMetadataById,
  isAuthenticated,
  onProgress,
  onAuthenticatedRestart,
}) {
  let selectedDepartment = null;
  const foundDepartmentIds = new Set();
  const departments = document.querySelectorAll('.map-container path[id^="dep_"]');
  const form = document.querySelector("#guess-form");
  const input = document.querySelector("#department-guess");
  const tooltip = document.querySelector("#tooltip");
  const restartButton = document.querySelector("#restart-button");
  const score = document.querySelector("#score");
  const anonymousSaveNotice = document.querySelector("#anonymous-save-notice");
  const totalDepartments = departments.length;

  function updateScore() {
    score.textContent = `Départements trouvés : ${foundDepartmentIds.size} / ${totalDepartments}`;
  }

  function clear() {
    foundDepartmentIds.clear();
    selectedDepartment = null;
    input.value = "";
    departments.forEach((department) => {
      department.classList.remove("found", "selected");
    });
    updateScore();
  }

  function display(savedDepartmentIds) {
    clear();
    const savedDepartmentIdSet = new Set(savedDepartmentIds);

    departments.forEach((department) => {
      if (savedDepartmentIdSet.has(department.id)) {
        department.classList.add("found");
        foundDepartmentIds.add(department.id);
      }
    });

    updateScore();
  }

  departments.forEach((department) => {
    department.addEventListener("click", () => {
      if (department.classList.contains("found")) {
        return;
      }

      input.value = "";
      selectedDepartment?.classList.remove("selected");
      selectedDepartment = department;
      selectedDepartment.classList.add("selected");
      input.focus();
    });

    department.addEventListener("mouseenter", () => {
      const metadata = departmentMetadataById[department.id];
      tooltip.textContent = department.classList.contains("found")
        ? metadata.name
        : metadata.hint;
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!selectedDepartment) {
      return;
    }

    const expectedName = departmentMetadataById[selectedDepartment.id].name;
    const answerIsCorrect =
      normalizeString(input.value) === normalizeString(expectedName);

    if (!answerIsCorrect) {
      return;
    }

    selectedDepartment.classList.remove("selected");
    selectedDepartment.classList.add("found");
    foundDepartmentIds.add(selectedDepartment.id);
    selectedDepartment = null;
    updateScore();
    onProgress(foundDepartmentIds);
    anonymousSaveNotice.hidden = isAuthenticated();
  });

  restartButton.addEventListener("click", () => {
    if (isAuthenticated()) {
      onAuthenticatedRestart();
      return;
    }

    clear();
    anonymousSaveNotice.hidden = true;
  });

  updateScore();

  return {
    clear,
    display,
    getFoundDepartmentIds: () => [...foundDepartmentIds],
    hasProgress: () => foundDepartmentIds.size > 0,
  };
}
