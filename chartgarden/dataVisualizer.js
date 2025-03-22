// Default data when no CSV is loaded
let data = [
  { name: 'Category A', value: 400 },
  { name: 'Category B', value: 300 },
  { name: 'Category C', value: 200 },
  { name: 'Category D', value: 278 },
  { name: 'Category E', value: 189 },
];

// Chart configuration
let chartConfig = {
  nameKey: 'name',
  valueKey: 'value',
  chartType: 'bar',
  stackColumns: [],  // For stacked charts
  divergingEnabled: false,
  leftColumns: [],  // For diverging charts (negative values)
  rightColumns: []  // For diverging charts (positive values)
};

// Colors for charts
const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', 
  '#a4de6c', '#d0ed57', '#ffc658', '#ff8a65'
];

// Chart instance
let chart = null;

// DOM Elements
const csvUpload = document.getElementById('csv-upload');
const chartTypeSelect = document.getElementById('chart-type');
const nameColumnSelect = document.getElementById('name-column');
const valueColumnSelect = document.getElementById('value-column');
const columnSelectors = document.getElementById('column-selectors');
const stackedOptions = document.getElementById('stacked-options');
const stackColumnsSelect = document.getElementById('stack-columns');
const divergingEnabled = document.getElementById('diverging-enabled');
const regularStackOptions = document.getElementById('regular-stack-options');
const divergingOptions = document.getElementById('diverging-options');
const leftColumnsSelect = document.getElementById('left-columns');
const rightColumnsSelect = document.getElementById('right-columns');
const downloadSvgBtn = document.getElementById('download-svg');
const downloadCsvBtn = document.getElementById('download-csv');
const tableBody = document.getElementById('table-body');
const chartCanvas = document.getElementById('chart-canvas');

// Initialize the application
function init() {
  // Render the initial chart
  renderChart();
  
  // Render initial data table
  renderDataTable();
  
  // Setup event listeners
  setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
  // CSV file upload
  csvUpload.addEventListener('change', handleFileUpload);
  
  // Chart type change
  chartTypeSelect.addEventListener('change', (e) => {
    chartConfig.chartType = e.target.value;
    
    // Show/hide stacked options based on chart type
    if (chartConfig.chartType === 'stackedBar' || chartConfig.chartType === 'stackedHorizontalBar') {
      // Show appropriate options based on current diverging state
      if (chartConfig.divergingEnabled) {
        regularStackOptions.classList.add('hidden');
        divergingOptions.classList.remove('hidden');
      } else {
        regularStackOptions.classList.remove('hidden');
        divergingOptions.classList.add('hidden');
      }
    } else {
      regularStackOptions.classList.add('hidden');
      divergingOptions.classList.add('hidden');
    }
    
    renderChart();
  });
  
  // Column selections
  nameColumnSelect.addEventListener('change', (e) => {
    chartConfig.nameKey = e.target.value;
    updateStackColumnsOptions(); // Update stacked columns options
    // Update the selected stack columns in the multi-select
    Array.from(stackColumnsSelect.options).forEach(option => {
      option.selected = chartConfig.stackColumns.includes(option.value);
    });
    renderChart();
    renderDataTable();
  });
  
  valueColumnSelect.addEventListener('change', (e) => {
    chartConfig.valueKey = e.target.value;
    updateStackColumnsOptions(); // Update stacked columns options
    // Update the selected stack columns in the multi-select
    Array.from(stackColumnsSelect.options).forEach(option => {
      option.selected = chartConfig.stackColumns.includes(option.value);
    });
    renderChart();
    renderDataTable();
  });
  
  // Stack columns selection
  stackColumnsSelect.addEventListener('change', (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    chartConfig.stackColumns = selected;
    renderChart();
  });
  
  // Diverging chart toggle
  divergingEnabled.addEventListener('change', (e) => {
    chartConfig.divergingEnabled = e.target.checked;
    
    // Only show/hide appropriate options if we're using a stacked chart type
    if (chartConfig.chartType === 'stackedBar' || chartConfig.chartType === 'stackedHorizontalBar') {
      if (chartConfig.divergingEnabled) {
        regularStackOptions.classList.add('hidden');
        divergingOptions.classList.remove('hidden');
        // Update diverging options
        updateDivergingColumnsOptions();
      } else {
        regularStackOptions.classList.remove('hidden');
        divergingOptions.classList.add('hidden');
      }
    }
    
    renderChart();
  });
  
  // Left columns selection
  leftColumnsSelect.addEventListener('change', (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    chartConfig.leftColumns = selected;
    
    // Update right columns options to exclude left columns
    updateRightColumnsOptions();
    
    renderChart();
  });
  
  // Right columns selection
  rightColumnsSelect.addEventListener('change', (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    chartConfig.rightColumns = selected;
    
    // Update left columns options to exclude right columns
    updateLeftColumnsOptions();
    
    renderChart();
  });
  
  // Download buttons
  downloadSvgBtn.addEventListener('click', downloadSVG);
  downloadCsvBtn.addEventListener('click', downloadCSV);
}

