import React, { useState, useMemo } from 'react';
import DrillDownModal from './DrillDownModal';

const DashboardBuilder = ({ data, dashboardCharts, setDashboardCharts }) => {
  const [selectedLayout, setSelectedLayout] = useState('2x2');
  const [showChartCreator, setShowChartCreator] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [drillDownData, setDrillDownData] = useState(null);
  const [activeFilterTab, setActiveFilterTab] = useState('global');
  const [isDataSummaryCollapsed, setIsDataSummaryCollapsed] = useState(false);
  const [isFilterSectionCollapsed, setIsFilterSectionCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState({ 
    startColumn: '', 
    startFrom: '', 
    startTo: '',
    endColumn: '', 
    endFrom: '', 
    endTo: '' 
  });
  const [numericRangeFilters, setNumericRangeFilters] = useState({});
  const [textSearchFilter, setTextSearchFilter] = useState('');
  const [textSearchColumn, setTextSearchColumn] = useState('');
  const [multiSelectFilters, setMultiSelectFilters] = useState({});

  // Simplified data handling
  const normalizedData = useMemo(() => {
    if (!data) return null;
    if (data.rows && Array.isArray(data.rows) && data.headers && Array.isArray(data.headers)) {
      return { rows: data.rows, headers: data.headers };
    }
    return { rows: [], headers: [] };
  }, [data]);

  const layoutOptions = [
    { id: '1+2', name: '1 + 2 Layout', cols: 2, rows: 2, maxCharts: 3, isSpecial: true },
    { id: '1+3', name: '1 + 3 Layout', cols: 3, rows: 2, maxCharts: 4, isSpecial: true },
    { id: '2x1', name: '2 Horizontal', cols: 2, rows: 1, maxCharts: 2 },
    { id: '3x1', name: '3 Horizontal', cols: 3, rows: 1, maxCharts: 3 },
    { id: '2x2', name: '2x2 Grid', cols: 2, rows: 2, maxCharts: 4 },
    { id: '2x3', name: '2x3 Grid', cols: 2, rows: 3, maxCharts: 6 },
    { id: '3x2', name: '3x2 Grid', cols: 3, rows: 2, maxCharts: 6 },
    { id: '3x3', name: '3x3 Grid', cols: 3, rows: 3, maxCharts: 9 }
  ];

  const chartTypes = [
    { id: 'kpi', name: 'KPI Card', description: 'Show key metrics with trends', icon: '📊' },
    { id: 'pie', name: 'Pie Chart', description: 'Show proportions and percentages', icon: '🥧' },
    { id: 'donut', name: 'Donut Chart', description: 'Pie chart with hollow center', icon: '🍩' },
    { id: 'bar', name: 'Bar Chart', description: 'Compare values across categories', icon: '📊' },
    { id: 'line', name: 'Line Chart', description: 'Show trends over time or sequence', icon: '📈' },
    { id: 'area', name: 'Area Chart', description: 'Line chart with filled area', icon: '🏔️' },
    { id: 'gauge', name: 'Gauge Chart', description: 'Show progress toward a goal', icon: '⏱️' },
    { id: 'table', name: 'Data Table', description: 'Display data in sortable table', icon: '📋' },
    { id: 'scatter', name: 'Scatter Plot', description: 'Show correlation between variables', icon: '⚫' },
    { id: 'histogram', name: 'Histogram', description: 'Show distribution of values', icon: '📊' }
  ];

  const addChart = (chartConfig) => {
    const currentLayout = layoutOptions.find(l => l.id === selectedLayout);
    const chartCount = dashboardCharts.length;
    
    // Determine size and position based on special layouts
    let size = { width: 1, height: 1 };
    
    if (currentLayout?.isSpecial) {
      if (currentLayout.id === '1+2') {
        // First chart spans full width (2 columns)
        // Charts 2 and 3 are 1 column each on second row
        if (chartCount === 0) {
          size = { width: 2, height: 1 }; // Full width top
        } else {
          size = { width: 1, height: 1 }; // Bottom row
        }
      } else if (currentLayout.id === '1+3') {
        // First chart spans full width (3 columns)
        // Charts 2, 3, and 4 are 1 column each on second row
        if (chartCount === 0) {
          size = { width: 3, height: 1 }; // Full width top
        } else {
          size = { width: 1, height: 1 }; // Bottom row
        }
      }
    }
    
    const newChart = {
      id: `chart-${Date.now()}`,
      ...chartConfig,
      position: { x: 0, y: 0 },
      size
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

  const toggleMultiSelectFilter = (column, value) => {
    setMultiSelectFilters(prev => {
      const currentValues = prev[column] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      if (newValues.length === 0) {
        const { [column]: removed, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [column]: newValues };
    });
  };

  const clearAllFilters = () => {
    setMultiSelectFilters({});
    setNumericRangeFilters({});
    setTextSearchFilter('');
    setTextSearchColumn('');
    setDateRange({ 
      startColumn: '', 
      startFrom: '', 
      startTo: '',
      endColumn: '', 
      endFrom: '', 
      endTo: '' 
    });
  };

  const applyDatePreset = (preset) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (preset) {
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'lastQuarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
        const quarterYear = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
        startDate = new Date(quarterYear, lastQuarter * 3, 1);
        endDate = new Date(quarterYear, (lastQuarter + 1) * 3, 0);
        break;
      case 'ytd':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'thisQuarter':
        const thisQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), thisQuarter * 3, 1);
        break;
      default:
        return;
    }

    const formatDate = (date) => date.toISOString().split('T')[0];
    
    if (dateRange.startColumn) {
      setDateRange(prev => ({
        ...prev,
        startFrom: formatDate(startDate),
        startTo: formatDate(endDate)
      }));
    } else if (dateRange.endColumn) {
      setDateRange(prev => ({
        ...prev,
        endFrom: formatDate(startDate),
        endTo: formatDate(endDate)
      }));
    }
  };

  // Save dashboard configuration
  const saveDashboardConfig = () => {
    const config = {
      layout: selectedLayout,
      charts: dashboardCharts,
      multiSelectFilters,
      numericRangeFilters,
      textSearchFilter,
      textSearchColumn,
      dateRange,
      savedAt: new Date().toISOString()
    };
    
    const configJSON = JSON.stringify(config, null, 2);
    const blob = new Blob([configJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_config_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Load dashboard configuration
  const loadDashboardConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        setSelectedLayout(config.layout || '2x2');
        setDashboardCharts(config.charts || []);
        setMultiSelectFilters(config.multiSelectFilters || {});
        setNumericRangeFilters(config.numericRangeFilters || {});
        setTextSearchFilter(config.textSearchFilter || '');
        setTextSearchColumn(config.textSearchColumn || '');
        setDateRange(config.dateRange || { startColumn: '', startFrom: '', startTo: '', endColumn: '', endFrom: '', endTo: '' });
        alert('Dashboard configuration loaded successfully!');
      } catch (error) {
        alert('Error loading dashboard configuration. Please check the file format.');
        console.error('Load config error:', error);
      }
    };
    reader.readAsText(file);
  };

  // Export dashboard to PDF
  const exportDashboardToPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      const dashboardElement = document.getElementById('dashboard-grid');
      if (!dashboardElement) return;
      
      // Show loading message
      const loadingMsg = document.createElement('div');
      loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 9999;';
      loadingMsg.innerHTML = '<div style="text-align: center;"><div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">📊 Generating PDF...</div><div style="color: #666;">This may take a moment</div></div>';
      document.body.appendChild(loadingMsg);
      
      // Capture dashboard as canvas
      const canvas = await html2canvas(dashboardElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Add metadata
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, pdfHeight - 10);
      
      // Save PDF
      pdf.save(`dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Remove loading message
      document.body.removeChild(loadingMsg);
    } catch (error) {
      alert('Error generating PDF. Please try again.');
      console.error('PDF export error:', error);
    }
  };

  const getFilteredData = useMemo(() => {
    if (!normalizedData || !normalizedData.rows) return normalizedData;
    let filteredRows = [...normalizedData.rows];
    
    // Apply multi-select filters
    Object.entries(multiSelectFilters).forEach(([column, selectedValues]) => {
      if (selectedValues && selectedValues.length > 0) {
        filteredRows = filteredRows.filter(row => selectedValues.includes(row[column]));
      }
    });
    
    // Apply numeric range filters
    Object.entries(numericRangeFilters).forEach(([column, range]) => {
      if (range && (range.min !== undefined || range.max !== undefined)) {
        filteredRows = filteredRows.filter(row => {
          const value = parseFloat(row[column]);
          if (isNaN(value)) return false;
          
          let passesFilter = true;
          if (range.min !== undefined && range.min !== '') {
            passesFilter = passesFilter && value >= parseFloat(range.min);
          }
          if (range.max !== undefined && range.max !== '') {
            passesFilter = passesFilter && value <= parseFloat(range.max);
          }
          return passesFilter;
        });
      }
    });
    
    // Apply text search filter
    if (textSearchFilter && textSearchColumn) {
      const searchTerm = textSearchFilter.toLowerCase();
      filteredRows = filteredRows.filter(row => {
        const cellValue = String(row[textSearchColumn] || '').toLowerCase();
        return cellValue.includes(searchTerm);
      });
    }
    
    // Apply date range filters
    // Filter by Start Date column
    if (dateRange.startColumn && (dateRange.startFrom || dateRange.startTo)) {
      filteredRows = filteredRows.filter(row => {
        const dateValue = row[dateRange.startColumn];
        if (!dateValue) return false;
        
        const rowDate = new Date(dateValue);
        if (isNaN(rowDate.getTime())) return false;
        
        let passesFilter = true;
        if (dateRange.startFrom) {
          passesFilter = passesFilter && rowDate >= new Date(dateRange.startFrom);
        }
        if (dateRange.startTo) {
          passesFilter = passesFilter && rowDate <= new Date(dateRange.startTo);
        }
        return passesFilter;
      });
    }
    
    // Filter by End Date column
    if (dateRange.endColumn && (dateRange.endFrom || dateRange.endTo)) {
      filteredRows = filteredRows.filter(row => {
        const dateValue = row[dateRange.endColumn];
        if (!dateValue) return false;
        
        const rowDate = new Date(dateValue);
        if (isNaN(rowDate.getTime())) return false;
        
        let passesFilter = true;
        if (dateRange.endFrom) {
          passesFilter = passesFilter && rowDate >= new Date(dateRange.endFrom);
        }
        if (dateRange.endTo) {
          passesFilter = passesFilter && rowDate <= new Date(dateRange.endTo);
        }
        return passesFilter;
      });
    }
    
    return { ...normalizedData, rows: filteredRows };
  }, [normalizedData, multiSelectFilters, numericRangeFilters, textSearchFilter, textSearchColumn, dateRange]);

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
      const numericCount = values.filter(v => !isNaN(parseFloat(v))).length;
      return numericCount / values.length > 0.7; // 70% of values should be numeric
    });
  }, [normalizedData]);

  const getTextColumns = useMemo(() => {
    if (!normalizedData || !normalizedData.headers || !normalizedData.rows) return [];
    return normalizedData.headers.filter(header => {
      const values = normalizedData.rows.map(row => row[header]).filter(v => v !== null && v !== '');
      // Text columns are non-numeric columns
      const numericCount = values.filter(v => !isNaN(parseFloat(v))).length;
      const isText = numericCount / values.length < 0.3; // Less than 30% numeric
      return isText && values.length > 0;
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

  const getDateColumns = useMemo(() => {
    if (!normalizedData || !normalizedData.headers || !normalizedData.rows) return [];
    return normalizedData.headers.filter(header => {
      const sampleValues = normalizedData.rows.slice(0, 10).map(row => row[header]).filter(v => v !== null && v !== '');
      if (sampleValues.length === 0) return false;
      // Check if values can be parsed as dates
      const dateCount = sampleValues.filter(v => {
        const date = new Date(v);
        return !isNaN(date.getTime()) && v.toString().match(/\d{4}|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2}/);
      }).length;
      return dateCount / sampleValues.length > 0.7; // 70% of values should be valid dates
    });
  }, [normalizedData]);

  const handleChartClick = (chart, categoryName, categoryValue) => {
    setDrillDownData({
      categoryName,
      categoryValue,
      rawData: normalizedData,
      categoryColumn: chart.categoryColumn,
      valueColumn: chart.valueColumn,
      chartType: chart.chartType
    });
  };

  const renderChart = (chart) => {
    try {
      const { chartType, categoryColumn, valueColumn, filterColumn, filterValue, title } = chart;
      let filteredRows = getFilteredData?.rows || [];
      
      console.log('Dashboard renderChart:', {
        title,
        chartType,
        categoryColumn,
        valueColumn,
        filterColumn,
        filterValue,
        totalRows: filteredRows.length,
        hasMultiSelectFilters: Object.keys(multiSelectFilters).length,
        multiSelectFilters
      });
      
      if (filterColumn && filterValue) {
        const beforeFilter = filteredRows.length;
        filteredRows = filteredRows.filter(row => row[filterColumn] === filterValue);
        console.log(`Chart filter applied: ${beforeFilter} -> ${filteredRows.length} rows`);
      }
      
      // For table widget, render directly without aggregation
      if (chartType === 'table') {
        return renderDataTable(filteredRows, chart);
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
      
      if (chartType === 'pie' || chartType === 'bar' || chartType === 'donut' || chartType === 'kpi' || chartType === 'gauge') {
        const counts = {};
        filteredRows.forEach(row => {
          const category = row[categoryColumn];
          // If valueColumn is specified, try to parse as number, otherwise count occurrences
          let value = 1;
          if (valueColumn) {
            const parsedValue = parseFloat(row[valueColumn]);
            // Only use parsed value if it's a valid number, otherwise count as 1
            value = !isNaN(parsedValue) ? parsedValue : 1;
          }
          if (category !== null && category !== undefined && category !== '') {
            counts[category] = (counts[category] || 0) + value;
          }
        });
        
        // Filter out categories with 0 or very small values
        chartData = Object.entries(counts)
          .filter(([name, value]) => value > 0)
          .map(([name, value]) => ({ name: String(name), value }))
          .sort((a, b) => b.value - a.value);
        
        // Debug logging
        console.log('Dashboard Chart Data:', {
          chartType,
          categoryColumn,
          valueColumn,
          filteredRowsCount: filteredRows.length,
          uniqueCategories: Object.keys(counts).length,
          chartDataLength: chartData.length,
          chartData: chartData.slice(0, 10), // Show first 10 for debugging
          countsDebug: counts
        });
        
        // Warning if all values are very small or similar (indicates wrong value column)
        const allValues = chartData.map(d => d.value);
        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues);
        if (maxValue > 0 && maxValue === minValue && chartData.length > 2) {
          console.warn('⚠️ All categories have the same value. This might indicate you selected a non-numeric column as the value column.');
        }
      } else if (chartType === 'line' || chartType === 'scatter' || chartType === 'area') {
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
        case 'kpi':
          return renderKPICard(chartData, chart);
        case 'pie':
          return renderPieChart(chartData, title, chart);
        case 'donut':
          return renderDonutChart(chartData, title);
        case 'bar':
          return renderBarChart(chartData, title, chart);
        case 'line':
          return renderLineChart(chartData, title);
        case 'area':
          return renderAreaChart(chartData, title);
        case 'gauge':
          return renderGaugeChart(chartData, chart);
        case 'table':
          return renderDataTable(filteredRows, chart);
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

  const renderPieChart = (data, title, chart) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-lg mb-2">🥧</div>
            <div className="text-sm">No data to display</div>
          </div>
        </div>
      );
    }
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 80;
    
    let currentAngle = -Math.PI / 2; // Start from top
    const slices = [];
    
    data.forEach((item, index) => {
      const percentage = total > 0 ? item.value / total : 0;
      const angle = percentage * 2 * Math.PI;
      const endAngle = currentAngle + angle;
      
      const x1 = centerX + radius * Math.cos(currentAngle);
      const y1 = centerY + radius * Math.sin(currentAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      const color = `hsl(${index * (360 / data.length)}, 70%, 50%)`;
      
      slices.push({
        pathData,
        color,
        item,
        percentage
      });
      
      currentAngle = endAngle;
    });
    
    return (
      <div className="h-full p-3 flex flex-col">
        <h3 className="text-base font-semibold mb-2 text-center text-sm">{title}</h3>
        <div className="flex-1 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-md">
            {slices.map((slice, index) => (
              <path
                key={index}
                d={slice.pathData}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleChartClick(chart, slice.item.name, slice.item.value)}
              />
            ))}
          </svg>
        </div>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {data.slice(0, 5).map((item, index) => {
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
        <div className="text-xs text-gray-500 text-center mt-1">
          Total: {total.toFixed(0)} | Categories: {data.length}
        </div>
      </div>
    );
  };

  const renderBarChart = (data, title, chart) => {
    const maxValue = Math.max(...data.map(item => item.value));
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="h-full p-3">
        <h3 className="text-base font-semibold mb-3 text-center text-sm">{title}</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {data.map((item, index) => {
            const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span className="truncate max-w-24">{item.name}</span>
                  <span className="flex-shrink-0">{item.value.toFixed(0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-5 cursor-pointer" onClick={() => handleChartClick(chart, item.name, item.value)}>
                  <div 
                    className="bg-blue-600 h-5 rounded-full transition-all duration-300 flex items-center justify-end pr-2 hover:bg-blue-700"
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="text-xs text-white font-medium">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
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

  // KPI Card Renderer
  const renderKPICard = (data, chart) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const average = data.length > 0 ? total / data.length : 0;
    const max = data.length > 0 ? Math.max(...data.map(item => item.value)) : 0;
    const min = data.length > 0 ? Math.min(...data.map(item => item.value)) : 0;
    
    // Calculate trend (comparing first half to second half of data)
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length : 0;
    const trendPercentage = firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    const isPositive = trendPercentage >= 0;
    
    // Use aggregation type from chart config or default to 'total'
    const aggregationType = chart.aggregationType || 'total';
    let mainValue = total;
    let valueLabel = 'Total';
    
    switch (aggregationType) {
      case 'average':
        mainValue = average;
        valueLabel = 'Average';
        break;
      case 'max':
        mainValue = max;
        valueLabel = 'Maximum';
        break;
      case 'min':
        mainValue = min;
        valueLabel = 'Minimum';
        break;
      case 'count':
        mainValue = data.length;
        valueLabel = 'Count';
        break;
      default:
        mainValue = total;
        valueLabel = 'Total';
    }
    
    return (
      <div className="h-full p-6 flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center w-full">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{chart.title || valueLabel}</h3>
          <div className="text-5xl font-bold text-blue-600 mb-3">
            {mainValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
          
          {/* Trend Indicator */}
          {data.length > 2 && (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <span className="text-lg mr-1">{isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trendPercentage).toFixed(1)}%</span>
            </div>
          )}
          
          {/* Mini Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-800">{min.toFixed(0)}</div>
              <div className="text-gray-500">Min</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-800">{average.toFixed(0)}</div>
              <div className="text-gray-500">Avg</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-800">{max.toFixed(0)}</div>
              <div className="text-gray-500">Max</div>
            </div>
          </div>
          
          {/* Data Count */}
          <div className="mt-3 text-xs text-gray-500">
            Based on {data.length} data points
          </div>
        </div>
      </div>
    );
  };

  // Donut Chart Renderer
  const renderDonutChart = (data, title) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-lg mb-2">🍩</div>
            <div className="text-sm">No data to display</div>
          </div>
        </div>
      );
    }
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 70;
    const innerRadius = 45;
    
    let currentAngle = -Math.PI / 2; // Start from top
    const slices = [];
    
    data.forEach((item, index) => {
      const percentage = total > 0 ? item.value / total : 0;
      const angle = percentage * 2 * Math.PI;
      const endAngle = currentAngle + angle;
      
      const x1 = centerX + radius * Math.cos(currentAngle);
      const y1 = centerY + radius * Math.sin(currentAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const x3 = centerX + innerRadius * Math.cos(endAngle);
      const y3 = centerY + innerRadius * Math.sin(endAngle);
      const x4 = centerX + innerRadius * Math.cos(currentAngle);
      const y4 = centerY + innerRadius * Math.sin(currentAngle);
      
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');
      
      const color = `hsl(${index * (360 / data.length)}, 70%, 50%)`;
      
      slices.push({
        pathData,
        color,
        item,
        percentage
      });
      
      currentAngle = endAngle;
    });
    
    return (
      <div className="h-full p-3 flex flex-col">
        <h3 className="text-base font-semibold mb-2 text-center text-sm">{title}</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-md">
              {slices.map((slice, index) => (
                <path
                  key={index}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
              {/* Center circle */}
              <circle cx={centerX} cy={centerY} r={innerRadius} fill="white" />
              {/* Center text */}
              <text x={centerX} y={centerY - 5} textAnchor="middle" className="text-2xl font-bold fill-gray-800">
                {total.toFixed(0)}
              </text>
              <text x={centerX} y={centerY + 15} textAnchor="middle" className="text-xs fill-gray-500">
                Total
              </text>
            </svg>
          </div>
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {data.slice(0, 5).map((item, index) => {
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
      </div>
    );
  };

  // Area Chart Renderer
  const renderAreaChart = (data, title) => {
    if (data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(item => item.value));
    const minValue = Math.min(...data.map(item => item.value));
    const width = 300;
    const height = 200;
    const padding = 30;
    
    // Calculate points for the line
    const points = data.map((item, index) => {
      const x = padding + (index * (width - 2 * padding)) / (data.length - 1);
      const y = height - padding - ((item.value - minValue) / (maxValue - minValue)) * (height - 2 * padding);
      return { x, y };
    });
    
    // Create path for the line
    const linePath = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
    
    // Create path for the filled area
    const areaPath = [
      ...points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`),
      `L ${points[points.length - 1].x} ${height - padding}`,
      `L ${points[0].x} ${height - padding}`,
      'Z'
    ].join(' ');
    
    return (
      <div className="h-full p-3 flex flex-col">
        <h3 className="text-base font-semibold mb-2 text-center text-sm">{title}</h3>
        <div className="flex-1 flex items-center justify-center">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => {
              const y = padding + (i * (height - 2 * padding)) / 4;
              return (
                <line
                  key={i}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              );
            })}
            
            {/* Filled area */}
            <path
              d={areaPath}
              fill={`url(#gradient-${title})`}
            />
            
            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
            />
            
            {/* Data points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#3B82F6"
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>
        <div className="text-xs text-gray-500 text-center mt-2">
          Range: {minValue.toFixed(0)} - {maxValue.toFixed(0)} | Points: {data.length}
        </div>
      </div>
    );
  };

  // Gauge Chart Renderer
  const renderGaugeChart = (data, chart) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const target = chart.targetValue || total * 1.2; // Default target is 120% of current
    const percentage = Math.min((total / target) * 100, 100);
    
    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 70;
    const startAngle = -Math.PI * 0.75; // Start at bottom left
    const endAngle = Math.PI * 0.75; // End at bottom right
    const currentAngle = startAngle + (endAngle - startAngle) * (percentage / 100);
    
    // Arc path for the gauge background
    const arcPath = (start, end, r) => {
      const x1 = centerX + r * Math.cos(start);
      const y1 = centerY + r * Math.sin(start);
      const x2 = centerX + r * Math.cos(end);
      const y2 = centerY + r * Math.sin(end);
      const largeArc = end - start > Math.PI ? 1 : 0;
      return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
    };
    
    // Determine color based on percentage
    let gaugeColor = '#EF4444'; // red
    if (percentage >= 75) gaugeColor = '#10B981'; // green
    else if (percentage >= 50) gaugeColor = '#F59E0B'; // yellow
    
    return (
      <div className="h-full p-6 flex flex-col justify-center items-center">
        <h3 className="text-sm font-medium text-gray-600 mb-4">{chart.title || 'Progress'}</h3>
        <div className="relative">
          <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
            {/* Background arc */}
            <path
              d={arcPath(startAngle, endAngle, radius)}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="20"
              strokeLinecap="round"
            />
            
            {/* Progress arc */}
            <path
              d={arcPath(startAngle, currentAngle, radius)}
              fill="none"
              stroke={gaugeColor}
              strokeWidth="20"
              strokeLinecap="round"
            />
            
            {/* Needle */}
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX + (radius - 15) * Math.cos(currentAngle)}
              y2={centerY + (radius - 15) * Math.sin(currentAngle)}
              stroke="#374151"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Center dot */}
            <circle cx={centerX} cy={centerY} r="8" fill="#374151" />
          </svg>
        </div>
        
        {/* Value display */}
        <div className="text-center mt-2">
          <div className="text-4xl font-bold" style={{ color: gaugeColor }}>
            {percentage.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {total.toFixed(0)} / {target.toFixed(0)}
          </div>
        </div>
      </div>
    );
  };

  // Data Table Renderer - converted to component
  const renderDataTable = (rows, chart) => {
    return <DataTableWidget rows={rows} chart={chart} />;
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
    <div className="p-6 max-w-full overflow-x-hidden">
      {/* Data Summary - Collapsible */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg">
        <button
          onClick={() => setIsDataSummaryCollapsed(!isDataSummaryCollapsed)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors rounded-lg"
        >
          <h3 className="text-lg font-semibold text-blue-900">📊 Data Summary</h3>
          <span className="text-blue-900 text-xl">
            {isDataSummaryCollapsed ? '▼' : '▲'}
          </span>
        </button>
        {!isDataSummaryCollapsed && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
              <div>
                <span className="font-medium text-blue-800">Total Rows:</span>
                <span className="ml-2 text-blue-600">{normalizedData?.rows?.length || 0}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Filtered Rows:</span>
                <span className="ml-2 text-blue-600">{getFilteredData?.rows?.length || 0}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Total Columns:</span>
                <span className="ml-2 text-blue-600">{normalizedData?.headers?.length || 0}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Filters Active:</span>
                <span className="ml-2 text-blue-600">
                  {Object.keys(multiSelectFilters).filter(k => multiSelectFilters[k]?.length > 0).length +
                   Object.keys(numericRangeFilters).length +
                   (textSearchFilter ? 1 : 0) +
                   (dateRange.startColumn ? 1 : 0) +
                   (dateRange.endColumn ? 1 : 0)}
                </span>
              </div>
            </div>
            {normalizedData?.headers && (
              <div>
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
        )}
      </div>

      {/* Dashboard Actions & Layout */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={saveDashboardConfig}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Save Dashboard Configuration"
          >
            💾 Save
          </button>
          <label className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            title="Load Dashboard Configuration">
            📂 Load
            <input
              type="file"
              accept=".json"
              onChange={loadDashboardConfig}
              className="hidden"
            />
          </label>
          <button
            onClick={exportDashboardToPDF}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Export Dashboard to PDF"
          >
            📄 Export PDF
          </button>
        </div>
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

      {/* Filters Section with Tabs - Collapsible */}
      {(getFilterableColumns.length > 0 || getDateColumns.length > 0 || getNumericColumns.length > 0 || getTextColumns.length > 0) && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg">
          <button
            onClick={() => setIsFilterSectionCollapsed(!isFilterSectionCollapsed)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100 transition-colors rounded-t-lg"
          >
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {(Object.keys(multiSelectFilters).length > 0 || Object.keys(numericRangeFilters).length > 0 || textSearchFilter || dateRange.startColumn || dateRange.endColumn) && (
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {Object.keys(multiSelectFilters).filter(k => multiSelectFilters[k]?.length > 0).length +
                   Object.keys(numericRangeFilters).length +
                   (textSearchFilter ? 1 : 0) +
                   (dateRange.startColumn ? 1 : 0) +
                   (dateRange.endColumn ? 1 : 0)} active
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {(Object.keys(multiSelectFilters).length > 0 || Object.keys(numericRangeFilters).length > 0 || textSearchFilter || dateRange.startColumn || dateRange.endColumn) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAllFilters();
                  }}
                  className="px-3 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-300 rounded transition-colors"
                >
                  Clear All
                </button>
              )}
              <span className="text-gray-900 text-xl">
                {isFilterSectionCollapsed ? '▼' : '▲'}
              </span>
            </div>
          </button>
          
          {!isFilterSectionCollapsed && (
            <div className="p-4 pt-0">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              <button
                onClick={() => setActiveFilterTab('global')}
                className={`${
                  activeFilterTab === 'global'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Category Filters
                {Object.keys(multiSelectFilters).filter(k => multiSelectFilters[k]?.length > 0).length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                    {Object.keys(multiSelectFilters).filter(k => multiSelectFilters[k]?.length > 0).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveFilterTab('numeric')}
                className={`${
                  activeFilterTab === 'numeric'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                🔢 Numeric Ranges
                {Object.keys(numericRangeFilters).length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                    {Object.keys(numericRangeFilters).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveFilterTab('textSearch')}
                className={`${
                  activeFilterTab === 'textSearch'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                🔍 Text Search
                {textSearchFilter && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                    1
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveFilterTab('dateRange')}
                className={`${
                  activeFilterTab === 'dateRange'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                📅 Date Ranges
                {(dateRange.startColumn || dateRange.endColumn) && (
                  <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                    {(dateRange.startColumn ? 1 : 0) + (dateRange.endColumn ? 1 : 0)}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Category Filters Tab Content */}
          {activeFilterTab === 'global' && getFilterableColumns.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-4">
                Apply categorical filters to all charts. Select multiple values to include them in your filter (OR logic).
              </p>
              
              <div className="space-y-4">
                {getFilterableColumns.slice(0, 4).map(column => {
                  const values = getColumnValues[column] || [];
                  const isManyValues = values.length > 10;
                  
                  return (
                    <div key={column} className="bg-white border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-800">{column}</label>
                        <div className="flex items-center space-x-2">
                          {multiSelectFilters[column]?.length > 0 && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {multiSelectFilters[column].length} selected
                            </span>
                          )}
                          {multiSelectFilters[column]?.length > 0 && (
                            <button
                              onClick={() => {
                                setMultiSelectFilters(prev => {
                                  const { [column]: removed, ...rest } = prev;
                                  return rest;
                                });
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {!isManyValues ? (
                        // Multi-select checkboxes for columns with few values
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                          {values.map(value => (
                            <label key={value} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={multiSelectFilters[column]?.includes(value) || false}
                                onChange={() => toggleMultiSelectFilter(column, value)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="truncate">{value}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        // Multi-select with scrollable checkbox list for columns with many values
                        <div className="border border-gray-300 rounded bg-white max-h-48 overflow-y-auto p-2">
                          <div className="space-y-1">
                            {values.map(value => (
                              <label key={value} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={multiSelectFilters[column]?.includes(value) || false}
                                  onChange={() => toggleMultiSelectFilter(column, value)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="truncate">{value}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {multiSelectFilters[column]?.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600">
                          Showing data where {column} is: {multiSelectFilters[column].join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Numeric Range Filters Tab Content */}
          {activeFilterTab === 'numeric' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-4">
                Select numeric columns to filter by min/max ranges. Leave fields blank to filter by only one boundary.
              </p>
              
              {getNumericColumns.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No numeric columns detected in your data.</p>
              ) : (
                <div className="space-y-4">
                  {/* Active Numeric Filters */}
                  {Object.keys(numericRangeFilters).length > 0 && (
                    <div className="space-y-3">
                      {Object.entries(numericRangeFilters).map(([column, range]) => {
                        const values = normalizedData.rows.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
                        const min = values.length > 0 ? Math.min(...values) : 0;
                        const max = values.length > 0 ? Math.max(...values) : 0;
                        
                        return (
                          <div key={column} className="bg-gray-50 border border-gray-300 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-semibold text-gray-800">{column}</label>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Range: {min.toFixed(2)} - {max.toFixed(2)}</span>
                                <button
                                  onClick={() => setNumericRangeFilters(prev => {
                                    const { [column]: removed, ...rest } = prev;
                                    return rest;
                                  })}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                  title="Remove this filter"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="flex-1">
                                <label className="block text-xs text-gray-600 mb-1">Min</label>
                                <input
                                  type="number"
                                  placeholder={min.toFixed(2)}
                                  value={range.min || ''}
                                  onChange={(e) => setNumericRangeFilters(prev => ({
                                    ...prev,
                                    [column]: { ...prev[column], min: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                              </div>
                              <span className="text-gray-400 pt-5">—</span>
                              <div className="flex-1">
                                <label className="block text-xs text-gray-600 mb-1">Max</label>
                                <input
                                  type="number"
                                  placeholder={max.toFixed(2)}
                                  value={range.max || ''}
                                  onChange={(e) => setNumericRangeFilters(prev => ({
                                    ...prev,
                                    [column]: { ...prev[column], max: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Add New Numeric Filter */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Numeric Column Filter</label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value && !numericRangeFilters[e.target.value]) {
                          setNumericRangeFilters(prev => ({
                            ...prev,
                            [e.target.value]: { min: '', max: '' }
                          }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select a numeric column to filter...</option>
                      {getNumericColumns
                        .filter(col => !numericRangeFilters[col])
                        .map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                    </select>
                    {Object.keys(numericRangeFilters).length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Select a column above to start filtering by numeric range
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Search Filter Tab Content */}
          {activeFilterTab === 'textSearch' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-4">
                Search for specific text across a column. Results will show rows containing your search term.
              </p>
              
              {getTextColumns.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No text columns detected in your data.</p>
              ) : (
                <div className="bg-white border border-gray-200 rounded p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Column to Search</label>
                      <select
                        value={textSearchColumn}
                        onChange={(e) => setTextSearchColumn(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Choose a column...</option>
                        {getTextColumns.map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                    
                    {textSearchColumn && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Term</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Enter text to search..."
                            value={textSearchFilter}
                            onChange={(e) => setTextSearchFilter(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {textSearchFilter && (
                            <button
                              onClick={() => {
                                setTextSearchFilter('');
                                setTextSearchColumn('');
                              }}
                              className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        {textSearchFilter && (
                          <p className="text-xs text-gray-500 mt-1">
                            Searching in "{textSearchColumn}" for: "{textSearchFilter}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date Range Filters Tab Content */}
          {activeFilterTab === 'dateRange' && getDateColumns.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-4">
                Filter data by start and/or end date ranges. Both filters are optional.
              </p>
              
              {/* Quick Date Presets */}
              {(dateRange.startColumn || dateRange.endColumn) && (
                <div className="mb-4 bg-white border border-gray-200 rounded p-3">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Quick Date Presets</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => applyDatePreset('last7days')}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => applyDatePreset('last30days')}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => applyDatePreset('thisMonth')}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => applyDatePreset('lastMonth')}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
                    >
                      Last Month
                    </button>
                    <button
                      onClick={() => applyDatePreset('thisQuarter')}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
                    >
                      This Quarter
                    </button>
                    <button
                      onClick={() => applyDatePreset('lastQuarter')}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
                    >
                      Last Quarter
                    </button>
                    <button
                      onClick={() => applyDatePreset('ytd')}
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 transition-colors"
                    >
                      Year to Date
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select a date column below first, then use these presets for quick filtering
                  </p>
                </div>
              )}
              
              {/* Combined Date Filter Box */}
              <div className="space-y-4">
                {/* Start Date Filter */}
                <div className="pb-4 border-b border-gray-300">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Start Date Filter (Optional)</h4>
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date Column:</label>
                      <select
                        value={dateRange.startColumn}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startColumn: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select start date column (optional)</option>
                        {getDateColumns.map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                    {dateRange.startColumn && (
                      <>
                        <div className="flex-1 min-w-[150px]">
                          <label className="block text-sm font-medium text-gray-700 mb-1">From Date:</label>
                          <input
                            type="date"
                            value={dateRange.startFrom}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startFrom: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                          <label className="block text-sm font-medium text-gray-700 mb-1">To Date:</label>
                          <input
                            type="date"
                            value={dateRange.startTo}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startTo: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <button
                          onClick={() => setDateRange(prev => ({ ...prev, startColumn: '', startFrom: '', startTo: '' }))}
                          className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 bg-white"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* End Date Filter */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">End Date Filter (Optional)</h4>
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date Column:</label>
                      <select
                        value={dateRange.endColumn}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endColumn: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select end date column (optional)</option>
                        {getDateColumns.map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                    {dateRange.endColumn && (
                      <>
                        <div className="flex-1 min-w-[150px]">
                          <label className="block text-sm font-medium text-gray-700 mb-1">From Date:</label>
                          <input
                            type="date"
                            value={dateRange.endFrom}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endFrom: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                          <label className="block text-sm font-medium text-gray-700 mb-1">To Date:</label>
                          <input
                            type="date"
                            value={dateRange.endTo}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endTo: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <button
                          onClick={() => setDateRange(prev => ({ ...prev, endColumn: '', endFrom: '', endTo: '' }))}
                          className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 bg-white"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Clear All Date Filters Button */}
                {(dateRange.startColumn || dateRange.endColumn) && (
                  <div className="pt-4 border-t border-gray-300 text-center">
                    <button
                      onClick={() => setDateRange({ startColumn: '', startFrom: '', startTo: '', endColumn: '', endFrom: '', endTo: '' })}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Clear All Date Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {/* Dashboard Grid */}
      <div 
        id="dashboard-grid"
        className="grid gap-4 max-w-full"
        style={{
          gridTemplateColumns: `repeat(${layoutOptions.find(l => l.id === selectedLayout)?.cols || 2}, 1fr)`,
          gridTemplateRows: `repeat(${layoutOptions.find(l => l.id === selectedLayout)?.rows || 2}, 1fr)`
        }}
      >
        {dashboardCharts.map((chart, index) => {
          // Use chart's size property for grid span
          const gridColumnSpan = chart.size?.width || 1;
          const gridRowSpan = chart.size?.height || 1;
          
          return (
            <div
              key={chart.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm relative group overflow-hidden"
              style={{
                gridColumn: `span ${gridColumnSpan}`,
                gridRow: `span ${gridRowSpan}`
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
              <div className="h-[28rem] overflow-hidden">
                {renderChart(chart)}
              </div>
            </div>
          );
        })}
        
        {/* Empty Grid Cells */}
        {Array.from({ length: (layoutOptions.find(l => l.id === selectedLayout)?.maxCharts || 4) - dashboardCharts.length }).map((_, index) => {
          const currentLayout = layoutOptions.find(l => l.id === selectedLayout);
          const chartCount = dashboardCharts.length;
          const emptyIndex = chartCount + index;
          
          // Determine grid span for special layouts
          let gridStyle = {};
          if (currentLayout?.isSpecial) {
            if (currentLayout.id === '1+2' && emptyIndex === 0) {
              gridStyle = { gridColumn: 'span 2' };
            } else if (currentLayout.id === '1+3' && emptyIndex === 0) {
              gridStyle = { gridColumn: 'span 3' };
            }
          }
          
          return (
            <div
              key={`empty-${index}`}
              onClick={() => setShowChartCreator(true)}
              className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 cursor-pointer hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-all duration-200"
              style={gridStyle}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-medium">Empty Chart Slot</div>
                <div className="text-xs mt-1">Click to Add Chart</div>
              </div>
            </div>
          );
        })}
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

      {/* Drill Down Modal */}
      {drillDownData && (
        <DrillDownModal
          isOpen={!!drillDownData}
          onClose={() => setDrillDownData(null)}
          categoryName={drillDownData.categoryName}
          categoryValue={drillDownData.categoryValue}
          rawData={drillDownData.rawData}
          categoryColumn={drillDownData.categoryColumn}
          valueColumn={drillDownData.valueColumn}
          chartType={drillDownData.chartType}
        />
      )}
    </div>
  );
};

// Data Table Widget Component
const DataTableWidget = ({ rows, chart }) => {
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;
  
  // Sort data - must be before early return
  const sortedRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    if (!sortColumn) return rows;
    
    return [...rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      // Try numeric comparison
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String comparison
      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [rows, sortColumn, sortDirection]);
  
  // Paginate - must be before early return
  const paginatedRows = useMemo(() => {
    return sortedRows.slice(
      currentPage * rowsPerPage,
      (currentPage + 1) * rowsPerPage
    );
  }, [sortedRows, currentPage, rowsPerPage]);
  
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  
  // Early return after all hooks
  if (!rows || rows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">📋</div>
          <div className="text-sm">No data to display</div>
        </div>
      </div>
    );
  }
  
  const headers = Object.keys(rows[0]);
  
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      <div className="flex-1 border border-gray-200 rounded overflow-auto">
        <div className="overflow-x-auto overflow-y-auto h-full">
          <table className="min-w-full text-xs border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    onClick={() => handleSort(header)}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap border-b border-gray-200"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{header}</span>
                      {sortColumn === header && (
                        <span className="text-blue-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {headers.map((header) => (
                    <td key={header} className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {String(row[header] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-2 px-2 py-2 flex items-center justify-between bg-gray-50 rounded flex-shrink-0">
          <div className="text-xs text-gray-600">
            {currentPage * rowsPerPage + 1}-{Math.min((currentPage + 1) * rowsPerPage, sortedRows.length)} of {sortedRows.length}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="px-2 py-1 text-xs">
              {currentPage + 1}/{totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
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
    title: existingChart?.title || '',
    aggregationType: existingChart?.aggregationType || 'total',
    targetValue: existingChart?.targetValue || ''
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

  const needsTwoColumns = chartConfig.chartType === 'line' || chartConfig.chartType === 'scatter' || chartConfig.chartType === 'area';
  const isValueColumnOptional = chartConfig.chartType === 'pie' || chartConfig.chartType === 'bar' || chartConfig.chartType === 'donut' || chartConfig.chartType === 'histogram' || chartConfig.chartType === 'kpi' || chartConfig.chartType === 'gauge';

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
            {needsTwoColumns ? 'Y-Axis Column' : 'Value Column'} {!needsTwoColumns && '(Optional)'}
          </label>
          <select
            value={chartConfig.valueColumn}
            onChange={(e) => setChartConfig(prev => ({ ...prev, valueColumn: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={needsTwoColumns}
          >
            <option value="">{needsTwoColumns ? 'Select a column' : 'Count occurrences (leave empty)'}</option>
            {allColumns.map(column => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {!needsTwoColumns && !chartConfig.valueColumn 
              ? '📊 Will count rows per category' 
              : numericColumns.includes(chartConfig.valueColumn) 
              ? '✅ Good for numeric values' 
              : chartConfig.valueColumn
              ? '⚠️ Non-numeric column - will count as 1 per row'
              : ''}
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

      {/* KPI-specific options */}
      {chartConfig.chartType === 'kpi' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aggregation Type
          </label>
          <select
            value={chartConfig.aggregationType}
            onChange={(e) => setChartConfig(prev => ({ ...prev, aggregationType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="total">Total (Sum)</option>
            <option value="average">Average</option>
            <option value="count">Count</option>
            <option value="max">Maximum</option>
            <option value="min">Minimum</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose how to aggregate your data for the KPI card
          </p>
        </div>
      )}

      {/* Gauge-specific options */}
      {chartConfig.chartType === 'gauge' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Value (Optional)
          </label>
          <input
            type="number"
            placeholder="Enter target value"
            value={chartConfig.targetValue}
            onChange={(e) => setChartConfig(prev => ({ ...prev, targetValue: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Set a goal to measure progress. Leave blank for auto-calculated target (120% of current)
          </p>
        </div>
      )}

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
          disabled={!chartConfig.categoryColumn || (needsTwoColumns && !chartConfig.valueColumn)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {existingChart ? 'Update Chart' : 'Create Chart'}
        </button>
      </div>
    </form>
  );
};

export default DashboardBuilder;