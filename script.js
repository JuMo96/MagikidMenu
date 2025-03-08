document.addEventListener('DOMContentLoaded', () => {
  // Helper: Convert 24H "HH:MM" to 12H "H:MM AM/PM"
  function convertTo12Hour(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  // Vibrant color mapping for classrooms.
  const vibrantColors = {
    lobby: "#C0C0C0",   // Bright silver for lobby
    blue: "#007BFF",    // Vibrant blue
    orange: "#FF8C00",  // Bright orange
    green: "#28A745",   // Bold green
    red: "#DC3545",     // Vivid red
    purple: "#6F42C1",  // Strong purple
    yellow: "#FFFF00",  // Bright yellow
    default: "#17A2B8"  // Vibrant teal as default
  };

  // Determine the current day's CSV file (e.g., monday.csv)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[new Date().getDay()];
  const csvFile = `${currentDay}.csv`;

  fetch(csvFile)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.text();
    })
    .then(data => {
      const delimiter = data.includes("\t") ? "\t" : ",";
      const rows = data.trim().split('\n').map(row => row.split(delimiter));
      if (rows.length === 0) return;
      const headers = rows[0].map(h => h.trim());
      const records = rows.slice(1);

      // Column indices (case-insensitive)
      const classNameIndex = headers.findIndex(h => h.toLowerCase() === "class name");
      const teacherIndex = headers.findIndex(h => h.toLowerCase() === "teacher");
      const startTimeIndex = headers.findIndex(h => h.toLowerCase() === "start time");
      const endTimeIndex = headers.findIndex(h => h.toLowerCase() === "end time");
      const classroomIndex = headers.findIndex(h => h.toLowerCase() === "classroom");

      // Get containers for ongoing and upcoming sections
      const ongoingContainer = document.getElementById('ongoing-container');
      const upcomingContainer = document.getElementById('upcoming-container');
      const now = new Date();
      const twoAndHalfHoursInMs = 2.5 * 60 * 60 * 1000;

      records.forEach(record => {
        if (record.length === 1 && record[0].trim() === "") return;

        // Parse start and end times (assumes "HH:MM" format)
        let startTimeDate, endTimeDate;
        if (startTimeIndex !== -1) {
          const startTimeStr = record[startTimeIndex].trim();
          const startParts = startTimeStr.split(':');
          if (startParts.length === 2) {
            startTimeDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              parseInt(startParts[0], 10),
              parseInt(startParts[1], 10)
            );
          }
        }
        if (endTimeIndex !== -1) {
          const endTimeStr = record[endTimeIndex].trim();
          const endParts = endTimeStr.split(':');
          if (endParts.length === 2) {
            endTimeDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              parseInt(endParts[0], 10),
              parseInt(endParts[1], 10)
            );
          }
        }
        // Remove classes that have concluded
        if (endTimeDate && now >= endTimeDate) return;

        // Create a card for the class
        const card = document.createElement('div');
        card.className = 'class-card';

        // Set card background using vibrant color mapping
        let classroomVal = (classroomIndex !== -1) ? record[classroomIndex].trim().toLowerCase() : "";
        let bgColor = vibrantColors[classroomVal] || vibrantColors.default;
        card.style.backgroundColor = bgColor;

        // Create overlay content for text details
        const content = document.createElement('div');
        content.className = 'card-content';

        const title = document.createElement('h3');
        title.textContent = record[classNameIndex];
        if (startTimeDate && endTimeDate && now >= startTimeDate && now < endTimeDate) {
          title.style.color = (record[classNameIndex].trim().toLowerCase() === "competition team") ? "yellow" : "green";
        } else {
          title.style.color = "#fff";
        }
        content.appendChild(title);

        const teacher = document.createElement('p');
        teacher.textContent = record[teacherIndex];
        content.appendChild(teacher);

        const timeDetail = document.createElement('p');
        timeDetail.className = "time-detail"; // assign new class for increased font size
        timeDetail.textContent = `${convertTo12Hour(record[startTimeIndex].trim())} - ${convertTo12Hour(record[endTimeIndex].trim())}`;
        content.appendChild(timeDetail);

        card.appendChild(content);

        // Categorize into ongoing vs upcoming
        if (startTimeDate && now >= startTimeDate && now < endTimeDate) {
          ongoingContainer.appendChild(card);
        } else if (startTimeDate && now < startTimeDate && (startTimeDate.getTime() - now.getTime()) < twoAndHalfHoursInMs) {
          upcomingContainer.appendChild(card);
        }
      });

      // Auto-refresh every 60 seconds
      setInterval(() => window.location.reload(), 60000);
    })
    .catch(error => {
      console.error('Error loading CSV data:', error);
      document.getElementById('data-container').textContent = 'Failed to load data. Please check the file path.';
    });
});
