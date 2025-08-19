import React, { useState, useMemo, useEffect } from 'react';

const PivotTable = ({ data, onPivotExportData, onReset }) => {
  const [rowColumn, setRowColumn] = useState('');
  const [columnColumn, setColumnColumn] = useState('');
  const [valueColumn, setValueColumn] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  
  // Prefer full dataset if available
  const sourceRows = useMemo(() => {
    if (data && Array.isArray(data.rows) && data.rows.length > 0) return data.rows;
    return Array.isArray(data.preview) ? data.preview : [];
  }, [data]);

  // Debug logging
  console.log('PivotTable data:', { 
    hasRows: !!data.rows, 
    rowsCount: data.rows?.length || 0, 
    previewCount: data.preview?.length || 0,
    sourceRowsCount: sourceRows.length,
    headers: data.headers 
  });
  
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

  // Generate pivot data based on selected configuration
  const pivotData = useMemo(() => {
    if (!rowColumn || !columnColumn || !sourceRows || sourceRows.length === 0) {
      return { tableData: [] };
    }

    // Apply filter if specified
    let filteredData = sourceRows;
    if (filterColumn && filterValue) {
      filteredData = sourceRows.filter(row => getColumnValue(row, filterColumn) === filterValue);
    }

    if (filteredData.length === 0) {
      return { tableData: [] };
    }

    // Get unique values for rows and columns
    const uniqueRows = [...new Set(filteredData.map(row => getColumnValue(row, rowColumn)))].sort();
    const uniqueColumns = [...new Set(filteredData.map(row => getColumnValue(row, columnColumn)))].sort();

    // Initialize pivot matrix
    const pivotMatrix = {};
    uniqueRows.forEach(row => {
      pivotMatrix[row] = {};
      uniqueColumns.forEach(col => {
        pivotMatrix[row][col] = 0;
      });
    });

    // Populate pivot matrix
    filteredData.forEach(row => {
      const rowKey = getColumnValue(row, rowColumn);
      const colKey = getColumnValue(row, columnColumn);
      if (valueColumn && row[valueColumn] !== null && row[valueColumn] !== undefined && row[valueColumn] !== '') {
        const numericValue = parseFloat(row[valueColumn]);
        pivotMatrix[rowKey][colKey] += isNaN(numericValue) ? 1 : numericValue;
      } else {
        pivotMatrix[rowKey][colKey] += 1; // Default to counting
      }
    });

    // Convert to table format
    const tableData = uniqueRows.map(row => {
      const rowData = { row: row };
      uniqueColumns.forEach(col => {
        rowData[col] = pivotMatrix[row][col];
      });
      // Add row total
      rowData.total = uniqueColumns.reduce((sum, col) => sum + pivotMatrix[row][col], 0);
      return rowData;
    });

    // Add column totals row
    const columnTotals = { row: 'TOTAL' };
    uniqueColumns.forEach(col => {
      columnTotals[col] = uniqueRows.reduce((sum, row) => sum + pivotMatrix[row][col], 0);
    });
    columnTotals.total = uniqueRows.reduce((sum, row) => sum + uniqueColumns.reduce((colSum, col) => colSum + pivotMatrix[row][col], 0), 0);
    tableData.push(columnTotals);

    return { tableData };
  }, [rowColumn, columnColumn, valueColumn, filterColumn, filterValue, sourceRows]);

  // Notify parent component when pivot data is ready for export
  useEffect(() => {
    if (onPivotExportData && pivotData.tableData && pivotData.tableData.length > 0) {
      onPivotExportData({
        tableData: pivotData.tableData,
        rowColumn,
        columnColumn,
        valueColumn,
        filterColumn,
        filterValue
      });
    }
  }, [pivotData, onPivotExportData, rowColumn, columnColumn, valueColumn, filterColumn, filterValue]);

  if (!data || (!data.preview && !data.rows)) {
    return null;
  }

  const renderPivotTable = () => {
    if (!pivotData.tableData || pivotData.tableData.length === 0) return null;
    
    const columns = Object.keys(pivotData.tableData[0]).filter(key => key !== 'row');
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300" data-pivot-table="true">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                {rowColumn}
              </th>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pivotData.tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex === pivotData.tableData.length - 1 ? 'bg-blue-50 font-semibold' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                  {row.row}
                </td>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 text-right">
                    {typeof row[col] === 'number' ? row[col].toLocaleString() : row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pivot Table Analysis</h2>
      {/* Configuration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label htmlFor="rowColumn" className="block text-sm font-medium text-gray-700 mb-2">Rows:</label>
          <select id="rowColumn" value={rowColumn} onChange={(e) => setRowColumn(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="">Choose row column...</option>
            {data.headers.map((header, index) => (<option key={index} value={header}>{header || `Column ${index + 1}`}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="columnColumn" className="block text-sm font-medium text-gray-700 mb-2">Columns:</label>
          <select id="columnColumn" value={columnColumn} onChange={(e) => setColumnColumn(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="">Choose column...</option>
            {data.headers.map((header, index) => (<option key={index} value={header}>{header || `Column ${index + 1}`}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="valueColumn" className="block text-sm font-medium text-gray-700 mb-2">Values:</label>
          <select id="valueColumn" value={valueColumn} onChange={(e) => setValueColumn(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="">Count (default)</option>
            {data.headers.map((header, index) => (<option key={index} value={header}>{header || `Column ${index + 1}`}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="filterColumn" className="block text-sm font-medium text-gray-700 mb-2">Filter (Optional):</label>
          <select id="filterColumn" value={filterColumn} onChange={(e) => { setFilterColumn(e.target.value); setFilterValue(''); }} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="">No filter</option>
            {data.headers.map((header, index) => (<option key={index} value={header}>{header || `Column ${index + 1}`}</option>))}
          </select>
        </div>
      </div>

      {filterColumn && (
        <div className="mb-6">
          <label htmlFor="filterValue" className="block text-sm font-medium text-gray-700 mb-2">Filter Value:</label>
          <select id="filterValue" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            <option value="">Choose filter value...</option>
            {filterValues.map((value, index) => (<option key={index} value={value}>{value}</option>))}
          </select>
        </div>
      )}

      {/* Reset All Button */}
      {(rowColumn || columnColumn || valueColumn || filterColumn || filterValue) && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => {
              setRowColumn('');
              setColumnColumn('');
              setValueColumn('');
              setFilterColumn('');
              setFilterValue('');
              onReset(); // Call the onReset callback
            }}
            className="px-6 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            title="Reset all pivot table configuration (rows, columns, values, and filters)"
          >
            🔄 Reset All
          </button>
        </div>
      )}

      {rowColumn && columnColumn && (
        <div className="space-y-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Pivot Summary</h3>
            <p className="text-sm text-blue-700">Rows: {rowColumn} | Columns: {columnColumn} | Values: {valueColumn || 'Count'}{filterColumn && filterValue && ` | Filter: ${filterColumn} = ${filterValue}`}</p>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">Pivot Table</h4>
            {renderPivotTable()}
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ Pivot table data is ready for export in the Export Options section below
            </p>
          </div>
        </div>
      )}

      {(!rowColumn || !columnColumn) && (
        <div className="text-center py-8 text-gray-500">
          <div className="space-y-2">
            <p>Select row and column columns above to generate a pivot table.</p>
            <p className="text-xs text-gray-400">💡 Tip: Choose categorical columns for rows/columns and numeric columns for values to get meaningful insights</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PivotTable;
