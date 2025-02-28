document.addEventListener('DOMContentLoaded', () => {
  fetch('data.csv')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      // Use tab delimiter if tabs are present, else use comma
      const delimiter = data.includes("\t") ? "\t" : ",";
      const rows = data.trim().split('\n').map(row => row.split(delimiter));
      if (rows.length === 0) return;

      const headers = rows[0].map(h => h.trim());
      const records = rows.slice(1);

      // Create a table element with Bootstrap classes
      const table = document.createElement('table');
      table.className = 'table table-striped table-bordered';

      // Build the table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Current time for comparison (assumes classes are scheduled for today)
      const now = new Date();

      // Determine the index of important columns
      const endTimeIndex = headers.findIndex(h => h.toLowerCase() === "end time");
      const classroomIndex = headers.findIndex(h => h.toLowerCase() === "classroom");

      // Build the table body
      const tbody = document.createElement('tbody');
      records.forEach(record => {
        // Skip empty rows
        if (record.length === 1 && record[0] === "") return;

        const tr = document.createElement('tr');

        // If there's an end time column, check if the class is over
        if (endTimeIndex !== -1) {
          const endTimeStr = record[endTimeIndex].trim();
          // Expecting format like "10:30"
          const timeParts = endTimeStr.split(':');
          if (timeParts.length === 2) {
            const endTimeDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              parseInt(timeParts[0], 10),
              parseInt(timeParts[1], 10)
            );
            if (now > endTimeDate) {
              tr.classList.add('ended');
            }
          }
        }

        // Process each field in the record
        record.forEach((field, index) => {
          const td = document.createElement('td');
          field = field.trim();
          
          // For the classroom column, create a badge with a background color.
          if (index === classroomIndex) {
            const badge = document.createElement('span');
            // Determine the color: if "lobby", use silver; otherwise, try to use the classroom name as a color.
            let bgColor = field.toLowerCase() === "lobby" ? "silver" : field.toLowerCase();
            // For readability, adjust text color if needed (e.g., for yellow background use black)
            let textColor = (field.toLowerCase() === "yellow") ? "black" : "white";
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
