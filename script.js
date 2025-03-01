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

      // Define desired column widths (in pixels)
      const colWidths = {
        className: 100,
        teacher: 120,
        time: 100,
        classroom: 80
      };

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
        
        // Set fixed widths and minimum widths for specific columns:
        if (index === classNameIndex) {
          th.style.width = `${colWidths.className}px`;
          th.style.minWidth = `${colWidths.className}px`;
        } else if (index === teacherIndex) {
          th.style.width = `${colWidths.teacher}px`;
          th.style.minWidth = `${colWidths.teacher}px`;
        } else if (index === startTimeIndex || index === endTimeIndex) {
          th.style.width = `${colWidths.time}px`;
          th.style.minWidth = `${colWidths.time}px`;
        } else if (index === classroomIndex) {
          th.style.width = `${colWidths.classroom}px`;
          th.style.minWidth = `${colWidths.classroom}px`;
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

        // Process each cell in the row with alignment, formatting, and fixed widths
        record.forEach((field, index) => {
          const td = document.createElement('td');
          field = field.trim();

          // If this is a time column, convert to 12-hour format.
          if (index === startTimeIndex || index === endTimeIndex) {
            field = convertTo12Hour(field);
          }

          if (index === classNameIndex) {
            td.classList.add('text-right');  // Class Name: right aligned
            td.style.width = `${colWidths.className}px`;
            td.style.minWidth = `${colWidths.className}px`;
            // Set text color based on whether the class is ongoing:
            td.style.color = (startTimeDate && endTimeDate && now >= startTimeDate && now < endTimeDate) ? "green" : "black";
            td.textContent = field;
          } else if (index === teacherIndex) {
            td.classList.add('text-center');  // Teacher: center aligned
            td.style.width = `${colWidths.teacher}px`;
            td.style.minWidth = `${colWidths.teacher}px`;
            td.textContent = field;
          } else if (index === startTimeIndex || index === endTimeIndex) {
            td.classList.add('text-center');  // Start/End Time: center aligned
            td.style.width = `${colWidths.time}px`;
            td.style.minWidth = `${colWidths.time}px`;
            td.textContent = field;
          } else if (index === classroomIndex) {
            td.classList.add('text-center');  // Center the badge in the cell
            td.style.width = `${colWidths.classroom}px`;
            td.style.minWidth = `${colWidths.classroom}px`;
            // Create a badge with a fixed-size square background, centered within the cell.
            const badge = document.createElement('span');
            let bgColor = field.toLowerCase() === "lobby" ? "#3e424B" : field.toLowerCase();
            badge.style.backgroundColor = bgColor;
            badge.style.display = "inline-block";
            // Set the badge dimensions to match the cell width for uniformity.
            badge.style.width = `${colWidths.classroom}px`;
            badge.style.height = "25px";
            badge.style.lineHeight = "25px";
            badge.style.textAlign = "center";
            badge.style.borderRadius = "3px";
            badge.style.margin = "0 auto"; // Center the badge horizontally
            // Remove text content so only the badge is visible.
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
      
      // Auto-refresh the page every 60 seconds to update class schedules
      setInterval(() => {
        window.location.reload();
      }, 60000);
    })
    .catch(error => {
      console.error('Error loading CSV data:', error);
      document.getElementById('data-table').textContent = 'Failed to load data. Please check the file path.';
    });
});