// Handle CSV file upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          // Store the data
          data = results.data;
          
          // Get column names
          const columns = results.meta.fields || Object.keys(results.data[0]);
          
          // Update column selectors
          populateColumnSelectors(columns);
          
          // Show column selectors
          columnSelectors.classList.remove('hidden');
          
          // Default to first column as name and second as value
          if (columns.length >= 2) {
            chartConfig.nameKey = columns[0];
            chartConfig.valueKey = columns[1];
            
            // Pre-select in dropdowns
            nameColumnSelect.value = columns[0];
            valueColumnSelect.value = columns[1];
            
            // Reset stack and diverging columns
            chartConfig.stackColumns = [];
            chartConfig.leftColumns = [];
            chartConfig.rightColumns = [];
            
            // Keep existing diverging enabled state
            
            // Show appropriate stacked options if stacked chart is selected
            if (chartConfig.chartType === 'stackedBar' || chartConfig.chartType === 'stackedHorizontalBar') {
              if (chartConfig.divergingEnabled) {
                regularStackOptions.classList.add('hidden');
                divergingOptions.classList.remove('hidden');
              } else {
                regularStackOptions.classList.remove('hidden');
                divergingOptions.classList.add('hidden');
              }
            } else {
              regularStackOptions.classList.add('hidden');
              divergingOptions.classList.add('hidden');
            }
          }
          
          // Render the updated data
          renderChart();
          renderDataTable();
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format and try again.');
      }
    });
  }
}

// Populate column selector dropdowns
function populateColumnSelectors(columns) {
  // Clear existing options
  nameColumnSelect.innerHTML = '';
  valueColumnSelect.innerHTML = '';
  stackColumnsSelect.innerHTML = '';
  
  // Add new options
  columns.forEach(col => {
    const nameOption = document.createElement('option');
    nameOption.value = col;
    nameOption.textContent = col;
    nameColumnSelect.appendChild(nameOption);
    
    const valueOption = document.createElement('option');
    valueOption.value = col;
    valueOption.textContent = col;
    valueColumnSelect.appendChild(valueOption);
  });
  
  // Update stack columns options based on current selections
  updateStackColumnsOptions();
}

// Update stack column options, excluding the name and value columns
function updateStackColumnsOptions() {
  // Clear existing options
  stackColumnsSelect.innerHTML = '';
  
  // Only add numeric columns that aren't name or value
  if (data.length > 0) {
    const columns = Object.keys(data[0]);
    
    // Filter out selected columns from stack options
    const selectedValueColumn = chartConfig.valueKey;
    
    // Also filter out any columns already in stackColumns that are no longer valid
    chartConfig.stackColumns = chartConfig.stackColumns.filter(col => {
      return col !== chartConfig.nameKey && 
             col !== selectedValueColumn && 
             typeof data[0][col] === 'number';
    });
    
    columns.forEach(col => {
      // Skip name and value columns
      if (col === chartConfig.nameKey || col === selectedValueColumn) {
        return;
      }
      
      // Only include numeric columns
      if (typeof data[0][col] === 'number') {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        stackColumnsSelect.appendChild(option);
      }
    });
  }
  
  // Also update diverging options
  updateDivergingColumnsOptions();
}

// Update the left and right column options for diverging charts
function updateDivergingColumnsOptions() {
  // Update both left and right columns
  updateLeftColumnsOptions();
  updateRightColumnsOptions();
}

