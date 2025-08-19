import React, { useState } from 'react';

const DataPreview = ({ data }) => {
  const [expandedSections, setExpandedSections] = useState({
    fileInfo: true, // File info expanded by default since it's compact
    columnHeaders: false,
    dataPreview: false
  });

  if (!data) return null;

  // Debug logging
  console.log('DataPreview - Received data:', {
    hasData: !!data,
    fileName: data.fileName,
    fileType: data.fileType,
    headersCount: data.headers?.length,
    totalRows: data.rows?.length,
    previewCount: data.preview?.length,
    samplePreview: data.preview?.slice(0, 2),
    sampleHeaders: data.headers?.slice(0, 5)
  });

  // Get total row count (prefer full dataset if available)
  const totalRows = data.rows ? data.rows.length : (data.preview ? data.preview.length : 0);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="mt-8 space-y-4">
      {/* File Info - Compact and always visible */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            📁 File Information
          </h2>
          <div className="text-sm text-gray-500">
            {data.fileType} • {data.headers.length} columns • {totalRows.toLocaleString()} rows
          </div>
        </div>
        
        {/* Large File Warning */}
        {data.largeFileWarning && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Large File Notice:</strong> {data.largeFileWarning}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Charts and pivot tables will work with the full dataset, but preview is limited for performance.
            </p>
          </div>
        )}
        
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">File:</span>
            <span className="ml-2 text-gray-900 truncate block">{data.fileName}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Type:</span>
            <span className="ml-2 text-gray-900">{data.fileType}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Columns:</span>
            <span className="ml-2 text-gray-900">{data.headers.length}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Rows:</span>
            <span className="ml-2 text-gray-900">{totalRows.toLocaleString()}</span>
          </div>
        </div>
        
        {/* File Size Info */}
        {data.fileSizeMB && (
          <div className="mt-2 text-xs text-gray-500">
            File size: {data.fileSizeMB.toFixed(1)}MB | 
            Processed: {data.processedRows ? `${data.processedRows.toLocaleString()} rows` : 'All rows'}
          </div>
        )}
      </div>

      {/* Column Headers - Collapsible */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={() => toggleSection('columnHeaders')}
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              📊 Column Headers ({data.headers.length})
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {expandedSections.columnHeaders ? 'Click to collapse' : 'Click to expand'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                  expandedSections.columnHeaders ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
        
        {expandedSections.columnHeaders && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Header Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sample Values
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.headers.map((header, index) => {
                    // Get sample values for this column
                    const sampleValues = data.preview ? 
                      data.preview.slice(0, 3).map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '') :
                      [];
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {header || <span className="text-gray-400 italic">(Empty)</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {sampleValues.length > 0 ? (
                            <div className="space-y-1">
                              {sampleValues.map((value, valIndex) => (
                                <div key={valIndex} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {String(value)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No data</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Data Preview - Collapsible */}
      {data.preview && data.preview.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={() => toggleSection('dataPreview')}
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                👀 Data Preview
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  First {Math.min(50, totalRows)} rows • {expandedSections.dataPreview ? 'Click to collapse' : 'Click to expand'}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                    expandedSections.dataPreview ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </button>
          
          {expandedSections.dataPreview && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {data.headers.map((header, index) => (
                        <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header || `Column ${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.preview.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {data.headers.map((header, colIndex) => (
                          <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {row[header] || <span className="text-gray-400 italic">-</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataPreview;
