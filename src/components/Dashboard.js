import React, { useState, Suspense, lazy } from 'react';
import Welcome from './Welcome';

// Lazy load heavy components to prevent simultaneous analysis
const ChartPreview = lazy(() => import('./ChartPreview'));
const PivotTable = lazy(() => import('./PivotTable'));
const DataPreview = lazy(() => import('./DataPreview'));
const DataQualityDashboard = lazy(() => import('./DataQualityDashboard'));
const SmartRecommendations = lazy(() => import('./SmartRecommendations'));
const DataComparison = lazy(() => import('./DataComparison'));
const DashboardBuilder = lazy(() => import('./DashboardBuilder'));

const Dashboard = ({ data, fileName }) => {
  const [activeTab, setActiveTab] = useState('welcome');
  
  // Check if data is available
  const hasData = data && (data.rows || data.preview);
  
  // Preserve configurations across tab switches
  const [chartConfig, setChartConfig] = useState({
    chartType: 'pie',
    categoryColumn: '',
    valueColumn: '',
    filterColumn: '',
    filterValue: ''
  });
  
  const [pivotConfig, setPivotConfig] = useState({
    rowColumns: [''],
    columnColumn: '',
    filterColumn: '',
    filterValue: '',
    calculationType: 'sum',
    showSubtotals: true,
    showGrandTotal: true,
    conditionalFormatting: true,
    expandedSections: []
  });
  
  // Persist dashboard charts across tab switches
  const [dashboardCharts, setDashboardCharts] = useState([]);

  const tabs = [
    {
      id: 'welcome',
      name: 'Welcome',
      icon: '🎉',
      description: 'Get started with Data Visualization Agent - your comprehensive data analysis platform'
    },
    {
      id: 'smart-recommendations',
      name: 'Smart Recommendations',
      icon: '💡',
      description: 'Get intelligent recommendations for your data analysis'
    },
    {
      id: 'data-quality',
      name: 'Data Quality',
      icon: '🔍',
      description: 'Analyze data health, detect issues, and get recommendations'
    },
    {
      id: 'data-comparison',
      name: 'Data Comparison',
      icon: '🔍',
      description: 'Compare multiple datasets to identify differences and similarities'
    },
    {
      id: 'dashboard-builder',
      name: 'Interactive Dashboard',
      icon: '📊',
      description: 'Create multi-chart layouts with global filtering and interactions'
    },
    {
      id: 'charts',
      name: 'Chart Visualization',
      icon: '📊',
      description: 'Create and customize charts from your data'
    },
    {
      id: 'pivot',
      name: 'Pivot Tables',
      icon: '🔢',
      description: 'Analyze data with interactive pivot tables'
    },
    {
      id: 'data',
      name: 'Data Preview',
      icon: '📋',
      description: 'View and explore your raw data'
    }
  ];

  // No data message component
  const NoDataMessage = ({ tabName }) => (
    <div className="p-8 text-center">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">📁</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
      <p className="text-gray-600 mb-4">
        {tabName} requires data to be uploaded first. Please go to the Welcome tab and upload your Excel or CSV file.
      </p>
      <button
        onClick={() => setActiveTab('welcome')}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Go to Welcome
      </button>
    </div>
  );

  const renderTabContent = () => {
    // If no data and not on welcome tab, show no data message
    if (!hasData && activeTab !== 'welcome') {
      return <NoDataMessage tabName={tabs.find(tab => tab.id === activeTab)?.name} />;
    }

    // Only render the active tab component to prevent all components from analyzing data simultaneously
    switch (activeTab) {
      case 'welcome':
        return <Welcome hasData={hasData} data={data} />;
      case 'smart-recommendations':
        return (
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading AI Recommendations</h3>
              <p className="text-gray-600">Preparing smart analysis...</p>
            </div>
          }>
            <SmartRecommendations 
              data={data} 
              onNavigateToTab={setActiveTab}
              onConfigureChart={(config) => {
                // Update chart configuration when a recommendation is clicked
                setChartConfig({
                  chartType: config.chartType || 'pie',
                  categoryColumn: config.categoryColumn || '',
                  valueColumn: config.valueColumn || '',
                  filterColumn: '',
                  filterValue: ''
                });
              }}
            />
          </Suspense>
        );
      case 'data-quality':
        return (
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Data Quality Analysis</h3>
              <p className="text-gray-600">Preparing quality insights...</p>
            </div>
          }>
            <DataQualityDashboard data={data} />
          </Suspense>
        );
      case 'data-comparison':
        return (
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Data Comparison</h3>
              <p className="text-gray-600">Preparing comparison tools...</p>
            </div>
          }>
            <DataComparison data={data} onNavigateToTab={setActiveTab} onConfigureChart={() => {}} />
          </Suspense>
        );
      case 'dashboard-builder':
        return (
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Dashboard Builder</h3>
              <p className="text-gray-600">Preparing interactive dashboard...</p>
            </div>
          }>
            <DashboardBuilder 
              data={data} 
              dashboardCharts={dashboardCharts}
              setDashboardCharts={setDashboardCharts}
            />
          </Suspense>
        );
      case 'charts':
        return (
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Chart Visualization</h3>
              <p className="text-gray-600">Preparing chart tools...</p>
            </div>
          }>
            <ChartPreview 
              data={data} 
              onReset={() => {
                setChartConfig({
                  chartType: 'pie',
                  categoryColumn: '',
                  valueColumn: '',
                  filterColumn: '',
                  filterValue: ''
                });
              }}
              config={chartConfig}
              onConfigChange={setChartConfig}
            />
          </Suspense>
        );
      case 'pivot':
        return (
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">🔢</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Pivot Tables</h3>
              <p className="text-gray-600">Preparing pivot analysis...</p>
            </div>
          }>
            <PivotTable 
              data={data} 
              onReset={() => {
                setPivotConfig({
                  rowColumns: [''],
                  columnColumn: '',
                  valueColumn: '',
                  filterColumn: '',
                  filterValue: '',
                  calculationType: 'sum',
                  showSubtotals: true,
                  showGrandTotal: true,
                  conditionalFormatting: true,
                  expandedSections: []
                });
              }}
              config={pivotConfig}
              onConfigChange={setPivotConfig}
            />
          </Suspense>
        );
      case 'data':
        return (
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Data Preview</h3>
              <p className="text-gray-600">Preparing data view...</p>
            </div>
          }>
            <DataPreview data={data} />
          </Suspense>
        );
      default:
        return <Welcome />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-16 2xl:px-20 flex justify-center">
          <div className="w-full max-w-7xl">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Visualization Agent</h1>
                <p className="text-sm text-gray-600">Professional Data Analysis Dashboard</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Data Status */}
                {hasData && activeTab !== 'welcome' && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✅ Data Loaded
                    </div>
                    <div className="text-sm text-gray-500">
                      {fileName || 'Untitled Dataset'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-16 2xl:px-20 flex justify-center">
          <div className="w-full max-w-7xl">
            <nav className="flex justify-between w-full" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                    ${!hasData && tab.id !== 'welcome' ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  disabled={!hasData && tab.id !== 'welcome'}
                >
                  <div className="flex items-center space-x-2">
                    <span>{tab.name}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-16 2xl:px-20 py-8 flex justify-center">
        <div className="w-full max-w-7xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h2>
            <p className="text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
