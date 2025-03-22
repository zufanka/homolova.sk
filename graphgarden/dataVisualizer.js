// Destructure React components
const { useState, useRef, useEffect } = React;

// Destructure Recharts components
const {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine
} = Recharts;

// Main DataVisualizer component
const DataVisualizer = () => {
  // Default data when no CSV is loaded
  const [data, setData] = useState([
    { name: 'Category A', value: 400 },
    { name: 'Category B', value: 300 },
    { name: 'Category C', value: 200 },
    { name: 'Category D', value: 278 },
    { name: 'Category E', value: 189 },
  ]);
  
  const [columns, setColumns] = useState({ nameKey: 'name', valueKey: 'value' });
  const [availableColumns, setAvailableColumns] = useState([]);
  const [chartType, setChartType] = useState('bar-vertical');
  const [divergingOptions, setDivergingOptions] = useState({
    enabled: false,
    middlePoint: 0,
    leftCategories: [],
    rightCategories: []
  });
  const chartRef = useRef(null);
  
  // Color palette for charts
  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];
  
  const removeDataPoint = (index) => {
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            // Extract column names from the first row
            const cols = results.meta.fields || Object.keys(results.data[0]);
            setAvailableColumns(cols);
            
            // Set default column mappings (first column as name, second as value)
            if (cols.length >= 2) {
              setColumns({
                nameKey: cols[0],
                valueKey: cols[1]
              });
              
              // Reset diverging options when loading new data
              const numericCols = cols.filter(col => 
                typeof results.data[0][col] === 'number'
              );
              
              // Create reasonable defaults for diverging chart
              // If we have at least 2 numeric columns, set first as left and second as right
              if (numericCols.length >= 2) {
                setDivergingOptions({
                  ...divergingOptions,
                  leftCategories: [numericCols[0]],
                  rightCategories: [numericCols[1]]
                });
              } else {
                // Otherwise reset to defaults
                setDivergingOptions({
                  enabled: false,
                  middlePoint: 0,
                  leftCategories: [],
                  rightCategories: []
                });
              }
            }
            
            setData(results.data);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Error parsing CSV file. Please check the format and try again.');
        }
      });
    }
  };
  
  const downloadSVG = () => {
    try {
      const svgElement = chartRef.current.querySelector('svg');
      if (!svgElement) {
        console.error('No SVG element found');
        return;
      }
      
      // Create a new SVG element
      const svgString = new XMLSerializer().serializeToString(svgElement);
      
      // Create a blob with SVG content
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // Create a link to download it
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chart.svg';
      
      // Append to the document, click and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Revoke the object URL to free memory
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error downloading SVG:', error);
      alert('There was an error downloading the SVG. Please try again.');
    }
  };

  // Function to download current data as CSV
  const downloadCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render chart based on selected chart type
  const renderChart = () => {
    switch(chartType) {
      case 'bar-vertical':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={columns.nameKey} 
                angle={-45} 
                textAnchor="end" 
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={columns.valueKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'bar-horizontal':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              layout="vertical"
              data={data} 
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey={columns.nameKey} 
                type="category"
                width={80}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey={columns.valueKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'stacked-horizontal-bar':
        // For diverging bar charts, transform the data if needed
        const horizontalProcessedData = [...data];
        
        if (divergingOptions.enabled) {
          if (divergingOptions.leftCategories.length > 0) {
            // For category-based diverging, negate the values for left side categories
            horizontalProcessedData.forEach(item => {
              divergingOptions.leftCategories.forEach(col => {
                if (item[col] !== undefined) {
                  item[col] = -Math.abs(item[col]);
                }
              });
            });
          }
        }
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              layout="vertical"
              data={horizontalProcessedData} 
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
              stackOffset={divergingOptions.enabled ? "sign" : "expand"}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                domain={divergingOptions.enabled ? ['dataMin', 'dataMax'] : [0, 'dataMax']}
                // Add a reference line at x=0 for diverging charts
                tickFormatter={(value) => Math.abs(value) + '%'}
              />
              <YAxis 
                dataKey={columns.nameKey} 
                type="category"
                width={80}
              />
              <Tooltip formatter={(value) => `${Math.abs(value)}%`} />
              <Legend />
              <ReferenceLine x={0} stroke="#000" />
              
              {/* For categorical diverging, render both sides */}
              {divergingOptions.enabled && divergingOptions.leftCategories.length > 0 ? (
                <>
                  {/* Left side categories */}
                  {divergingOptions.leftCategories.map((col, index) => (
                    <Bar 
                      key={`left-${col}`} 
                      dataKey={col} 
                      stackId="stack"
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                  
                  {/* Right side categories */}
                  {divergingOptions.rightCategories.map((col, index) => (
                    <Bar 
                      key={`right-${col}`} 
                      dataKey={col} 
                      stackId="stack"
                      fill={COLORS[(index + divergingOptions.leftCategories.length) % COLORS.length]} 
                    />
                  ))}
                </>
              ) : (
                // Regular stacked bar chart
                <>
                  <Bar dataKey={columns.valueKey} stackId="stack" fill="#8884d8" />
                  {availableColumns
                    .filter(col => col !== columns.nameKey && col !== columns.valueKey && typeof data[0]?.[col] === 'number')
                    .slice(0, 5) // Limit to 5 additional columns
                    .map((col, index) => (
                      <Bar key={col} dataKey={col} stackId="stack" fill={COLORS[(index + 1) % COLORS.length]} />
                    ))
                  }
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey={columns.valueKey}
                nameKey={columns.nameKey}
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#8884d8"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={columns.nameKey} 
                angle={-45} 
                textAnchor="end" 
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={columns.valueKey} stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'stacked-bar':
        // For diverging bar charts, transform the data if needed
        const verticalProcessedData = [...data];
        
        if (divergingOptions.enabled) {
          if (divergingOptions.leftCategories.length > 0) {
            // For category-based diverging, negate the values for left side categories
            verticalProcessedData.forEach(item => {
              divergingOptions.leftCategories.forEach(col => {
                if (item[col] !== undefined) {
                  item[col] = -Math.abs(item[col]);
                }
              });
            });
          }
        }
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={verticalProcessedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              stackOffset={divergingOptions.enabled ? "sign" : "expand"}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={columns.nameKey} 
                angle={-45} 
                textAnchor="end" 
                height={70}
              />
              <YAxis 
                domain={divergingOptions.enabled ? ['dataMin', 'dataMax'] : [0, 'dataMax']}
                tickFormatter={(value) => Math.abs(value) + '%'}
              />
              <Tooltip formatter={(value) => `${Math.abs(value)}%`} />
              <Legend />
              <ReferenceLine y={0} stroke="#000" />
              
              {/* For categorical diverging, render both sides */}
              {divergingOptions.enabled && divergingOptions.leftCategories.length > 0 ? (
                <>
                  {/* Left side categories */}
                  {divergingOptions.leftCategories.map((col, index) => (
                    <Bar 
                      key={`left-${col}`} 
                      dataKey={col} 
                      stackId="stack"
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                  
                  {/* Right side categories */}
                  {divergingOptions.rightCategories.map((col, index) => (
                    <Bar 
                      key={`right-${col}`} 
                      dataKey={col} 
                      stackId="stack"
                      fill={COLORS[(index + divergingOptions.leftCategories.length) % COLORS.length]} 
                    />
                  ))}
                </>
              ) : (
                // Regular stacked bar chart
                <>
                  <Bar dataKey={columns.valueKey} stackId="stack" fill="#8884d8" />
                  {availableColumns
                    .filter(col => col !== columns.nameKey && col !== columns.valueKey && typeof data[0]?.[col] === 'number')
                    .slice(0, 5) // Limit to 5 additional columns
                    .map((col, index) => (
                      <Bar key={col} dataKey={col} stackId="stack" fill={COLORS[(index + 1) % COLORS.length]} />
                    ))
                  }
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        );
        
      default:
        return <div>Select a chart type</div>;
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Data Visualization Tool</h1>
        <p className="text-gray-600 mb-4">Upload CSV, visualize data, and download as SVG</p>
        
        {/* CSV Upload Section */}
        <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">Upload Data</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 
                file:mr-4 file:py-2 file:px-4 
                file:rounded file:border-0 
                file:text-sm file:font-semibold 
                file:bg-blue-50 file:text-blue-700 
                hover:file:bg-blue-100"
            />
          </div>
          
          {availableColumns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name/Category Column</label>
                <select 
                  value={columns.nameKey} 
                  onChange={(e) => setColumns({...columns, nameKey: e.target.value})}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                >
                  {availableColumns.map(col => (
                    <option key={`name-${col}`} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value Column</label>
                <select 
                  value={columns.valueKey} 
                  onChange={(e) => setColumns({...columns, valueKey: e.target.value})}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                >
                  {availableColumns.map(col => (
                    <option key={`value-${col}`} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Visualization Options */}
        <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">Visualization Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              >
                <option value="bar-vertical">Bar Chart (Vertical)</option>
                <option value="bar-horizontal">Bar Chart (Horizontal)</option>
                <option value="stacked-horizontal-bar">Stacked Bar Chart (Horizontal)</option>
                <option value="stacked-bar">Stacked Bar Chart (Vertical)</option>
                <option value="pie">Pie Chart</option>
                <option value="line">Line Chart</option>
              </select>
            </div>

            {/* Only show diverging options for stacked chart types */}
            {(chartType === 'stacked-bar' || chartType === 'stacked-horizontal-bar') && (
              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="diverging-enabled"
                    checked={divergingOptions.enabled}
                    onChange={(e) => setDivergingOptions({
                      ...divergingOptions,
                      enabled: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <label htmlFor="diverging-enabled" className="text-sm font-medium text-gray-700">
                    Enable Diverging Chart
                  </label>
                </div>
                
                {divergingOptions.enabled && (
                  <div className="mt-4 border-t pt-4">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diverging Method
                      </label>
                      
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="diverging-method"
                            checked={divergingOptions.leftCategories.length === 0}
                            onChange={() => setDivergingOptions({
                              ...divergingOptions,
                              leftCategories: [],
                              rightCategories: []
                            })}
                            className="mr-1"
                          />
                          <span className="text-sm">Numeric Middle Point</span>
                        </label>
                        
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="diverging-method"
                            checked={divergingOptions.leftCategories.length > 0}
                            onChange={() => {
                              // Initialize with first column on left side if switching to categories
                              if (divergingOptions.leftCategories.length === 0) {
                                const availableCols = availableColumns.filter(
                                  col => col !== columns.nameKey && typeof data[0]?.[col] === 'number'
                                );
                                const leftCols = availableCols.length > 0 ? [availableCols[0]] : [];
                                const rightCols = availableCols.length > 1 ? [availableCols[1]] : [];
                                
                                setDivergingOptions({
                                  ...divergingOptions,
                                  leftCategories: leftCols,
                                  rightCategories: rightCols
                                });
                              }
                            }}
                            className="mr-1"
                          />
                          <span className="text-sm">Split Categories</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Show numeric middle point option */}
                    {divergingOptions.leftCategories.length === 0 && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Middle Point Value
                        </label>
                        <input
                          type="number"
                          value={divergingOptions.middlePoint}
                          onChange={(e) => setDivergingOptions({
                            ...divergingOptions,
                            middlePoint: parseFloat(e.target.value) || 0
                          })}
                          className="border border-gray-300 rounded px-3 py-2 w-full"
                        />
                      </div>
                    )}
                    
                    {/* Show category selection options */}
                    {divergingOptions.leftCategories.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Left Side Categories
                          </label>
                          <select
                            multiple
                            value={divergingOptions.leftCategories}
                            onChange={(e) => {
                              const selected = Array.from(
                                e.target.selectedOptions,
                                option => option.value
                              );
                              setDivergingOptions({
                                ...divergingOptions,
                                leftCategories: selected
                              });
                            }}
                            className="border border-gray-300 rounded px-3 py-2 w-full h-24"
                          >
                            {availableColumns
                              .filter(col => 
                                col !== columns.nameKey && 
                                typeof data[0]?.[col] === 'number' &&
                                !divergingOptions.rightCategories.includes(col)
                              )
                              .map(col => (
                                <option key={`left-opt-${col}`} value={col}>{col}</option>
                              ))
                            }
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Right Side Categories
                          </label>
                          <select
                            multiple
                            value={divergingOptions.rightCategories}
                            onChange={(e) => {
                              const selected = Array.from(
                                e.target.selectedOptions,
                                option => option.value
                              );
                              setDivergingOptions({
                                ...divergingOptions,
                                rightCategories: selected
                              });
                            }}
                            className="border border-gray-300 rounded px-3 py-2 w-full h-24"
                          >
                            {availableColumns
                              .filter(col => 
                                col !== columns.nameKey && 
                                typeof data[0]?.[col] === 'number' &&
                                !divergingOptions.leftCategories.includes(col)
                              )
                              .map(col => (
                                <option key={`right-opt-${col}`} value={col}>{col}</option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Visualization */}
      <div className="mb-6" ref={chartRef}>
        <h2 className="text-lg font-semibold mb-3">Visualization</h2>
        {renderChart()}
      </div>
      
      {/* Download Options */}
      <div className="flex gap-4 justify-start mb-6">
        <button
          onClick={downloadSVG}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Download as SVG
        </button>
        <button
          onClick={downloadCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Download as CSV
        </button>
      </div>
      
      {/* Data Table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Data Table</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">{columns.nameKey}</th>
                <th className="py-2 px-4 border-b">{columns.valueKey}</th>
                <th className="py-2 px-4 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-2 px-4 border-b">{item[columns.nameKey]}</td>
                  <td className="py-2 px-4 border-b">{item[columns.valueKey]}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => removeDataPoint(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// This ensures the DataVisualizer component is available globally for the HTML file to use
window.DataVisualizer = DataVisualizer;