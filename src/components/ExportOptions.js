import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const ExportOptions = ({ chartExportData, pivotExportData, fileName }) => {
  const [showExportInfo, setShowExportInfo] = useState(false);
  
  // Check if we have data to export
  const hasChart = chartExportData && chartExportData.chartData && chartExportData.chartData.length > 0;
  const hasPivot = pivotExportData && pivotExportData.tableData && pivotExportData.tableData.length > 0;

  // Debug logging for visibility
  console.log('ExportOptions visibility check:', { 
    hasChart, 
    hasPivot, 
    chartExportData: !!chartExportData,
    pivotExportData: !!pivotExportData
  });

  // Export chart as PNG
  const exportChartAsPNG = async () => {
    if (!chartExportData) {
      alert('No chart available for export');
      return;
    }

    try {
      // Find the chart container in the DOM
      const chartContainer = document.querySelector('[data-chart-type]');
      console.log('Looking for chart container with data-chart-type attribute...');
      console.log('Found chart container:', chartContainer);
      console.log('Chart type:', chartContainer?.getAttribute('data-chart-type'));
      
      if (!chartContainer) {
        alert('Chart not found. Please make sure a chart is visible on the page.');
        return;
      }

      console.log('Exporting chart as PNG from container:', chartContainer);
      
      // Wait a moment for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await htmlToImage.toPng(chartContainer, { 
        background: '#ffffff', 
        pixelRatio: 2,
        width: chartContainer.offsetWidth,
        height: chartContainer.offsetHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `${fileName}_${chartExportData.chartType}_chart.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting chart as PNG:', error);
      alert('Failed to export chart as PNG: ' + error.message);
    }
  };

  // Export chart as JPEG
  const exportChartAsJPEG = async () => {
    if (!chartExportData) {
      alert('No chart available for export');
      return;
    }

    try {
      // Find the chart container in the DOM
      const chartContainer = document.querySelector('[data-chart-type]');
      console.log('Looking for chart container with data-chart-type attribute...');
      console.log('Found chart container:', chartContainer);
      console.log('Chart type:', chartContainer?.getAttribute('data-chart-type'));
      
      if (!chartContainer) {
        alert('Chart not found. Please make sure a chart is visible on the page.');
        return;
      }

      console.log('Exporting chart as JPEG from container:', chartContainer);
      
      // Wait a moment for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await htmlToImage.toJpeg(chartContainer, { 
        quality: 0.95, 
        background: '#ffffff', 
        pixelRatio: 2,
        width: chartContainer.offsetWidth,
        height: chartContainer.offsetHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `${fileName}_${chartExportData.chartType}_chart.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting chart as JPEG:', error);
      alert('Failed to export chart as JPEG: ' + error.message);
    }
  };

  // Export chart data to Excel
  const exportChartToExcel = () => {
    if (!chartExportData || !chartExportData.chartData || chartExportData.chartData.length === 0) {
      alert('No chart data available for export');
      return;
    }

    try {
      console.log('Exporting chart data:', chartExportData);
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Prepare chart data for Excel
      const worksheetData = chartExportData.chartData.map(item => ({
        Category: item.name,
        Value: item.value,
        Percentage: ((item.value / chartExportData.chartData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(2) + '%'
      }));

      // Add summary row
      const total = chartExportData.chartData.reduce((sum, item) => sum + item.value, 0);
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
      XLSX.utils.book_append_sheet(workbook, worksheet, `${chartExportData.chartType.charAt(0).toUpperCase() + chartExportData.chartType.slice(1)} Chart Data`);

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Download file
      saveAs(data, `${fileName}_${chartExportData.chartType}_chart_data.xlsx`);
    } catch (error) {
      console.error('Error exporting chart data to Excel:', error);
      alert('Failed to export chart data to Excel');
    }
  };

  // Export pivot table as PNG
  const exportPivotAsPNG = async () => {
    if (!pivotExportData || !pivotExportData.tableData || pivotExportData.tableData.length === 0) {
      alert('No pivot table available for export');
      return;
    }

    try {
      // Find the pivot table container in the DOM
      const pivotContainer = document.querySelector('[data-pivot-table="true"]');
      if (!pivotContainer) {
        alert('Pivot table not found. Please make sure a pivot table is visible on the page.');
        return;
      }

      console.log('Exporting pivot table as PNG from container:', pivotContainer);
      
      // Wait a moment for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await htmlToImage.toPng(pivotContainer, { 
        background: '#ffffff', 
        pixelRatio: 2,
        width: pivotContainer.offsetWidth,
        height: pivotContainer.offsetHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `${fileName}_pivot_table.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting pivot table as PNG:', error);
      alert('Failed to export pivot table as PNG: ' + error.message);
    }
  };

  // Export pivot table as JPEG
  const exportPivotAsJPEG = async () => {
    if (!pivotExportData || !pivotExportData.tableData || pivotExportData.tableData.length === 0) {
      alert('No pivot table available for export');
      return;
    }

    try {
      // Find the pivot table container in the DOM
      const pivotContainer = document.querySelector('[data-pivot-table="true"]');
      if (!pivotContainer) {
        alert('Pivot table not found. Please make sure a pivot table is visible on the page.');
        return;
      }

      console.log('Exporting pivot table as JPEG from container:', pivotContainer);
      
      // Wait a moment for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await htmlToImage.toJpeg(pivotContainer, { 
        quality: 0.95, 
        background: '#ffffff', 
        pixelRatio: 2,
        width: pivotContainer.offsetWidth,
        height: pivotContainer.offsetHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `${fileName}_pivot_table.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting pivot table as JPEG:', error);
      alert('Failed to export pivot table as JPEG: ' + error.message);
    }
  };

  // Export pivot table to Excel
  const exportPivotToExcel = () => {
    if (!pivotExportData || !pivotExportData.tableData || pivotExportData.tableData.length === 0) {
      alert('No pivot table data available for export');
      return;
    }

    try {
      console.log('Exporting pivot data:', pivotExportData);
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Convert pivot data to worksheet format
      const worksheetData = pivotExportData.tableData.map(row => {
        const excelRow = {};
        Object.keys(row).forEach(key => {
          if (key === 'row') {
            excelRow['Row'] = row[key];
          } else {
            excelRow[key] = row[key];
          }
        });
        return excelRow;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Auto-size columns
      const columnWidths = [];
      Object.keys(worksheetData[0] || {}).forEach(key => {
        const maxLength = Math.max(
          key.length,
          ...worksheetData.map(row => String(row[key] || '').length)
        );
        columnWidths.push({ wch: Math.min(maxLength + 2, 50) });
      });
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pivot Table');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Download file
      saveAs(data, `${fileName}_pivot_table.xlsx`);
    } catch (error) {
      console.error('Error exporting pivot table to Excel:', error);
      alert('Failed to export pivot table to Excel');
    }
  };

  // Always show export options if we have file data, even if no specific data yet
  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
      
      {/* Export Information - Collapsible */}
      <div className="mb-4 bg-gray-50 border border-gray-200 rounded-md">
        <button
          onClick={() => setShowExportInfo(!showExportInfo)}
          className="w-full p-3 text-left hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">📋 Export Information</span>
            <svg
              className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ${
                showExportInfo ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {showExportInfo && (
          <div className="px-3 pb-3 border-t border-gray-200">
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <p>
                <strong>Available exports:</strong> {!hasChart && !hasPivot ? 'None yet - create charts or pivot tables first' : 'Ready for export'}
              </p>
              <p><strong>Chart exports:</strong> PNG/JPEG for visual charts, Excel for raw data</p>
              <p><strong>Pivot exports:</strong> PNG/JPEG for table images, Excel for editable data</p>
              <p className="text-xs text-gray-500">
                Files will be saved with descriptive names including the original filename and export type.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3">
        {/* Chart Export Options */}
        {hasChart && (
          <div className="w-full">
            <h4 className="text-md font-medium text-gray-900 mb-3 border-b border-gray-200 pb-2">📊 Chart Exports</h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportChartAsPNG}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Export Chart (PNG)
              </button>
              
              <button
                onClick={exportChartAsJPEG}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Export Chart (JPEG)
              </button>

              {/* Export Chart Data to Excel */}
              <button
                onClick={exportChartToExcel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Chart Data (Excel)
              </button>
            </div>
          </div>
        )}

        {/* Pivot Table Export Options */}
        {hasPivot && (
          <div className="w-full">
            <h4 className="text-md font-medium text-gray-900 mb-3 border-b border-gray-200 pb-2">📋 Pivot Table Exports</h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportPivotAsPNG}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Export Pivot (PNG)
              </button>
              
              <button
                onClick={exportPivotAsJPEG}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Export Pivot (JPEG)
              </button>

              {/* Export Pivot Table to Excel */}
              <button
                onClick={exportPivotToExcel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Pivot Table (Excel)
              </button>
            </div>
          </div>
        )}

        {/* Show message when no export options are available yet */}
        {!hasChart && !hasPivot && (
          <div className="text-center py-4 text-gray-500">
            <p>Export options will appear after you create charts or pivot tables.</p>
            <p className="text-xs text-gray-400 mt-1">
              Create a chart by selecting columns in the Chart Visualization section above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportOptions;
