import React, { useState, useMemo, useEffect } from 'react';

const ChartPreview = ({ data, onChartExportData, onReset }) => {
  const [chartType, setChartType] = useState('pie');
  const [categoryColumn, setCategoryColumn] = useState('');
  const [valueColumn, setValueColumn] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    chartGuide: false
  });
  
  // Prefer full dataset if available
  const sourceRows = useMemo(() => {
    if (data && Array.isArray(data.rows) && data.rows.length > 0) return data.rows;
    return Array.isArray(data.preview) ? data.preview : [];
  }, [data]);

  // Get unique values for filter dropdown
  const filterValues = useMemo(() => {
    if (!filterColumn || !sourceRows) return [];
    const uniqueValues = new Set();
    sourceRows.forEach(row => {
      const value = row[filterColumn];
      if (value !== null && value !== undefined && value !== '') {
        uniqueValues.add(String(value).trim());
      }
    });
    return Array.from(uniqueValues).sort();
  }, [filterColumn, sourceRows]);

  // Helper function to safely get column value
  const getColumnValue = (row, column) => {
    const value = row[column];
    if (value === null || value === undefined || value === '') {
      return 'Empty/Null';
    }
    return String(value).trim();
  };

  // Generate chart data based on selected columns and chart type
  const chartData = useMemo(() => {
    if (!categoryColumn || !sourceRows || sourceRows.length === 0) {
      return [];
    }

    // Apply filter if specified
    let filteredData = sourceRows;
    if (filterColumn && filterValue) {
      filteredData = sourceRows.filter(row => getColumnValue(row, filterColumn) === filterValue);
    }

    if (filteredData.length === 0) {
      return [];
    }

    if (chartType === 'pie') {
      const frequencyCount = {};
      filteredData.forEach(row => {
        const value = row[categoryColumn];
        if (value === null || value === undefined || value === '') {
          frequencyCount['Empty/Null'] = (frequencyCount['Empty/Null'] || 0) + 1;
        } else {
          const stringValue = String(value).trim();
          frequencyCount[stringValue] = (frequencyCount[stringValue] || 0) + 1;
        }
      });
      
      const result = Object.entries(frequencyCount)
        .map(([name, value]) => ({ name: name || 'Empty', value }))
        .sort((a, b) => b.value - a.value);
      
      return result;
    } else if (chartType === 'bar') {
      const groupedData = {};
      filteredData.forEach(row => {
        const category = row[categoryColumn];
        const categoryKey = category === null || category === undefined || category === '' ? 'Empty/Null' : String(category).trim();
        if (!groupedData[categoryKey]) groupedData[categoryKey] = 0;
        if (valueColumn && row[valueColumn] !== null && row[valueColumn] !== undefined && row[valueColumn] !== '') {
          const numericValue = parseFloat(row[valueColumn]);
          groupedData[categoryKey] += isNaN(numericValue) ? 1 : numericValue;
        } else {
          groupedData[categoryKey] += 1;
        }
      });
      
      const result = Object.entries(groupedData)
        .map(([name, value]) => ({ name: name || 'Empty', value: Math.round(value * 100) / 100 }))
        .sort((a, b) => b.value - a.value);
      
      return result;
    } else if (chartType === 'line') {
      // For line charts, we need both category and value columns
      if (!valueColumn) {
        console.log('Line chart: No value column selected');
        return [];
      }
      
      console.log('Line chart data processing:', { categoryColumn, valueColumn, filteredDataLength: filteredData.length });
      
      const lineData = filteredData
        .filter(row => {
          const category = row[categoryColumn];
          const value = row[valueColumn];
          const isValid = category !== null && category !== undefined && category !== '' &&
                         value !== null && value !== undefined && value !== '';
          if (!isValid) {
            console.log('Line chart: Invalid row data:', { category, value });
          }
          return isValid;
        })
        .map(row => ({
          name: String(row[categoryColumn]).trim(),
          value: parseFloat(row[valueColumn])
        }))
        .filter(item => {
          const isValid = !isNaN(item.value);
          if (!isValid) {
            console.log('Line chart: Invalid numeric value:', item);
          }
          return isValid;
        })
        .sort((a, b) => {
          // Try to sort numerically first, then alphabetically
          const aNum = parseFloat(a.name);
          const bNum = parseFloat(b.name);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          return a.name.localeCompare(b.name);
        });
      
      console.log('Line chart final data:', lineData);
      return lineData;
    } else if (chartType === 'scatter') {
      // For scatter plots, we need both category and value columns
      if (!valueColumn) {
        console.log('Scatter plot: No value column selected');
        return [];
      }
      
      console.log('Scatter plot data processing:', { categoryColumn, valueColumn, filteredDataLength: filteredData.length });
      
      const scatterData = filteredData
        .filter(row => {
          const category = row[categoryColumn];
          const value = row[valueColumn];
          const isValid = category !== null && category !== undefined && category !== '' &&
                         value !== null && value !== undefined && value !== '';
          if (!isValid) {
            console.log('Scatter plot: Invalid row data:', { category, value });
          }
          return isValid;
        })
        .map(row => ({
          name: String(row[categoryColumn]).trim(),
          value: parseFloat(row[valueColumn])
        }))
        .filter(item => {
          const isValid = !isNaN(item.value);
          if (!isValid) {
            console.log('Scatter plot: Invalid numeric value:', item);
          }
          return isValid;
        });
      
      console.log('Scatter plot final data:', scatterData);
      return scatterData;
    } else if (chartType === 'histogram') {
      // For histograms, we need numeric data in the category column
      console.log('Histogram data processing:', { categoryColumn, filteredDataLength: filteredData.length });
      
      const numericValues = filteredData
        .filter(row => {
          const value = row[categoryColumn];
          const isValid = value !== null && value !== undefined && value !== '';
          if (!isValid) {
            console.log('Histogram: Invalid row data:', { value });
          }
          return isValid;
        })
        .map(row => parseFloat(row[categoryColumn]))
        .filter(value => {
          const isValid = !isNaN(value);
          if (!isValid) {
            console.log('Histogram: Invalid numeric value:', value);
          }
          return isValid;
        });
      
      console.log('Histogram numeric values:', numericValues);
      
      if (numericValues.length === 0) {
        console.log('Histogram: No valid numeric values found');
        return [];
      }
      
      // Create histogram bins
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const binCount = Math.min(10, Math.ceil(Math.sqrt(numericValues.length)));
      const binSize = (max - min) / binCount;
      
      console.log('Histogram binning:', { min, max, binCount, binSize });
      
      const bins = {};
      for (let i = 0; i < binCount; i++) {
        const binStart = min + (i * binSize);
        const binEnd = min + ((i + 1) * binSize);
        const binLabel = i === binCount - 1 
          ? `${binStart.toFixed(2)}+`
          : `${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`;
        bins[binLabel] = 0;
      }
      
      // Count values in each bin
      numericValues.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
        const binStart = min + (binIndex * binSize);
        const binEnd = min + ((binIndex + 1) * binSize);
        const binLabel = binIndex === binCount - 1 
          ? `${binStart.toFixed(2)}+`
          : `${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`;
        bins[binLabel]++;
      });
      
      const result = Object.entries(bins)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          // Sort by bin start value
          const aStart = parseFloat(a.name.split(' - ')[0]);
          const bStart = parseFloat(b.name.split(' - ')[0]);
          return aStart - bStart;
        });
      
      console.log('Histogram final result:', result);
      return result;
    }
    
    return [];
  }, [chartType, categoryColumn, valueColumn, filterColumn, filterValue, sourceRows]);

  // Notify parent component when chart data is ready for export
  useEffect(() => {
    if (onChartExportData && chartData.length > 0) {
      onChartExportData({
        chartType,
        chartData,
        categoryColumn,
        valueColumn
      });
    }
  }, [chartData, chartType, onChartExportData, categoryColumn, valueColumn]);

  // Colors for charts
  const COLORS = [
    '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c',
    '#d0ed57', '#ffc658', '#ff7300', '#ff0000', '#ff69b4',
    '#9370db', '#32cd32', '#ffd700', '#ff6347', '#00ced1'
  ];

  // Render pie chart using SVG
  const renderPieChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const width = 400;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 40;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate total for percentages
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    
    // Generate pie slices
    let currentAngle = 0;
    const slices = chartData.map((item, index) => {
      const percentage = item.value / total;
      const startAngle = currentAngle;
      const endAngle = currentAngle + (percentage * 2 * Math.PI);
      currentAngle = endAngle;
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = percentage > 0.5 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      return {
        path: pathData,
        color: COLORS[index % COLORS.length],
        item,
        percentage,
        startAngle,
        endAngle
      };
    });
    
    const chartTitle = filterColumn && filterValue 
      ? `Pie Chart (Filtered: ${filterColumn} = ${filterValue})`
      : 'Pie Chart';
    
    return (
      <div className="w-full bg-white p-4 rounded-lg border border-gray-200" data-chart-type="pie">
        <h4 className="text-center font-bold mb-4 text-gray-800">{chartTitle}</h4>
        <svg width={width} height={height} className="mx-auto">
          {slices.map((slice, index) => (
            <g key={index}>
              <path
                d={slice.path}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
              />
              {/* Add labels for larger slices */}
              {slice.percentage > 0.1 && (
                <text
                  x={centerX + (radius * 0.7) * Math.cos(slice.startAngle + (slice.endAngle - slice.startAngle) / 2)}
                  y={centerY + (radius * 0.7) * Math.sin(slice.startAngle + (slice.endAngle - slice.startAngle) / 2)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="14"
                  fill="white"
                  fontWeight="bold"
                >
                  {Math.round(slice.percentage * 100)}%
                </text>
              )}
            </g>
          ))}
        </svg>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="truncate">{item.name}</span>
              <span className="font-bold">({item.value})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render bar chart using SVG
  const renderBarChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const width = 500;
    const height = 300;
    const barWidth = 30;
    const barSpacing = 15;
    const maxValue = Math.max(...chartData.map(item => item.value));
    const scale = (height - 80) / maxValue;
    
    const chartTitle = filterColumn && filterValue 
      ? `Bar Chart (Filtered: ${filterColumn} = ${filterValue})`
      : 'Bar Chart';
    
    return (
      <div className="w-full bg-white p-4 rounded-lg border border-gray-200" data-chart-type="bar">
        <h4 className="text-center font-bold mb-4 text-gray-800">{chartTitle}</h4>
        <svg width={width} height={height} className="mx-auto">
          {/* Y-axis */}
          <line x1="60" y1="50" x2="60" y2={height - 30} stroke="black" strokeWidth="2" />
          <line x1="60" y1={height - 30} x2={width - 20} y2={height - 30} stroke="black" strokeWidth="2" />
          
          {/* Bars */}
          {chartData.map((item, index) => {
            const x = 80 + (index * (barWidth + barSpacing));
            const barHeight = item.value * scale;
            const y = height - 30 - barHeight;
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={COLORS[index % COLORS.length]}
                  stroke="white"
                  strokeWidth="1"
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="black"
                >
                  {item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="black"
                  fontWeight="bold"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Render histogram using SVG
  const renderHistogram = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const width = 500;
    const height = 300;
    const barWidth = (width - 120) / chartData.length;
    const maxValue = Math.max(...chartData.map(item => item.value));
    const scale = (height - 80) / maxValue;
    
    const chartTitle = filterColumn && filterValue 
      ? `Histogram (Filtered: ${filterColumn} = ${filterValue})`
      : 'Histogram';
    
    return (
      <div className="w-full bg-white p-4 rounded-lg border border-gray-200" data-chart-type="histogram">
        <h4 className="text-center font-bold mb-4 text-gray-800">{chartTitle}</h4>
        <svg width={width} height={height} className="mx-auto">
          {/* Y-axis */}
          <line x1="60" y1="50" x2="60" y2={height - 30} stroke="black" strokeWidth="2" />
          <line x1="60" y1={height - 30} x2={width - 20} y2={height - 30} stroke="black" strokeWidth="2" />
          
          {/* Bars */}
          {chartData.map((item, index) => {
            const x = 80 + (index * barWidth);
            const barHeight = item.value * scale;
            const y = height - 30 - barHeight;
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth - 2}
                  height={barHeight}
                  fill={COLORS[index % COLORS.length]}
                  stroke="white"
                  strokeWidth="1"
                />
                <text
                  x={x + (barWidth - 2) / 2}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="8"
                  fill="black"
                >
                  {item.name}
                </text>
                <text
                  x={x + (barWidth - 2) / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="black"
                  fontWeight="bold"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Render line chart using SVG
  const renderLineChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const width = 500;
    const height = 300;
    const padding = 60;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    const chartTitle = filterColumn && filterValue 
      ? `Line Chart (Filtered: ${filterColumn} = ${filterValue})`
      : 'Line Chart';
    
    // Calculate scales
    const xValues = chartData.map((_, index) => index);
    const yValues = chartData.map(item => item.value);
    const xScale = chartWidth / (xValues.length - 1);
    const yScale = chartHeight / (Math.max(...yValues) - Math.min(...yValues));
    
    // Generate path data
    const pathData = chartData.map((item, index) => {
      const x = padding + (index * xScale);
      const y = padding + chartHeight - ((item.value - Math.min(...yValues)) * yScale);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return (
      <div className="w-full bg-white p-4 rounded-lg border border-gray-200" data-chart-type="line">
        <h4 className="text-center font-bold mb-4 text-gray-800">{chartTitle}</h4>
        <svg width={width} height={height} className="mx-auto">
          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="black" strokeWidth="2" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="black" strokeWidth="2" />
          
          {/* Line */}
          <path d={pathData} stroke="#8884d8" strokeWidth="3" fill="none" />
          
          {/* Data points */}
          {chartData.map((item, index) => {
            const x = padding + (index * xScale);
            const y = padding + chartHeight - ((item.value - Math.min(...yValues)) * yScale);
            
            return (
              <g key={index}>
                <circle cx={x} cy={y} r="4" fill="#8884d8" stroke="white" strokeWidth="2" />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="black"
                  fontWeight="bold"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels */}
          {chartData.map((item, index) => {
            const x = padding + (index * xScale);
            return (
              <text
                key={index}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="8"
                fill="black"
              >
                {item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // Render scatter plot using SVG
  const renderScatterPlot = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const width = 500;
    const height = 300;
    const padding = 60;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    const chartTitle = filterColumn && filterValue 
      ? `Scatter Plot (Filtered: ${filterColumn} = ${filterValue})`
      : 'Scatter Plot';
    
    // Calculate scales
    const xValues = chartData.map(item => parseFloat(item.name) || 0);
    const yValues = chartData.map(item => item.value);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    const xScale = chartWidth / (xMax - xMin);
    const yScale = chartHeight / (yMax - yMin);
    
    return (
      <div className="w-full bg-white p-4 rounded-lg border border-gray-200" data-chart-type="scatter">
        <h4 className="text-center font-bold mb-4 text-gray-800">{chartTitle}</h4>
        <svg width={width} height={height} className="mx-auto">
          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="black" strokeWidth="2" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="black" strokeWidth="2" />
          
          {/* Data points */}
          {chartData.map((item, index) => {
            const x = padding + ((parseFloat(item.name) - xMin) * xScale);
            const y = padding + chartHeight - ((item.value - yMin) * yScale);
            
            return (
              <g key={index}>
                <circle cx={x} cy={y} r="4" fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth="1" />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="8"
                  fill="black"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (!data || (!data.preview && !data.rows)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Chart Visualization</h2>
      <p className="text-gray-600 mb-6">
        Select chart type and columns to visualize your data. Different chart types have different data requirements.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Chart Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chart Type
          </label>
          <select
            value={chartType}
            onChange={(e) => {
              setChartType(e.target.value);
              // Clear value column for histogram, pie, and bar charts
              if (['histogram', 'pie', 'bar'].includes(e.target.value)) {
                setValueColumn('');
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pie">Pie Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="histogram">Histogram</option>
            <option value="line">Line Chart</option>
            <option value="scatter">Scatter Plot</option>
          </select>
        </div>

        {/* Column Selection - Dynamic based on chart type */}
        {['pie', 'bar', 'histogram'].includes(chartType) ? (
          // Single column selection for pie, bar, histogram
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {chartType === 'histogram' ? 'Numeric Column' : 'Category Column'}
            </label>
            <select
              value={categoryColumn}
              onChange={(e) => setCategoryColumn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a column</option>
              {data.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ) : (
          // Two column selection for line and scatter charts
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X-Axis Column {chartType === 'line' ? '(Category/Time)' : '(Numeric)'}
              </label>
              <select
                value={categoryColumn}
                onChange={(e) => setCategoryColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select X-axis column</option>
                {data.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Y-Axis Column (Numeric)
              </label>
              <select
                value={valueColumn}
                onChange={(e) => setValueColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Y-axis column</option>
                {data.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Value Column for pie and bar charts */}
        {['pie', 'bar'].includes(chartType) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value Column (Optional)
            </label>
            <select
              value={valueColumn}
              onChange={(e) => setValueColumn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No value column (count frequency)</option>
              {data.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart Filtering */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter Column
          </label>
          <select
            value={filterColumn}
            onChange={(e) => {
              setFilterColumn(e.target.value);
              setFilterValue(''); // Reset filter value when column changes
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No filter</option>
            {data.headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter Value
          </label>
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            disabled={!filterColumn}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a value</option>
            {filterValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={() => {
              setCategoryColumn('');
              setValueColumn('');
              setFilterColumn('');
              setFilterValue('');
              onReset(); // Call the onReset callback
            }}
            disabled={!categoryColumn && !valueColumn && !filterColumn && !filterValue}
            title="Reset all chart configuration (columns and filters)"
            className="w-full px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 transition-colors duration-200"
          >
            🔄 Reset All
          </button>
        </div>
      </div>

      {/* Chart Summary */}
      {chartData.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            ✅ Chart Data Ready
          </h3>
          <p className="text-xs text-green-600">
            {chartData.length} data points ready for {chartType} visualization
            {filterColumn && filterValue && (
              <span className="block mt-1">
                📊 Filtered by: {filterColumn} = {filterValue}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Chart Type Guide - Collapsible */}
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md">
        <button
          onClick={() => setExpandedSections(prev => ({ ...prev, chartGuide: !prev.chartGuide }))}
          className="w-full p-3 text-left hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">💡 Chart Type Guide</span>
            <svg
              className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ${
                expandedSections.chartGuide ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {expandedSections.chartGuide && (
          <div className="px-3 pb-3 border-t border-gray-100">
            <div className="mt-3 space-y-3">
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-800 font-medium mb-2">Chart Requirements:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  {chartType === 'pie' && (
                    <li>• <strong>Pie Chart:</strong> Category column (any data type) + optional value column (numeric)</li>
                  )}
                  {chartType === 'bar' && (
                    <li>• <strong>Bar Chart:</strong> Category column (any data type) + optional value column (numeric)</li>
                  )}
                  {chartType === 'histogram' && (
                    <li>• <strong>Histogram:</strong> Single numeric column for frequency distribution</li>
                  )}
                  {chartType === 'line' && (
                    <li>• <strong>Line Chart:</strong> X-axis (category/time) + Y-axis (numeric) columns required</li>
                  )}
                  {chartType === 'scatter' && (
                    <li>• <strong>Scatter Plot:</strong> Both X and Y columns must contain numeric data</li>
                  )}
                </ul>
              </div>
              
              <div className="p-3 bg-gray-100 rounded border border-gray-200">
                <p className="text-xs text-gray-700 font-medium mb-2">General Guidelines:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• <strong>Pie/Bar:</strong> Work with any data type, show frequency or values</li>
                  <li>• <strong>Histogram:</strong> Requires numeric data for distribution analysis</li>
                  <li>• <strong>Line Chart:</strong> Perfect for time series or sequential data</li>
                  <li>• <strong>Scatter Plot:</strong> Shows correlation between two numeric variables</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {categoryColumn && chartData.length > 0 && (
        <div className="space-y-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Chart Ready for Export
            </h3>
            <p className="text-sm text-green-700">
              {chartType === 'pie' ? 'Pie Chart' : 
               chartType === 'bar' ? 'Bar Chart' :
               chartType === 'line' ? 'Line Chart' :
               chartType === 'scatter' ? 'Scatter Plot' :
               'Histogram'}: {categoryColumn}
              {chartType === 'bar' && valueColumn && ` vs ${valueColumn}`}
              {(chartType === 'line' || chartType === 'scatter') && valueColumn && ` vs ${valueColumn}`}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {chartType === 'histogram' ? 
                `${chartData.length} bins with ${chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()} total data points` :
                `${chartData.length} unique categories with ${chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()} total ${valueColumn ? 'values' : 'records'}`
              }
              {filterColumn && filterValue && (
                <span className="block mt-1">
                  📊 Filtered by: {filterColumn} = {filterValue}
                </span>
              )}
            </p>
          </div>
          
          {/* Chart Visualization */}
          <div className="flex justify-center" data-chart-type={chartType}>
            {chartType === 'pie' ? renderPieChart() : 
             chartType === 'bar' ? renderBarChart() : 
             chartType === 'histogram' ? renderHistogram() : 
             chartType === 'line' ? renderLineChart() : 
             chartType === 'scatter' ? renderScatterPlot() : 
             <div className="text-red-500">Unknown chart type: {chartType}</div>}
          </div>
          
          <div className="text-center">
            <p className="text-xs text-blue-600">
              ✅ Chart export buttons are now available in the Export Options section below
            </p>
          </div>
        </div>
      )}

      {categoryColumn && chartData.length === 0 && (
        <div className="text-center py-8 text-red-500">
          <p className="font-medium">No data available for the selected columns and chart type.</p>
          <div className="mt-3 p-3 bg-red-50 rounded border border-red-200 text-left text-sm">
            <p className="font-medium text-red-800 mb-2">Troubleshooting:</p>
            <ul className="text-red-700 space-y-1">
              <li>• <strong>Line Chart:</strong> Requires both category AND value columns with numeric data</li>
              <li>• <strong>Scatter Plot:</strong> Requires both columns to contain numeric data</li>
              <li>• <strong>Histogram:</strong> Requires category column with numeric data (no value column needed)</li>
              <li>• <strong>Pie/Bar Charts:</strong> Work with any data type</li>
            </ul>
            <p className="mt-2 text-xs text-red-600">
              Current: Category="{categoryColumn}" Value="{valueColumn || 'None'}" Chart="{chartType}"
            </p>
          </div>
        </div>
      )}

      {!categoryColumn && (
        <div className="text-center py-8 text-gray-500">
          <p>Select a category column above to generate a chart.</p>
        </div>
      )}
    </div>
  );
};

export default ChartPreview;