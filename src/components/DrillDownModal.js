import React, { useState, useMemo } from 'react';

const DrillDownModal = ({ 
  isOpen, 
  onClose, 
  categoryName, 
  categoryValue, 
  rawData, 
  categoryColumn, 
  valueColumn,
  chartType 
}) => {
  const [sortColumn, setSortColumn] = useState(valueColumn || '');
  const [sortDirection, setSortDirection] = useState('desc');

  // Filter and process the raw data for the selected category
  const filteredData = useMemo(() => {
    if (!rawData || !rawData.rows || !categoryName) return [];
    
    return rawData.rows.filter(row => 
      String(row[categoryColumn]) === String(categoryName)
    );
  }, [rawData, categoryName, categoryColumn]);

  // Sort the filtered data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = parseFloat(a[sortColumn]) || 0;
      const bVal = parseFloat(b[sortColumn]) || 0;
      
      if (sortDirection === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredData.length) return null;
    
    const values = filteredData.map(row => parseFloat(row[valueColumn]) || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { total, average, min, max, count: values.length };
  }, [filteredData, valueColumn]);

  // Export functions
  const exportToCSV = () => {
    if (!sortedData.length) return;
    
    const headers = rawData.headers;
    const csvContent = [
      headers.join(','),
      ...sortedData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${categoryName}_drilldown.csv`;
    link.click();
  };

  const exportToExcel = () => {
    if (!sortedData.length) return;
    
    import('xlsx').then(XLSX => {
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const worksheetData = sortedData.map(row => {
        const excelRow = {};
        rawData.headers.forEach(header => {
          excelRow[header] = row[header];
        });
        return excelRow;
      });

      // Add summary row
      if (summaryStats) {
        const summaryRow = {};
        rawData.headers.forEach(header => {
          if (header === valueColumn) {
            summaryRow[header] = `TOTAL: ${summaryStats.total}`;
          } else if (header === categoryColumn) {
            summaryRow[header] = `SUMMARY (${summaryStats.count} items)`;
          } else {
            summaryRow[header] = '';
          }
        });
        worksheetData.push(summaryRow);
      }

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Auto-size columns
      const columnWidths = rawData.headers.map(header => ({
        wch: Math.max(
          header.length + 2,
          ...worksheetData.map(row => String(row[header] || '').length)
        )
      }));
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, `${categoryName} Details`);

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Download file
      const link = document.createElement('a');
      link.download = `${categoryName}_drilldown.xlsx`;
      link.href = URL.createObjectURL(data);
      link.click();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Drill Down: {categoryName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {chartType === 'pie' ? 'Pie Slice' : 'Bar'} Details - {filteredData.length} line items
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportToCSV}
              className="px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              📄 Export CSV
            </button>
            <button
              onClick={exportToExcel}
              className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              📊 Export Excel
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {summaryStats && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summaryStats.count}</div>
                <div className="text-sm text-gray-600">Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summaryStats.total.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summaryStats.average.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Average</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{summaryStats.min.toFixed(2)} - {summaryStats.max.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Range</div>
              </div>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortColumn}
              onChange={(e) => setSortColumn(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No sorting</option>
              {rawData.headers.map(header => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
            {sortColumn && (
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {sortDirection === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {rawData.headers.map((header, index) => (
                    <th
                      key={index}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        header === categoryColumn ? 'bg-blue-100' : 
                        header === valueColumn ? 'bg-green-100' : ''
                      }`}
                    >
                      {header}
                      {header === categoryColumn && <span className="ml-1">📊</span>}
                      {header === valueColumn && <span className="ml-1">💰</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {rawData.headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          header === valueColumn ? 'font-medium text-green-600' : 'text-gray-900'
                        }`}
                      >
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {sortedData.length} of {filteredData.length} items for "{categoryName}"
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrillDownModal;
