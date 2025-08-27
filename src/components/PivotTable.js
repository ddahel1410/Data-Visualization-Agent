import React, { useState, useMemo, useEffect } from 'react';

const PivotTable = ({ data, onReset, config, onConfigChange }) => {
  // Use external configuration if provided, otherwise use local state
  const [rowColumns, setRowColumns] = useState(config?.rowColumns || ['']); // Array of row dimensions
  const [columnColumn, setColumnColumn] = useState(config?.columnColumn || '');
  const [valueColumn, setValueColumn] = useState(config?.valueColumn || '');
  const [filterColumn, setFilterColumn] = useState(config?.filterColumn || '');
  const [filterValue, setFilterValue] = useState(config?.filterValue || '');
  
  // Enhanced pivot table features
  const [calculationType, setCalculationType] = useState('sum'); // sum, average, count, percentage
  const [showSubtotals, setShowSubtotals] = useState(true);
  const [showGrandTotal, setShowGrandTotal] = useState(true);
  const [conditionalFormatting, setConditionalFormatting] = useState(true);
  const [drillDownLevel, setDrillDownLevel] = useState(0); // For drill-down capabilities
  const [expandedSections, setExpandedSections] = useState(new Set()); // Track expanded/collapsed sections
  const [showDebugColumns, setShowDebugColumns] = useState(false); // Show internal metadata columns
  const [drillDownData, setDrillDownData] = useState(null); // Store drill-down data
  const [drillDownPosition, setDrillDownPosition] = useState({ x: 0, y: 0 }); // Position for drill-down modal
  
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

  // Helper function to get hierarchical row key
  const getRowKey = (row) => {
    return rowColumns.filter(col => col).map(col => getColumnValue(row, col)).join('|');
  };

  // Helper function to add/remove row dimensions
  const addRowDimension = () => {
    setRowColumns([...rowColumns, '']);
  };

  const removeRowDimension = (index) => {
    if (rowColumns.length > 1) {
      const newRowColumns = rowColumns.filter((_, i) => i !== index);
      setRowColumns(newRowColumns);
    }
  };

  const updateRowDimension = (index, value) => {
    const newRowColumns = [...rowColumns];
    newRowColumns[index] = value;
    setRowColumns(newRowColumns);
  };

  // Helper functions for expand/collapse functionality
  const toggleSection = (sectionKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const isSectionExpanded = (sectionKey) => {
    return expandedSections.has(sectionKey);
  };

  // Drill-down function to show underlying records
  const handleCellDrillDown = (row, column, event) => {
    if (!row.isDataRow && !row.isSubtotal) return; // Only allow drill-down on data rows and subtotals
    
    // Get the cell value and position
    const cellValue = row[column];
    const rect = event.target.getBoundingClientRect();
    
    // Find the underlying records that contribute to this cell
    let underlyingRecords = [];
    
    if (row.isDataRow) {
      // For data rows, find records that match this specific row/column combination
      underlyingRecords = sourceRows.filter(record => {
        const recordRowKey = getRowKey(record);
        const recordColValue = getColumnValue(record, columnColumn);
        return recordRowKey === row.sectionKey && recordColValue === column;
      });
    } else if (row.isSubtotal) {
      // For subtotals, find all records that contribute to this subtotal
      underlyingRecords = sourceRows.filter(record => {
        const recordRowKey = getRowKey(record);
        return recordRowKey.startsWith(row.sectionKey);
      });
    }
    
    // Apply filters if they exist
    if (filterColumn && filterValue) {
      underlyingRecords = underlyingRecords.filter(record => 
        getColumnValue(record, filterColumn) === filterValue
      );
    }
    
    setDrillDownData({
      rowLabel: row.row,
      columnLabel: column,
      value: cellValue,
      records: underlyingRecords,
      isSubtotal: row.isSubtotal
    });
    
    // Center the modal on the screen instead of positioning it relative to the cell
    setDrillDownPosition({
      centered: true
    });
  };

  const closeDrillDown = () => {
    setDrillDownData(null);
  };

  // Generate pivot data based on selected configuration
  const pivotData = useMemo(() => {
    if (!rowColumns.some(col => col) || !columnColumn || !sourceRows || sourceRows.length === 0) {
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

    // Get unique hierarchical row keys and columns
    const uniqueRowKeys = [...new Set(filteredData.map(row => getRowKey(row)))].sort();
    const uniqueColumns = [...new Set(filteredData.map(row => getColumnValue(row, columnColumn)))].sort();

    // Initialize pivot matrix
    const pivotMatrix = {};
    uniqueRowKeys.forEach(rowKey => {
      pivotMatrix[rowKey] = {};
      uniqueColumns.forEach(col => {
        pivotMatrix[rowKey][col] = 0;
      });
    });

    // Populate pivot matrix
    filteredData.forEach(row => {
      const rowKey = getRowKey(row);
      const colKey = getColumnValue(row, columnColumn);
      
      if (valueColumn && row[valueColumn] !== null && row[valueColumn] !== undefined && row[valueColumn] !== '') {
        const numericValue = parseFloat(row[valueColumn]);
        if (!isNaN(numericValue)) {
          if (calculationType === 'count') {
            pivotMatrix[rowKey][colKey] += 1;
          } else {
            pivotMatrix[rowKey][colKey] += numericValue;
          }
        } else {
          pivotMatrix[rowKey][colKey] += 1; // Count non-numeric values
        }
      } else {
        pivotMatrix[rowKey][colKey] += 1; // Default to counting
      }
    });

    // Convert to table format with enhanced calculations
    const tableData = [];
    
    // Group rows by their hierarchical levels
    const groupedRows = {};
    uniqueRowKeys.forEach(rowKey => {
      const rowParts = rowKey.split('|');
      let currentGroup = groupedRows;
      
      // Build hierarchical structure
      for (let i = 0; i < rowParts.length; i++) {
        const part = rowParts[i];
        if (!currentGroup[part]) {
          currentGroup[part] = { children: {}, data: null };
        }
        if (i === rowParts.length - 1) {
          // This is a leaf node (actual data row)
          currentGroup[part].data = rowKey;
        }
        currentGroup = currentGroup[part].children;
      }
    });

    // Function to flatten hierarchical structure with subtotals
    const flattenWithSubtotals = (group, level = 0, path = []) => {
      const result = [];
      
      Object.keys(group).forEach(key => {
        const currentPath = [...path, key];
        const node = group[key];
        
        if (node.data) {
          // This is a data row
          const rowData = { 
            row: key,
            level: level,
            path: currentPath,
            isDataRow: true,
            parentKey: path.join('|'),
            sectionKey: currentPath.join('|')
          };
          
          uniqueColumns.forEach(col => {
            let value = pivotMatrix[node.data][col];
            
            // Apply calculation type transformations
            if (calculationType === 'average' && valueColumn) {
              const count = filteredData.filter(r => getRowKey(r) === node.data && getColumnValue(r, columnColumn) === col).length;
              value = count > 0 ? value / count : 0;
            } else if (calculationType === 'percentage' && valueColumn) {
              const grandTotal = uniqueRowKeys.reduce((sum, r) => 
                sum + uniqueColumns.reduce((colSum, c) => colSum + pivotMatrix[r][c], 0), 0
              );
              value = grandTotal > 0 ? (value / grandTotal) * 100 : 0;
            }
            
            rowData[col] = value;
          });
          
          // Add row total
          rowData.total = uniqueColumns.reduce((sum, col) => sum + pivotMatrix[node.data][col], 0);
          
          // Apply calculation type to row total
          if (calculationType === 'average' && valueColumn) {
            const rowCount = uniqueColumns.reduce((sum, col) => {
              const count = filteredData.filter(r => getRowKey(r) === node.data && getColumnValue(r, columnColumn) === col).length;
              return sum + count;
            }, 0);
            rowData.total = rowCount > 0 ? rowData.total / rowCount : 0;
          } else if (calculationType === 'percentage' && valueColumn) {
            const grandTotal = uniqueRowKeys.reduce((sum, r) => 
              sum + uniqueColumns.reduce((colSum, c) => colSum + pivotMatrix[r][c], 0), 0
            );
            rowData.total = grandTotal > 0 ? (rowData.total / grandTotal) * 100 : 0;
          }
          
          result.push(rowData);
        }
        
        // Add subtotal if this group has children and subtotals are enabled
        if (Object.keys(node.children).length > 0 && showSubtotals) {
          const subtotalRow = { 
            row: `${key} - Subtotal`,
            level: level,
            path: currentPath,
            isSubtotal: true,
            sectionKey: currentPath.join('|'),
            hasChildren: true,
            childCount: Object.keys(node.children).length
          };
          
          // Calculate subtotal for this group
          const childRows = Object.values(node.children).filter(child => child.data);
    uniqueColumns.forEach(col => {
            let subtotal = childRows.reduce((sum, child) => sum + pivotMatrix[child.data][col], 0);
            
            if (calculationType === 'average' && valueColumn) {
              const totalCount = childRows.reduce((sum, child) => {
                const count = filteredData.filter(r => getRowKey(r) === child.data && getColumnValue(r, columnColumn) === col).length;
                return sum + count;
              }, 0);
              subtotal = totalCount > 0 ? subtotal / totalCount : 0;
            } else if (calculationType === 'percentage' && valueColumn) {
              const grandTotal = uniqueRowKeys.reduce((sum, r) => 
                sum + uniqueColumns.reduce((colSum, c) => colSum + pivotMatrix[r][c], 0), 0
              );
              subtotal = grandTotal > 0 ? (subtotal / grandTotal) * 100 : 0;
            }
            
            subtotalRow[col] = subtotal;
          });
          
          // Add subtotal row total
          subtotalRow.total = childRows.reduce((sum, child) => {
            let rowTotal = uniqueColumns.reduce((colSum, col) => colSum + pivotMatrix[child.data][col], 0);
            if (calculationType === 'average' && valueColumn) {
              const rowCount = uniqueColumns.reduce((sum, col) => {
                const count = filteredData.filter(r => getRowKey(r) === child.data && getColumnValue(r, columnColumn) === col).length;
                return sum + count;
              }, 0);
              rowTotal = rowCount > 0 ? rowTotal / rowCount : 0;
            } else if (calculationType === 'percentage' && valueColumn) {
              const grandTotal = uniqueRowKeys.reduce((sum, r) => 
                sum + uniqueColumns.reduce((colSum, c) => colSum + pivotMatrix[r][c], 0), 0
              );
              rowTotal = grandTotal > 0 ? (rowTotal / grandTotal) * 100 : 0;
            }
            return sum + rowTotal;
          }, 0);
          
          result.push(subtotalRow);
        }
        
        // Recursively process children
        if (Object.keys(node.children).length > 0) {
          result.push(...flattenWithSubtotals(node.children, level + 1, currentPath));
        }
      });
      
      return result;
    };
    
    // Generate the flattened table with subtotals
    tableData.push(...flattenWithSubtotals(groupedRows));

    // Add grand total row if enabled
    if (showGrandTotal) {
      const grandTotalRow = { row: 'GRAND TOTAL' };
      uniqueColumns.forEach(col => {
        let grandTotal = uniqueRowKeys.reduce((sum, rowKey) => sum + pivotMatrix[rowKey][col], 0);
        
        if (calculationType === 'average' && valueColumn) {
          const totalCount = uniqueRowKeys.reduce((sum, rowKey) => {
            const count = filteredData.filter(r => getRowKey(r) === rowKey && getColumnValue(r, columnColumn) === col).length;
            return sum + count;
          }, 0);
          grandTotal = totalCount > 0 ? grandTotal / totalCount : 0;
        } else if (calculationType === 'percentage' && valueColumn) {
          grandTotal = 100; // Grand total percentage is always 100%
        }
        
        grandTotalRow[col] = grandTotal;
      });
      
      // Add grand total
      grandTotalRow.total = uniqueRowKeys.reduce((sum, rowKey) => {
        let rowTotal = uniqueColumns.reduce((colSum, col) => colSum + pivotMatrix[rowKey][col], 0);
        if (calculationType === 'average' && valueColumn) {
          const rowCount = uniqueColumns.reduce((sum, col) => {
            const count = filteredData.filter(r => getRowKey(r) === rowKey && getColumnValue(r, columnColumn) === col).length;
            return sum + count;
          }, 0);
          rowTotal = rowCount > 0 ? rowTotal / rowCount : 0;
        } else if (calculationType === 'percentage' && valueColumn) {
          const grandTotal = uniqueRowKeys.reduce((sum, r) => 
            sum + uniqueColumns.reduce((colSum, c) => colSum + pivotMatrix[r][c], 0), 0
          );
          rowTotal = grandTotal > 0 ? (rowTotal / grandTotal) * 100 : 0;
        }
        return sum + rowTotal;
      }, 0);
      
      if (calculationType === 'percentage' && valueColumn) {
        grandTotalRow.total = 100; // Grand total percentage is always 100%
      }
      
      tableData.push(grandTotalRow);
    }

    return { tableData };
  }, [rowColumns, columnColumn, valueColumn, filterColumn, filterValue, sourceRows, calculationType, showSubtotals, showGrandTotal]);

  // Notify parent component when pivot data is ready for export
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        rowColumns,
        columnColumn,
        valueColumn,
        filterColumn,
        filterValue,
        calculationType,
        showSubtotals,
        showGrandTotal,
        conditionalFormatting,
        expandedSections: Array.from(expandedSections)
      });
    }
  }, [rowColumns, columnColumn, valueColumn, filterColumn, filterValue, calculationType, showSubtotals, showGrandTotal, conditionalFormatting, expandedSections, onConfigChange]);

  // Sync local state with external configuration
  useEffect(() => {
    if (config) {
      setRowColumns(config.rowColumns || ['']);
      setColumnColumn(config.columnColumn || '');
      setValueColumn(config.valueColumn || '');
      setFilterColumn(config.filterColumn || '');
      setFilterValue(config.filterValue || '');
    }
  }, [config]);

  if (!data || (!data.preview && !data.rows)) {
    return null;
  }

  const renderPivotTable = () => {
    if (!pivotData.tableData || pivotData.tableData.length === 0) return null;
    
    // Filter out internal metadata columns (unless debug mode is on)
    const metadataColumns = ['level', 'path', 'isDataRow', 'isSubtotal', 'sectionKey', 'hasChildren', 'childCount', 'parentKey'];
    const columns = Object.keys(pivotData.tableData[0]).filter(key => {
      if (key === 'row') return false;
      if (showDebugColumns) return true;
      return !metadataColumns.includes(key);
    });
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300" data-pivot-table="true">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                {rowColumns.length > 0 ? rowColumns.join(' → ') : 'Row'}
              </th>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pivotData.tableData.map((row, rowIndex) => {
              const isSubtotal = row.row.toString().startsWith('Subtotal');
              const isGrandTotal = row.row.toString().startsWith('GRAND TOTAL');
              const isTotal = isSubtotal || isGrandTotal;
              
              // Check if this row should be visible (expand/collapse logic)
              const shouldShowRow = () => {
                if (row.isDataRow && row.parentKey) {
                  // Data rows are only visible if their parent section is expanded
                  return isSectionExpanded(row.parentKey);
                }
                return true; // Always show subtotals and grand totals
              };
              
              if (!shouldShowRow()) return null;
              
              // Conditional formatting based on values
              const getCellStyle = (value, col) => {
                // Always apply professional styling for totals (not affected by conditional formatting toggle)
                if (isGrandTotal) return 'bg-blue-100 font-bold';
                if (isSubtotal) return 'bg-blue-50 font-semibold';
                
                // Color coding for high/low values (only for data rows and only when conditional formatting is enabled)
                if (conditionalFormatting && typeof value === 'number' && row.isDataRow) {
                  const allValues = pivotData.tableData.filter(r => r.isDataRow).map(r => r[col]).filter(v => typeof v === 'number');
                  if (allValues.length > 0) {
                    const max = Math.max(...allValues);
                    const min = Math.min(...allValues);
                    const range = max - min;
                    
                    if (range > 0) {
                      const normalized = (value - min) / range;
                      if (normalized > 0.8) return 'bg-green-100';
                      if (normalized < 0.2) return 'bg-red-100';
                    }
                  }
                }
                return '';
              };
              
              return (
                <tr key={rowIndex} className={isTotal ? 'border-t-2 border-gray-400' : ''}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300 ${isTotal ? 'font-bold' : ''}`}>
                    <div className="flex items-center">
                      {row.level > 0 && (
                        <span className="text-gray-400 mr-2">
                          {'—'.repeat(row.level)}
                        </span>
                      )}
                      
                      {/* Expand/Collapse button for subtotals */}
                      {row.isSubtotal && row.hasChildren && (
                        <button
                          onClick={() => toggleSection(row.sectionKey)}
                          className="mr-2 text-blue-600 hover:text-blue-800 transition-colors"
                          title={isSectionExpanded(row.sectionKey) ? 'Collapse section' : 'Expand section'}
                        >
                          {isSectionExpanded(row.sectionKey) ? '▼' : '▶'}
                        </button>
                      )}
                      
                  {row.row}
                    </div>
                  </td>
                  {columns.map((col, colIndex) => {
                    const value = row[col];
                    const cellStyle = getCellStyle(value, col);
                    const canDrillDown = row.isDataRow || row.isSubtotal;
                    
                    return (
                      <td 
                        key={colIndex} 
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 text-right ${cellStyle} ${canDrillDown ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        onDoubleClick={canDrillDown ? (e) => handleCellDrillDown(row, col, e) : undefined}
                        title={canDrillDown ? 'Double-click to drill down' : undefined}
                      >
                        {typeof value === 'number' ? 
                          (calculationType === 'percentage' ? 
                            value.toFixed(1) + '%' : 
                            calculationType === 'average' ? 
                              value.toFixed(2) : 
                              value.toLocaleString()
                          ) : 
                          value
                        }
                      </td>
                    );
                  })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pivot Table Analysis</h2>
          <p className="text-gray-600">Create interactive pivot tables to analyze your data relationships</p>
        </div>
        
        {/* Export Buttons */}
        {pivotData && pivotData.tableData && pivotData.tableData.length > 0 && (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Find the pivot table container in the DOM
                const pivotContainer = document.querySelector('[data-pivot-table="true"]');
                if (pivotContainer) {
                  // Trigger PNG export
                  const link = document.createElement('a');
                  link.download = `pivot_table.png`;
                  
                  // Use html-to-image to export
                  import('html-to-image').then(htmlToImage => {
                    htmlToImage.toPng(pivotContainer, { 
                      background: '#ffffff', 
                      pixelRatio: 2 
                    }).then(dataUrl => {
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
                // Find the pivot table container in the DOM
                const pivotContainer = document.querySelector('[data-pivot-table="true"]');
                if (pivotContainer) {
                  // Trigger JPEG export
                  const link = document.createElement('a');
                  link.download = `pivot_table.jpg`;
                  
                  // Use html-to-image to export
                  import('html-to-image').then(htmlToImage => {
                    htmlToImage.toJpeg(pivotContainer, { 
                      quality: 0.95, 
                      background: '#ffffff', 
                      pixelRatio: 2 
                    }).then(dataUrl => {
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
                // Export pivot data to Excel
                import('xlsx').then(XLSX => {
                  const workbook = XLSX.utils.book_new();
                  
                  // Prepare pivot data for Excel
                  const worksheetData = pivotData.tableData.map(row => {
                    const excelRow = { Row: row.row };
                    Object.keys(row).forEach(key => {
                      if (key !== 'row') {
                        excelRow[key] = row[key];
                      }
                    });
                    return excelRow;
                  });

                  // Create worksheet
                  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

                  // Auto-size columns
                  const columnWidths = Object.keys(worksheetData[0] || {}).map(key => ({
                    wch: Math.max(key.length, ...worksheetData.map(row => String(row[key] || '').length)) + 2
                  }));
                  worksheet['!cols'] = columnWidths;

                  // Add worksheet to workbook
                  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pivot Table Data');

                  // Generate Excel file
                  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                  
                  // Download file
                  const link = document.createElement('a');
                  link.download = `pivot_table_data.xlsx`;
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
      {/* Configuration Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Row Dimensions:</label>
          <div className="space-y-2">
            {rowColumns.map((rowColumn, index) => (
              <div key={index} className="flex items-center space-x-2">
                <select 
                  value={rowColumn} 
                  onChange={(e) => updateRowDimension(index, e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Dimension {index + 1}...</option>
                  {data.headers.map((header, headerIndex) => (
                    <option key={headerIndex} value={header}>{header || `Column ${headerIndex + 1}`}</option>
                  ))}
          </select>
                {rowColumns.length > 1 && (
                  <button
                    onClick={() => removeRowDimension(index)}
                    className="px-2 py-1 text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addRowDimension}
              className="px-2 py-1 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 text-xs"
            >
              + Add Row Dimension
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Add multiple dimensions for hierarchical groupings
          </p>
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

      {/* Enhanced Pivot Table Options */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-3">🎯 Enhanced Pivot Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="calculationType" className="block text-xs font-medium text-blue-700 mb-1">Calculation Type:</label>
            <select 
              id="calculationType" 
              value={calculationType} 
              onChange={(e) => setCalculationType(e.target.value)}
              className="block w-full px-2 py-1 text-xs border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="sum">Sum</option>
              <option value="average">Average</option>
              <option value="count">Count</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              id="showSubtotals"
              type="checkbox"
              checked={showSubtotals}
              onChange={(e) => setShowSubtotals(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showSubtotals" className="ml-2 text-xs text-blue-700">Show Subtotals</label>
          </div>
          
          <div className="flex items-center">
            <input
              id="showGrandTotal"
              type="checkbox"
              checked={showGrandTotal}
              onChange={(e) => setShowGrandTotal(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showGrandTotal" className="ml-2 text-xs text-blue-700">Show Grand Total</label>
          </div>
          
          <div className="flex items-center">
            <input
              id="conditionalFormatting"
              type="checkbox"
              checked={conditionalFormatting}
              onChange={(e) => setConditionalFormatting(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="conditionalFormatting" className="ml-2 text-xs text-blue-700">Value Color Coding</label>
          </div>
        </div>
        
        {/* Advanced/Debug Options */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-700">Advanced Options:</span>
            <div className="flex items-center">
              <input
                id="showDebugColumns"
                type="checkbox"
                checked={showDebugColumns}
                onChange={(e) => setShowDebugColumns(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showDebugColumns" className="ml-2 text-xs text-blue-700">Show Debug Columns</label>
            </div>
          </div>
        </div>
        
        {/* Expand/Collapse Controls */}
        {showSubtotals && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-700">Section Controls:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const allSections = new Set();
                    pivotData.tableData.forEach(row => {
                      if (row.sectionKey) allSections.add(row.sectionKey);
                    });
                    setExpandedSections(allSections);
                  }}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Expand All
                </button>
                <button
                  onClick={() => setExpandedSections(new Set())}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset All Button */}
      {(rowColumns.some(col => col) || columnColumn || valueColumn || filterColumn || filterValue) && (
        <div className="mb-6">
          <button
            onClick={() => {
              setRowColumns(['']);
              setColumnColumn('');
              setValueColumn('');
              setFilterColumn('');
              setFilterValue('');
              if (onReset) onReset();
            }}
            className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Reset All
          </button>
        </div>
      )}

      {/* Pivot Table Display */}
      {rowColumns.some(col => col) && columnColumn && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <p className="text-sm text-blue-700">Rows: {rowColumns.filter(col => col).join(' → ')} | Columns: {columnColumn} | Values: {valueColumn || 'Count'}{filterColumn && filterValue && ` | Filter: ${filterColumn} = ${filterValue}`}</p>
            <p className="text-xs text-blue-600 mt-1">💡 Double-click any data cell to drill down and see the underlying records</p>
          </div>
            {renderPivotTable()}
        </div>
      )}

      {/* Instructions */}
      {(!rowColumns.some(col => col) || !columnColumn) && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">📊 Ready to create your pivot table?</p>
          <p className="text-sm">Select row dimensions, columns, and values to get started</p>
        </div>
      )}

      {/* Drill-Down Modal */}
      {drillDownData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Drill-Down Details</h3>
                <p className="text-sm opacity-90">
                  {drillDownData.rowLabel} → {drillDownData.columnLabel}: {drillDownData.value}
                  {drillDownData.isSubtotal && ' (Subtotal)'}
                </p>
              </div>
              <button
                onClick={closeDrillDown}
                className="text-white hover:text-gray-200 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-auto max-h-[60vh]">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Found {drillDownData.records.length} record{drillDownData.records.length !== 1 ? 's' : ''} that contribute to this value:
                </p>
              </div>

              {/* Records Table */}
              {drillDownData.records.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        {data.headers.map((header, index) => (
                          <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            {header || `Column ${index + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {drillDownData.records.map((record, recordIndex) => (
                        <tr key={recordIndex} className="hover:bg-gray-50">
                          {data.headers.map((header, headerIndex) => (
                            <td key={headerIndex} className="px-4 py-2 text-sm text-gray-900 border-r border-gray-300">
                              {record[header] !== null && record[header] !== undefined ? 
                                String(record[header]) : 
                                <span className="text-gray-400">-</span>
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Export Options */}
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    // Export drill-down data to Excel
                    import('xlsx').then(XLSX => {
                      const workbook = XLSX.utils.book_new();
                      const worksheetData = drillDownData.records.map(record => {
                        const excelRow = {};
                        data.headers.forEach((header, index) => {
                          excelRow[header || `Column ${index + 1}`] = record[header] || '';
                        });
                        return excelRow;
                      });

                      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
                      XLSX.utils.book_append_sheet(workbook, worksheet, 'Drill-Down Data');

                      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                      
                      const link = document.createElement('a');
                      link.download = `drill_down_${drillDownData.rowLabel}_${drillDownData.columnLabel}.xlsx`;
                      link.href = URL.createObjectURL(data);
                      link.click();
                    });
                  }}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  📊 Export to Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PivotTable;
