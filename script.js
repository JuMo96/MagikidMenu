// Map classroom names to (x, y) % coordinates on the floorplan
const classroomCoords = {
  "Blue": [20, 40],
  "Orange": [70, 40],
  "Yellow": [50, 70],
  "Green": [85, 85],
  "Lobby": [85, 85],
  // Add more mappings as needed based on your floorplan.png
};

async function fetchSchedule() {
  try {
    const response = await fetch("schedule.csv");
    const text = await response.text();
    const rows = text.trim().split(/\r?\n/).slice(1); // Skip header

    const now = new Date();
    const overlay = document.getElementById("class-overlay");
    overlay.innerHTML = ""; // Clear previous elements

    rows.forEach(row => {
      if (!row.trim()) return;

      const [className, teacher, startTime, endTime, classroom] = row.split(",").map(cell => cell.trim());

      if (!classroomCoords[classroom]) {
        console.warn(`Unknown classroom: ${classroom}`);
        return;
      }

      // Convert times
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const start = new Date();
      const end = new Date();
      start.setHours(startH, startM, 0, 0);
      end.setHours(endH, endM, 0, 0);

      // Show only ongoing classes
      if (now >= start && now <= end) {
        const [xPercent, yPercent] = classroomCoords[classroom];

        const classDiv = document.createElement("div");
        classDiv.className = "class-label";
        classDiv.style.left = `${xPercent}%`;
        classDiv.style.top = `${yPercent}%`;
        classDiv.innerHTML = `
          <strong>${className}</strong>
          ${teacher}<br>
          ${startTime} - ${endTime}
        `;

        overlay.appendChild(classDiv);
      }
    });

  } catch (err) {
    console.error("Failed to load schedule:", err);
    document.getElementById("class-overlay").innerText = "Unable to load schedule.";
  }
}

// Run once on load, then every 60 seconds
fetchSchedule();
setInterval(fetchSchedule, 60000);
