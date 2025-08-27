import React, { useState, useMemo } from 'react';

const SmartRecommendations = ({ data, onNavigateToTab, onConfigureChart }) => {
  const [selectedColumns, setSelectedColumns] = useState(null); // null means analyze all columns
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  // Analyze data and generate smart recommendations
  const recommendations = useMemo(() => {
    if (!data || (!data.rows && !data.preview)) {
      return { insights: [], suggestions: [], warnings: [] };
    }

    const rows = data.rows || data.preview || [];
    const headers = data.headers || [];
    
    if (rows.length === 0 || headers.length === 0) {
      return { insights: [], suggestions: [], warnings: [] };
    }

    const insights = [];
    const suggestions = [];
    const warnings = [];

    // Filter columns based on user selection
    const columnsToAnalyze = selectedColumns ? selectedColumns : headers;
    
    // Analyze data types and patterns
    const columnAnalysis = columnsToAnalyze.map(header => {
      const values = rows.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
      const numericValues = values.filter(val => !isNaN(parseFloat(val)));
      const uniqueValues = new Set(values);
      const isNumeric = numericValues.length > values.length * 0.8;
      const isDate = values.some(val => !isNaN(Date.parse(val)));
      const isCategorical = uniqueValues.size < Math.min(values.length * 0.5, 50);
      
      return {
        header,
        isNumeric,
        isDate,
        isCategorical,
        uniqueCount: uniqueValues.size,
        totalCount: values.length,
        numericValues: isNumeric ? numericValues : [],
        sampleValues: Array.from(uniqueValues).slice(0, 5)
      };
    });

    // 1. Chart Type Recommendations
    const numericColumns = columnAnalysis.filter(col => col.isNumeric);
    const categoricalColumns = columnAnalysis.filter(col => col.isCategorical);
    const dateColumns = columnAnalysis.filter(col => col.isDate);

    if (numericColumns.length >= 2) {
      suggestions.push({
        type: 'chart',
        priority: 'high',
        title: '📊 Correlation Analysis',
        description: `You have ${numericColumns.length} numeric columns. Consider creating scatter plots to discover correlations between variables.`,
        action: 'scatter',
        columns: numericColumns.slice(0, 2).map(col => col.header)
      });
    }

    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        type: 'chart',
        priority: 'high',
        title: '📈 Comparative Analysis',
        description: `Perfect for bar charts! Compare ${categoricalColumns[0].header} against ${numericColumns[0].header} to see patterns.`,
        action: 'bar',
        columns: [categoricalColumns[0].header, numericColumns[0].header]
      });
    }

    if (dateColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        type: 'chart',
        priority: 'high',
        title: '⏰ Time Series Analysis',
        description: `Time-based data detected! Create line charts to visualize trends over time.`,
        action: 'line',
        columns: [dateColumns[0].header, numericColumns[0].header]
      });
    }

    // 2. Data Quality Insights
    const lowQualityColumns = columnAnalysis.filter(col => 
      col.totalCount > 0 && (col.totalCount - col.uniqueCount) / col.totalCount > 0.8
    );

    if (lowQualityColumns.length > 0) {
      warnings.push({
        type: 'quality',
        priority: 'medium',
        title: '⚠️ Low Data Variety',
        description: `${lowQualityColumns.length} column(s) have very few unique values, which may limit analysis options.`,
        columns: lowQualityColumns.map(col => col.header)
      });
    }

    // 3. Pattern Detection
    if (rows.length > 100) {
      insights.push({
        type: 'pattern',
        priority: 'medium',
        title: '🔍 Large Dataset',
        description: `You have ${rows.length.toLocaleString()} rows - consider using filters to focus on specific segments for better performance.`
      });
    }

    // 4. Missing Data Analysis
    const columnsWithMissingData = columnAnalysis.filter(col => 
      col.totalCount < rows.length
    );

    if (columnsWithMissingData.length > 0) {
      const missingPercentage = ((rows.length - Math.min(...columnsWithMissingData.map(col => col.totalCount))) / rows.length * 100).toFixed(1);
      warnings.push({
        type: 'missing',
        priority: 'high',
        title: '❌ Missing Data Detected',
        description: `${missingPercentage}% of your data has missing values. Consider data cleaning before analysis.`,
        columns: columnsWithMissingData.map(col => col.header)
      });
    }

    // 5. Optimal Chart Suggestions
    if (categoricalColumns.length > 0) {
      const bestCategorical = categoricalColumns.sort((a, b) => b.uniqueCount - a.uniqueCount)[0];
      if (bestCategorical.uniqueCount <= 10) {
        suggestions.push({
          type: 'chart',
          priority: 'medium',
          title: '🥧 Pie Chart Opportunity',
          description: `${bestCategorical.header} has ${bestCategorical.uniqueCount} categories - perfect for pie charts!`,
          action: 'pie',
          columns: [bestCategorical.header]
        });
      }
    }

    // 6. Histogram Opportunities
    const histogramCandidates = numericColumns.filter(col => 
      col.numericValues.length > 20 && 
      (Math.max(...col.numericValues) - Math.min(...col.numericValues)) > 0
    );

    if (histogramCandidates.length > 0) {
      suggestions.push({
        type: 'chart',
        priority: 'medium',
        title: '📊 Distribution Analysis',
        description: `Create histograms to understand the distribution of ${histogramCandidates[0].header}.`,
        action: 'histogram',
        columns: [histogramCandidates[0].header]
      });
    }

    return { insights, suggestions, warnings };
  }, [data, selectedColumns]);

  if (!data || (!data.rows && !data.preview)) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Smart Recommendations</h3>
                      <p className="text-sm text-blue-700">
            {selectedColumns 
              ? `AI-powered suggestions for ${selectedColumns.length} selected column${selectedColumns.length > 1 ? 's' : ''}`
              : 'AI-powered suggestions for your data analysis'
            }
          </p>
          </div>
        </div>
        <button
          onClick={() => setShowColumnSelector(!showColumnSelector)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>{showColumnSelector ? '▼' : '▶'}</span>
          <span>{selectedColumns ? `${selectedColumns.length} Selected` : 'Select Columns'}</span>
        </button>
      </div>

      {/* Column Selector */}
      {showColumnSelector && (
        <div className="bg-white rounded-lg border border-blue-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-900">Select Columns to Analyze</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedColumns(null)}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Analyze All
              </button>
              <button
                onClick={() => setSelectedColumns([...(data.headers || [])])}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Select All
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {(data.headers || []).map((header) => (
              <label key={header} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedColumns ? selectedColumns.includes(header) : true}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Add column to selection
                      if (selectedColumns) {
                        setSelectedColumns([...selectedColumns, header]);
                      } else {
                        // Transition from "all columns" to "selected columns" mode
                        setSelectedColumns([header]);
                      }
                    } else {
                      // Remove column from selection
                      if (selectedColumns) {
                        const newSelection = selectedColumns.filter(col => col !== header);
                        setSelectedColumns(newSelection.length > 0 ? newSelection : null);
                      } else {
                        // Transition from "all columns" to "selected columns" mode, excluding this column
                        const allColumns = data.headers || [];
                        const newSelection = allColumns.filter(col => col !== header);
                        setSelectedColumns(newSelection.length > 0 ? newSelection : null);
                      }
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 truncate" title={header}>
                  {header}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {selectedColumns 
              ? `Analyzing ${selectedColumns.length} selected column${selectedColumns.length > 1 ? 's' : ''} for focused insights.`
              : '💡 Tip: Currently analyzing ALL columns. Select specific columns above to get focused recommendations.'
            }
          </div>
        </div>
      )}

      {/* High Priority Suggestions */}
      {recommendations.suggestions.filter(s => s.priority === 'high').length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-blue-800 mb-3 flex items-center">
            <span className="mr-2">🚀</span> High Priority Actions
          </h4>
          <div className="space-y-3">
            {recommendations.suggestions
              .filter(s => s.priority === 'high')
              .map((suggestion, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">{suggestion.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                      {suggestion.columns && (
                        <div className="flex flex-wrap gap-2">
                          {suggestion.columns.map((col, colIndex) => (
                            <span key={colIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {col}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <button 
                        onClick={() => {
                          if (onNavigateToTab && onConfigureChart) {
                            // Navigate to charts tab and configure the chart
                            onNavigateToTab('charts');
                            // Small delay to ensure tab switch completes
                            setTimeout(() => {
                              onConfigureChart({
                                chartType: suggestion.action,
                                categoryColumn: suggestion.columns?.[0] || '',
                                valueColumn: suggestion.columns?.[1] || '',
                                title: suggestion.title
                              });
                            }, 100);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors transition-all duration-200 hover:scale-105"
                        title={`Create ${suggestion.action} chart with ${suggestion.columns?.join(' and ') || 'selected columns'}`}
                      >
                        Try This
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Medium Priority Suggestions */}
      {recommendations.suggestions.filter(s => s.priority === 'medium').length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-blue-800 mb-3 flex items-center">
            <span className="mr-2">💡</span> Smart Ideas
          </h4>
          <div className="space-y-3">
            {recommendations.suggestions
              .filter(s => s.priority === 'medium')
              .map((suggestion, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">{suggestion.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                      {suggestion.columns && (
                        <div className="flex flex-wrap gap-2">
                          {suggestion.columns.map((col, colIndex) => (
                            <span key={colIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {col}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <button 
                        onClick={() => {
                          if (onNavigateToTab && onConfigureChart) {
                            // Navigate to charts tab and configure the chart
                            onNavigateToTab('charts');
                            // Small delay to ensure tab switch completes
                            setTimeout(() => {
                              onConfigureChart({
                                chartType: suggestion.action,
                                categoryColumn: suggestion.columns?.[0] || '',
                                valueColumn: suggestion.columns?.[1] || '',
                                title: suggestion.title
                              });
                            }, 100);
                          }
                        }}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors transition-all duration-200 hover:scale-105"
                        title={`Create ${suggestion.action} chart with ${suggestion.columns?.join(' and ') || 'selected columns'}`}
                      >
                        Explore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {recommendations.insights.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-blue-800 mb-3 flex items-center">
            <span className="mr-2">🔍</span> Data Insights
          </h4>
          <div className="space-y-3">
            {recommendations.insights.map((insight, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                <h5 className="font-medium text-gray-900 mb-1">{insight.title}</h5>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {recommendations.warnings.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-orange-800 mb-3 flex items-center">
            <span className="mr-2">⚠️</span> Data Quality Alerts
          </h4>
          <div className="space-y-3">
            {recommendations.warnings.map((warning, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                <h5 className="font-medium text-gray-900 mb-1">{warning.title}</h5>
                <p className="text-sm text-gray-600 mb-2">{warning.description}</p>
                {warning.columns && (
                  <div className="flex flex-wrap gap-2">
                    {warning.columns.map((col, colIndex) => (
                      <span key={colIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {col}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Analysis Summary */}
      {selectedColumns && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-md font-medium text-blue-800 mb-2 flex items-center">
            <span className="mr-2">📊</span> Analysis Scope
          </h4>
          <p className="text-sm text-blue-700 mb-2">
            Currently analyzing <strong>{selectedColumns.length}</strong> selected column{selectedColumns.length > 1 ? 's' : ''}:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedColumns.map((col, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No Recommendations */}
      {recommendations.suggestions.length === 0 && recommendations.insights.length === 0 && recommendations.warnings.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤔</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {selectedColumns ? 'No Recommendations for Selected Columns' : 'Analyzing Your Data...'}
          </h4>
          <p className="text-gray-600">
            {selectedColumns 
              ? 'Try selecting different columns or analyze all columns for comprehensive insights.'
              : 'Upload more data or try different columns to get personalized recommendations!'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartRecommendations;
