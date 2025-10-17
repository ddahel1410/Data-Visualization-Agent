import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';

import { useTheme } from '../contexts/ThemeContext';

const VirtualDataView = ({ data, pageSize = 100, height = 400 }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [columnFilters, setColumnFilters] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [throttledSearchTerm, setThrottledSearchTerm] = useState('');
  const { isDark } = useTheme();
  
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  // Throttle search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setThrottledSearchTerm(searchTerm);
    }, 300); // 300ms delay to prevent excessive filtering
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Virtual scrolling constants
  // const itemHeight = 40; // Height of each row - Available for future use
  // const visibleItems = Math.ceil(height / itemHeight); // Available for future virtual scrolling
  // const bufferSize = 5; // Extra items to render above/below visible area

  // Process data efficiently with the hybrid streaming approach
  const processedData = useMemo(() => {
    if (!data.rows || !data.headers) return { rows: [], totalRows: 0 };
    
    // For very large datasets that might need additional loading
    if (data.totalRows > 100000 && data.hasMoreData) {
      return {
        rows: data.rows,
        totalRows: data.totalRows,
        isLargeDataset: true,
        needsMoreData: data.rows.length < data.totalRows
      };
    }
    
    // For smaller datasets or fully loaded data, process normally
    let filteredRows = data.rows;

    // Apply search filter
    if (throttledSearchTerm) {
      const searchLower = throttledSearchTerm.toLowerCase();
      filteredRows = filteredRows.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue) {
        filteredRows = filteredRows.filter(row => 
          String(row[column]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortColumn) {
      filteredRows = [...filteredRows].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return {
      rows: filteredRows,
      totalRows: filteredRows.length,
      isLargeDataset: false
    };
  }, [data.rows, data.headers, data.totalRows, data.hasMoreData, throttledSearchTerm, columnFilters, sortColumn, sortDirection]);

  // Pagination with virtual scrolling
  const totalPages = Math.ceil(processedData.totalRows / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, processedData.totalRows);
  
  // Get the current page data
  const currentPageData = useMemo(() => {
    return processedData.rows.slice(startIndex, endIndex);
  }, [processedData.rows, startIndex, endIndex]);

  // Handle sorting
  const handleSort = useCallback((column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(0); // Reset to first page when sorting
  }, [sortColumn, sortDirection]);

  // Handle row selection
  const handleRowSelect = useCallback((rowIndex) => {
    const globalIndex = startIndex + rowIndex;
    const newSelected = new Set(selectedRows);
    
    if (newSelected.has(globalIndex)) {
      newSelected.delete(globalIndex);
    } else {
      newSelected.add(globalIndex);
    }
    
    setSelectedRows(newSelected);
  }, [selectedRows, startIndex]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === currentPageData.length) {
      setSelectedRows(new Set());
    } else {
      const newSelected = new Set();
      currentPageData.forEach((_, index) => {
        newSelected.add(startIndex + index);
      });
      setSelectedRows(newSelected);
    }
  }, [selectedRows, currentPageData, startIndex]);

  // Export selected data
  const exportSelectedData = useCallback(() => {
    if (selectedRows.size === 0) return;
    
    // For large datasets, we need to get the actual data from the loaded dataset
    const selectedData = Array.from(selectedRows).map(index => data.rows[index]);
    const csvContent = [
      data.headers.join(','),
      ...selectedData.map(row => 
        data.headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedRows, data]);

  // Column filter component
  const ColumnFilter = ({ column }) => (
    <input
      type="text"
      placeholder={`Filter ${column}...`}
      value={columnFilters[column] || ''}
      onChange={(e) => setColumnFilters(prev => ({
        ...prev,
        [column]: e.target.value
      }))}
      className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${
        isDark
          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
      }`}
    />
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setColumnFilters({});
    setSortColumn(null);
    setSortDirection('asc');
    setCurrentPage(0);
  }, []);

  // Performance optimization: memoize row rendering
  const renderRow = useCallback((row, rowIndex) => {
    const globalIndex = startIndex + rowIndex;
    const isSelected = selectedRows.has(globalIndex);
    
    return (
      <tr
        key={globalIndex}
        className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} cursor-pointer`}
        onClick={() => handleRowSelect(rowIndex)}
      >
        <td className="px-3 py-2 border-b border-gray-200">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleRowSelect(rowIndex)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </td>
        {data.headers.map((header, colIndex) => (
          <td key={colIndex} className="px-3 py-2 border-b border-gray-200 text-sm">
            <div className="truncate max-w-xs" title={String(row[header] || '')}>
              {String(row[header] || '')}
            </div>
          </td>
        ))}
      </tr>
    );
  }, [data.headers, startIndex, selectedRows, handleRowSelect]);

  // Data view content component - defined first so it can be used
  const DataViewContent = () => (
    <>
      {/* Header with controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <h3 className={`text-lg font-medium ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Data View ({processedData.totalRows.toLocaleString()} rows)
          </h3>
          {selectedRows.size > 0 && (
            <span className={`text-sm px-2 py-1 rounded ${
              isDark 
                ? 'text-blue-300 bg-blue-900/30' 
                : 'text-blue-600 bg-blue-50'
            }`}>
              {selectedRows.size} selected
            </span>
          )}
          {isProcessing && (
            <span className={`text-sm px-2 py-1 rounded ${
              isDark 
                ? 'text-orange-300 bg-orange-900/30' 
                : 'text-orange-600 bg-orange-50'
            }`}>
              Processing...
            </span>
          )}
          {data.hasMoreData && (
            <span className={`text-sm px-2 py-1 rounded ${
              isDark 
                ? 'text-green-300 bg-green-900/30' 
                : 'text-green-600 bg-green-50'
            }`}>
              {data.currentLoadedRows?.toLocaleString() || data.rows.length.toLocaleString()} loaded
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
              isDark
                ? 'text-gray-300 border border-gray-600 hover:bg-gray-700'
                : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Reset Filters
          </button>
          {selectedRows.size > 0 && (
            <button
              onClick={exportSelectedData}
              className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Export Selected
            </button>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search across all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <div className={`text-sm flex items-center ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Showing {startIndex + 1}-{endIndex} of {processedData.totalRows.toLocaleString()} rows
          </div>
        </div>
      </div>

      {/* Virtual scrolling container */}
      <div 
        ref={containerRef}
        className={`border rounded-lg overflow-hidden transition-colors duration-200 ${
          isDark ? 'border-gray-600' : 'border-gray-200'
        }`}
        style={{ height: `${height}px` }}
      >
        <div className="overflow-auto h-full" ref={scrollRef}>
          <table className="w-full">
            <thead className={`sticky top-0 ${
              isDark ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-3 py-2 border-b text-left text-xs font-medium uppercase tracking-wider ${
                  isDark 
                    ? 'border-gray-600 text-gray-300' 
                    : 'border-gray-200 text-gray-500'
                }`}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === currentPageData.length && currentPageData.length > 0}
                    onChange={handleSelectAll}
                    className={`rounded text-blue-600 focus:ring-blue-500 transition-colors duration-200 ${
                      isDark ? 'border-gray-500 bg-gray-600' : 'border-gray-300 bg-white'
                    }`}
                  />
                </th>
                {data.headers?.map((header, index) => (
                  <th key={index} className={`px-3 py-2 border-b text-left text-xs font-medium uppercase tracking-wider ${
                    isDark 
                      ? 'border-gray-600 text-gray-300' 
                      : 'border-gray-200 text-gray-500'
                  }`}>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleSort(header)}
                        className={`flex items-center gap-1 focus:outline-none transition-colors duration-200 ${
                          isDark 
                            ? 'hover:text-gray-100' 
                            : 'hover:text-gray-700'
                        }`}
                      >
                        {header}
                        {sortColumn === header && (
                          <span className="text-blue-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                      <ColumnFilter column={header} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPageData.map((row, index) => renderRow(row, index))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className={`text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              className={`px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                isDark
                  ? 'border-gray-600 hover:bg-gray-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              className={`px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                isDark
                  ? 'border-gray-600 hover:bg-gray-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className={`px-3 py-1 text-sm border rounded disabled:opacity-200 disabled:cursor-not-allowed transition-colors duration-200 ${
                isDark
                  ? 'border-gray-600 hover:bg-gray-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
              className={`px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                isDark
                  ? 'border-gray-600 hover:bg-gray-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Performance info */}
      <div className={`mt-4 text-xs text-center ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <p>⚡ Preview streaming for massive datasets</p>
        <p>💾 {data.rows.length.toLocaleString()} rows loaded in memory</p>
        <p>🔍 Advanced filtering and sorting capabilities</p>
        <p>🚀 Optimized for files up to 500MB</p>
        {data.hasMoreData && (
          <p>📈 Additional data available for loading on demand</p>
        )}
      </div>
    </>
  );

  // For large datasets, we'll show a simplified message and proceed to data view
  if (processedData.isLargeDataset && processedData.needsMoreData) {
    // Just show a small info banner instead of blocking the entire view
    return (
      <div className={`rounded-lg shadow-sm border p-6 transition-colors duration-200 ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Info banner for large datasets */}
        <div className={`mb-4 p-3 rounded-lg ${
          isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-blue-500">ℹ️</span>
            <span className={`text-sm ${
              isDark ? 'text-blue-200' : 'text-blue-700'
            }`}>
              Large dataset detected: {processedData.totalRows.toLocaleString()} rows. 
              Showing preview data for analysis. Additional data can be loaded as needed.
            </span>
          </div>
        </div>
        
        {/* Continue with normal data view */}
        <DataViewContent />
      </div>
    );
  }



  // Show data view
  return (
    <div className={`rounded-lg shadow-sm border p-6 transition-colors duration-200 ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <DataViewContent />
    </div>
  );
};

export default VirtualDataView;

