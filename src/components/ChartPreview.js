import React, { useState, useMemo, useEffect } from 'react';
import DrillDownModal from './DrillDownModal';

const ChartPreview = ({ data, onReset, config, onConfigChange }) => {
  // Use external configuration if provided, otherwise use local state
  const [chartType, setChartType] = useState(config?.chartType || 'pie');
  const [categoryColumn, setCategoryColumn] = useState(config?.categoryColumn || '');
  const [valueColumn, setValueColumn] = useState(config?.valueColumn || '');
  const [filterColumn, setFilterColumn] = useState(config?.filterColumn || '');
  const [filterValue, setFilterValue] = useState(config?.filterValue || '');
  const [expandedSections, setExpandedSections] = useState(config?.expandedSections || { chartGuide: false });
  
  // Drill-down modal state
  const [drillDownModal, setDrillDownModal] = useState({
    isOpen: false,
    categoryName: '',
    categoryValue: 0,
    chartType: ''
  });

  // Multiple charts support
  const [charts, setCharts] = useState([
    {
      id: 'chart-1',
      name: 'Chart 1',
      chartType: 'pie',
      categoryColumn: '',
      valueColumn: '',
      filterColumn: '',
      filterValue: '',
      // Customization options
      title: '',
      colorScheme: 'pastel',
      size: 'medium',
      showGrid: true,
      showLegend: true,
      legendPosition: 'right',
      xAxisLabel: '',
      yAxisLabel: ''
    }
  ]);
  const [activeChartId, setActiveChartId] = useState('chart-1');

  // Get current active chart
  const activeChart = charts.find(chart => chart.id === activeChartId) || charts[0];

  // Compute filtered data for drill-down modal based on active chart's filters
  const filteredData = useMemo(() => {
    if (!data || !data.rows) return data;

    let filteredRows = data.rows;

    // Apply filter if specified
    if (activeChart.filterColumn && activeChart.filterValue) {
      filteredRows = data.rows.filter(row => row[activeChart.filterColumn] === activeChart.filterValue);
    }

    return {
      ...data,
      rows: filteredRows
    };
  }, [data, activeChart.filterColumn, activeChart.filterValue]);

  // Update local state when external config changes
  useEffect(() => {
    if (config) {
      setChartType(config.chartType || 'pie');
      setCategoryColumn(config.categoryColumn || '');
      setValueColumn(config.valueColumn || '');
      setFilterColumn(config.filterColumn || '');
      setFilterValue(config.filterValue || '');
      setExpandedSections(config.expandedSections || { chartGuide: false });
    }
  }, [config]);

  // Sync local state with external configuration
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        chartType,
      categoryColumn,
        valueColumn,
        filterColumn,
        filterValue,
        expandedSections
      });
    }
  }, [chartType, categoryColumn, valueColumn, filterColumn, filterValue, expandedSections, onConfigChange]);

  // Add new chart
  const addNewChart = () => {
    const newChartId = `chart-${charts.length + 1}`;
    const newChart = {
      id: newChartId,
      name: `Chart ${charts.length + 1}`,
      chartType: 'pie',
      categoryColumn: '',
      valueColumn: '',
      filterColumn: '',
      filterValue: '',
      // Customization options
      title: '',
      colorScheme: 'pastel',
      size: 'medium',
      showGrid: true,
      showLegend: true,
      legendPosition: 'right',
      xAxisLabel: '',
      yAxisLabel: ''
    };
    setCharts([...charts, newChart]);
    setActiveChartId(newChartId);
  };

  // Remove chart
  const removeChart = (chartId) => {
    if (charts.length === 1) return; // Keep at least one chart
    const updatedCharts = charts.filter(chart => chart.id !== chartId);
    setCharts(updatedCharts);
    
    // If we're removing the active chart, switch to the first available one
    if (chartId === activeChartId) {
      setActiveChartId(updatedCharts[0].id);
    }
  };

  // Update chart configuration
  const updateChart = (chartId, updates) => {
    setCharts(charts.map(chart => 
      chart.id === chartId ? { ...chart, ...updates } : chart
    ));
  };

  // Rename chart (available for future use)
  // const renameChart = (chartId, newName) => {
  //   updateChart(chartId, { name: newName });
  // };

  // Drill-down handlers
  const handleDrillDown = (categoryName, categoryValue, chartType) => {
    setDrillDownModal({
      isOpen: true,
      categoryName,
      categoryValue,
      chartType
    });
  };

  const closeDrillDownModal = () => {
    setDrillDownModal({
      isOpen: false,
      categoryName: '',
      categoryValue: 0,
      chartType: ''
    });
  };

  // Reset all charts
  const resetAllCharts = () => {
    setCharts([{
      id: 'chart-1',
      name: 'Chart 1',
      chartType: 'pie',
      categoryColumn: '',
      valueColumn: '',
      filterColumn: '',
      filterValue: '',
      // Customization options
      title: '',
      colorScheme: 'pastel',
      size: 'medium',
      showGrid: true,
      showLegend: true,
      legendPosition: 'right',
      xAxisLabel: '',
      yAxisLabel: ''
    }]);
    setActiveChartId('chart-1');
    if (onReset) onReset();
  };
  
  // Get columns from data (available for future use)
  // const columns = data.headers || [];

  // Get filter values for the selected filter column
  const filterValues = useMemo(() => {
    if (!activeChart.filterColumn || !data.rows) return [];
    const values = [...new Set(data.rows.map(row => row[activeChart.filterColumn]))];
    return values.sort();
  }, [activeChart.filterColumn, data.rows]);

  // Process data for the active chart
  const chartData = useMemo(() => {
    if (!data.rows || !activeChart.categoryColumn) return [];

    let filteredRows = data.rows;

    // Apply filter if specified
    if (activeChart.filterColumn && activeChart.filterValue) {
      filteredRows = data.rows.filter(row => row[activeChart.filterColumn] === activeChart.filterValue);
    }

    if (activeChart.chartType === 'pie' || activeChart.chartType === 'bar') {
      // For pie and bar charts, count frequency or sum values
      const counts = {};
      
      filteredRows.forEach(row => {
        const category = row[activeChart.categoryColumn];
        const value = activeChart.valueColumn ? (parseFloat(row[activeChart.valueColumn]) || 0) : 1;
        
        if (category) {
          counts[category] = (counts[category] || 0) + value;
        }
      });

      return Object.entries(counts)
        .map(([name, value]) => ({ name: String(name), value })) // Ensure name is a string
        .sort((a, b) => b.value - a.value);
    } else if (activeChart.chartType === 'line' || activeChart.chartType === 'scatter') {
      // For line and scatter charts, need both X and Y columns
      if (!activeChart.valueColumn) return [];
      
      return filteredRows
        .filter(row => row[activeChart.categoryColumn] && row[activeChart.valueColumn])
        .map(row => ({
          name: String(row[activeChart.categoryColumn]), // Ensure name is a string
          value: parseFloat(row[activeChart.valueColumn]) || 0
        }))
        .sort((a, b) => {
          // Ensure both names are strings and handle edge cases
          const nameA = String(a.name || '');
          const nameB = String(b.name || '');
          return nameA.localeCompare(nameB);
        });
    } else if (activeChart.chartType === 'histogram') {
      // For histogram, need numeric data
      const numericValues = filteredRows
        .map(row => parseFloat(row[activeChart.categoryColumn]))
        .filter(val => !isNaN(val));
      
      if (numericValues.length === 0) return [];
      
      // Create histogram bins
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const binCount = Math.min(10, Math.ceil(Math.sqrt(numericValues.length)));
      const binSize = (max - min) / binCount;
      
      const bins = {};
      for (let i = 0; i < binCount; i++) {
        const binStart = min + (i * binSize);
        const binEnd = min + ((i + 1) * binSize);
        const binLabel = `${binStart.toFixed(1)} - ${binEnd.toFixed(1)}`;
        bins[binLabel] = 0;
      }
      
      numericValues.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
        const binStart = min + (binIndex * binSize);
        const binEnd = min + ((binIndex + 1) * binSize);
        const binLabel = `${binStart.toFixed(1)} - ${binEnd.toFixed(1)}`;
        bins[binLabel]++;
      });
      
      return Object.entries(bins).map(([name, value]) => ({ name, value }));
    }

    return [];
  }, [data.rows, activeChart.categoryColumn, activeChart.valueColumn, activeChart.filterColumn, activeChart.filterValue, activeChart.chartType]);

  // Notify parent component when chart data is ready for export
  useEffect(() => {
    // This useEffect is no longer needed as export data is handled locally
  }, [chartData, chartType, categoryColumn, valueColumn]);

  // Color schemes for charts
  const colorSchemes = {
    default: ['#3B82F6', '#1E40AF', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
    warm: ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6'],
    cool: ['#06B6D4', '#0891B2', '#0E7490', '#155E75', '#164E63', '#083344', '#082F49', '#0C4A6E'],
    earth: ['#A3A3A3', '#737373', '#525252', '#404040', '#262626', '#171717', '#0A0A0A', '#000000'],
    vibrant: ['#EC4899', '#D946EF', '#A855F7', '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95'],
    pastel: ['#FCA5A5', '#FDBA74', '#FDE047', '#BEF264', '#86EFAC', '#67E8F9', '#A5B4FC', '#C4B5FD'],
    monochrome: ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6']
  };

  // Get colors for current chart
  const getChartColors = () => {
    return colorSchemes[activeChart.colorScheme] || colorSchemes.default;
  };

  // Render pie chart using SVG
  // Get chart dimensions based on size setting
  const getChartDimensions = () => {
    const sizeMap = {
      'small': { width: 400, height: 350 },
      'medium': { width: 500, height: 450 },
      'large': { width: 600, height: 550 },
      'extra-large': { width: 700, height: 650 }
    };
    return sizeMap[activeChart.size] || sizeMap.medium;
  };

  const renderPieChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const dimensions = getChartDimensions();
    const width = dimensions.width;
    const height = dimensions.height;
    const radius = Math.min(width, height) / 2 - 40;
    const centerX = width / 2;
    const centerY = height / 2;
    const colors = getChartColors();
    
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
        color: colors[index % colors.length],
        item,
        percentage,
        startAngle,
        endAngle
      };
    });
    
    const chartTitle = activeChart.title || (filterColumn && filterValue 
      ? `Pie Chart (Filtered: ${filterColumn} = ${filterValue})`
      : 'Pie Chart');
    
    return (
      <div className="w-full bg-white p-4 rounded-lg border border-gray-200" data-chart-type="pie">
        <h4 className="text-center font-bold mb-4 text-gray-800">{chartTitle}</h4>
        
        <div className={`flex ${
          activeChart.legendPosition === 'left' ? 'flex-row-reverse' :
          activeChart.legendPosition === 'right' ? 'flex-row' :
          activeChart.legendPosition === 'top' ? 'flex-col-reverse' :
          'flex-col'
        } items-center justify-center gap-6`}>
          
          {/* Chart SVG */}
          <div className="flex-shrink-0">
            <svg width={width} height={height}>
              {slices.map((slice, index) => (
                <g key={`${index}-${activeChart.colorScheme}`}>
                  <path
                    d={slice.path}
                    fill={colors[index % colors.length]}
                    stroke="white"
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onClick={() => handleDrillDown(slice.item.name, slice.item.value, 'pie')}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '1';
                    }}
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
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleDrillDown(slice.item.name, slice.item.value, 'pie')}
                    >
                      {Math.round(slice.percentage * 100)}%
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
          
          {/* Legend */}
          {activeChart.showLegend && (
            <div className="flex-shrink-0">
              <div className={`grid gap-2 ${
                activeChart.legendPosition === 'right' || activeChart.legendPosition === 'left' 
                  ? 'grid-cols-1' 
                  : 'grid-cols-2'
              }`}>
                {chartData.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                    onClick={() => handleDrillDown(item.name, item.value, 'pie')}
                    title="Click to drill down"
                  >
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <span className="truncate">{item.name}</span>
                    <span className="font-bold">({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render bar chart using SVG
  const renderBarChart = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const dimensions = getChartDimensions();
    const width = dimensions.width;
    const height = dimensions.height;
    const colors = getChartColors();
    const barWidth = 35;
    const barSpacing = 20;
    const maxValue = Math.max(...chartData.map(item => item.value));
    const scale = (height - 80) / maxValue;
    
    const chartTitle = activeChart.title || (filterColumn && filterValue 
      ? `Bar Chart (Filtered: ${filterColumn} = ${filterValue})`
      : 'Bar Chart');
    
    return (
      <div className="w-full bg-white p-4 rounded-lg border border-gray-200" data-chart-type="bar">
        <h4 className="text-center font-bold mb-4 text-gray-800">{chartTitle}</h4>
        
        <div className={`flex ${
          activeChart.legendPosition === 'left' ? 'flex-row-reverse' :
          activeChart.legendPosition === 'right' ? 'flex-row' :
          activeChart.legendPosition === 'top' ? 'flex-col-reverse' :
          'flex-col'
        } items-center justify-center gap-6`}>
          
          {/* Chart SVG */}
          <div className="flex-shrink-0">
            <svg width={width} height={height}>
              {/* Y-axis */}
              <line x1="60" y1="50" x2="60" y2={height - 30} stroke="black" strokeWidth="2" />
              <line x1="60" y1={height - 30} x2={width - 20} y2={height - 30} stroke="black" strokeWidth="2" />
              
              {/* Bars */}
              {chartData.map((item, index) => {
                const x = 80 + (index * (barWidth + barSpacing));
                const barHeight = item.value * scale;
                const y = height - 30 - barHeight;
                
                return (
                  <g key={`${index}-${activeChart.colorScheme}`}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={colors[index % colors.length]}
                      stroke="white"
                      strokeWidth="1"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleDrillDown(item.name, item.value, 'bar')}
                      onMouseEnter={(e) => {
                        e.target.style.fill = colors[index % colors.length];
                        e.target.style.opacity = '0.8';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.fill = colors[index % colors.length];
                        e.target.style.opacity = '1';
                      }}
                    />
                    <text
                      x={x + barWidth / 2}
                      y={height - 5}
                      textAnchor="middle"
                      fontSize="5"
                      fill="black"
                    >
                      {item.name.length > 4 ? item.name.substring(0, 4) + '...' : item.name}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fontSize="5"
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
          
          {/* Legend */}
          {activeChart.showLegend && (
            <div className="flex-shrink-0">
              <div className={`grid gap-2 ${
                activeChart.legendPosition === 'right' || activeChart.legendPosition === 'left' 
                  ? 'grid-cols-1' 
                  : 'grid-cols-2'
              }`}>
                {chartData.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                    onClick={() => handleDrillDown(item.name, item.value, 'bar')}
                    title="Click to drill down"
                  >
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <span className="truncate">{item.name}</span>
                    <span className="font-bold">({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render histogram using SVG
  const renderHistogram = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const dimensions = getChartDimensions();
    const width = dimensions.width;
    const height = dimensions.height;
    const colors = getChartColors();
    const barWidth = (width - 120) / chartData.length;
    const maxValue = Math.max(...chartData.map(item => item.value));
    const scale = (height - 80) / maxValue;
    
    const chartTitle = activeChart.title || (filterColumn && filterValue 
      ? `Histogram (Filtered: ${filterColumn} = ${filterValue})`
      : 'Histogram');
    
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
              <g key={`${index}-${activeChart.colorScheme}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth - 2}
                  height={barHeight}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="1"
                />
                <text
                  x={x + (barWidth - 2) / 2}
                  y={height - 5}
                  textAnchor="middle"
                  fontSize="5"
                  fill="black"
                >
                  {item.name.length > 4 ? item.name.substring(0, 4) + '...' : item.name}
                </text>
                <text
                  x={x + (barWidth - 2) / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="5"
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
    
    // Debug logging
    console.log('Line chart data:', chartData);
    console.log('Chart dimensions:', getChartDimensions());
    
    const dimensions = getChartDimensions();
    const width = dimensions.width;
    const height = dimensions.height;
    const padding = 70; // Adjusted padding for better label visibility
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    const chartTitle = activeChart.title || (filterColumn && filterValue 
      ? `Line Chart (Filtered: ${filterColumn} = ${filterValue})`
      : 'Line Chart');
    
    // Calculate scales
    const xValues = chartData.map((_, index) => index);
    const yValues = chartData.map(item => item.value);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const yRange = yMax - yMin || 1; // Prevent division by zero
    
    const xScale = chartWidth / (xValues.length - 1);
    const yScale = chartHeight / yRange;
    
    // Generate path data
    const pathData = chartData.map((item, index) => {
      const x = padding + (index * xScale);
      const y = padding + chartHeight - ((item.value - yMin) * yScale);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <div className="w-full bg-white p-4 rounded-lg border border-gray-200" data-chart-type="line">
        <h4 className="text-center font-bold mb-4 text-gray-800">{chartTitle}</h4>
        {/* Debug info */}
        <div className="text-xs text-gray-500 mb-2">
          Chart dimensions: {width}x{height}, Padding: {padding}, Data points: {chartData.length}
        </div>
        <svg width={width} height={height} className="mx-auto" style={{ backgroundColor: '#f9fafb' }}>
          {/* Grid lines (if enabled) */}
          {activeChart.showGrid && (
            <>
              {/* Vertical grid lines */}
              {chartData.map((_, index) => {
                const x = padding + (index * xScale);
                return (
                  <line
                    key={`v-grid-${index}`}
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={height - padding}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                );
              })}
              {/* Horizontal grid lines */}
              {Array.from({ length: 6 }, (_, i) => {
                const y = padding + (i * chartHeight / 5);
                return (
                  <line
                    key={`h-grid-${i}`}
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                );
              })}
            </>
          )}
          
          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="black" strokeWidth="2" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="black" strokeWidth="2" />
          
          {/* Y-axis labels and ticks */}
          {Array.from({ length: 6 }, (_, i) => {
            const y = padding + (i * chartHeight / 5);
            const value = yMax - (i * yRange / 5);
            return (
              <g key={`y-tick-${i}`}>
                <line x1={padding - 5} y1={y} x2={padding} y2={y} stroke="black" strokeWidth="1" />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="black"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            );
          })}
          
          {/* Line */}
          <path d={pathData} stroke="#8884d8" strokeWidth="3" fill="none" />
          
          {/* Data points */}
          {chartData.map((item, index) => {
            const x = padding + (index * xScale);
            const y = padding + chartHeight - ((item.value - yMin) * yScale);
            
            return (
              <g key={`${index}-${activeChart.colorScheme}`}>
                <circle cx={x} cy={y} r="5" fill="#8884d8" stroke="white" strokeWidth="2" />
                {/* Data point value label */}
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#374151"
                  fontWeight="500"
                >
                  {item.value.toFixed(1)}
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels */}
          {chartData.map((item, index) => {
            const x = padding + (index * xScale);
            return (
              <g key={`x-label-${index}`}>
                {/* Tick mark */}
                <line x1={x} y1={height - padding} x2={x} y2={height - padding + 8} stroke="black" strokeWidth="2" />
                {/* Label */}
                <text
                  x={x}
                  y={height - padding + 30}
                  textAnchor="middle"
                  fontSize="13"
                  fill="#1f2937"
                  fontWeight="600"
                >
                  {item.name}
                </text>
              </g>
            );
          })}
          
          {/* Axis titles */}
          {activeChart.xAxisLabel && (
            <text
              x={width / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize="14"
              fill="black"
              fontWeight="500"
            >
              {activeChart.xAxisLabel}
            </text>
          )}
          
          {activeChart.yAxisLabel && (
            <text
              x={20}
              y={height / 2}
              textAnchor="middle"
              fontSize="14"
              fill="black"
              fontWeight="500"
              transform={`rotate(-90, 20, ${height / 2})`}
            >
              {activeChart.yAxisLabel}
            </text>
          )}
        </svg>
      </div>
    );
  };

  // Render scatter plot using SVG
  const renderScatterPlot = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const dimensions = getChartDimensions();
    const width = dimensions.width;
    const height = dimensions.height;
    const colors = getChartColors();
    const padding = 60;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    
    const chartTitle = activeChart.title || (filterColumn && filterValue 
      ? `Scatter Plot (Filtered: ${filterColumn} = ${filterValue})`
      : 'Scatter Plot');
    
    // Calculate scales with proper handling for edge cases
    const xValues = chartData.map(item => parseFloat(item.name) || 0);
    const yValues = chartData.map(item => item.value);
    
    // Filter out invalid values
    const validXValues = xValues.filter(v => !isNaN(v) && isFinite(v));
    const validYValues = yValues.filter(v => !isNaN(v) && isFinite(v));
    
    if (validXValues.length === 0 || validYValues.length === 0) {
      return (
        <div className="w-full bg-white p-4 rounded-lg border border-gray-200" data-chart-type="scatter">
          <h4 className="text-center font-bold mb-4 text-gray-800">{chartTitle}</h4>
          <div className="text-center text-red-500 py-8">
            Invalid data for scatter plot. Both X and Y values must be numeric.
          </div>
        </div>
      );
    }
    
    const xMin = Math.min(...validXValues);
    const xMax = Math.max(...validXValues);
    const yMin = Math.min(...validYValues);
    const yMax = Math.max(...validYValues);
    
    // Handle case where all values are the same
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    
    const xScale = chartWidth / xRange;
    const yScale = chartHeight / yRange;
    
    // Add some padding to the data range for better visualization
    const xPadding = xRange * 0.1;
    const yPadding = yRange * 0.1;
    
    return (
      <div className="w-full bg-white p-4 rounded-lg border border-gray-200" data-chart-type="scatter">
        <h4 className="text-center font-bold mb-4 text-gray-800">{chartTitle}</h4>
        <svg width={width} height={height} className="mx-auto">
          {/* Grid lines */}
          {activeChart.showGrid && (
            <g>
              {[0, 1, 2, 3, 4].map(i => (
                <g key={i}>
                  <line
                    x1={padding}
                    y1={padding + (chartHeight * i / 4)}
                    x2={width - padding}
                    y2={padding + (chartHeight * i / 4)}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <line
                    x1={padding + (chartWidth * i / 4)}
                    y1={padding}
                    x2={padding + (chartWidth * i / 4)}
                    y2={height - padding}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                </g>
              ))}
            </g>
          )}
          
          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="black" strokeWidth="2" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="black" strokeWidth="2" />
          
          {/* Axis ticks and labels */}
          {[0, 1, 2, 3, 4].map(i => {
            const xValue = xMin + (xRange * i / 4);
            const yValue = yMin + (yRange * i / 4);
            return (
              <g key={i}>
                {/* X-axis ticks */}
                <line
                  x1={padding + (chartWidth * i / 4)}
                  y1={height - padding}
                  x2={padding + (chartWidth * i / 4)}
                  y2={height - padding + 5}
                  stroke="black"
                  strokeWidth="2"
                />
                <text
                  x={padding + (chartWidth * i / 4)}
                  y={height - padding + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="black"
                >
                  {xValue.toFixed(1)}
                </text>
                
                {/* Y-axis ticks */}
                <line
                  x1={padding - 5}
                  y1={height - padding - (chartHeight * i / 4)}
                  x2={padding}
                  y2={height - padding - (chartHeight * i / 4)}
                  stroke="black"
                  strokeWidth="2"
                />
                <text
                  x={padding - 10}
                  y={height - padding - (chartHeight * i / 4) + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="black"
                >
                  {yValue.toFixed(1)}
                </text>
              </g>
            );
          })}
          
          {/* Data points */}
          {chartData.map((item, index) => {
            const xVal = parseFloat(item.name);
            const yVal = item.value;
            
            // Skip invalid points
            if (isNaN(xVal) || isNaN(yVal) || !isFinite(xVal) || !isFinite(yVal)) {
              return null;
            }
            
            const x = padding + ((xVal - xMin) * xScale);
            const y = height - padding - ((yVal - yMin) * yScale);
            
            return (
              <g key={`${index}-${activeChart.colorScheme}`}>
                <circle 
                  cx={x} 
                  cy={y} 
                  r="6" 
                  fill={colors[0]} 
                  opacity="0.7"
                  stroke="white" 
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleDrillDown(String(xVal), yVal, 'scatter')}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '1';
                    e.target.setAttribute('r', '8');
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '0.7';
                    e.target.setAttribute('r', '6');
                  }}
                />
              </g>
            );
          })}
          
          {/* Axis labels */}
          {activeChart.xAxisLabel && (
            <text
              x={width / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize="14"
              fill="black"
              fontWeight="500"
            >
              {activeChart.xAxisLabel}
            </text>
          )}
          {activeChart.yAxisLabel && (
            <text
              x={20}
              y={height / 2}
              textAnchor="middle"
              fontSize="14"
              fill="black"
              fontWeight="500"
              transform={`rotate(-90, 20, ${height / 2})`}
            >
              {activeChart.yAxisLabel}
            </text>
          )}
        </svg>
      </div>
    );
  };

  // Helper to render the correct chart type
  const renderChart = () => {
    switch (activeChart.chartType) {
      case 'pie':
        return renderPieChart();
      case 'bar':
        return renderBarChart();
      case 'histogram':
        return renderHistogram();
      case 'line':
        return renderLineChart();
      case 'scatter':
        return renderScatterPlot();
      default:
        return <div className="text-red-500">Unknown chart type: {activeChart.chartType}</div>;
    }
  };

  if (!data || (!data.preview && !data.rows)) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">
          Please upload data to create charts and visualizations.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Chart Tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Chart Visualizations</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={addNewChart}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ➕ Add Chart
            </button>
            <button
              onClick={resetAllCharts}
              disabled={charts.length === 1 && !activeChart.categoryColumn && !activeChart.valueColumn}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Reset All
            </button>
          </div>
        </div>

        {/* Chart Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Chart tabs">
            {charts.map((chart) => (
              <div key={chart.id} className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveChartId(chart.id)}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeChartId === chart.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {chart.name}
                </button>
                {charts.length > 1 && (
                  <button
                    onClick={() => removeChart(chart.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove chart"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Chart Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-6">
        {/* Chart Type Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chart Type
          </label>
        <select
            value={activeChart.chartType}
            onChange={(e) => updateChart(activeChartId, { chartType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="pie">Pie Chart</option>
          <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="histogram">Histogram</option>
        </select>
      </div>

        {/* Chart Title */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chart Title
          </label>
          <input
            type="text"
            value={activeChart.title}
            onChange={(e) => updateChart(activeChartId, { title: e.target.value })}
            placeholder="Enter chart title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Color Scheme */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Scheme
          </label>
          <select
            value={activeChart.colorScheme}
            onChange={(e) => updateChart(activeChartId, { colorScheme: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pastel">Pastel Colors</option>
            <option value="default">Blue</option>
            <option value="warm">Warm Colors</option>
            <option value="cool">Cool Colors</option>
            <option value="earth">Earth Tones</option>
            <option value="vibrant">Vibrant Colors</option>
            <option value="monochrome">Monochrome</option>
          </select>
        </div>

        {/* Chart Size */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chart Size
          </label>
          <select
            value={activeChart.size}
            onChange={(e) => updateChart(activeChartId, { size: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="small">Small (300px)</option>
            <option value="medium">Medium (400px)</option>
            <option value="large">Large (500px)</option>
            <option value="extra-large">Extra Large (600px)</option>
          </select>
        </div>

        {/* Legend Position */}
        {(activeChart.chartType === 'pie' || activeChart.chartType === 'bar') && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Legend
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show-legend"
                  checked={activeChart.showLegend}
                  onChange={(e) => updateChart(activeChartId, { showLegend: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show-legend" className="ml-2 text-sm text-gray-700">
                  Show Legend
                </label>
              </div>
              {activeChart.showLegend && (
                <select
                  value={activeChart.legendPosition}
                  onChange={(e) => updateChart(activeChartId, { legendPosition: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                  <option value="bottom">Bottom</option>
                  <option value="top">Top</option>
                </select>
              )}
            </div>
          </div>
        )}

        {/* Axis Labels for Line/Scatter Charts */}
        {(activeChart.chartType === 'line' || activeChart.chartType === 'scatter') && (
          <>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X-Axis Label
              </label>
              <input
                type="text"
                value={activeChart.xAxisLabel}
                onChange={(e) => updateChart(activeChartId, { xAxisLabel: e.target.value })}
                placeholder="X-axis label"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Y-Axis Label
              </label>
              <input
                type="text"
                value={activeChart.yAxisLabel}
                onChange={(e) => updateChart(activeChartId, { yAxisLabel: e.target.value })}
                placeholder="Y-axis label"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Grid Lines for Line/Scatter/Bar Charts */}
        {(activeChart.chartType === 'line' || activeChart.chartType === 'scatter' || activeChart.chartType === 'bar') && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grid Options
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-grid"
                checked={activeChart.showGrid}
                onChange={(e) => updateChart(activeChartId, { showGrid: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="show-grid" className="ml-2 text-sm text-gray-700">
                Show Grid Lines
              </label>
            </div>
          </div>
        )}

        {/* Column Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {activeChart.chartType === 'line' || activeChart.chartType === 'scatter' ? 'X-Axis Column' : 'Category Column'}
          </label>
          <select
            value={activeChart.categoryColumn}
            onChange={(e) => updateChart(activeChartId, { categoryColumn: e.target.value })}
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

        {/* Value Column for charts that need it */}
        {(activeChart.chartType === 'pie' || activeChart.chartType === 'bar' || activeChart.chartType === 'line' || activeChart.chartType === 'scatter') && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {activeChart.chartType === 'line' || activeChart.chartType === 'scatter' ? 'Y-Axis Column' : 'Value Column (Optional)'}
            </label>
            <select
              value={activeChart.valueColumn}
              onChange={(e) => updateChart(activeChartId, { valueColumn: e.target.value })}
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
        )}

        {/* Filter Options */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter Column (Optional)
          </label>
          <select
            value={activeChart.filterColumn}
            onChange={(e) => updateChart(activeChartId, { filterColumn: e.target.value, filterValue: '' })}
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
          
        {/* Filter Value */}
        {activeChart.filterColumn && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Value
            </label>
            <select
              value={activeChart.filterValue}
              onChange={(e) => updateChart(activeChartId, { filterValue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a value</option>
              {filterValues.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            </div>
          )}
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

      {/* Chart Visualization */}
      {activeChart.categoryColumn && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {activeChart.name} - {activeChart.chartType.charAt(0).toUpperCase() + activeChart.chartType.slice(1)}
            </h4>
            
            {/* Export Buttons */}
            {chartData && chartData.length > 0 && (
              <div className="flex space-x-2">
            <button
              onClick={() => {
                    const chartContainer = document.querySelector('[data-chart-type]');
                    if (chartContainer) {
                      import('html-to-image').then(htmlToImage => {
                        htmlToImage.toPng(chartContainer, { 
                          background: '#ffffff', 
                          pixelRatio: 2 
                        }).then(dataUrl => {
                          const link = document.createElement('a');
                          link.download = `${activeChart.name}_${activeChart.chartType}.png`;
                          link.href = dataUrl;
                          link.click();
                        });
                      });
                    }
                  }}
                  className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  📷 Export PNG
            </button>
                <button
                  onClick={() => {
                    const chartContainer = document.querySelector('[data-chart-type]');
                    if (chartContainer) {
                      import('html-to-image').then(htmlToImage => {
                        htmlToImage.toJpeg(chartContainer, { 
                          quality: 0.95, 
                          background: '#ffffff', 
                          pixelRatio: 2 
                        }).then(dataUrl => {
                          const link = document.createElement('a');
                          link.download = `${activeChart.name}_${activeChart.chartType}.jpg`;
                          link.href = dataUrl;
                          link.click();
                        });
                      });
                    }
                  }}
                  className="px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  🖼️ Export JPEG
                </button>
                <button
                  onClick={() => {
                    // Export chart data to Excel
                    import('xlsx').then(XLSX => {
                      const workbook = XLSX.utils.book_new();
                      
                      // Prepare chart data for Excel
                      const worksheetData = chartData.map(item => ({
                        Category: item.name,
                        Value: item.value,
                        Percentage: ((item.value / chartData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(2) + '%'
                      }));

                      // Add summary row
                      const total = chartData.reduce((sum, item) => sum + item.value, 0);
                      worksheetData.push({
                        Category: 'TOTAL',
                        Value: total,
                        Percentage: '100%'
                      });

                      // Create worksheet
                      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

                      // Auto-size columns
                      const columnWidths = [
                        { wch: Math.max(...worksheetData.map(row => String(row.Category).length)) + 2 },
                        { wch: Math.max(...worksheetData.map(row => String(row.Value).length)) + 2 },
                        { wch: 12 }
                      ];
                      worksheet['!cols'] = columnWidths;

                      // Add worksheet to workbook
                      XLSX.utils.book_append_sheet(workbook, worksheet, `${activeChart.chartType.charAt(0).toUpperCase() + activeChart.chartType.slice(1)} Chart Data`);

                      // Generate Excel file
                      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                      
                      // Download file
                      const link = document.createElement('a');
                      link.download = `${activeChart.name}_${activeChart.chartType}_data.xlsx`;
                      link.href = URL.createObjectURL(data);
                      link.click();
                    });
                  }}
                  className="px-3 py-2 bg-purple-500 text-white text-sm font-medium rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  📊 Export Excel
                </button>
                  </div>
            )}
                </div>

          {/* Chart Display */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {chartData.length > 0 ? (
              <div 
                data-chart-type={activeChart.chartType}
                className="w-full min-h-[400px] flex items-center justify-center"
              >
                {renderChart()}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
              </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data to Display</h3>
                <p className="text-gray-600">
                  {activeChart.chartType === 'line' || activeChart.chartType === 'scatter' 
                    ? 'Both X and Y axis columns require data to generate this chart.'
                    : 'The selected category column has no data to display.'
                  }
                </p>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Type Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <button
          onClick={() => setExpandedSections(prev => ({ ...prev, chartGuide: !prev.chartGuide }))}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <span>💡 Chart Type Guide</span>
          <span className="ml-2">
            {expandedSections.chartGuide ? '▼' : '▶'}
          </span>
            </button>
        
        {expandedSections.chartGuide && (
          <div className="mt-3 text-sm text-gray-600 space-y-2">
            <p><strong>Pie Chart:</strong> Categorical data (status, types, categories)</p>
            <p><strong>Bar Chart:</strong> Categorical vs numeric data</p>
            <p><strong>Line Chart:</strong> Time series or sequential data</p>
            <p><strong>Scatter Plot:</strong> Correlation between two numeric variables</p>
            <p><strong>Histogram:</strong> Distribution of numeric data</p>
        </div>
      )}
      </div>

      {/* Drill Down Modal */}
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={closeDrillDownModal}
        categoryName={drillDownModal.categoryName}
        categoryValue={drillDownModal.categoryValue}
        rawData={filteredData}
        categoryColumn={activeChart.categoryColumn}
        valueColumn={activeChart.valueColumn}
        chartType={drillDownModal.chartType}
      />
    </div>
  );
};

export default ChartPreview;