// Update left columns options
function updateLeftColumnsOptions() {
  // Clear existing options
  leftColumnsSelect.innerHTML = '';
  
  // Only add numeric columns that aren't name or already in right columns
  if (data.length > 0) {
    const columns = Object.keys(data[0]);
    
    // Filter out any columns in leftColumns that are no longer valid
    chartConfig.leftColumns = chartConfig.leftColumns.filter(col => {
      return col !== chartConfig.nameKey && 
             !chartConfig.rightColumns.includes(col) && 
             typeof data[0][col] === 'number';
    });
    
    columns.forEach(col => {
      // Skip name column and columns already in right
      if (col === chartConfig.nameKey || chartConfig.rightColumns.includes(col)) {
        return;
      }
      
      // Only include numeric columns
      if (typeof data[0][col] === 'number') {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        option.selected = chartConfig.leftColumns.includes(col);
        leftColumnsSelect.appendChild(option);
      }
    });
  }
}

// Update right columns options
function updateRightColumnsOptions() {
  // Clear existing options
  rightColumnsSelect.innerHTML = '';
  
  // Only add numeric columns that aren't name or already in left columns
  if (data.length > 0) {
    const columns = Object.keys(data[0]);
    
    // Filter out any columns in rightColumns that are no longer valid
    chartConfig.rightColumns = chartConfig.rightColumns.filter(col => {
      return col !== chartConfig.nameKey && 
             !chartConfig.leftColumns.includes(col) && 
             typeof data[0][col] === 'number';
    });
    
    columns.forEach(col => {
      // Skip name column and columns already in left
      if (col === chartConfig.nameKey || chartConfig.leftColumns.includes(col)) {
        return;
      }
      
      // Only include numeric columns
      if (typeof data[0][col] === 'number') {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        option.selected = chartConfig.rightColumns.includes(col);
        rightColumnsSelect.appendChild(option);
      }
    });
  }
}

// Render the chart based on current data and configuration
function renderChart() {
  // Prepare labels and data
  const labels = data.map(item => item[chartConfig.nameKey]);
  const values = data.map(item => item[chartConfig.valueKey]);
  
  // Prepare colors for pie/doughnut charts
  const backgroundColors = data.map((_, index) => COLORS[index % COLORS.length]);
  
  // Determine if we should destroy an existing chart
  if (chart) {
    chart.destroy();
  }
  
  // Determine chart type
  let chartType;
  let indexAxis = 'x';
  
  if (chartConfig.chartType === 'horizontalBar' || chartConfig.chartType === 'stackedHorizontalBar') {
    chartType = 'bar';
    indexAxis = 'y';
  } else if (chartConfig.chartType === 'stackedBar') {
    chartType = 'bar';
  } else {
    chartType = chartConfig.chartType;
  }
  
  // Prepare datasets
  let datasets = [];
  
  // For stacked charts, create multiple datasets
  if (chartConfig.chartType === 'stackedBar' || chartConfig.chartType === 'stackedHorizontalBar') {
    // Handle both regular stacked and diverging stacked charts
    if (chartConfig.divergingEnabled) {
      // For diverging charts, handle left and right sides separately
      
      // Left columns (negative values)
      chartConfig.leftColumns.forEach((column, index) => {
        const columnData = data.map(item => {
          // Make left side values negative for diverging
          const value = item[column] || 0;
          return -Math.abs(value);
        });
        
        datasets.push({
          label: column + ' (Left)',
          data: columnData,
          backgroundColor: COLORS[index % COLORS.length],
          borderColor: COLORS[index % COLORS.length],
          borderWidth: 1
        });
      });
      
      // Right columns (positive values)
      chartConfig.rightColumns.forEach((column, index) => {
        datasets.push({
          label: column + ' (Right)',
          data: data.map(item => item[column] || 0),
          backgroundColor: COLORS[(index + chartConfig.leftColumns.length) % COLORS.length],
          borderColor: COLORS[(index + chartConfig.leftColumns.length) % COLORS.length],
          borderWidth: 1
        });
      });
      
    } else {
      // Regular stacked chart
      // First dataset is the main value
      datasets.push({
        label: chartConfig.valueKey,
        data: values,
        backgroundColor: COLORS[0],
        borderColor: COLORS[0],
        borderWidth: 1
      });
      
      // Add additional datasets for each stack column
      chartConfig.stackColumns.forEach((column, index) => {
        datasets.push({
          label: column,
          data: data.map(item => item[column]),
          backgroundColor: COLORS[(index + 1) % COLORS.length],
          borderColor: COLORS[(index + 1) % COLORS.length],
          borderWidth: 1
        });
      });
    }
  } else {
    // For non-stacked charts, just use a single dataset
    datasets.push({
      label: chartConfig.valueKey,
      data: values,
      backgroundColor: chartConfig.chartType === 'line' 
        ? 'rgba(136, 132, 216, 0.5)' 
        : backgroundColors,
      borderColor: chartConfig.chartType === 'line' 
        ? 'rgb(136, 132, 216)' 
        : backgroundColors,
      borderWidth: 1
    });
  }
  
  // Chart.js configuration
  const config = {
    type: chartType,
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: indexAxis,
      scales: {
        x: {
          stacked: chartConfig.chartType === 'stackedBar' || chartConfig.chartType === 'stackedHorizontalBar'
        },
        y: {
          stacked: chartConfig.chartType === 'stackedBar' || chartConfig.chartType === 'stackedHorizontalBar'
        }
      },
      plugins: {
        legend: {
          display: ['pie', 'doughnut'].includes(chartConfig.chartType) || 
                   chartConfig.chartType === 'stackedBar' || 
                   chartConfig.chartType === 'stackedHorizontalBar'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.formattedValue;
              return label;
            }
          }
        }
      }
    }
  };
  
  // Create new chart
  chart = new Chart(chartCanvas, config);
}

