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
  const [drillDownData, setDrillDownData] = useState(null); // Store drill-down data
  const [drillDownPosition, setDrillDownPosition] = useState({ x: 0, y: 0 }); // Position for drill-down modal
  const [showEnhancedOptions, setShowEnhancedOptions] = useState(false); // Collapse/expand enhanced options panel
  
  // New features
  const [sortBy, setSortBy] = useState('none'); // none, label-asc, label-desc, value-asc, value-desc
  const [decimalPlaces, setDecimalPlaces] = useState(2); // Number of decimal places
  const [showThousandsSeparator, setShowThousandsSeparator] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('none'); // none, $, €, £, ¥
  const [topBottomFilter, setTopBottomFilter] = useState('none'); // none, top-5, top-10, bottom-5, bottom-10
  const [percentageMode, setPercentageMode] = useState('none'); // none, row-total, column-total, grand-total
  const [activeOptionsTab, setActiveOptionsTab] = useState('display'); // display, sorting, format, percentages, colors
  const [showColumnTotals, setShowColumnTotals] = useState(false); // Show totals row at top for each column
  const [colorScaleMode, setColorScaleMode] = useState('none'); // none, heatmap, threshold
  const [thresholdGreen, setThresholdGreen] = useState(100);
  const [thresholdRed, setThresholdRed] = useState(0);
  const [showLoadModal, setShowLoadModal] = useState(false); // Show load configuration modal
  
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

  // Save/Load Configuration Functions
  const saveCurrentConfiguration = () => {
    const configName = prompt('Enter a name for this pivot configuration:');
    if (!configName) return;
    
    const config = {
      name: configName,
      timestamp: new Date().toISOString(),
      version: '1.0',
      rowColumns,
      columnColumn,
      valueColumn,
      filterColumn,
      filterValue,
      calculationType,
      showSubtotals,
      showGrandTotal,
      showColumnTotals,
      conditionalFormatting,
      sortBy,
      decimalPlaces,
      showThousandsSeparator,
      currencySymbol,
      topBottomFilter,
      percentageMode,
      colorScaleMode,
      thresholdGreen,
      thresholdRed
    };
    
    // Download as JSON file
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pivot_config_${configName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const loadConfiguration = (config) => {
    setRowColumns(config.rowColumns);
    setColumnColumn(config.columnColumn);
    setValueColumn(config.valueColumn);
    setFilterColumn(config.filterColumn || '');
    setFilterValue(config.filterValue || '');
    setCalculationType(config.calculationType);
    setShowSubtotals(config.showSubtotals);
    setShowGrandTotal(config.showGrandTotal);
    setShowColumnTotals(config.showColumnTotals || false);
    setConditionalFormatting(config.conditionalFormatting);
    setSortBy(config.sortBy);
    setDecimalPlaces(config.decimalPlaces);
    setShowThousandsSeparator(config.showThousandsSeparator);
    setCurrencySymbol(config.currencySymbol);
    setTopBottomFilter(config.topBottomFilter || 'none');
    setPercentageMode(config.percentageMode || 'none');
    setColorScaleMode(config.colorScaleMode || 'none');
    setThresholdGreen(config.thresholdGreen || 100);
    setThresholdRed(config.thresholdRed || 0);
    setShowLoadModal(false);
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        loadConfiguration(config);
        alert(`Configuration "${config.name}" loaded successfully!`);
      } catch (error) {
        alert('Error loading configuration file. Please ensure it is a valid pivot configuration JSON file.');
        console.error('Config load error:', error);
      }
    };
    reader.readAsText(file);
  };
  
  const clearAllSelections = () => {
    if (!window.confirm('Clear all pivot table selections and reset to defaults?')) return;
    
    // Reset all pivot configurations
    setRowColumns(['']);
    setColumnColumn('');
    setValueColumn('');
    setFilterColumn('');
    setFilterValue('');
    
    // Reset enhanced options to defaults
    setCalculationType('sum');
    setShowSubtotals(true);
    setShowGrandTotal(true);
    setShowColumnTotals(false);
    setConditionalFormatting(true);
    setSortBy('none');
    setDecimalPlaces(2);
    setShowThousandsSeparator(true);
    setCurrencySymbol('none');
    setTopBottomFilter('none');
    setPercentageMode('none');
    setColorScaleMode('none');
    setThresholdGreen(100);
    setThresholdRed(0);
    setExpandedSections(new Set());
  };

  // Helper function to format numbers
  const formatNumber = (value, rowTotal = null, colTotal = null, grandTotal = null) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) {
      return value;
    }
    
    let num = parseFloat(value);
    
    // Apply percentage mode if specified
    if (percentageMode !== 'none' && calculationType !== 'percentage') {
      if (percentageMode === 'row-total' && rowTotal && rowTotal !== 0) {
        num = (num / rowTotal) * 100;
        return num.toFixed(decimalPlaces) + '%';
      } else if (percentageMode === 'column-total' && colTotal && colTotal !== 0) {
        num = (num / colTotal) * 100;
        return num.toFixed(decimalPlaces) + '%';
      } else if (percentageMode === 'grand-total' && grandTotal && grandTotal !== 0) {
        num = (num / grandTotal) * 100;
        return num.toFixed(decimalPlaces) + '%';
      }
    }
    
    // Apply decimal places
    let formatted = num.toFixed(decimalPlaces);
    
    // Add thousands separator if enabled
    if (showThousandsSeparator) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }
    
    // Add currency symbol
    if (currencySymbol !== 'none') {
      formatted = `${currencySymbol}${formatted}`;
    }
    
    return formatted;
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
    
    // Add column totals row at top if enabled
    if (showColumnTotals && columnColumn) {
      const columnTotalsRow = { row: 'COLUMN TOTALS', isColumnTotal: true };
      uniqueColumns.forEach(col => {
        let colTotal = uniqueRowKeys.reduce((sum, rowKey) => sum + pivotMatrix[rowKey][col], 0);
        
        if (calculationType === 'average' && valueColumn) {
          const totalCount = uniqueRowKeys.reduce((sum, rowKey) => {
            const count = filteredData.filter(r => getRowKey(r) === rowKey && getColumnValue(r, columnColumn) === col).length;
            return sum + count;
          }, 0);
          colTotal = totalCount > 0 ? colTotal / totalCount : 0;
        } else if (calculationType === 'percentage' && valueColumn) {
          colTotal = 100;
        }
        
        columnTotalsRow[col] = colTotal;
      });
      
      // Add row total for column totals
      columnTotalsRow.total = uniqueColumns.reduce((sum, col) => sum + columnTotalsRow[col], 0);
      
      tableData.push(columnTotalsRow);
    }
    
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

    // Apply sorting and top/bottom filtering if specified
    if (sortBy !== 'none' || topBottomFilter !== 'none') {
      // Separate grand total and subtotals from regular rows
      const grandTotal = tableData.filter(row => row.row === 'GRAND TOTAL');
      let regularRows = tableData.filter(row => row.row !== 'GRAND TOTAL' && !row.isSubtotal);
      const subtotals = tableData.filter(row => row.isSubtotal);
      
      // Sort regular rows based on sortBy option
      if (sortBy === 'label-asc') {
        regularRows.sort((a, b) => a.row.localeCompare(b.row));
      } else if (sortBy === 'label-desc') {
        regularRows.sort((a, b) => b.row.localeCompare(a.row));
      } else if (sortBy === 'value-asc') {
        regularRows.sort((a, b) => (a.total || 0) - (b.total || 0));
      } else if (sortBy === 'value-desc') {
        regularRows.sort((a, b) => (b.total || 0) - (a.total || 0));
      }
      
      // Apply top/bottom filter
      if (topBottomFilter !== 'none') {
        // Sort by value for top/bottom filtering
        const sortedByValue = [...regularRows].sort((a, b) => (b.total || 0) - (a.total || 0));
        
        if (topBottomFilter === 'top-5') {
          regularRows = sortedByValue.slice(0, 5);
        } else if (topBottomFilter === 'top-10') {
          regularRows = sortedByValue.slice(0, 10);
        } else if (topBottomFilter === 'top-20') {
          regularRows = sortedByValue.slice(0, 20);
        } else if (topBottomFilter === 'bottom-5') {
          regularRows = sortedByValue.slice(-5).reverse();
        } else if (topBottomFilter === 'bottom-10') {
          regularRows = sortedByValue.slice(-10).reverse();
        } else if (topBottomFilter === 'bottom-20') {
          regularRows = sortedByValue.slice(-20).reverse();
        }
      }
      
      // Rebuild table with sorted/filtered rows, preserving subtotals and grand total
      tableData.length = 0;
      tableData.push(...regularRows, ...subtotals, ...grandTotal);
    }

    return { tableData, uniqueColumns };
  }, [rowColumns, columnColumn, valueColumn, filterColumn, filterValue, sourceRows, calculationType, showSubtotals, showGrandTotal, sortBy, topBottomFilter]);

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
    
    // Filter out internal metadata columns
    const metadataColumns = ['level', 'path', 'isDataRow', 'isSubtotal', 'sectionKey', 'hasChildren', 'childCount', 'parentKey'];
    const columns = Object.keys(pivotData.tableData[0]).filter(key => {
      if (key === 'row') return false;
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
                // Always apply professional styling for totals
                if (isGrandTotal) return 'bg-blue-100 font-bold';
                if (isSubtotal) return 'bg-blue-50 font-semibold';
                if (row.isColumnTotal) return 'bg-purple-100 font-bold';
                
                // Apply advanced color scales
                if (typeof value === 'number' && row.isDataRow) {
                  // Threshold mode
                  if (colorScaleMode === 'threshold') {
                    if (value >= thresholdGreen) return 'bg-green-200 font-medium';
                    if (value <= thresholdRed) return 'bg-red-200 font-medium';
                    return 'bg-yellow-100';
                  }
                  
                  // Heatmap mode
                  if (colorScaleMode === 'heatmap') {
                    const allValues = pivotData.tableData.filter(r => r.isDataRow).map(r => r[col]).filter(v => typeof v === 'number');
                    if (allValues.length > 0) {
                      const max = Math.max(...allValues);
                      const min = Math.min(...allValues);
                      const range = max - min;
                      
                      if (range > 0) {
                        const normalized = (value - min) / range;
                        // Gradient from red (low) to yellow (mid) to green (high)
                        if (normalized >= 0.8) return 'bg-green-300 font-medium';
                        if (normalized >= 0.6) return 'bg-green-200';
                        if (normalized >= 0.4) return 'bg-yellow-200';
                        if (normalized >= 0.2) return 'bg-orange-200';
                        return 'bg-red-200';
                      }
                    }
                  }
                  
                  // Legacy conditional formatting mode
                  if (conditionalFormatting && colorScaleMode === 'none') {
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
                    
                    // Get totals for percentage calculations
                    const rowTotal = row.total;
                    const grandTotalRow = pivotData.tableData.find(r => r.row === 'GRAND TOTAL');
                    const columnTotal = grandTotalRow ? grandTotalRow[col] : null;
                    const grandTotal = grandTotalRow ? grandTotalRow.total : null;
                    
                    return (
                      <td 
                        key={colIndex} 
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 text-right ${cellStyle} ${canDrillDown ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        onDoubleClick={canDrillDown ? (e) => handleCellDrillDown(row, col, e) : undefined}
                        title={canDrillDown ? 'Double-click to drill down' : undefined}
                      >
                        {typeof value === 'number' ? 
                          (calculationType === 'percentage' ? 
                            value.toFixed(decimalPlaces) + '%' : 
                            formatNumber(value, rowTotal, columnTotal, grandTotal)
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
        
        {/* Action Buttons */}
          <div className="flex space-x-2">
          {/* Export Buttons - Only show when pivot table exists */}
          {pivotData && pivotData.tableData && pivotData.tableData.length > 0 && (
            <>
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
            </>
          )}
          
          {/* Save/Load Config - Always visible */}
          <button
            onClick={saveCurrentConfiguration}
            className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            title="Save current pivot configuration as JSON"
          >
            💾 Save Config
          </button>
          <button
            onClick={() => setShowLoadModal(true)}
            className="px-3 py-2 bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            title="Load a saved pivot configuration"
          >
            📂 Load Config
          </button>
      </div>
      </div>
      
      {/* Load Configuration Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Load Pivot Configuration</h3>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <label htmlFor="config-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Click to upload a configuration file
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    JSON files only
                  </span>
                  <input
                    id="config-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>💡 Tip:</strong> Upload a previously saved pivot configuration JSON file to restore all settings including columns, filters, formatting, and color schemes.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
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
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md">
        <button
          onClick={() => setShowEnhancedOptions(!showEnhancedOptions)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors rounded-t-md"
        >
          <h3 className="text-sm font-medium text-blue-800">🎯 Enhanced Pivot Options</h3>
          <span className="text-blue-600 text-lg">
            {showEnhancedOptions ? '▼' : '▶'}
          </span>
        </button>
        
        {showEnhancedOptions && (
          <div className="border-t border-blue-200">
            {/* Tabs */}
            <div className="flex border-b border-blue-200 bg-blue-100">
              <button
                onClick={() => setActiveOptionsTab('display')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeOptionsTab === 'display'
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-600'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                📊 Display
              </button>
              <button
                onClick={() => setActiveOptionsTab('sorting')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeOptionsTab === 'sorting'
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-600'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                🔽 Sort & Filter
              </button>
              <button
                onClick={() => setActiveOptionsTab('format')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeOptionsTab === 'format'
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-600'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                🔢 Number Format
              </button>
              <button
                onClick={() => setActiveOptionsTab('percentages')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeOptionsTab === 'percentages'
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-600'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                📈 Percentages
              </button>
              <button
                onClick={() => setActiveOptionsTab('colors')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeOptionsTab === 'colors'
                    ? 'bg-blue-50 text-blue-800 border-b-2 border-blue-600'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                🎨 Colors
              </button>
            </div>
            
            <div className="p-4">
              {/* Display Tab */}
              {activeOptionsTab === 'display' && (
                <div>
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
                        id="showColumnTotals"
              type="checkbox"
                        checked={showColumnTotals}
                        onChange={(e) => setShowColumnTotals(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
                      <label htmlFor="showColumnTotals" className="ml-2 text-xs text-blue-700">Show Column Totals</label>
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
        
        {/* Expand/Collapse Controls */}
        {showSubtotals && (
                    <div className="mt-4 pt-3 border-t border-blue-200">
            <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-700">Table Row Controls:</span>
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
                            Expand All Rows
                </button>
                <button
                  onClick={() => setExpandedSections(new Set())}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                            Collapse All Rows
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
              )}
              
              {/* Sort & Filter Tab */}
              {activeOptionsTab === 'sorting' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sortBy" className="block text-xs font-medium text-blue-700 mb-1">Sort By:</label>
                    <select 
                      id="sortBy" 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="block w-full px-2 py-1 text-xs border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="none">No Sorting</option>
                      <option value="label-asc">Label (A → Z)</option>
                      <option value="label-desc">Label (Z → A)</option>
                      <option value="value-asc">Value (Low → High)</option>
                      <option value="value-desc">Value (High → Low)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="topBottomFilter" className="block text-xs font-medium text-blue-700 mb-1">Top/Bottom Filter:</label>
                    <select 
                      id="topBottomFilter" 
                      value={topBottomFilter} 
                      onChange={(e) => setTopBottomFilter(e.target.value)}
                      className="block w-full px-2 py-1 text-xs border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="none">Show All Items</option>
                      <option value="top-5">Top 5 Items</option>
                      <option value="top-10">Top 10 Items</option>
                      <option value="top-20">Top 20 Items</option>
                      <option value="bottom-5">Bottom 5 Items</option>
                      <option value="bottom-10">Bottom 10 Items</option>
                      <option value="bottom-20">Bottom 20 Items</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                      💡 Tip: Top/Bottom filter is based on the row total values. Use sorting to arrange the filtered results.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Number Format Tab */}
              {activeOptionsTab === 'format' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="decimalPlaces" className="block text-xs font-medium text-blue-700 mb-1">Decimal Places:</label>
                      <select 
                        id="decimalPlaces" 
                        value={decimalPlaces} 
                        onChange={(e) => setDecimalPlaces(parseInt(e.target.value))}
                        className="block w-full px-2 py-1 text-xs border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="0">0 decimals (1,234)</option>
                        <option value="1">1 decimal (1,234.5)</option>
                        <option value="2">2 decimals (1,234.56)</option>
                        <option value="3">3 decimals (1,234.567)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="currencySymbol" className="block text-xs font-medium text-blue-700 mb-1">Currency:</label>
                      <select 
                        id="currencySymbol" 
                        value={currencySymbol} 
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                        className="block w-full px-2 py-1 text-xs border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="$">$ (Dollar)</option>
                        <option value="€">€ (Euro)</option>
                        <option value="£">£ (Pound)</option>
                        <option value="¥">¥ (Yen/Yuan)</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="showThousandsSeparator"
                        type="checkbox"
                        checked={showThousandsSeparator}
                        onChange={(e) => setShowThousandsSeparator(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showThousandsSeparator" className="ml-2 text-xs text-blue-700">Thousands Separator</label>
                    </div>
                    
                    <div className="flex items-center text-xs text-blue-600">
                      <span className="font-medium">Preview: {formatNumber(1234.567)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Percentages Tab */}
              {activeOptionsTab === 'percentages' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="percentageMode" className="block text-xs font-medium text-blue-700 mb-1">Show Values As:</label>
                      <select 
                        id="percentageMode" 
                        value={percentageMode} 
                        onChange={(e) => setPercentageMode(e.target.value)}
                        className="block w-full px-2 py-1 text-xs border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="none">Raw Values</option>
                        <option value="row-total">% of Row Total</option>
                        <option value="column-total">% of Column Total</option>
                        <option value="grand-total">% of Grand Total</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800 mb-2"><strong>Understanding Percentage Modes:</strong></p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• <strong>% of Row Total:</strong> Each cell shows what % it is of that row's total</li>
                      <li>• <strong>% of Column Total:</strong> Each cell shows what % it is of that column's total</li>
                      <li>• <strong>% of Grand Total:</strong> Each cell shows what % it is of the entire table total</li>
                    </ul>
                    <p className="text-xs text-blue-600 mt-2 italic">
                      Note: Percentage mode is ignored when Calculation Type is set to "Percentage"
                    </p>
                  </div>
                </div>
              )}
              
              {/* Colors Tab */}
              {activeOptionsTab === 'colors' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="colorScaleMode" className="block text-xs font-medium text-blue-700 mb-1">Color Scale Mode:</label>
                      <select 
                        id="colorScaleMode" 
                        value={colorScaleMode} 
                        onChange={(e) => setColorScaleMode(e.target.value)}
                        className="block w-full px-2 py-1 text-xs border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="none">No Color Scale</option>
                        <option value="heatmap">Heat Map (Gradient)</option>
                        <option value="threshold">Custom Thresholds</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Threshold Settings */}
                  {colorScaleMode === 'threshold' && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-800 mb-3">Threshold Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="thresholdGreen" className="block text-xs font-medium text-gray-700 mb-1">
                            Green if ≥ (Good)
                          </label>
                          <input
                            id="thresholdGreen"
                            type="number"
                            value={thresholdGreen}
                            onChange={(e) => setThresholdGreen(parseFloat(e.target.value))}
                            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="thresholdRed" className="block text-xs font-medium text-gray-700 mb-1">
                            Red if ≤ (Poor)
                          </label>
                          <input
                            id="thresholdRed"
                            type="number"
                            value={thresholdRed}
                            onChange={(e) => setThresholdRed(parseFloat(e.target.value))}
                            className="block w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Values between red and green thresholds will be yellow.
                      </p>
                    </div>
                  )}
                  
                  {/* Color Scale Examples */}
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800 mb-2"><strong>Color Scale Modes:</strong></p>
                    <ul className="text-xs text-blue-700 space-y-2">
                      <li>
                        • <strong>Heat Map:</strong> Automatic gradient coloring from red (lowest) through yellow to green (highest)
                        <div className="mt-1 flex items-center space-x-1">
                          <div className="w-12 h-4 bg-red-200 rounded text-[8px] flex items-center justify-center">Low</div>
                          <div className="w-12 h-4 bg-orange-200 rounded"></div>
                          <div className="w-12 h-4 bg-yellow-200 rounded text-[8px] flex items-center justify-center">Mid</div>
                          <div className="w-12 h-4 bg-green-200 rounded"></div>
                          <div className="w-12 h-4 bg-green-300 rounded text-[8px] flex items-center justify-center">High</div>
                        </div>
                      </li>
                      <li>
                        • <strong>Custom Thresholds:</strong> Define your own good/poor thresholds for business rules
                        <div className="mt-1 flex items-center space-x-1">
                          <div className="w-16 h-4 bg-red-200 rounded text-[8px] flex items-center justify-center">≤ Red</div>
                          <div className="w-16 h-4 bg-yellow-100 rounded text-[8px] flex items-center justify-center">Between</div>
                          <div className="w-16 h-4 bg-green-200 rounded text-[8px] flex items-center justify-center">≥ Green</div>
                        </div>
                      </li>
                    </ul>
                    <p className="text-xs text-blue-600 mt-2 italic">
                      Note: Color scales only apply to data cells, not totals or subtotals.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Clear All Button */}
      {(rowColumns.some(col => col) || columnColumn || valueColumn || filterColumn || filterValue) && (
        <div className="mb-6">
          <button
            onClick={clearAllSelections}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            title="Clear all selections and reset to defaults"
          >
            🗑️ Clear All
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
