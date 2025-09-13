// Room coordinates for the floorplan (positions + sizes)
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
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = new Date();
    const filename = `${dayNames[today.getDay()]}.csv`;

    const response = await fetch(filename);
    const text = await response.text();
    const rows = text.trim().split(/\r?\n/).slice(1);

    const now = new Date();
    const overlay = document.getElementById("class-overlay");
    const upcomingList = document.getElementById("upcoming-list");
    overlay.innerHTML = "";
    upcomingList.innerHTML = "";

    rows.forEach(row => {
      if (!row.trim()) return;

      const cells = row.split(",").map(cell => cell.trim());
      const [className, teacher, startTime, endTime, classroom] = cells;

      if (!classroomCoords[classroom]) {
        console.warn(`Unknown classroom: ${classroom}`);
        return;
      }

      // Parse time
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const classStart = new Date();
      const classEnd = new Date();
      classStart.setHours(startH, startM, 0, 0);
      classEnd.setHours(endH, endM, 0, 0);

      const hoursUntilStart = (classStart - now) / (1000 * 60 * 60);

      // === Ongoing class on the map
      if (now >= classStart && now <= classEnd) {
        const { x, y, width, height } = classroomCoords[classroom];

        const div = document.createElement("div");
        div.className = "class-label";
        div.setAttribute("data-classroom", classroom);
        div.style.left = `${x}%`;
        div.style.top = `${y}%`;
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        div.innerHTML = `<strong>${className}</strong>${teacher}<br>${startTime} - ${endTime}`;
        document.getElementById("class-overlay").appendChild(div);
      }

      // === Upcoming class (2+ hours away)
      else if (hoursUntilStart >= 2) {
        const upcoming = document.createElement("div");
        upcoming.className = "upcoming-card";
        upcoming.innerHTML = `
          <strong>${className}</strong>
          ${teacher}<br>
          ${startTime} - ${endTime}<br>
          <em>Room: ${classroom}</em>
        `;
        document.getElementById("upcoming-list").appendChild(upcoming);
      }
    });

  } catch (err) {
    console.error("Failed to load schedule:", err);
    document.getElementById("class-overlay").innerText = "Unable to load schedule.";
  }
}

// Run on load and refresh every 60 seconds
fetchSchedule();
setInterval(fetchSchedule, 60000);
