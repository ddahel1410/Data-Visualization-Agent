import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import ChartPreview from './components/ChartPreview';
import PivotTable from './components/PivotTable';
import ExportOptions from './components/ExportOptions';

function App() {
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);
  
  // Simple state for export functionality instead of complex refs
  const [chartExportData, setChartExportData] = useState(null);
  const [pivotExportData, setPivotExportData] = useState(null);

  const handleFileUpload = (data) => {
    console.log('App: handleFileUpload called with:', { 
      data, 
      fileName: data?.fileName, 
      fileType: data?.fileType 
    });
    setFileData(data);
    setError(null);
    // Clear export data when new file is uploaded
    setChartExportData(null);
    setPivotExportData(null);
  };

  const handleError = (errorMessage) => {
    console.log('App: handleError called with:', errorMessage);
    setError(errorMessage);
    setFileData(null);
    setChartExportData(null);
    setPivotExportData(null);
  };

  // Reset function to clear all data
  const resetApp = () => {
    console.log('App: resetApp called');
    setFileData(null);
    setError(null);
    setChartExportData(null);
    setPivotExportData(null);
  };

  // Simple handlers for export data
  const handleChartExportData = (data) => {
    console.log('App: handleChartExportData called with:', data);
    setChartExportData(data);
  };

  const handlePivotExportData = (data) => {
    console.log('App: handlePivotExportData called with:', data);
    setPivotExportData(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Data Visualization Assistant
          </h1>
          <p className="text-lg text-gray-600">
            Upload your Excel (.xlsx) or CSV file to create interactive charts, build pivot tables, and export your data in multiple formats
          </p>
          
          {/* Reset button for debugging */}
          {fileData && (
            <button
              onClick={resetApp}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Reset App (Clear All Data)
            </button>
          )}
        </div>

        <FileUpload 
          onFileUpload={handleFileUpload} 
          onError={handleError} 
        />

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {fileData && (
          <>
            <DataPreview data={fileData} />
            <ChartPreview 
              data={fileData} 
              onChartExportData={handleChartExportData}
              onReset={() => setChartExportData(null)}
            />
            <PivotTable 
              data={fileData} 
              onPivotExportData={handlePivotExportData}
              onReset={() => setPivotExportData(null)}
            />
            <ExportOptions 
              chartExportData={chartExportData} 
              pivotExportData={pivotExportData}
              fileName={fileData?.fileName}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
