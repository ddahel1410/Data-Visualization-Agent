import React, { useState, useMemo } from 'react';

const DashboardBuilder = ({ data, dashboardCharts, setDashboardCharts }) => {
  const [selectedLayout, setSelectedLayout] = useState('2x2');
  const [globalFilters, setGlobalFilters] = useState({});
  const [showChartCreator, setShowChartCreator] = useState(false);
  const [editingChart, setEditingChart] = useState(null);

  // Simplified data handling
  const normalizedData = useMemo(() => {
    if (!data) return null;
    if (data.rows && Array.isArray(data.rows) && data.headers && Array.isArray(data.headers)) {
      return { rows: data.rows, headers: data.headers };
    }
    return { rows: [], headers: [] };
  }, [data]);

  const layoutOptions = [
    { id: '2x2', name: '2x2 Grid', cols: 2, rows: 2, maxCharts: 4 },
    { id: '3x2', name: '3x2 Grid', cols: 3, rows: 2, maxCharts: 6 },
    { id: '2x3', name: '2x3 Grid', cols: 2, rows: 3, maxCharts: 6 },
    { id: '3x3', name: '3x3 Grid', cols: 3, rows: 3, maxCharts: 9 }
  ];

  const chartTypes = [
    { id: 'pie', name: 'Pie Chart', description: 'Show proportions and percentages' },
    { id: 'bar', name: 'Bar Chart', description: 'Compare values across categories' },
    { id: 'line', name: 'Line Chart', description: 'Show trends over time or sequence' },
    { id: 'scatter', name: 'Scatter Plot', description: 'Show correlation between variables' },
    { id: 'histogram', name: 'Histogram', description: 'Show distribution of values' }
  ];

  const addChart = (chartConfig) => {
    const newChart = {
      id: `chart-${Date.now()}`,
      ...chartConfig,
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 }
    };
    setDashboardCharts(prev => [...prev, newChart]);
    setShowChartCreator(false);
    setEditingChart(null);
  };

  const removeChart = (chartId) => {
    setDashboardCharts(prev => prev.filter(chart => chart.id !== chartId));
  };

  const editChart = (chart) => {
    setEditingChart(chart);
    setShowChartCreator(true);
  };

  const updateChart = (chartId, updates) => {
    setDashboardCharts(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, ...updates } : chart
    ));
    setEditingChart(null);
  };

  const applyGlobalFilter = (filterType, value) => {
    setGlobalFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearGlobalFilters = () => {
    setGlobalFilters({});
  };

  const getFilteredData = useMemo(() => {
    if (!normalizedData || !normalizedData.rows) return normalizedData;
    let filteredRows = [...normalizedData.rows];
    Object.entries(globalFilters).forEach(([filterType, filterValue]) => {
      if (filterValue && filterValue !== '') {
        filteredRows = filteredRows.filter(row => row[filterType] === filterValue);
      }
    });
    return { ...normalizedData, rows: filteredRows };
  }, [normalizedData, globalFilters]);

  const getFilterableColumns = useMemo(() => {
    if (!normalizedData || !normalizedData.headers) return [];
    return normalizedData.headers.filter(header => {
      const values = normalizedData.rows.map(row => row[header]).filter(v => v !== null && v !== '');
      const uniqueValues = new Set(values);
      return uniqueValues.size > 1 && uniqueValues.size < 50;
    });
  }, [normalizedData]);

  const getColumnValues = useMemo(() => {
    if (!normalizedData || !normalizedData.headers || !normalizedData.rows) return {};
    const columnValues = {};
    normalizedData.headers.forEach(header => {
      const values = normalizedData.rows.map(row => row[header]).filter(v => v !== null && v !== '');
      const uniqueValues = [...new Set(values)].sort();
      if (uniqueValues.length > 1 && uniqueValues.length < 50) {
        columnValues[header] = uniqueValues;
      }
    });
    return columnValues;
  }, [normalizedData]);

  const getAvailableColumns = useMemo(() => {
    if (!normalizedData || !normalizedData.headers) return [];
    return normalizedData.headers;
  }, [normalizedData]);

  const getNumericColumns = useMemo(() => {
    if (!normalizedData || !normalizedData.headers || !normalizedData.rows) return [];
    return normalizedData.headers.filter(header => {
      const values = normalizedData.rows.map(row => row[header]).filter(v => v !== null && v !== '');
      return values.some(v => !isNaN(parseFloat(v)));
    });
  }, [normalizedData]);

  const getCategoricalColumns = useMemo(() => {
    if (!normalizedData || !normalizedData.headers || !normalizedData.rows) return [];
    return normalizedData.headers.filter(header => {
      const values = normalizedData.rows.map(row => row[header]).filter(v => v !== null && v !== '');
      const uniqueValues = new Set(values);
      return uniqueValues.size >= 1 && uniqueValues.size < 100;
    });
  }, [normalizedData]);

  const getAllChartColumns = useMemo(() => {
    if (!normalizedData || !normalizedData.headers) return [];
    return normalizedData.headers;
  }, [normalizedData]);

  const renderChart = (chart) => {
    try {
      const { chartType, categoryColumn, valueColumn, filterColumn, filterValue, title } = chart;
      let filteredRows = getFilteredData?.rows || [];
      
      if (filterColumn && filterValue) {
        filteredRows = filteredRows.filter(row => row[filterColumn] === filterValue);
      }
      
      if (!filteredRows.length) {
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-lg mb-2">📊</div>
              <div className="text-sm">No data available</div>
            </div>
          </div>
        );
      }

      let chartData = [];
      
      if (chartType === 'pie' || chartType === 'bar') {
        const counts = {};
        filteredRows.forEach(row => {
          const category = row[categoryColumn];
          const value = valueColumn ? (parseFloat(row[valueColumn]) || 0) : 1;
          if (category) {
            counts[category] = (counts[category] || 0) + value;
          }
        });
        chartData = Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      } else if (chartType === 'line' || chartType === 'scatter') {
        if (!valueColumn) return <div className="p-4 text-center text-gray-500">Value column required</div>;
        chartData = filteredRows
          .filter(row => row[categoryColumn] && row[valueColumn])
          .map(row => ({
            name: row[categoryColumn],
            value: parseFloat(row[valueColumn]) || 0
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      } else if (chartType === 'histogram') {
        const numericValues = filteredRows
          .map(row => parseFloat(row[categoryColumn]))
          .filter(val => !isNaN(val));
        
        if (numericValues.length === 0) return <div className="p-4 text-center text-gray-500">No numeric data found</div>;
        
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const binCount = Math.min(8, Math.ceil(Math.sqrt(numericValues.length)));
        const binSize = (max - min) / binCount;
        
        const bins = {};
        for (let i = 0; i < binCount; i++) {
          const binStart = min + (i * binSize);
          const binEnd = min + ((i + 1) * binSize);
          const binLabel = `${binStart.toFixed(0)}-${binEnd.toFixed(0)}`;
          bins[binLabel] = 0;
        }
        
        numericValues.forEach(value => {
          const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
          const binStart = min + (binIndex * binSize);
          const binEnd = min + ((binIndex + 1) * binSize);
          const binLabel = `${binStart.toFixed(0)}-${binEnd.toFixed(0)}`;
          bins[binLabel]++;
        });
        
        chartData = Object.entries(bins).map(([name, value]) => ({ name, value }));
      }

      if (chartData.length === 0) {
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-lg mb-2">📊</div>
              <div className="text-sm">No data to display</div>
            </div>
          </div>
        );
      }

      switch (chartType) {
        case 'pie':
          return renderPieChart(chartData, title);
        case 'bar':
          return renderBarChart(chartData, title);
        case 'line':
          return renderLineChart(chartData, title);
        case 'scatter':
          return renderScatterChart(chartData, title);
        case 'histogram':
          return renderHistogramChart(chartData, title);
        default:
          return <div className="p-4 text-center text-gray-500">Chart type not supported</div>;
      }
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <div className="text-center">
            <div className="text-lg mb-2">⚠️</div>
            <div className="text-sm">Chart Error</div>
          </div>
        </div>
      );
    }
  };

  const renderPieChart = (data, title) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="h-full p-3 flex flex-col">
        <h3 className="text-base font-semibold mb-2 text-center text-sm">{title}</h3>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${index * (360 / data.length)}, 70%, 50%)` }}></div>
                <div className="flex-1 truncate">{item.name}</div>
                <div className="text-xs font-medium">{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 text-center mt-2">
          Total: {total.toFixed(0)} | Categories: {data.length}
        </div>
      </div>
    );
  };

  const renderBarChart = (data, title) => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="h-full p-3">
        <h3 className="text-base font-semibold mb-3 text-center text-sm">{title}</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {data.map((item, index) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span className="truncate max-w-24">{item.name}</span>
                  <span className="flex-shrink-0">{item.value.toFixed(0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-5">
                  <div 
                    className="bg-blue-600 h-5 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="text-xs text-white font-medium">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 text-center mt-2">
          Categories: {data.length} | Max: {maxValue.toFixed(0)}
        </div>
      </div>
    );
  };

  const renderLineChart = (data, title) => {
    const maxValue = Math.max(...data.map(item => item.value));
    const minValue = Math.min(...data.map(item => item.value));
    
    return (
      <div className="h-full p-3">
        <h3 className="text-base font-semibold mb-3 text-center text-sm">{title}</h3>
        <div className="text-center text-sm text-gray-600 mb-4">
          <div>Data Points: {data.length}</div>
          <div>Range: {minValue.toFixed(0)} - {maxValue.toFixed(0)}</div>
        </div>
        <div className="space-y-1 text-xs">
          {data.slice(0, 10).map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="truncate max-w-20">{item.name}</span>
              <span>{item.value.toFixed(0)}</span>
            </div>
          ))}
          {data.length > 10 && (
            <div className="text-gray-500 text-center">... and {data.length - 10} more</div>
          )}
        </div>
      </div>
    );
  };

  const renderScatterChart = (data, title) => {
    return (
      <div className="h-full p-3">
        <h3 className="text-base font-semibold mb-3 text-center text-sm">{title}</h3>
        <div className="text-center text-sm text-gray-600 mb-4">
          <div>Data Points: {data.length}</div>
        </div>
        <div className="space-y-1 text-xs">
          {data.slice(0, 10).map((item, index) => (
            <div key={index} className="flex justify-between">
              <span className="truncate max-w-20">{item.name}</span>
              <span>{item.value.toFixed(0)}</span>
            </div>
          ))}
          {data.length > 10 && (
            <div className="text-gray-500 text-center">... and {data.length - 10} more</div>
          )}
        </div>
      </div>
    );
  };

  const renderHistogramChart = (data, title) => {
    return (
      <div className="h-full p-3">
        <h3 className="text-base font-semibold mb-3 text-center text-sm">{title}</h3>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span className="truncate max-w-20">{item.name}</span>
                <span className="flex-shrink-0">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-600 h-4 rounded-full"
                  style={{ width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 text-center mt-2">
          Bins: {data.length}
        </div>
      </div>
    );
  };

  if (!normalizedData || !normalizedData.rows) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">
          Please upload data to create interactive dashboards.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Data Summary */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 Data Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Total Rows:</span>
            <span className="ml-2 text-blue-600">{normalizedData?.rows?.length || 0}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Total Columns:</span>
            <span className="ml-2 text-blue-600">{normalizedData?.headers?.length || 0}</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Global Filters Active:</span>
            <span className="ml-2 text-blue-600">{Object.keys(globalFilters).filter(k => globalFilters[k]).length}</span>
          </div>
        </div>
        {normalizedData?.headers && (
          <div className="mt-3">
            <span className="font-medium text-blue-800">Available Columns:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {normalizedData.headers.map((header, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  {header}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Layout Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Dashboard Layout</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedLayout}
              onChange={(e) => setSelectedLayout(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {layoutOptions.map(layout => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowChartCreator(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ➕ Add Chart
            </button>
          </div>
        </div>
      </div>

      {/* Global Filters */}
      {getFilterableColumns.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Global Filters</h3>
          <p className="text-sm text-gray-600 mb-3">
            Apply these filters to all charts on the dashboard
          </p>
          <div className="flex flex-wrap gap-4">
            {getFilterableColumns.slice(0, 4).map(column => (
              <div key={column} className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">{column}:</label>
                <select
                  value={globalFilters[column] || ''}
                  onChange={(e) => applyGlobalFilter(column, e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All {column}</option>
                  {getColumnValues[column]?.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            ))}
            <button
              onClick={clearGlobalFilters}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 underline"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${layoutOptions.find(l => l.id === selectedLayout)?.cols || 2}, 1fr)`,
          gridTemplateRows: `repeat(${layoutOptions.find(l => l.id === selectedLayout)?.rows || 2}, 1fr)`
        }}
      >
        {dashboardCharts.map((chart, index) => (
          <div
            key={chart.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm relative group"
            style={{
              gridColumn: `span ${chart.size.width}`,
              gridRow: `span ${chart.size.height}`
            }}
          >
            {/* Chart Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 text-sm">{chart.title || `${chart.chartType} Chart`}</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => editChart(chart)}
                  className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition-opacity text-sm"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => removeChart(chart.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Chart Content */}
            <div className="h-[28rem]">
              {renderChart(chart)}
            </div>
          </div>
        ))}
        
        {/* Empty Grid Cells */}
        {Array.from({ length: (layoutOptions.find(l => l.id === selectedLayout)?.maxCharts || 4) - dashboardCharts.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">Empty Chart Slot</div>
              <div className="text-xs text-gray-300 mt-1">Click + Add Chart</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Creator/Editor Modal */}
      {showChartCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingChart ? 'Edit Chart' : 'Create New Chart'}
              </h3>
              <button
                onClick={() => {
                  setShowChartCreator(false);
                  setEditingChart(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <ChartCreatorForm
              data={normalizedData}
              chartTypes={chartTypes}
              availableColumns={getAvailableColumns}
              numericColumns={getNumericColumns}
              categoricalColumns={getCategoricalColumns}
              allColumns={getAllChartColumns}
              existingChart={editingChart}
              onSubmit={editingChart ? updateChart : addChart}
              onCancel={() => {
                setShowChartCreator(false);
                setEditingChart(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Chart Creator Form Component
const ChartCreatorForm = ({ 
  data, 
  chartTypes, 
  availableColumns, 
  numericColumns, 
  categoricalColumns, 
  allColumns,
  existingChart, 
  onSubmit, 
  onCancel 
}) => {
  const [chartConfig, setChartConfig] = useState({
    chartType: existingChart?.chartType || 'pie',
    categoryColumn: existingChart?.categoryColumn || '',
    valueColumn: existingChart?.valueColumn || '',
    filterColumn: existingChart?.filterColumn || '',
    filterValue: existingChart?.filterValue || '',
    title: existingChart?.title || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!chartConfig.title) {
      chartConfig.title = `${chartConfig.chartType.charAt(0).toUpperCase() + chartConfig.chartType.slice(1)}: ${chartConfig.categoryColumn} vs ${chartConfig.valueColumn}`;
    }
    
    if (existingChart) {
      onSubmit(existingChart.id, chartConfig);
    } else {
      onSubmit(chartConfig);
    }
  };

  const needsTwoColumns = chartConfig.chartType === 'line' || chartConfig.chartType === 'scatter';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Chart Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chart Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {chartTypes.map(type => (
            <label
              key={type.id}
              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                chartConfig.chartType === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="chartType"
                value={type.id}
                checked={chartConfig.chartType === type.id}
                onChange={(e) => setChartConfig(prev => ({ ...prev, chartType: e.target.value }))}
                className="sr-only"
              />
              <div className="flex flex-col">
                <span className="block text-sm font-medium text-gray-900">{type.name}</span>
                <span className="block text-xs text-gray-500 mt-1">{type.description}</span>
              </div>
              {chartConfig.chartType === type.id && (
                <div className="absolute top-4 right-4 text-blue-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Column Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Column */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {needsTwoColumns ? 'X-Axis Column' : 'Category Column'}
          </label>
          <select
            value={chartConfig.categoryColumn}
            onChange={(e) => setChartConfig(prev => ({ ...prev, categoryColumn: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a column</option>
            {allColumns.map(column => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {categoricalColumns.includes(chartConfig.categoryColumn) 
              ? '✅ Good for categories' 
              : '⚠️ May work as category'}
          </p>
        </div>

        {/* Value Column */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {needsTwoColumns ? 'Y-Axis Column' : 'Value Column'}
          </label>
          <select
            value={chartConfig.valueColumn}
            onChange={(e) => setChartConfig(prev => ({ ...prev, valueColumn: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a column</option>
            {allColumns.map(column => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {categoricalColumns.includes(chartConfig.valueColumn) 
              ? '✅ Good for categories' 
              : '⚠️ May work as category'}
          </p>
        </div>
      </div>

      {/* Optional Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter Column (Optional)
          </label>
          <select
            value={chartConfig.filterColumn}
            onChange={(e) => {
              setChartConfig(prev => ({ 
                ...prev, 
                filterColumn: e.target.value,
                filterValue: '' // Reset filter value when column changes
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No filter</option>
            {availableColumns.map(column => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </div>

        {chartConfig.filterColumn && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Value
            </label>
            <select
              value={chartConfig.filterValue}
              onChange={(e) => setChartConfig(prev => ({ ...prev, filterValue: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All {chartConfig.filterColumn}</option>
              {(() => {
                if (!data || !data.rows || !chartConfig.filterColumn) return [];
                const values = data.rows
                  .map(row => row[chartConfig.filterColumn])
                  .filter(v => v !== null && v !== '');
                const uniqueValues = [...new Set(values)].sort();
                return uniqueValues.slice(0, 50).map(value => (
                  <option key={value} value={value}>{value}</option>
                ));
              })()}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select a specific value to filter this chart
            </p>
          </div>
        )}
      </div>

      {/* Chart Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chart Title (Optional)
        </label>
        <input
          type="text"
          placeholder="Enter a custom title or leave blank for auto-generated title"
          value={chartConfig.title}
          onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!chartConfig.categoryColumn || !chartConfig.valueColumn}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {existingChart ? 'Update Chart' : 'Create Chart'}
        </button>
      </div>
    </form>
  );
};

export default DashboardBuilder;