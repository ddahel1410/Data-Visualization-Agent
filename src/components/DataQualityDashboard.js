import React, { useState, useMemo } from 'react';

const DataQualityDashboard = ({ data }) => {
  const [drillDownData, setDrillDownData] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: 'missingPercentage',
    direction: 'desc'
  });

  // Helper function to detect outliers using IQR method
  const detectOutliers = (values) => {
    if (values.length < 4) return [];
    
    const sorted = values.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - (iqr * 1.5);
    const upperBound = q3 + (iqr * 1.5);
    
    return values.filter(val => val < lowerBound || val > upperBound);
  };

  // Helper function to detect duplicate rows
  const detectDuplicates = (rows) => {
    const seen = new Set();
    const duplicates = [];
    
    rows.forEach((row, index) => {
      const rowString = JSON.stringify(row);
      if (seen.has(rowString)) {
        duplicates.push(index);
      } else {
        seen.add(rowString);
      }
    });
    
    return {
      duplicateCount: duplicates.length,
      duplicateRows: duplicates,
      duplicatePercentage: (duplicates.length / rows.length) * 100
    };
  };

  // Analyze data quality and generate insights
  const dataQuality = useMemo(() => {
    if (!data || !data.rows || !data.headers) {
      return null;
    }

    const analysis = {
      totalRows: data.rows.length,
      totalColumns: data.headers.length,
      columns: {},
      overallHealth: 0,
      issues: [],
      recommendations: []
    };

    // Analyze each column
    data.headers.forEach(header => {
      const columnData = data.rows.map(row => row[header]);
      
      // Data type detection
      const dataTypes = columnData.map(value => {
        if (value === null || value === undefined || value === '') return 'missing';
        if (!isNaN(value) && value !== '') return 'numeric';
        if (new Date(value).toString() !== 'Invalid Date' && !isNaN(Date.parse(value))) return 'date';
        return 'text';
      });

      const typeCounts = dataTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Determine primary data type
      const primaryType = Object.entries(typeCounts)
        .filter(([type]) => type !== 'missing')
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';

      // Missing values analysis
      const missingCount = typeCounts.missing || 0;
      const missingPercentage = (missingCount / columnData.length) * 100;

      // Numeric analysis
      let numericStats = null;
      if (primaryType === 'numeric') {
        const numericValues = columnData
          .filter(val => !isNaN(val) && val !== '' && val !== null)
          .map(val => parseFloat(val));
        
        if (numericValues.length > 0) {
          numericStats = {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            median: numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)],
            uniqueValues: new Set(numericValues).size,
            outliers: detectOutliers(numericValues)
          };
        }
      }

      // Text analysis
      let textStats = null;
      if (primaryType === 'text') {
        const textValues = columnData.filter(val => val !== null && val !== undefined && val !== '');
        textStats = {
          uniqueValues: new Set(textValues).size,
          maxLength: Math.max(...textValues.map(val => String(val).length)),
          minLength: Math.min(...textValues.map(val => String(val).length)),
          avgLength: textValues.reduce((sum, val) => sum + String(val).length, 0) / textValues.length
        };
      }

      // Date analysis
      let dateStats = null;
      if (primaryType === 'date') {
        const dateValues = columnData
          .filter(val => val !== null && val !== undefined && val !== '')
          .map(val => new Date(val))
          .filter(date => !isNaN(date.getTime()));
        
        if (dateValues.length > 0) {
          dateStats = {
            earliest: new Date(Math.min(...dateValues)),
            latest: new Date(Math.max(...dateValues)),
            uniqueDates: new Set(dateValues.map(d => d.toDateString())).size
          };
        }
      }

      // Column health score (0-100)
      let columnHealth = 100;
      if (missingPercentage > 20) columnHealth -= 30;
      if (missingPercentage > 50) columnHealth -= 40;
      if (primaryType === 'unknown') columnHealth -= 20;

      analysis.columns[header] = {
        primaryType,
        missingCount,
        missingPercentage,
        columnHealth,
        numericStats,
        textStats,
        dateStats,
        typeCounts
      };

      // Collect issues and recommendations
      if (missingPercentage > 20) {
        analysis.issues.push(`High missing values in "${header}" (${missingPercentage.toFixed(1)}%)`);
        analysis.recommendations.push(`Consider data cleaning for "${header}" column`);
      }
      
      if (primaryType === 'unknown') {
        analysis.issues.push(`Unable to determine data type for "${header}"`);
        analysis.recommendations.push(`Review data format in "${header}" column`);
      }
    });

    // Calculate overall health score
    const columnHealthScores = Object.values(analysis.columns).map(col => col.columnHealth);
    analysis.overallHealth = Math.round(columnHealthScores.reduce((a, b) => a + b, 0) / columnHealthScores.length);

    // Add duplicate detection
    const duplicateAnalysis = detectDuplicates(data.rows);
    analysis.duplicates = duplicateAnalysis;
    
    if (duplicateAnalysis.duplicateCount > 0) {
      analysis.issues.push(`${duplicateAnalysis.duplicateCount} duplicate rows detected`);
      analysis.recommendations.push('Consider removing duplicate rows for cleaner analysis');
    }

    return analysis;
  }, [data]);

  if (!dataQuality) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Upload data to analyze data quality and generate insights.</p>
      </div>
    );
  }

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthIcon = (score) => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  };

  // Get sort indicator for column headers
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Handle drill-down into specific data quality issues
  const handleDrillDown = (columnName, issueType, issueData) => {
    let drillData = [];
    
    if (issueType === 'missing') {
      // Find rows with missing values in this column
      drillData = data.rows
        .map((row, index) => ({ ...row, __rowIndex: index }))
        .filter(row => row[columnName] === null || row[columnName] === undefined || row[columnName] === '');
    } else if (issueType === 'outliers') {
      // Find rows with outlier values in this column
      const outlierValues = issueData;
      drillData = data.rows
        .map((row, index) => ({ ...row, __rowIndex: index }))
        .filter(row => outlierValues.includes(parseFloat(row[columnName])));
    } else if (issueType === 'duplicates') {
      // Find duplicate rows
      drillData = data.rows
        .map((row, index) => ({ ...row, __rowIndex: index }))
        .filter((row, index) => issueData.includes(index));
    }
    
    setDrillDownData({
      columnName,
      issueType,
      data: drillData,
      totalRows: drillData.length
    });
  };

  // Close drill-down modal
  const closeDrillDown = () => {
    setDrillDownData({});
  };

  // Handle column sorting
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort columns based on current sort configuration
  const getSortedColumns = () => {
    if (!dataQuality || !dataQuality.columns) return [];
    
    const columns = Object.entries(dataQuality.columns);
    
    return columns.sort(([, a], [, b]) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'columnName':
          aValue = a.columnName || '';
          bValue = b.columnName || '';
          break;
        case 'primaryType':
          aValue = a.primaryType || '';
          bValue = b.primaryType || '';
          break;
        case 'missingCount':
          aValue = a.missingCount || 0;
          bValue = b.missingCount || 0;
          break;
        case 'missingPercentage':
          aValue = a.missingPercentage || 0;
          bValue = b.missingPercentage || 0;
          break;
        case 'columnHealth':
          aValue = a.columnHealth || 0;
          bValue = b.columnHealth || 0;
          break;
        default:
          aValue = a[sortConfig.key] || 0;
          bValue = b[sortConfig.key] || 0;
      }
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Export drill-down data to Excel
  const exportToExcel = async (drillData) => {
    try {
      // Validate input data
      if (!drillData || !drillData.data || !drillData.data.length) {
        throw new Error('No data available for export');
      }

      if (!data || !data.headers || !data.headers.length) {
        throw new Error('No column headers available for export');
      }

      // Dynamically import xlsx library
      const XLSX = await import('xlsx');
      
      if (!XLSX || !XLSX.utils) {
        throw new Error('Excel library failed to load');
      }
      
      // Prepare data for Excel export
      const exportData = drillData.data.map(row => {
        const cleanRow = {};
        // Remove internal row index and clean up the data
        Object.keys(row).forEach(key => {
          if (key !== '__rowIndex') {
            cleanRow[key] = row[key] === null || row[key] === undefined || row[key] === '' ? 'NULL' : row[key];
          }
        });
        return cleanRow;
      });

      // Add summary information at the top
      const summaryRow = {};
      data.headers.forEach(header => {
        summaryRow[header] = `SUMMARY: ${drillData.issueType === 'missing' ? 'Missing Values' : 
                                         drillData.issueType === 'outliers' ? 'Outlier Values' : 
                                         'Duplicate Rows'} - Total: ${drillData.totalRows} rows`;
      });
      
      // Insert summary at the beginning
      exportData.unshift(summaryRow);
      exportData.unshift({}); // Empty row for spacing

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const columnWidths = data.headers.map(header => ({
        wch: Math.max(
          header.length,
          ...exportData.map(row => String(row[header] || '').length)
        ) + 2
      }));
      worksheet['!cols'] = columnWidths;

      // Generate descriptive filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const issueType = drillData.issueType === 'missing' ? 'Missing_Values' :
                       drillData.issueType === 'outliers' ? 'Outlier_Values' : 'Duplicate_Rows';
      const columnName = drillData.issueType !== 'duplicates' ? `_${drillData.columnName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `Data_Quality_${issueType}${columnName}_${timestamp}.xlsx`;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Quality Issues');

      // Generate and download Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();

      // Clean up
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      console.error('Error details:', {
        drillData,
        dataHeaders: data?.headers
      });
      alert(`Error exporting to Excel: ${error.message}. Please check the console for details.`);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Quality Dashboard</h3>
        <p className="text-gray-600">Comprehensive analysis of your dataset's health and structure</p>
      </div>

      {/* Overall Health Score */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Overall Data Health</h4>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(dataQuality.overallHealth)}`}>
            {getHealthIcon(dataQuality.overallHealth)} {dataQuality.overallHealth}/100
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{dataQuality.totalRows.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Rows</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dataQuality.totalColumns}</div>
            <div className="text-sm text-gray-600">Total Columns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{dataQuality.duplicates.duplicateCount}</div>
            <div className="text-sm text-gray-600">Duplicate Rows</div>
            {dataQuality.duplicates.duplicateCount > 0 && (
              <button
                onClick={() => handleDrillDown('duplicates', 'duplicates', dataQuality.duplicates.duplicateRows)}
                className="mt-1 inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors duration-200 border border-purple-200 hover:border-purple-300"
              >
                <span className="mr-1">👁️</span>
                View Details
              </button>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Object.values(dataQuality.columns).filter(col => col.missingPercentage > 20).length}
            </div>
            <div className="text-sm text-gray-600">Columns with Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {Object.values(dataQuality.columns).filter(col => col.primaryType === 'numeric').length}
            </div>
            <div className="text-sm text-gray-600">Numeric Columns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600">
              {Object.values(dataQuality.columns).filter(col => col.primaryType === 'text').length}
            </div>
            <div className="text-sm text-gray-600">Text Columns</div>
          </div>
        </div>
      </div>

      {/* Column Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-gray-900">Column Analysis</h4>
          {sortConfig.key && (
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              <span className="font-medium">Sorted by:</span> {sortConfig.key === 'columnName' ? 'Column Name' : 
                                                              sortConfig.key === 'primaryType' ? 'Data Type' : 
                                                              sortConfig.key === 'missingCount' ? 'Missing Count' : 
                                                              sortConfig.key === 'missingPercentage' ? 'Missing Percentage' : 
                                                              sortConfig.key === 'columnHealth' ? 'Column Health' : 
                                                              sortConfig.key} 
              <span className="ml-2 text-gray-500">
                ({sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'})
              </span>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 w-1/4"
                  onClick={() => handleSort('columnName')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Column</span>
                    <span className="text-gray-400">{getSortIndicator('columnName')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 w-1/6"
                  onClick={() => handleSort('primaryType')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Type</span>
                    <span className="text-gray-400">{getSortIndicator('primaryType')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 w-1/6"
                  onClick={() => handleSort('missingCount')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Missing</span>
                    <span className="text-gray-400">{getSortIndicator('missingCount')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 w-1/6"
                  onClick={() => handleSort('columnHealth')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Health</span>
                    <span className="text-gray-400">{getSortIndicator('columnHealth')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedColumns().map(([columnName, columnData]) => (
                <tr key={columnName}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {columnName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      columnData.primaryType === 'numeric' ? 'bg-blue-100 text-blue-800' :
                      columnData.primaryType === 'date' ? 'bg-green-100 text-green-800' :
                      columnData.primaryType === 'text' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {columnData.primaryType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {columnData.missingCount} ({columnData.missingPercentage.toFixed(1)}%)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`px-2 py-1 text-xs rounded-full ${getHealthColor(columnData.columnHealth)}`}>
                      {columnData.columnHealth}/100
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {columnData.primaryType === 'numeric' && columnData.numericStats && (
                      <div>
                        <div>Min: {columnData.numericStats.min.toFixed(2)}</div>
                        <div>Max: {columnData.numericStats.max.toFixed(2)}</div>
                        <div>Mean: {columnData.numericStats.mean.toFixed(2)}</div>
                        {columnData.numericStats.outliers.length > 0 && (
                          <div className="text-orange-600">
                            {columnData.numericStats.outliers.length} outliers
                            <button
                              onClick={() => handleDrillDown(columnName, 'outliers', columnData.numericStats.outliers)}
                              className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-200 border border-blue-200 hover:border-blue-300"
                            >
                              <span className="mr-1">👁️</span>
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {columnData.primaryType === 'text' && columnData.textStats && (
                      <div>
                        <div>Unique: {columnData.textStats.uniqueValues}</div>
                        <div>Avg Length: {columnData.textStats.avgLength.toFixed(1)}</div>
                      </div>
                    )}
                    {columnData.primaryType === 'date' && columnData.dateStats && (
                      <div>
                        <div>Range: {columnData.dateStats.earliest.toLocaleDateString()} - {columnData.dateStats.latest.toLocaleDateString()}</div>
                        <div>Unique Dates: {columnData.dateStats.uniqueDates}</div>
                      </div>
                    )}
                    
                    {/* Missing Values Drill-Down */}
                    {columnData.missingCount > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleDrillDown(columnName, 'missing', columnData.missingCount)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-200 border border-red-200 hover:border-red-300"
                        >
                          <span className="mr-1">👁️</span>
                          View Missing Values ({columnData.missingCount})
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues and Recommendations */}
      {(dataQuality.issues.length > 0 || dataQuality.recommendations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Issues */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-red-900 mb-4">⚠️ Data Issues</h4>
            <ul className="space-y-2">
              {dataQuality.issues.map((issue, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span className="text-sm text-gray-700">{issue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-blue-900 mb-4">💡 Recommendations</h4>
            <ul className="space-y-2">
              {dataQuality.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Enhanced Drill-Down Modal */}
      {drillDownData.columnName && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 animate-fadeIn">
          <div className="relative top-16 mx-auto p-8 border-0 w-11/12 max-w-7xl shadow-2xl rounded-2xl bg-white transform transition-all duration-300 ease-out">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    drillDownData.issueType === 'missing' ? 'bg-red-100 text-red-600' :
                    drillDownData.issueType === 'outliers' ? 'bg-orange-100 text-orange-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {drillDownData.issueType === 'missing' ? '⚠️' : 
                     drillDownData.issueType === 'outliers' ? '📊' : '🔄'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {drillDownData.issueType === 'missing' ? 'Missing Values' : 
                       drillDownData.issueType === 'outliers' ? 'Outlier Values' : 
                       'Duplicate Rows'} {drillDownData.issueType !== 'duplicates' ? `in "${drillDownData.columnName}"` : ''}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Found {drillDownData.totalRows} rows with {
                        drillDownData.issueType === 'missing' ? 'missing values' : 
                        drillDownData.issueType === 'outliers' ? 'outlier values' : 
                        'duplicate data'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={closeDrillDown}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Data Table Section */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="overflow-x-auto max-h-96 rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <span>#</span>
                          <span className="text-gray-500 text-xs">Row</span>
                        </div>
                      </th>
                      {data.headers.map(header => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {drillDownData.data.map((row, index) => (
                      <tr key={index} className={`hover:bg-blue-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-gray-900">{row.__rowIndex + 1}</span>
                            <div className={`w-2 h-2 rounded-full ${
                              drillDownData.issueType === 'missing' ? 'bg-red-400' :
                              drillDownData.issueType === 'outliers' ? 'bg-orange-400' :
                              'bg-purple-400'
                            }`}></div>
                          </div>
                        </td>
                        {data.headers.map(header => (
                          <td key={header} className="px-4 py-3 text-sm">
                            <div className={`${
                              row[header] === null || row[header] === undefined || row[header] === '' 
                                ? 'text-red-600 font-medium bg-red-50 px-2 py-1 rounded' 
                                : 'text-gray-700'
                            }`}>
                              {row[header] === null || row[header] === undefined || row[header] === '' 
                                ? 'NULL' 
                                : String(row[header])
                              }
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Section */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">💡</span>
                  <span>Export this data for further analysis in Excel or other tools</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => exportToExcel(drillDownData)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center space-x-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="text-lg">📊</span>
                  <span className="font-semibold">Export to Excel</span>
                </button>
                <button
                  onClick={closeDrillDown}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataQualityDashboard;