// Render the data table
function renderDataTable() {
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add rows for each data item
  data.forEach((item, index) => {
    const row = document.createElement('tr');
    row.className = index % 2 === 0 ? 'bg-gray-50' : 'bg-white';
    
    // Name cell
    const nameCell = document.createElement('td');
    nameCell.className = 'py-2 px-4 border-b';
    nameCell.textContent = item[chartConfig.nameKey];
    row.appendChild(nameCell);
    
    // Value cell
    const valueCell = document.createElement('td');
    valueCell.className = 'py-2 px-4 border-b';
    valueCell.textContent = item[chartConfig.valueKey];
    row.appendChild(valueCell);
    
    // Action cell
    const actionCell = document.createElement('td');
    actionCell.className = 'py-2 px-4 border-b';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'text-red-600 hover:text-red-800';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeDataPoint(index));
    
    actionCell.appendChild(removeBtn);
    row.appendChild(actionCell);
    
    tableBody.appendChild(row);
  });
}

// Remove a data point
function removeDataPoint(index) {
  data.splice(index, 1);
  renderChart();
  renderDataTable();
}

// Download chart as SVG with vector elements
function downloadSVG() {
  if (!chart) {
    alert('No chart to download');
    return;
  }
  
  try {
    const canvas = chartCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Create the SVG container
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">\n';
    
    // Add white background
    svg += '<rect width="100%" height="100%" fill="white"/>\n';
    
    // Different SVG generation based on chart type
    if (chartConfig.chartType === 'pie' || chartConfig.chartType === 'doughnut') {
      // For pie/doughnut charts
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) * 0.7;
      const innerRadius = chartConfig.chartType === 'doughnut' ? radius * 0.5 : 0;
      
      // Calculate total for percentages
      const total = data.reduce((sum, item) => sum + item[chartConfig.valueKey], 0);
      
      // Add pie slices
      let startAngle = 0;
      svg += '<g transform="translate(' + centerX + ',' + centerY + ')">\n';
      
      data.forEach((item, index) => {
        const value = item[chartConfig.valueKey];
        const percentage = value / total;
        const endAngle = startAngle + percentage * 2 * Math.PI;
        
        // Calculate path for slice
        const startX = Math.cos(startAngle) * radius;
        const startY = Math.sin(startAngle) * radius;
        const endX = Math.cos(endAngle) * radius;
        const endY = Math.sin(endAngle) * radius;
        
        const innerStartX = Math.cos(startAngle) * innerRadius;
        const innerStartY = Math.sin(startAngle) * innerRadius;
        const innerEndX = Math.cos(endAngle) * innerRadius;
        const innerEndY = Math.sin(endAngle) * innerRadius;
        
        const largeArcFlag = percentage > 0.5 ? 1 : 0;
        
        let path = '';
        path += 'M ' + innerStartX + ' ' + innerStartY + ' ';
        path += 'L ' + startX + ' ' + startY + ' ';
        path += 'A ' + radius + ' ' + radius + ' 0 ' + largeArcFlag + ' 1 ' + endX + ' ' + endY + ' ';
        path += 'L ' + innerEndX + ' ' + innerEndY + ' ';
        
        if (innerRadius > 0) {
          path += 'A ' + innerRadius + ' ' + innerRadius + ' 0 ' + largeArcFlag + ' 0 ' + innerStartX + ' ' + innerStartY + ' ';
        }
        
        path += 'Z';
        
        const color = COLORS[index % COLORS.length];
        svg += '<path d="' + path + '" fill="' + color + '" stroke="white" stroke-width="1" />\n';
        
        // Add label if there's enough space
        if (percentage > 0.05) {
          const labelAngle = startAngle + (endAngle - startAngle) / 2;
          const labelRadius = (radius + innerRadius) / 2 + 20;
          const labelX = Math.cos(labelAngle) * labelRadius;
          const labelY = Math.sin(labelAngle) * labelRadius;
          const name = item[chartConfig.nameKey];
          svg += '<text x="' + labelX + '" y="' + labelY + '" text-anchor="middle" alignment-baseline="middle" font-size="12" fill="black">' + name + '</text>\n';
        }
        
        startAngle = endAngle;
      });
      
      svg += '</g>\n';
      
    } else if (chartConfig.chartType === 'bar' || chartConfig.chartType === 'horizontalBar') {
      // For bar charts
      const isHorizontal = chartConfig.chartType === 'horizontalBar';
      const labels = data.map(item => item[chartConfig.nameKey]);
      const values = data.map(item => item[chartConfig.valueKey]);
      
      // Calculate scales
      const maxValue = Math.max(...values, 0);
      const padding = 30;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      
      // Draw axes
      svg += '<g transform="translate(' + padding + ',' + (height - padding) + ')">\n';
      
      // X-axis
      svg += '<line x1="0" y1="0" x2="' + chartWidth + '" y2="0" stroke="black" stroke-width="1" />\n';
      
      if (isHorizontal) {
        // Horizontal bars
        const barHeight = chartHeight / labels.length * 0.8;
        const barSpacing = chartHeight / labels.length * 0.2;
        
        // Draw bars
        labels.forEach((label, index) => {
          const barValue = values[index];
          const barWidth = (barValue / maxValue) * chartWidth;
          const barY = -chartHeight + index * (barHeight + barSpacing);
          const color = COLORS[index % COLORS.length];
          
          svg += '<rect x="0" y="' + barY + '" width="' + barWidth + '" height="' + barHeight + '" fill="' + color + '" />\n';
          svg += '<text x="-5" y="' + (barY + barHeight/2) + '" text-anchor="end" alignment-baseline="middle" font-size="12">' + label + '</text>\n';
          svg += '<text x="' + (barWidth + 5) + '" y="' + (barY + barHeight/2) + '" text-anchor="start" alignment-baseline="middle" font-size="12">' + barValue + '</text>\n';
        });
        
        // Y-axis
        svg += '<line x1="0" y1="0" x2="0" y2="' + (-chartHeight) + '" stroke="black" stroke-width="1" />\n';
        
      } else {
        // Vertical bars
        const barWidth = chartWidth / labels.length * 0.8;
        const barSpacing = chartWidth / labels.length * 0.2;
        
        // Draw bars
        labels.forEach((label, index) => {
          const barValue = values[index];
          const barHeight = (barValue / maxValue) * chartHeight;
          const barX = index * (barWidth + barSpacing);
          const color = COLORS[index % COLORS.length];
          
          svg += '<rect x="' + barX + '" y="' + (-barHeight) + '" width="' + barWidth + '" height="' + barHeight + '" fill="' + color + '" />\n';
          svg += '<text x="' + (barX + barWidth/2) + '" y="15" text-anchor="middle" font-size="12" transform="rotate(-45 ' + (barX + barWidth/2) + ',15)">' + label + '</text>\n';
          svg += '<text x="' + (barX + barWidth/2) + '" y="' + (-barHeight - 5) + '" text-anchor="middle" font-size="12">' + barValue + '</text>\n';
        });
        
        // Y-axis
        svg += '<line x1="0" y1="0" x2="0" y2="' + (-chartHeight) + '" stroke="black" stroke-width="1" />\n';
      }
      
      svg += '</g>\n';
      
    } else if (chartConfig.chartType === 'stackedBar' || chartConfig.chartType === 'stackedHorizontalBar') {
      // For stacked bar charts
      const isHorizontal = chartConfig.chartType === 'stackedHorizontalBar';
      const isDiverging = chartConfig.divergingEnabled;
      const labels = data.map(item => item[chartConfig.nameKey]);
      
      // Get all stack values
      let allColumns;
      
      if (isDiverging) {
        // For diverging charts, use left and right columns
        allColumns = [...chartConfig.leftColumns, ...chartConfig.rightColumns];
      } else {
        // For regular stacked charts
        allColumns = [chartConfig.valueKey, ...chartConfig.stackColumns];
      }
      
      // Calculate scales - max value is the sum of all stack values for each data point
      let totals, maxTotal;
      
      if (isDiverging) {
        // For diverging charts, need to calculate max for each side separately
        const leftTotals = data.map(item => 
          chartConfig.leftColumns.reduce((sum, col) => sum + (item[col] || 0), 0)
        );
        const rightTotals = data.map(item => 
          chartConfig.rightColumns.reduce((sum, col) => sum + (item[col] || 0), 0)
        );
        const maxLeft = Math.max(...leftTotals, 0);
        const maxRight = Math.max(...rightTotals, 0);
        maxTotal = Math.max(maxLeft, maxRight);
      } else {
        // For regular stacked charts
        totals = data.map(item => 
          allColumns.reduce((sum, col) => sum + (item[col] || 0), 0)
        );
        maxTotal = Math.max(...totals, 0);
      }
      
      const padding = 30;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      
      // Draw axes based on chart type
      if (isDiverging && isHorizontal) {
        // For diverging horizontal charts, we need to center the coordinate system
        const centerX = chartWidth / 2;
        svg += '<g transform="translate(' + centerX + ',' + (height - padding) + ')">\n';
        
        // X-axis spanning both directions
        svg += '<line x1="' + (-centerX) + '" y1="0" x2="' + centerX + '" y2="0" stroke="black" stroke-width="1" />\n';
        // Center reference line
        svg += '<line x1="0" y1="0" x2="0" y2="' + (-chartHeight) + '" stroke="black" stroke-width="1" stroke-dasharray="3,3" />\n';
      } else {
        // For regular charts or vertical diverging
        svg += '<g transform="translate(' + padding + ',' + (height - padding) + ')">\n';
        
        // X-axis
        svg += '<line x1="0" y1="0" x2="' + chartWidth + '" y2="0" stroke="black" stroke-width="1" />\n';
      }
      
      if (isHorizontal) {
        // Horizontal stacked bars
        const barHeight = chartHeight / labels.length * 0.8;
        const barSpacing = chartHeight / labels.length * 0.2;
        
        // Legend at the top
        svg += '<g transform="translate(' + (chartWidth - 100) + ', ' + (-chartHeight) + ')">\n';
        svg += '<rect width="100" height="' + (allColumns.length * 20 + 10) + '" fill="white" stroke="black" stroke-width="0.5" opacity="0.8" />\n';
        
        allColumns.forEach((col, idx) => {
          const color = COLORS[idx % COLORS.length];
          svg += '<rect x="5" y="' + (idx * 20 + 5) + '" width="15" height="15" fill="' + color + '" />\n';
          svg += '<text x="25" y="' + (idx * 20 + 17) + '" font-size="12">' + col + '</text>\n';
        });
        
        svg += '</g>\n';
        
        // Draw bars
        labels.forEach((label, index) => {
          let currentX = 0;
          
          if (isDiverging) {
            // For diverging chart, start from the middle (x=0)
            currentX = 0;
            
            // Draw left columns (negative values)
            let leftStackPosition = 0;
            [...chartConfig.leftColumns].forEach((col, colIndex) => {
              const value = data[index][col] || 0;
              const barWidth = (value / maxTotal) * chartWidth;
              const barX = -leftStackPosition - barWidth; // Stack from right to left
              const barY = -chartHeight + index * (barHeight + barSpacing);
              const color = COLORS[colIndex % COLORS.length];
              
              svg += '<rect x="' + barX + '" y="' + barY + '" width="' + barWidth + 
                     '" height="' + barHeight + '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if there's enough space
              if (barWidth > 30) {
                svg += '<text x="' + (barX + barWidth/2) + '" y="' + (barY + barHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              leftStackPosition += barWidth; // Update stacking position for next column
            });
            
            // Reset currentX to start right columns from zero
            currentX = 0;
            
            // Draw right columns (positive values)
            chartConfig.rightColumns.forEach((col, colIndex) => {
              const value = data[index][col] || 0;
              const barWidth = (value / maxTotal) * chartWidth;
              const barY = -chartHeight + index * (barHeight + barSpacing);
              const color = COLORS[(colIndex + chartConfig.leftColumns.length) % COLORS.length];
              
              svg += '<rect x="' + currentX + '" y="' + barY + '" width="' + barWidth + 
                     '" height="' + barHeight + '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if there's enough space
              if (barWidth > 30) {
                svg += '<text x="' + (currentX + barWidth/2) + '" y="' + (barY + barHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              currentX += barWidth;
            });
          } else {
            // For regular stacked chart
            // Draw each segment for this data point
            allColumns.forEach((col, colIndex) => {
              const value = data[index][col] || 0;
              const barWidth = (value / maxTotal) * chartWidth;
              const barY = -chartHeight + index * (barHeight + barSpacing);
              const color = COLORS[colIndex % COLORS.length];
              
              svg += '<rect x="' + currentX + '" y="' + barY + '" width="' + barWidth + 
                     '" height="' + barHeight + '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if there's enough space
              if (barWidth > 30) {
                svg += '<text x="' + (currentX + barWidth/2) + '" y="' + (barY + barHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              currentX += barWidth;
            });
          }
          
          // Label for the bar
          svg += '<text x="-5" y="' + ((-chartHeight + index * (barHeight + barSpacing)) + barHeight/2) + 
                 '" text-anchor="end" alignment-baseline="middle" font-size="12">' + label + '</text>\n';
        });
        
        // Y-axis
        svg += '<line x1="0" y1="0" x2="0" y2="' + (-chartHeight) + '" stroke="black" stroke-width="1" />\n';
        
      } else {
        // Vertical stacked bars
        const barWidth = chartWidth / labels.length * 0.8;
        const barSpacing = chartWidth / labels.length * 0.2;
        
        // Legend at the top
        svg += '<g transform="translate(' + (chartWidth - 100) + ', ' + (-chartHeight) + ')">\n';
        svg += '<rect width="100" height="' + (allColumns.length * 20 + 10) + '" fill="white" stroke="black" stroke-width="0.5" opacity="0.8" />\n';
        
        allColumns.forEach((col, idx) => {
          const color = COLORS[idx % COLORS.length];
          svg += '<rect x="5" y="' + (idx * 20 + 5) + '" width="15" height="15" fill="' + color + '" />\n';
          svg += '<text x="25" y="' + (idx * 20 + 17) + '" font-size="12">' + col + '</text>\n';
        });
        
        svg += '</g>\n';
        
        // Draw bars
        labels.forEach((label, index) => {
          const barX = index * (barWidth + barSpacing);
          
          if (isDiverging) {
            // For diverging chart
            // Add a zero reference line
            if (index === 0) {
              // Add a horizontal reference line at the middle
              const zeroY = -chartHeight / 2;
              svg += '<line x1="0" y1="' + zeroY + '" x2="' + chartWidth + '" y2="' + zeroY + 
                     '" stroke="black" stroke-width="1" stroke-dasharray="3,3" />\n';
            }
            
            // Calculate zero line position - middle of the chart height
            const zeroY = -chartHeight / 2;
            
            // Draw left columns (down from zero - negative)
            let negativeHeight = 0;
            
            chartConfig.leftColumns.forEach((col, colIndex) => {
              const value = data[index][col] || 0;
              const segmentHeight = (value / maxTotal) * (chartHeight / 2); // Half height for each direction
              const color = COLORS[colIndex % COLORS.length];
              
              svg += '<rect x="' + barX + '" y="' + (zeroY + negativeHeight) + 
                     '" width="' + barWidth + '" height="' + segmentHeight + 
                     '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if there's enough space
              if (segmentHeight > 20) {
                svg += '<text x="' + (barX + barWidth/2) + '" y="' + (zeroY + negativeHeight + segmentHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              negativeHeight += segmentHeight;
            });
            
            // Draw right columns (up from zero - positive)
            let positiveHeight = 0;
            
            chartConfig.rightColumns.forEach((col, colIndex) => {
              const value = data[index][col] || 0;
              const segmentHeight = (value / maxTotal) * (chartHeight / 2);
              const color = COLORS[(colIndex + chartConfig.leftColumns.length) % COLORS.length];
              
              svg += '<rect x="' + barX + '" y="' + (zeroY - positiveHeight - segmentHeight) + 
                     '" width="' + barWidth + '" height="' + segmentHeight + 
                     '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if there's enough space
              if (segmentHeight > 20) {
                svg += '<text x="' + (barX + barWidth/2) + '" y="' + (zeroY - positiveHeight - segmentHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              positiveHeight += segmentHeight;
            });
          } else {
            // For regular stacked chart
            let currentHeight = 0;
            
            // Draw each segment for this data point
            allColumns.forEach((col, colIndex) => {
              const value = data[index][col] || 0;
              const segmentHeight = (value / maxTotal) * chartHeight;
              const color = COLORS[colIndex % COLORS.length];
              
              svg += '<rect x="' + barX + '" y="' + (-currentHeight - segmentHeight) + 
                     '" width="' + barWidth + '" height="' + segmentHeight + 
                     '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if there's enough space
              if (segmentHeight > 20) {
                svg += '<text x="' + (barX + barWidth/2) + '" y="' + (-currentHeight - segmentHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              currentHeight += segmentHeight;
            });
          }
          
          // Label for the bar
          svg += '<text x="' + (barX + barWidth/2) + '" y="15" text-anchor="middle" font-size="12" transform="rotate(-45 ' + 
                 (barX + barWidth/2) + ',15)">' + label + '</text>\n';
        });
        
        // Y-axis
        svg += '<line x1="0" y1="0" x2="0" y2="' + (-chartHeight) + '" stroke="black" stroke-width="1" />\n';
      }
      
      svg += '</g>\n';
      
    } else if (chartConfig.chartType === 'line') {
      // For line charts
      const labels = data.map(item => item[chartConfig.nameKey]);
      const values = data.map(item => item[chartConfig.valueKey]);
      
      // Calculate scales
      const maxValue = Math.max(...values, 0);
      const padding = 30;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      
      // Draw axes
      svg += '<g transform="translate(' + padding + ',' + (height - padding) + ')">\n';
      
      // X-axis
      svg += '<line x1="0" y1="0" x2="' + chartWidth + '" y2="0" stroke="black" stroke-width="1" />\n';
      
      // Y-axis
      svg += '<line x1="0" y1="0" x2="0" y2="' + (-chartHeight) + '" stroke="black" stroke-width="1" />\n';
      
      // Draw line
      const points = labels.map((label, index) => {
        const x = index * (chartWidth / (labels.length - 1));
        const y = -((values[index] / maxValue) * chartHeight);
        return x + ',' + y;
      }).join(' ');
      
      svg += '<polyline points="' + points + '" fill="none" stroke="#8884d8" stroke-width="2" />\n';
      
      // Draw points on the line
      labels.forEach((label, index) => {
        const x = index * (chartWidth / (labels.length - 1));
        const y = -((values[index] / maxValue) * chartHeight);
        
        svg += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#8884d8" />\n';
        
        // X-axis labels
        svg += '<text x="' + x + '" y="15" text-anchor="middle" font-size="12" transform="rotate(-45 ' + x + ',15)">' + label + '</text>\n';
        
        // Value labels
        svg += '<text x="' + x + '" y="' + (y - 10) + '" text-anchor="middle" font-size="12">' + values[index] + '</text>\n';
      });
      
      svg += '</g>\n';
    }
    
    // Close SVG
    svg += '</svg>';
    
    // Create blob and download
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, 'chart.svg');
    
  } catch (error) {
    console.error('Error creating SVG:', error);
    alert('There was an error creating the SVG. Please try again.');
  }
}

// Download data as CSV
function downloadCSV() {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'data.csv');
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);