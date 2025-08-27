import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';

function App() {
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = (data) => {
    console.log('App: handleFileUpload called with:', { 
      data, 
      fileName: data?.fileName, 
      fileType: data?.fileType 
    });
    setFileData(data);
    setError(null);
  };

  const handleError = (errorMessage) => {
    console.log('App: handleError called with:', errorMessage);
    setError(errorMessage);
    setFileData(null);
  };

  // Reset function to clear all data
  const resetApp = () => {
    console.log('App: resetApp called');
    setFileData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-16 2xl:px-20 flex justify-center">
        <div className="w-full max-w-7xl">
        {/* Reset button for debugging */}
        {fileData && (
          <div className="text-center mb-4">
            <button
              onClick={resetApp}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Reset App (Clear All Data)
            </button>
          </div>
        )}

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

        <Dashboard 
          data={fileData} 
          fileName={fileData?.fileName}
        />
        </div>
      </div>
    </div>
  );
}

export default App;
