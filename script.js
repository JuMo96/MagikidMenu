// Classroom layout mapping based on your floorplan.png
const classroomCoords = {
  "Orange":  { x: 79, y: 12, width: 220, height: 200 },
  "Yellow":  { x: 79, y: 37, width: 220, height: 200 },
  "Blue":    { x: 79, y: 63, width: 220, height: 200 },
  "Green":   { x: 20, y: 63, width: 220, height: 200 },
  "Purple":  { x: 20, y: 37, width: 220, height: 200 },
  "Lobby":   { x: 50, y: 90, width: 200, height: 100 }
};

async function fetchSchedule() {
  try {
    // Determine today's filename
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = new Date();
    const filename = `${dayNames[today.getDay()]}.csv`;

    const response = await fetch(filename);
    const text = await response.text();
    const rows = text.trim().split(/\r?\n/).slice(1);

    const now = new Date();
    const overlay = document.getElementById("class-overlay");
    overlay.innerHTML = "";

    rows.forEach(row => {
      if (!row.trim()) return;

      const cells = row.split(",").map(c => c.trim());
      const [className, teacher, startTime, endTime, classroom] = cells;

      if (!classroomCoords[classroom]) {
        console.warn("Unknown classroom:", classroom);
        return;
      }

      // Parse time range
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const start = new Date();
      const end = new Date();
      start.setHours(startH, startM, 0, 0);
      end.setHours(endH, endM, 0, 0);

      if (now >= start && now <= end) {
        const { x, y, width, height } = classroomCoords[classroom];

        const div = document.createElement("div");
        div.className = "class-label";
        div.setAttribute("data-classroom", classroom);
        div.style.left = `${x}%`;
        div.style.top = `${y}%`;
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        div.innerHTML = `<strong>${className}</strong>${teacher}<br>${startTime} - ${endTime}`;
        overlay.appendChild(div);
      }
    });

  } catch (err) {
    console.error("Failed to load schedule:", err);
    document.getElementById("class-overlay").innerText = "Unable to load schedule.";
  }
}

// Load schedule initially and every 60 seconds
fetchSchedule();
setInterval(fetchSchedule, 60000);
