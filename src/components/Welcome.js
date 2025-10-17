import React, { useState } from 'react';

const Welcome = ({ hasData = false, data = null }) => {
  const [expandedFeatures, setExpandedFeatures] = useState({});

  const toggleFeature = (featureId) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };
  return (
    <div className="max-w-6xl mx-auto p-8 bg-white">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Data Visualization Agent
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Your comprehensive data analysis platform for insights, visualizations, and reporting
        </p>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-lg font-medium">
            Transform your data into actionable insights with enterprise-grade analytics tools
          </p>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          Quick Start Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="text-blue-600 text-2xl mb-3">1</div>
            <h3 className="font-semibold text-gray-800 mb-2">Upload Your Data</h3>
            <p className="text-sm text-gray-600">
              Upload CSV files up to 10MB. We support various data formats and automatically detect columns.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-green-600 text-2xl mb-3">2</div>
            <h3 className="font-semibold text-gray-800 mb-2">Explore & Visualize</h3>
            <p className="text-sm text-gray-600">
              Create charts, build pivot tables, and preview your data with our intuitive tools.
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="text-purple-600 text-2xl mb-3">3</div>
            <h3 className="font-semibold text-gray-800 mb-2">Analyze & Compare</h3>
            <p className="text-sm text-gray-600">
              Use data quality tools, AI recommendations, and comparison tools for comprehensive analysis.
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="text-orange-600 text-2xl mb-3">4</div>
            <h3 className="font-semibold text-gray-800 mb-2">Export & Share</h3>
            <p className="text-sm text-gray-600">
              Export your insights as images, Excel files, or CSV for presentations and further analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          Key Features
        </h2>
        <div className="space-y-3">
          
          {/* Data Visualization */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleFeature('visualization')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                📊 Data Visualization
              </h3>
              <span className="text-gray-500 text-xl">
                {expandedFeatures['visualization'] ? '−' : '+'}
              </span>
            </button>
            {expandedFeatures['visualization'] && (
              <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Multiple chart types: Pie, Bar, Line, Scatter, Histogram
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Interactive charts with professional styling
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Export charts as PNG, JPEG, or Excel
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Customizable dimensions and data filtering
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Interactive Dashboards */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleFeature('dashboards')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                📈 Interactive Dashboards
              </h3>
              <span className="text-gray-500 text-xl">
                {expandedFeatures['dashboards'] ? '−' : '+'}
              </span>
            </button>
            {expandedFeatures['dashboards'] && (
              <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Multi-chart grid layouts (1+2, 1+3, 2x2, 3x2, 2x3, 3x3)
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Click-to-drill-down: Click charts to see detailed data
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Advanced filtering: Category, Numeric Range, Text Search, Date Range
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Quick date presets (Last 7/30 Days, Month, Quarter, YTD)
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Collapsible, tabbed filters with active filter badges
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Save/Load configurations & Export to PDF
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Advanced Pivot Tables */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleFeature('pivot')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                🔢 Enterprise Pivot Tables
              </h3>
              <span className="text-gray-500 text-xl">
                {expandedFeatures['pivot'] ? '−' : '+'}
              </span>
            </button>
            {expandedFeatures['pivot'] && (
              <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Multiple row dimensions with hierarchical grouping
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Smart subtotals and grand totals
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Expand/collapse sections for detailed analysis
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Drill-down capability to see underlying records
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Data Preview */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleFeature('preview')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                📋 Data Preview & Exploration
              </h3>
              <span className="text-gray-500 text-xl">
                {expandedFeatures['preview'] ? '−' : '+'}
              </span>
            </button>
            {expandedFeatures['preview'] && (
              <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Virtual scrolling for massive datasets
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Column filtering and sorting capabilities
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Row selection and export functionality
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Real-time search across all columns
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Data Quality & Profiling */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleFeature('quality')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                🔍 Data Quality & Profiling
              </h3>
              <span className="text-gray-500 text-xl">
                {expandedFeatures['quality'] ? '−' : '+'}
              </span>
            </button>
            {expandedFeatures['quality'] && (
              <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Comprehensive data health analysis and scoring
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Missing values, outliers, and duplicate detection
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Interactive drill-down to view problematic records
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Excel export for data quality reports
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Smart Recommendations */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleFeature('recommendations')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                💡 Smart Recommendations
              </h3>
              <span className="text-gray-500 text-xl">
                {expandedFeatures['recommendations'] ? '−' : '+'}
              </span>
            </button>
            {expandedFeatures['recommendations'] && (
              <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Intelligent chart type suggestions based on data characteristics
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Column-specific analysis and insights
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    One-click chart creation from recommendations
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Statistical analysis and pattern detection
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Data Comparison Tool */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleFeature('comparison')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                🔄 Data Comparison Tool
              </h3>
              <span className="text-gray-500 text-xl">
                {expandedFeatures['comparison'] ? '−' : '+'}
              </span>
            </button>
            {expandedFeatures['comparison'] && (
              <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    VLOOKUP-style comparison between multiple datasets
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Row matching using key columns and value validation
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Structure analysis and merge compatibility assessment
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Professional comparison reports with export functionality
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Export & Sharing */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => toggleFeature('export')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                💾 Export & Sharing
              </h3>
              <span className="text-gray-500 text-xl">
                {expandedFeatures['export'] ? '−' : '+'}
              </span>
            </button>
            {expandedFeatures['export'] && (
              <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Export charts as PNG, JPEG, or SVG images
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Export data to Excel or CSV formats
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    PDF generation for complete dashboards
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Configuration saving for recurring reports
                  </li>
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Use Cases */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Perfect For
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-800 mb-2">Business Analysts</h3>
            <p className="text-sm text-gray-600">Create comprehensive reports and dashboards</p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-gray-800 mb-2">Financial Teams</h3>
            <p className="text-sm text-gray-600">Analyze budgets, expenses, and financial metrics</p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="text-3xl mb-3">📈</div>
            <h3 className="font-semibold text-gray-800 mb-2">Sales Teams</h3>
            <p className="text-sm text-gray-600">Track performance by region, product, and time</p>
          </div>
          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-800 mb-2">Data Quality Teams</h3>
            <p className="text-sm text-gray-600">Audit data health and identify issues</p>
          </div>
          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="font-semibold text-gray-800 mb-2">Data Migration Teams</h3>
            <p className="text-sm text-gray-600">Compare datasets and validate transformations</p>
          </div>
          <div className="text-center p-6 bg-indigo-50 rounded-lg">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-800 mb-2">Compliance Teams</h3>
            <p className="text-sm text-gray-600">Reconcile data across systems and sources</p>
          </div>
        </div>
      </div>

      {/* Tips & Best Practices */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Tips & Best Practices
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Data Preparation</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Clean column headers (no special characters)</li>
                <li>• Consistent date formats (YYYY-MM-DD preferred)</li>
                <li>• Numeric values without currency symbols</li>
                <li>• Remove empty rows and columns</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Analysis Tips</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Use hierarchical row dimensions for drill-down analysis</li>
                <li>• Combine multiple filter types for precise analysis</li>
                <li>• Use quick date presets for common time periods</li>
                <li>• Collapse filters section to save screen space</li>
                <li>• Save dashboard configs for recurring reports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>


      {/* Support */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-gray-600 mb-4">
          Upload your data using the file upload area above and start creating powerful insights!
        </p>
        <div className="flex justify-center space-x-4">
          <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Professional Analytics
          </span>
          <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Enterprise Features
          </span>
          <span className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            Actionable Insights
          </span>
        </div>
      </div>

      {/* No Data Message - only show when no data is loaded */}
      {!hasData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            No Data Loaded
          </h3>
          <p className="text-blue-700 mb-4">
            To access the analysis features, please upload a CSV file using the file upload area above this dashboard.
          </p>
          <div className="bg-white border border-blue-300 rounded-lg p-4 inline-block">
            <p className="text-sm text-blue-800 font-medium">
              Tip: Look for the file upload area above this dashboard to get started!
            </p>
          </div>
        </div>
      )}

      {/* Data Loaded Message - show when data is available */}
      {hasData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mt-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Data Successfully Loaded!
          </h3>
          <p className="text-green-700 mb-4">
            Great! Your data is now ready for analysis. Navigate to the Charts, Pivot Tables, or Data Preview tabs to start exploring.
          </p>
          <div className="bg-white border border-green-300 rounded-lg p-4 inline-block">
            <p className="text-sm text-green-800 font-medium">
              Next Steps: Choose a tab above to begin your analysis!
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Features Guide - show when data is available */}
      {hasData && (
        <div className="mt-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              📊 Interactive Dashboard Features
            </h2>
            <p className="text-gray-700 mb-6">
              Go to the <strong>Interactive Dashboard</strong> tab to access these powerful features:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Save & Load */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-2xl mr-2">💾</span>
                  Save & Load Dashboards
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Build your perfect dashboard once, then save it for reuse with future datasets.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Click <strong>💾 Save</strong> to download your dashboard configuration</li>
                  <li>• Click <strong>📂 Load</strong> to restore a saved dashboard</li>
                  <li>• Saves layouts, charts, filters - not the data itself</li>
                  <li>• Perfect for recurring reports with updated data</li>
                </ul>
              </div>

              {/* PDF Export */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-2xl mr-2">📄</span>
                  Export to PDF
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create professional PDF reports from your dashboards instantly.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Click <strong>📄 Export PDF</strong> to generate report</li>
                  <li>• Captures entire dashboard with all charts</li>
                  <li>• Includes timestamp for record keeping</li>
                  <li>• Perfect for presentations and documentation</li>
                </ul>
              </div>

              {/* Advanced Filters */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-2xl mr-2">🔧</span>
                  Advanced Filtering System
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Four powerful filter types in a collapsible, tabbed interface.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• <strong>Category Filters:</strong> Multi-select checkboxes (OR logic)</li>
                  <li>• <strong>Numeric Ranges:</strong> Filter by min/max values</li>
                  <li>• <strong>Text Search:</strong> Search specific columns</li>
                  <li>• <strong>Date Ranges:</strong> With quick presets (Last 7/30 Days, YTD)</li>
                  <li>• All filters work together cumulatively</li>
                  <li>• Active filter badges show what's applied</li>
                </ul>
              </div>

              {/* Drill-Down */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="text-2xl mr-2">🔍</span>
                  Click-to-Drill-Down
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Click any chart element to see the underlying detailed data.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Click any pie slice or bar to drill down</li>
                  <li>• View all raw data rows for that category</li>
                  <li>• See summary statistics (count, total, avg)</li>
                  <li>• Export drill-down data to CSV or Excel</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 bg-blue-100 border border-blue-300 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium text-center">
                💡 Pro Tip: Create your dashboard, save the configuration, then use it weekly/monthly with updated data files!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Welcome;
