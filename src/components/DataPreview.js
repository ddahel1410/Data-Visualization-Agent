import React, { useState, useMemo, useCallback } from 'react';

const DataPreview = ({ data }) => {
  const [expandedSections, setExpandedSections] = useState({
    columnHeaders: false,
    dataPreview: false
  });

  // Performance optimization constants
  const PREVIEW_CHUNK_SIZE = 100; // Show data in 100-row chunks
  const MAX_VISIBLE_ROWS = 500; // Maximum rows to render at once
  const SCROLL_THRESHOLD = 50; // Pixels from bottom to trigger load more

  // Memoized data processing for performance
  const processedData = useMemo(() => {
    if (!data || (!data.preview && !data.rows)) {
      return {
        headers: [],
        totalRows: 0,
        previewData: [],
        hasMoreData: false
      };
    }

    const headers = data.headers || [];
    const sourceData = data.rows || data.preview || [];
    const totalRows = sourceData.length;

    // For large datasets, only show preview data
    const previewData = totalRows > MAX_VISIBLE_ROWS 
      ? sourceData.slice(0, MAX_VISIBLE_ROWS)
      : sourceData;

    return {
      headers,
      totalRows,
      previewData,
      hasMoreData: totalRows > MAX_VISIBLE_ROWS
    };
  }, [data]);

  // Virtual scrolling state
  const [visibleRows, setVisibleRows] = useState(PREVIEW_CHUNK_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load more data function
  const loadMoreData = useCallback(async () => {
    if (isLoadingMore || !processedData.hasMoreData) return;

    setIsLoadingMore(true);
    
    // Simulate async loading with small delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setVisibleRows(prev => Math.min(prev + PREVIEW_CHUNK_SIZE, processedData.totalRows));
    setIsLoadingMore(false);
  }, [isLoadingMore, processedData.hasMoreData, processedData.totalRows]);

  // Intersection observer for infinite scroll
  const observerRef = useCallback((node) => {
    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && processedData.hasMoreData) {
              loadMoreData();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    }
  }, [processedData.hasMoreData, loadMoreData]);

  if (!data || (!data.preview && !data.rows)) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">
          Please upload data to preview and explore your dataset.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* File Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📁 File Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-800">File Name</div>
            <div className="text-lg text-blue-900">{data.fileName || 'Untitled'}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-800">Total Rows</div>
            <div className="text-lg text-green-900">
              {processedData.totalRows.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-800">Columns</div>
            <div className="text-lg text-purple-900">
              {processedData.headers.length}
            </div>
          </div>
          {data.fileSizeMB && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-orange-800">File Size</div>
              <div className="text-lg text-orange-900">
                {data.fileSizeMB.toFixed(1)} MB
              </div>
            </div>
          )}
          {processedData.hasMoreData && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-yellow-800">Performance</div>
              <div className="text-lg text-yellow-900">
                Optimized View
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Column Headers */}
      <div className="mb-6">
        <button
          onClick={() => setExpandedSections(prev => ({ ...prev, columnHeaders: !prev.columnHeaders }))}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <span>📊 Column Headers ({processedData.headers.length})</span>
          <span className="ml-2">
            {expandedSections.columnHeaders ? '▼' : '▶'}
          </span>
        </button>
        
        {expandedSections.columnHeaders && (
          <div className="mt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {processedData.headers.map((header, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border text-sm">
                  <div className="font-medium text-gray-900">{header}</div>
                  <div className="text-gray-500 text-xs">Column {index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Preview */}
      <div className="mb-6">
        <button
          onClick={() => setExpandedSections(prev => ({ ...prev, dataPreview: !prev.dataPreview }))}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <span>📋 Data Preview</span>
          <span className="ml-2">
            {expandedSections.dataPreview ? '▼' : '▶'}
          </span>
        </button>
        
        {expandedSections.dataPreview && (
          <div className="mt-3">
            {/* Performance Notice for Large Files */}
            {processedData.hasMoreData && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">⚡</span>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Large Dataset Detected</p>
                    <p>Showing first {visibleRows.toLocaleString()} of {processedData.totalRows.toLocaleString()} rows for optimal performance.</p>
                    <p className="text-xs mt-1">Scroll down to load more data automatically.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Data Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {processedData.headers.map((header, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.previewData.slice(0, visibleRows).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {processedData.headers.map((header, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate"
                          title={String(row[header] || '')}
                        >
                          {String(row[header] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Load More Indicator */}
              {processedData.hasMoreData && visibleRows < processedData.totalRows && (
                <div className="bg-gray-50 px-6 py-4 text-center">
                  <div ref={observerRef} className="h-4" />
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading more data...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Showing {visibleRows.toLocaleString()} of {processedData.totalRows.toLocaleString()} rows
                    </p>
                  )}
                </div>
              )}

              {/* End of Data Indicator */}
              {visibleRows >= processedData.totalRows && processedData.totalRows > 0 && (
                <div className="bg-green-50 px-6 py-4 text-center">
                  <p className="text-sm text-green-700">
                    ✅ All {processedData.totalRows.toLocaleString()} rows loaded
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Performance Tips */}
      {processedData.hasMoreData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Performance Tips</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Large datasets use optimized rendering for smooth performance</li>
            <li>• Data loads automatically as you scroll</li>
            <li>• Use filters and charts for focused analysis of large datasets</li>
            <li>• Export specific data ranges rather than entire datasets</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DataPreview;
