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
  rightColumns: [],  // For diverging charts (positive values)
  showDataValues: false  // Whether to show data values on export
};

// Colors for charts
const COLORS = [
  '#DF8E99', '#E39162', '#83B171', '#53AFDC', 
  '#9A9EEC', '#C198BD', '#90A6CA', '#A5A5A5'
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
const showDataValuesCheckbox = document.getElementById('show-data-values');
const downloadSvgBtn = document.getElementById('download-svg');
const tableBody = document.getElementById('table-body');
const chartCanvas = document.getElementById('chart-canvas');

// Add event listener to window for page refresh 
window.addEventListener('pageshow', (event) => {
  // pageshow fires on initial load and when navigating back to the page
  // Check if the page is from cache (such as when using back/forward buttons)
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    // Reset all form elements if page was loaded from cache
    resetFormElements();
    // Re-render the chart with default settings
    renderChart();
    renderDataTable();
  }
});

// Initialize the application
function init() {
  // Reset all form elements to default state
  resetFormElements();
  
  // Render the initial chart
  renderChart();
  
  // Render initial data table
  renderDataTable();
  
  // Setup event listeners
  setupEventListeners();
}

// Reset all form elements to their default state
function resetFormElements() {
  // Reset chart type dropdown to default 'bar'
  chartTypeSelect.value = 'bar';
  chartConfig.chartType = 'bar';
  
  // Reset diverging chart checkbox
  divergingEnabled.checked = false;
  chartConfig.divergingEnabled = false;
  
  // Reset show data values checkbox
  showDataValuesCheckbox.checked = false;
  chartConfig.showDataValues = false;
  
  // Reset stack column selections
  chartConfig.stackColumns = [];
  chartConfig.leftColumns = [];
  chartConfig.rightColumns = [];
  
  // Hide all stack-related elements
  regularStackOptions.classList.add('hidden');
  divergingOptions.classList.add('hidden');
  
  // Reset file input
  csvUpload.value = '';
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
  
  // Show data values checkbox
  showDataValuesCheckbox.addEventListener('change', (e) => {
    chartConfig.showDataValues = e.target.checked;
  });
  
  // Download button
  downloadSvgBtn.addEventListener('click', downloadSVG);
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
      // For diverging charts, handle left and right sides with precise control over order
      
      // Define the exact order of colors we want to use
      // For a true diverging effect, we need to render the first selected column farthest from center
      
      // Process left columns in original selection order
      // In Chart.js, the stacking order is determined by the order of datasets
      // Since Chart.js renders datasets in reverse order (last dataset is at bottom/left),
      // we need to add them in reverse order to get the first selected to be outermost
      
      // Create a shallow copy and reverse to change the stacking order without changing color assignment
      [...chartConfig.leftColumns].reverse().forEach((column, revIndex) => {
        // Calculate the original index to maintain color consistency
        const originalIndex = chartConfig.leftColumns.length - 1 - revIndex;
        const colorIndex = originalIndex % COLORS.length;
        
        const columnData = data.map(item => {
          // Make left side values negative for diverging
          const value = item[column] || 0;
          return -Math.abs(value);
        });
        
        datasets.push({
          label: column + ' (Left)',
          data: columnData,
          backgroundColor: COLORS[colorIndex],
          borderColor: COLORS[colorIndex],
          borderWidth: 1
        });
      });
      
      // Right columns also need to be in order that makes the first selected outermost
      // Unlike left columns, we need to add right columns in original order
      // This creates a "mirror" stacking effect where the first selections are on the outside
      chartConfig.rightColumns.forEach((column, index) => {
        // Continue color sequence after leftColumns
        const colorIndex = (index + chartConfig.leftColumns.length) % COLORS.length;
        
        datasets.push({
          label: column + ' (Right)',
          data: data.map(item => item[column] || 0),
          backgroundColor: COLORS[colorIndex],
          borderColor: COLORS[colorIndex],
          borderWidth: 1
        });
      });
      
    } else {
      // Regular stacked chart
      // Create datasets in the exact order of selection
      const allStackColumns = [chartConfig.valueKey, ...chartConfig.stackColumns];
      
      // Create datasets in the order they were selected
      allStackColumns.forEach((column, index) => {
        datasets.push({
          label: column,
          data: data.map(item => item[column] || 0),
          backgroundColor: COLORS[index % COLORS.length],
          borderColor: COLORS[index % COLORS.length],
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
    
    // Get chart scales and axes info from Chart.js
    const chartScales = chart.scales;
    const xScale = chartScales.x;
    const yScale = chartScales.y;
    
    // Define base padding for chart elements
    const basePadding = 30; // Original padding used throughout the code
    
    // Add additional padding for labels, legends, and axes that might be outside the chart area
    const extraPadding = {
      left: 80,    // Extra space for y-axis labels on the left
      right: 120,  // Extra space for right side legends and labels
      top: 50,     // Extra space for title or top legends
      bottom: 80   // Extra space for x-axis labels, especially when rotated
    };
    
    // Calculate the expanded dimensions to include everything
    const totalWidth = width + extraPadding.left + extraPadding.right;
    const totalHeight = height + extraPadding.top + extraPadding.bottom;
    
    // Create the SVG container with the expanded size
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + totalWidth + '" height="' + totalHeight + 
              '" viewBox="0 0 ' + totalWidth + ' ' + totalHeight + '">\n';
    
    // Add white background for the entire expanded area
    svg += '<rect width="100%" height="100%" fill="white"/>\n';
    
    // Adjust the transform to account for the extra padding
    const transformX = basePadding + extraPadding.left;
    const transformY = basePadding + extraPadding.top;
    
    // For calculations throughout the function
    const chartWidth = width - basePadding * 2;
    const chartHeight = height - basePadding * 2;
    
    // Different SVG generation based on chart type
    if (chartConfig.chartType === 'pie' || chartConfig.chartType === 'doughnut') {
      // For pie/doughnut charts
      const centerX = totalWidth / 2;
      const centerY = totalHeight / 2;
      const radius = Math.min(width, height) / 2 * 0.7; // Use original canvas dimensions for radius calculation
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
        
        // Always add name label if there's enough space
        if (percentage > 0.05) {
          const labelAngle = startAngle + (endAngle - startAngle) / 2;
          const labelRadius = (radius + innerRadius) / 2 + 20;
          const labelX = Math.cos(labelAngle) * labelRadius;
          const labelY = Math.sin(labelAngle) * labelRadius;
          const name = item[chartConfig.nameKey];
          svg += '<text x="' + labelX + '" y="' + labelY + '" text-anchor="middle" alignment-baseline="middle" font-size="12" fill="black">' + name + '</text>\n';
          
          // Add value if enabled and there's enough space
          if (chartConfig.showDataValues && percentage > 0.08) {
            const valueX = Math.cos(labelAngle) * (labelRadius - 15);
            const valueY = Math.sin(labelAngle) * (labelRadius - 15);
            svg += '<text x="' + valueX + '" y="' + valueY + '" text-anchor="middle" alignment-baseline="middle" font-size="11" fill="black">' + value + '</text>\n';
          }
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
      
      // Draw axes
      svg += '<g transform="translate(' + transformX + ',' + (totalHeight - transformY) + ')">\n';
      
      // Draw grid lines for y axis
      const yTickCount = 5;
      const yTickStep = chartHeight / yTickCount;
      
      for (let i = 0; i <= yTickCount; i++) {
        const yPos = -i * yTickStep;
        const yValue = Math.round((i / yTickCount) * maxValue);
        
        // Grid line
        svg += '<line x1="0" y1="' + yPos + '" x2="' + chartWidth + '" y2="' + yPos + 
               '" stroke="#e0e0e0" stroke-width="1" />\n';
        
        // Tick value
        svg += '<text x="-5" y="' + yPos + '" text-anchor="end" alignment-baseline="middle" font-size="10">' + 
               yValue + '</text>\n';
      }
      
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
          
          // Only show value if enabled
          if (chartConfig.showDataValues) {
            svg += '<text x="' + (barWidth + 5) + '" y="' + (barY + barHeight/2) + '" text-anchor="start" alignment-baseline="middle" font-size="12">' + barValue + '</text>\n';
          }
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
          
          // Only show data value if enabled
          if (chartConfig.showDataValues) {
            svg += '<text x="' + (barX + barWidth/2) + '" y="' + (-barHeight - 5) + '" text-anchor="middle" font-size="12">' + barValue + '</text>\n';
          }
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
      
      // Define centerX for all horizontal chart types
      const centerX = chartWidth / 2;
      
      // Draw axes based on chart type
      if (isDiverging && isHorizontal) {
        // For diverging horizontal charts, align at the left edge rather than center
        svg += '<g transform="translate(' + transformX + ',' + (totalHeight - transformY) + ')">\n';
        
        // X-axis spanning the width
        svg += '<line x1="0" y1="0" x2="' + chartWidth + '" y2="0" stroke="black" stroke-width="1" />\n';
        
        // Add a midpoint line
        const midpointX = chartWidth * 0.5;
        
        // Grid lines for y axis
        const yTickCount = 5;
        const yTickStep = chartHeight / yTickCount;
      
        for (let i = 0; i <= yTickCount; i++) {
          const yPos = -i * yTickStep;
          
          // Calculate appropriate percentage of maxTotal
          const tickValue = Math.round((i / yTickCount) * maxTotal);
          
          // Grid lines spanning the chart width
          svg += '<line x1="0" y1="' + yPos + '" x2="' + chartWidth + '" y2="' + yPos + 
                '" stroke="#e0e0e0" stroke-width="1" />\n';
          
          // Tick values on left side (behind the axis)
          svg += '<text x="-5" y="' + yPos + '" text-anchor="end" alignment-baseline="middle" font-size="10">' + 
                tickValue + '</text>\n';
                
          // Add tick values at the midpoint
          svg += '<text x="' + (midpointX + 5) + '" y="' + yPos + '" text-anchor="start" alignment-baseline="middle" font-size="10">' + 
                tickValue + '</text>\n';
        }
        
        // We need to define barHeight and barSpacing here before using them
        const barHeight = chartHeight / labels.length * 0.8;
        const barSpacing = chartHeight / labels.length * 0.2;
        
        // Add horizontal grid lines for each bar
        labels.forEach((label, idx) => {
          const barY = -chartHeight + idx * (barHeight + barSpacing) + barHeight/2;
          // Horizontal gridline extending through this bar's position
          svg += '<line x1="0" y1="' + barY + '" x2="' + chartWidth + '" y2="' + barY + 
                '" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="3,3" />\n';
        });
      } else {
        // For regular charts or vertical diverging
        svg += '<g transform="translate(' + transformX + ',' + (totalHeight - transformY) + ')">\n';
        
        // Draw grid lines for y axis
        const yTickCount = 5;
        const yTickStep = chartHeight / yTickCount;
        
        for (let i = 0; i <= yTickCount; i++) {
          const yPos = -i * yTickStep;
          const yValue = Math.round((i / yTickCount) * maxTotal);
          
          // Grid line
          svg += '<line x1="0" y1="' + yPos + '" x2="' + chartWidth + '" y2="' + yPos + 
                 '" stroke="#e0e0e0" stroke-width="1" />\n';
          
          // Tick value
          svg += '<text x="-5" y="' + yPos + '" text-anchor="end" alignment-baseline="middle" font-size="10">' + 
                 yValue + '</text>\n';
        }
        
        // X-axis
        svg += '<line x1="0" y1="0" x2="' + chartWidth + '" y2="0" stroke="black" stroke-width="1" />\n';
      }
      
      if (isHorizontal) {
        // Horizontal stacked bars
        const barHeight = chartHeight / labels.length * 0.8;
        const barSpacing = chartHeight / labels.length * 0.2;
        
        // Legend at the top - structured to match the selection order
        svg += '<g transform="translate(' + (chartWidth - 150) + ', ' + (-chartHeight) + ')">\n';
        
        // Calculate exact height based on the columns we'll show
        const legendHeight = isDiverging ? 
          (chartConfig.leftColumns.length + chartConfig.rightColumns.length) * 20 + 10 :
          allColumns.length * 20 + 10;
        
        svg += '<rect width="150" height="' + legendHeight + '" fill="white" stroke="black" stroke-width="0.5" opacity="0.8" />\n';
        
        if (isDiverging) {
          // For diverging chart, maintain the specific order of selection for the legend
          // First left columns (in original selection order)
          chartConfig.leftColumns.forEach((col, idx) => {
            const color = COLORS[idx % COLORS.length];
            svg += '<rect x="5" y="' + (idx * 20 + 5) + '" width="15" height="15" fill="' + color + '" />\n';
            svg += '<text x="25" y="' + (idx * 20 + 17) + '" font-size="12">' + col + ' (Left)</text>\n';
          });
          
          // Then right columns
          chartConfig.rightColumns.forEach((col, idx) => {
            const rowIndex = idx + chartConfig.leftColumns.length;
            const colorIndex = (idx + chartConfig.leftColumns.length) % COLORS.length;
            const color = COLORS[colorIndex];
            svg += '<rect x="5" y="' + (rowIndex * 20 + 5) + '" width="15" height="15" fill="' + color + '" />\n';
            svg += '<text x="25" y="' + (rowIndex * 20 + 17) + '" font-size="12">' + col + ' (Right)</text>\n';
          });
        } else {
          // For regular stacked chart - use the order defined in allColumns
          allColumns.forEach((col, idx) => {
            const color = COLORS[idx % COLORS.length];
            svg += '<rect x="5" y="' + (idx * 20 + 5) + '" width="15" height="15" fill="' + color + '" />\n';
            svg += '<text x="25" y="' + (idx * 20 + 17) + '" font-size="12">' + col + '</text>\n';
          });
        }
        
        svg += '</g>\n';
        
        // Draw bars
        labels.forEach((label, index) => {
          let currentX = 0;
          
          if (isDiverging) {
            // For diverging chart, use the mid-point divider we defined earlier
            const midpointX = chartWidth * 0.5; // Middle of the chart width
            
            // Add a mid-point reference line (divider) if not already added
            svg += '<line x1="' + midpointX + '" y1="0" x2="' + midpointX + '" y2="' + (-chartHeight) + 
                   '" stroke="black" stroke-width="1" stroke-dasharray="3,3" />\n';
            
            // Draw left columns (from midpoint leftward)
            // Stack from the midpoint leftward in the exact order of selection
            // This ensures the first selected column is always the furthest left
            let leftStackPosition = 0;
            
            // Process the selected left columns in reverse order for stacking
            // This way, the first selected item will be at the outermost left position
            [...chartConfig.leftColumns].reverse().forEach((col, revIndex) => {
              // Calculate the original index in the non-reversed array
              const colIndex = chartConfig.leftColumns.length - 1 - revIndex;
              
              const value = data[index][col] || 0;
              const barWidth = (value / maxTotal) * chartWidth * 0.5; // Use half the width for each side
              const barY = -chartHeight + index * (barHeight + barSpacing);
              // Match the color to the dataset for this column
              const color = COLORS[colIndex % COLORS.length];
              
              // Position bars to grow from the midpoint leftward
              const barX = midpointX - leftStackPosition - barWidth;
              
              svg += '<rect x="' + barX + '" y="' + barY + '" width="' + barWidth + 
                     '" height="' + barHeight + '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if enabled and there's enough space
              if (chartConfig.showDataValues && barWidth > 30) {
                svg += '<text x="' + (barX + barWidth/2) + '" y="' + (barY + barHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              leftStackPosition += barWidth; // Stack from right to left
            });
            
            // Draw right columns (from midpoint rightward)
            currentX = midpointX; // Start at the midpoint
            
            // Process right columns in forward order (unlike left columns)
            // This way, the first item will be closest to the midpoint
            chartConfig.rightColumns.forEach((col, colIndex) => {
              const value = data[index][col] || 0;
              const barWidth = (value / maxTotal) * chartWidth * 0.5; // Use half the width for each side
              const barY = -chartHeight + index * (barHeight + barSpacing);
              // Match the color to the dataset for this column
              const color = COLORS[(colIndex + chartConfig.leftColumns.length) % COLORS.length];
              
              svg += '<rect x="' + currentX + '" y="' + barY + '" width="' + barWidth + 
                     '" height="' + barHeight + '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if enabled and there's enough space
              if (chartConfig.showDataValues && barWidth > 30) {
                svg += '<text x="' + (currentX + barWidth/2) + '" y="' + (barY + barHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              currentX += barWidth; // Stack from left to right
            });
          } else {
            // For regular stacked chart
            // Draw each segment for this data point in the exact order of selection
            // allColumns already contains [valueKey, ...stackColumns] in the correct order
            allColumns.forEach((col, colIndex) => {
              const value = data[index][col] || 0;
              const barWidth = (value / maxTotal) * chartWidth;
              const barY = -chartHeight + index * (barHeight + barSpacing);
              // Use the same color index as in the datasets for consistency
              const color = COLORS[colIndex % COLORS.length];
              
              svg += '<rect x="' + currentX + '" y="' + barY + '" width="' + barWidth + 
                     '" height="' + barHeight + '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if enabled and there's enough space
              if (chartConfig.showDataValues && barWidth > 30) {
                svg += '<text x="' + (currentX + barWidth/2) + '" y="' + (barY + barHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              currentX += barWidth;
            });
          }
          
          // Label for the bar - place behind the Y axis for all horizontal charts
          svg += '<text x="-5" y="' + ((-chartHeight + index * (barHeight + barSpacing)) + barHeight/2) + 
                '" text-anchor="end" alignment-baseline="middle" font-size="12">' + label + '</text>\n';
        });
        
        // Y-axis
        svg += '<line x1="0" y1="0" x2="0" y2="' + (-chartHeight) + '" stroke="black" stroke-width="1" />\n';
        
        // Horizontal grid lines for easier reading
        const yTickCount = 5;
        const yTickStep = chartHeight / yTickCount;
        for (let i = 1; i <= yTickCount; i++) {
          const yPos = -i * yTickStep;
          const tickValue = Math.round((i / yTickCount) * maxTotal);
          
          // Grid line
          svg += '<line x1="0" y1="' + yPos + '" x2="' + chartWidth + '" y2="' + yPos + 
                '" stroke="#e0e0e0" stroke-width="1" />\n';
          
          // Y-axis tick value
          svg += '<text x="-5" y="' + yPos + '" text-anchor="end" alignment-baseline="middle" font-size="10">' + 
                tickValue + '</text>\n';
        }
        
      } else {
        // Vertical stacked bars
        const barWidth = chartWidth / labels.length * 0.8;
        const barSpacing = chartWidth / labels.length * 0.2;
        
        // Legend at the top - structured to match the selection order
        svg += '<g transform="translate(' + (chartWidth - 150) + ', ' + (-chartHeight) + ')">\n';
        
        // Calculate exact height based on the columns we'll show
        const legendHeight = isDiverging ? 
          (chartConfig.leftColumns.length + chartConfig.rightColumns.length) * 20 + 10 :
          allColumns.length * 20 + 10;
        
        svg += '<rect width="150" height="' + legendHeight + '" fill="white" stroke="black" stroke-width="0.5" opacity="0.8" />\n';
        
        if (isDiverging) {
          // For diverging chart, maintain the specific order of selection for the legend
          // First left columns (in original selection order)
          chartConfig.leftColumns.forEach((col, idx) => {
            const color = COLORS[idx % COLORS.length];
            svg += '<rect x="5" y="' + (idx * 20 + 5) + '" width="15" height="15" fill="' + color + '" />\n';
            svg += '<text x="25" y="' + (idx * 20 + 17) + '" font-size="12">' + col + ' (Left)</text>\n';
          });
          
          // Then right columns
          chartConfig.rightColumns.forEach((col, idx) => {
            const rowIndex = idx + chartConfig.leftColumns.length;
            const colorIndex = (idx + chartConfig.leftColumns.length) % COLORS.length;
            const color = COLORS[colorIndex];
            svg += '<rect x="5" y="' + (rowIndex * 20 + 5) + '" width="15" height="15" fill="' + color + '" />\n';
            svg += '<text x="25" y="' + (rowIndex * 20 + 17) + '" font-size="12">' + col + ' (Right)</text>\n';
          });
        } else {
          // For regular stacked chart - use the order defined in allColumns
          allColumns.forEach((col, idx) => {
            const color = COLORS[idx % COLORS.length];
            svg += '<rect x="5" y="' + (idx * 20 + 5) + '" width="15" height="15" fill="' + color + '" />\n';
            svg += '<text x="25" y="' + (idx * 20 + 17) + '" font-size="12">' + col + '</text>\n';
          });
        }
        
        svg += '</g>\n';
        
        // Draw bars
        labels.forEach((label, index) => {
          const barX = index * (barWidth + barSpacing);
          
          if (isDiverging) {
            // For diverging chart
            // Add a zero reference line and Y-axis gridlines
            if (index === 0) {
              // Add grid lines for Y axis on both sides of the zero line
              const yTickCount = 5;
              const halfChartHeight = chartHeight / 2;
              const yTickStep = halfChartHeight / yTickCount;
              
              // Middle zero line
              const zeroY = -halfChartHeight;
              svg += '<line x1="0" y1="' + zeroY + '" x2="' + chartWidth + '" y2="' + zeroY + 
                     '" stroke="black" stroke-width="1" stroke-dasharray="3,3" />\n';
                     
              // Gridlines below zero (negative values)
              for (let i = 1; i <= yTickCount; i++) {
                const yPos = zeroY + (i * yTickStep);
                const tickValue = Math.round((i / yTickCount) * maxTotal);
                
                // Grid line
                svg += '<line x1="0" y1="' + yPos + '" x2="' + chartWidth + '" y2="' + yPos + 
                      '" stroke="#e0e0e0" stroke-width="1" />\n';
                
                // Tick value
                svg += '<text x="-5" y="' + yPos + '" text-anchor="end" alignment-baseline="middle" font-size="10">' + 
                      tickValue + '</text>\n';
              }
              
              // Gridlines above zero (positive values)
              for (let i = 1; i <= yTickCount; i++) {
                const yPos = zeroY - (i * yTickStep);
                const tickValue = Math.round((i / yTickCount) * maxTotal);
                
                // Grid line
                svg += '<line x1="0" y1="' + yPos + '" x2="' + chartWidth + '" y2="' + yPos + 
                      '" stroke="#e0e0e0" stroke-width="1" />\n';
                
                // Tick value
                svg += '<text x="-5" y="' + yPos + '" text-anchor="end" alignment-baseline="middle" font-size="10">' + 
                      tickValue + '</text>\n';
              }
              
              // Add vertical gridlines for each bar position
              for (let i = 0; i < labels.length; i++) {
                const barXPos = i * (barWidth + barSpacing) + barWidth/2;
                svg += '<line x1="' + barXPos + '" y1="0" x2="' + barXPos + '" y2="' + (-chartHeight) + 
                      '" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="3,3" />\n';
              }
            }
            
            // Calculate zero line position - middle of the chart height
            const zeroY = -chartHeight / 2;
            
            // Draw left columns (down from zero - negative)
            // In exact order of selection
            let negativeHeight = 0;
            
            // For vertical stacking, we need to consider the visual effect
            // In a diverging chart, we want the first selected column to be the outermost
            // We need to reverse the order for the left columns to match what we do in the Chart.js rendering
            [...chartConfig.leftColumns].reverse().forEach((col, revIndex) => {
              // Get the original index to maintain color consistency
              const colIndex = chartConfig.leftColumns.length - 1 - revIndex;
              const value = data[index][col] || 0;
              const segmentHeight = (value / maxTotal) * (chartHeight / 2); // Half height for each direction
              // Match color to the dataset for this column
              const color = COLORS[colIndex % COLORS.length];
              
              svg += '<rect x="' + barX + '" y="' + (zeroY + negativeHeight) + 
                     '" width="' + barWidth + '" height="' + segmentHeight + 
                     '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if enabled and there's enough space
              if (chartConfig.showDataValues && segmentHeight > 20) {
                svg += '<text x="' + (barX + barWidth/2) + '" y="' + (zeroY + negativeHeight + segmentHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              negativeHeight += segmentHeight;
            });
            
            // Draw right columns (up from zero - positive)
            // In exact order of selection
            let positiveHeight = 0;
            
            // For right columns, we need to consider the stack direction
            // In a consistent diverging chart, we want the first selected column to be the outermost
            // For consistency, process the columns in original order
            chartConfig.rightColumns.forEach((col, colIndex) => {
              const value = data[index][col] || 0;
              const segmentHeight = (value / maxTotal) * (chartHeight / 2);
              // Match color to the dataset for this column
              const color = COLORS[(colIndex + chartConfig.leftColumns.length) % COLORS.length];
              
              svg += '<rect x="' + barX + '" y="' + (zeroY - positiveHeight - segmentHeight) + 
                     '" width="' + barWidth + '" height="' + segmentHeight + 
                     '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if enabled and there's enough space
              if (chartConfig.showDataValues && segmentHeight > 20) {
                svg += '<text x="' + (barX + barWidth/2) + '" y="' + (zeroY - positiveHeight - segmentHeight/2) + 
                       '" text-anchor="middle" font-size="11" fill="white">' + value + '</text>\n';
              }
              
              positiveHeight += segmentHeight;
            });
          } else {
            // For regular stacked chart in the order of column selection
            let currentHeight = 0;
            
            // Draw each segment for this data point in the exact order of selection
            // allColumns already contains [valueKey, ...stackColumns] in the correct order
            allColumns.forEach((col, colIndex) => {
              const value = data[index][col] || 0;
              const segmentHeight = (value / maxTotal) * chartHeight;
              // Use the same color index as in the datasets for consistency
              const color = COLORS[colIndex % COLORS.length];
              
              svg += '<rect x="' + barX + '" y="' + (-currentHeight - segmentHeight) + 
                     '" width="' + barWidth + '" height="' + segmentHeight + 
                     '" fill="' + color + '" stroke="white" stroke-width="0.5" />\n';
              
              // Only add text if enabled and there's enough space
              if (chartConfig.showDataValues && segmentHeight > 20) {
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
        
        // Add horizontal gridlines for vertical bars
        const yTickCount = 5;
        const yTickStep = chartHeight / yTickCount;
        for (let i = 1; i <= yTickCount; i++) {
          const yPos = -i * yTickStep;
          const tickValue = Math.round((i / yTickCount) * maxTotal);
          
          // Grid line
          svg += '<line x1="0" y1="' + yPos + '" x2="' + chartWidth + '" y2="' + yPos + 
                '" stroke="#e0e0e0" stroke-width="1" />\n';
          
          // Y-axis tick value
          svg += '<text x="-5" y="' + yPos + '" text-anchor="end" alignment-baseline="middle" font-size="10">' + 
                tickValue + '</text>\n';
        }
        
        // Add vertical gridlines at each bar position
        labels.forEach((label, idx) => {
          const barX = idx * (barWidth + barSpacing) + barWidth/2;
          svg += '<line x1="' + barX + '" y1="0" x2="' + barX + '" y2="' + (-chartHeight) + 
                '" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="3,3" />\n';
        });
      }
      
      svg += '</g>\n';
      
    } else if (chartConfig.chartType === 'line') {
      // For line charts
      const labels = data.map(item => item[chartConfig.nameKey]);
      const values = data.map(item => item[chartConfig.valueKey]);
      
      // Calculate scales
      const maxValue = Math.max(...values, 0);
      
      // Draw axes
      svg += '<g transform="translate(' + transformX + ',' + (totalHeight - transformY) + ')">\n';
      
      // Draw grid lines for both axes
      const yTickCount = 5;
      const yTickStep = chartHeight / yTickCount;
      
      for (let i = 0; i <= yTickCount; i++) {
        const yPos = -i * yTickStep;
        const yValue = Math.round((i / yTickCount) * maxValue);
        
        // Grid line
        svg += '<line x1="0" y1="' + yPos + '" x2="' + chartWidth + '" y2="' + yPos + 
               '" stroke="#e0e0e0" stroke-width="1" />\n';
        
        // Tick value
        svg += '<text x="-5" y="' + yPos + '" text-anchor="end" alignment-baseline="middle" font-size="10">' + 
               yValue + '</text>\n';
      }
      
      // X-axis with ticks
      svg += '<line x1="0" y1="0" x2="' + chartWidth + '" y2="0" stroke="black" stroke-width="1" />\n';
      
      // Add vertical grid lines for each data point
      labels.forEach((label, index) => {
        const x = index * (chartWidth / (labels.length - 1));
        svg += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + (-chartHeight) + 
               '" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="3,3" />\n';
      });
      
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
        
        // Value labels (if enabled)
        if (chartConfig.showDataValues) {
          svg += '<text x="' + x + '" y="' + (y - 10) + '" text-anchor="middle" font-size="12">' + values[index] + '</text>\n';
        }
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


// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
