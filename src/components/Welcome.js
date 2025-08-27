import React from 'react';
import SmartRecommendations from './SmartRecommendations';

const Welcome = ({ hasData = false, data = null }) => {
  return (
    <div className="max-w-6xl mx-auto p-8 bg-white">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Analyst Agent
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Data Visualization */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              Data Visualization
            </h3>
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

          {/* Advanced Pivot Tables */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              Enterprise Pivot Tables
            </h3>
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
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Multiple calculation types: Sum, Average, Count, Percentage
              </li>
            </ul>
          </div>

          {/* Data Management */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              Data Management
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Comprehensive data preview with column information
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                File information and data quality insights
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Export processed data to Excel or CSV
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Support for large datasets (up to 10MB)
              </li>
            </ul>
          </div>

          {/* Advanced Features */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              Advanced Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Configuration persistence across tabs
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Optional conditional formatting with color coding
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Professional export options for all analysis types
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Responsive design that works on all devices
              </li>
            </ul>
          </div>

          {/* Interactive Dashboards */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              Interactive Dashboards
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Multi-chart grid layouts (2x2, 3x2, 2x3, 3x3)
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Global filtering across all charts simultaneously
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Pre-built chart templates for quick setup
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Professional dashboard appearance and interactions
              </li>
            </ul>
          </div>

          {/* Data Quality & Profiling */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              Data Quality & Profiling
            </h3>
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

          {/* Smart AI Recommendations */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              Smart AI Recommendations
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                AI-powered chart type suggestions based on data
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
                Customizable column selection for focused analysis
              </li>
            </ul>
          </div>

          {/* Data Comparison Tool */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              Data Comparison Tool
            </h3>
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
                <li>• Double-click cells to see underlying records</li>
                <li>• Export drill-down data for deeper investigation</li>
                <li>• Use filters to focus on specific data subsets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Data */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Sample Data
        </h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            Don't have data ready? Try our sample dataset to explore all features:
          </p>
          <div className="bg-white border rounded p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Sample Sales Data (sample_data.csv)</h4>
            <p className="text-sm text-gray-600 mb-3">
              Contains sales transactions with regions, products, dates, and amounts - perfect for demonstrating pivot tables and charts.
            </p>
            <p className="text-xs text-gray-500">
              File location: Look for 'sample_data.csv' in your project folder
            </p>
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

      {/* Smart Recommendations - show when data is available */}
      {hasData && data && (
        <div className="mt-6">
          <SmartRecommendations 
            data={data} 
            onNavigateToTab={() => {}} // No navigation from welcome tab
            onConfigureChart={() => {}} // No chart configuration from welcome tab
          />
        </div>
      )}
    </div>
  );
};

export default Welcome;
