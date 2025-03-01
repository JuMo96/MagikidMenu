document.addEventListener('DOMContentLoaded', () => {
  // Helper function to convert "HH:MM" 24H time to "H:MM AM/PM" format
  function convertTo12Hour(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr; // return original if not valid
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  // Determine the current day of the week (e.g., "monday", "tuesday", etc.)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[new Date().getDay()];
  // Use the current day's CSV file (e.g., monday.csv)
  const csvFile = `${currentDay}.csv`;

  fetch(csvFile)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      // Use tab delimiter if present, else use comma
      const delimiter = data.includes("\t") ? "\t" : ",";
      const rows = data.trim().split('\n').map(row => row.split(delimiter));
      if (rows.length === 0) return;

      const headers = rows[0].map(h => h.trim());
      const records = rows.slice(1);

      // Determine column indices (case-insensitive)
      const classNameIndex = headers.findIndex(h => h.toLowerCase() === "class name");
      const teacherIndex = headers.findIndex(h => h.toLowerCase() === "teacher");
      const startTimeIndex = headers.findIndex(h => h.toLowerCase() === "start time");
      const endTimeIndex = headers.findIndex(h => h.toLowerCase() === "end time");
      const classroomIndex = headers.findIndex(h => h.toLowerCase() === "classroom");

      // Create a table element with Bootstrap classes
      const table = document.createElement('table');
      table.className = 'table table-striped table-bordered';

      // Build the table header (center align all header cells)
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headers.forEach((header, index) => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.textAlign = "center";  // center align header text
        
        // Set fixed widths for specific columns:
        if (index === classNameIndex) {
          th.style.width = "100px";  // smaller Class Name column
        } else if (index === teacherIndex) {
          th.style.width = "120px";  // larger Teacher column
        } else if (index === startTimeIndex || index === endTimeIndex) {
          th.style.width = "100px";  // slightly larger Start/End Time columns
        } else if (index === classroomIndex) {
          th.style.width = "80px";   // smaller Classroom column
        }
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Current time for filtering (assumes classes are scheduled for today)
      const now = new Date();
      // 2.5 hours ahead in milliseconds
      const twoAndHalfHoursInMs = 2.5 * 60 * 60 * 1000;
      const thirtyMinutesInMs = 30 * 60 * 1000;

      // Build the table body
      const tbody = document.createElement('tbody');
      records.forEach(record => {
        // Skip empty rows
        if (record.length === 1 && record[0].trim() === "") return;

        // Parse the start and end times (assuming "HH:MM" format)
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

        // Filter out classes that start 2.5 hours (or more) ahead
        if (startTimeDate && (startTimeDate.getTime() - now.getTime()) >= twoAndHalfHoursInMs) {
          return;
        }

        // Filter out classes that ended more than 30 minutes ago
        if (endTimeDate && now.getTime() > endTimeDate.getTime() + thirtyMinutesInMs) {
          return;
        }

        // Create table row
        const tr = document.createElement('tr');

        // Mark classes as ended if current time is past the end time (but within the 30-minute grace period)
        if (endTimeDate && now.getTime() > endTimeDate.getTime()) {
          tr.classList.add('ended');
        }

        // Process each cell in the row with alignment, formatting, and width rules
        record.forEach((field, index) => {
          const td = document.createElement('td');
          field = field.trim();

          // If this is a time column, convert to 12-hour format.
          if (index === startTimeIndex || index === endTimeIndex) {
            field = convertTo12Hour(field);
          }

          // Apply alignment based on column type and set fixed widths:
          if (index === classNameIndex) {
            td.classList.add('text-right');  // Class Name: right aligned
            td.style.width = "100px";
          } else if (index === teacherIndex) {
            td.classList.add('text-center');  // Teacher: center aligned
            td.style.width = "120px";
          } else if (index === startTimeIndex || index === endTimeIndex) {
            td.classList.add('text-center');  // Start/End Time: center aligned
            td.style.width = "100px";
          } else if (index === classroomIndex) {
            td.classList.add('text-left');    // Classroom: left aligned
            td.style.width = "80px";
          }

          // For the Classroom column, create a badge with a background color.
          if (index === classroomIndex) {
            const badge = document.createElement('span');
            // If "lobby", use silver; otherwise, use the classroom name as the color.
            let bgColor = field.toLowerCase() === "lobby" ? "silver" : field.toLowerCase();
            // Set the text color to black for all classroom badges.
            let textColor = "black";
            badge.textContent = field;
            badge.style.backgroundColor = bgColor;
            badge.style.color = textColor;
            badge.style.padding = "5px 10px";
            badge.style.borderRadius = "3px";
            td.appendChild(badge);
          } else {
            td.textContent = field;
          }
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      // Insert the table into the page
      document.getElementById('data-table').appendChild(table);
    })
    .catch(error => {
      console.error('Error loading CSV data:', error);
      document.getElementById('data-table').textContent = 'Failed to load data. Please check the file path.';
    });
});
