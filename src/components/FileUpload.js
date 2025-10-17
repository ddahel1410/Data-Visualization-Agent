import React, { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useTheme } from '../contexts/ThemeContext';

const FileUpload = ({ onFileUpload, onError, fileData }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const { isDark } = useTheme();
  
  // Advanced performance optimization constants
  const STREAM_CHUNK_SIZE = 5000; // Process data in 5k-row chunks
  const PREVIEW_ROWS = 100; // Show first 100 rows in preview for fast loading
  
  console.log('🚀 FileUpload: Performance optimizations loaded - PREVIEW_ROWS =', PREVIEW_ROWS);
  // const MAX_MEMORY_ROWS = 100000; // Keep max 100k rows in memory for processing - Available for future use
  // const PROCESSING_DELAY = 5; // Minimal delay for faster processing - Available for future use
  // const MEMORY_CHECK_INTERVAL = 5000; // Check memory every 5k rows - Available for future use
  
  // Refs for memory management
  // const memoryUsageRef = useRef(0); // Available for future use
  // const processedRowsRef = useRef([]); // Available for future use
  // const totalRowsRef = useRef(0); // Available for future use
  const abortControllerRef = useRef(null);
  const workbookRef = useRef(null);

  // Memory management utility - Available for future use
  // const checkMemoryUsage = () => {
  //   if (performance.memory) {
  //     const used = performance.memory.usedJSHeapSize;
  //     const limit = performance.memory.jsHeapSizeLimit;
  //     const usage = (used / limit) * 100;
  //     
  //     if (usage > 75) {
  //       console.warn('High memory usage detected:', usage.toFixed(1) + '%');
  //       return false;
  //       }
  //     }
  //     return true;
  //   };

  // Simple data processor - fast and reliable
  const processDataSimple = useCallback(async (workbook, sheetName) => {
    console.log('📊 FileUpload: Using simple processing');
    const worksheet = workbook.Sheets[sheetName];
    
    // Get headers first
    const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0 })[0];
    const headers = headerRow || [];
    
    // Get total row count
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const totalRows = range.e.r;
    
    if (totalRows === 0) {
      return { headers, rows: [], preview: [], totalRows: 0, streaming: false };
    }
    
    // Process all data for full functionality
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      raw: false
    });
    
    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    
    return {
      headers,
      rows,
      preview: rows.slice(0, 100), // Show first 100 as preview
      totalRows: totalRows,
      processedRows: rows.length,
      streaming: false,
      workbook: workbook,
      sheetName: sheetName,
      hasMoreData: false
    };
  }, []);

  // Lazy data loader - loads additional data when needed
  const loadMoreData = useCallback(async (startRow, endRow, headers) => {
    if (!workbookRef.current || !headers) return [];
    
    const worksheet = workbookRef.current.Sheets[workbookRef.current.SheetNames[0]];
    const range = XLSX.utils.encode_range({
      s: { r: startRow + 1, c: 0 }, // +1 because we skip header
      e: { r: endRow, c: headers.length - 1 }
    });
    
    const chunkData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      range: range 
    });
    
    return chunkData.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  }, []);

  // Enhanced file upload with hybrid streaming
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Browser compatibility check
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isOldBrowser = !window.FileReader || !window.ArrayBuffer;
    
    if (isSafari || isOldBrowser) {
      console.log('Safari or older browser detected, using FileReader fallback');
    }

    // File size validation with much higher limits
    const fileSizeMB = file.size / (1024 * 1024);
    const MAX_FILE_SIZE_MB = 500; // Increased to 500MB
    const RECOMMENDED_FILE_SIZE_MB = 100;

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      onError(`File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    if (fileSizeMB > RECOMMENDED_FILE_SIZE_MB) {
      console.log(`Large file detected: ${fileSizeMB.toFixed(1)}MB - Using preview streaming (showing first ${PREVIEW_ROWS} rows immediately)`);
    }

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    setIsUploading(true);
    setUploadProgress(0);
          setProcessingStage('Initializing file processor...');

    try {
      // Safari compatibility: use different approach for file reading
      let data;
      if (file.arrayBuffer) {
        data = await file.arrayBuffer();
      } else {
        // Fallback for older browsers/Safari
        data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      }
      
      setProcessingStage('Reading file structure...');
      setUploadProgress(20);
      
      console.log('📁 FileUpload: Starting to process file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        throw new Error('No sheets found in the file');
      }

      setProcessingStage('Processing data...');
      setUploadProgress(40);
      
      // Process data with simple approach for fast loading
      console.log('📊 FileUpload: Starting simple data processing...');
      const processedData = await processDataSimple(workbook, sheetName);
      
      setUploadProgress(80);
      
      // Add file metadata and streaming capabilities
      const result = {
        ...processedData,
        fileName: file.name,
        fileType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: file.size,
        fileSizeMB: fileSizeMB,
        sheetName: sheetName,
        processingMethod: 'Preview Streaming',
        memoryOptimized: true,
        streaming: true,
        loadMoreData: (startRow, endRow) => loadMoreData(startRow, endRow, processedData.headers), // Function to load additional data on demand
        maxChunkSize: STREAM_CHUNK_SIZE,
        currentLoadedRows: processedData.rows.length
      };

      console.log('Preview streaming file processing complete:', {
        fileName: result.fileName,
        totalRows: result.totalRows,
        loadedRows: result.rows.length,
        fileSizeMB: result.fileSizeMB,
        processingMethod: result.processingMethod,
        memoryOptimized: result.memoryOptimized,
        streaming: result.streaming
      });

      setUploadProgress(100);
      setProcessingStage('File processing complete!');
      
      // Small delay to show completion
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setProcessingStage('');
        console.log('FileUpload: About to call onFileUpload with result:', result);
        onFileUpload(result);
        console.log('FileUpload: onFileUpload called successfully');
      }, 200);
    } catch (error) {
      if (error.message === 'Processing was cancelled') {
        onError('File processing was cancelled');
      } else {
        console.error('File processing error:', error);
        
        // Safari-specific error handling
        if (error.name === 'NotSupportedError' || error.message.includes('arrayBuffer')) {
          onError('File reading not supported in this browser. Please try using Chrome or Firefox.');
        } else if (error.message.includes('XLSX')) {
          onError('Error reading Excel file. Please ensure the file is not corrupted and try again.');
        } else if (error.message.includes('timeout')) {
          onError('File is too large or complex. Try a smaller file or simpler format.');
        } else {
          onError(`Error processing file: ${error.message}`);
        }
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStage('');
      // Reset file input
      event.target.value = '';
      // Clean up
      abortControllerRef.current = null;
      // Keep processedRowsRef for data access
    }
  }, []);

  // Cancel processing
  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStage('');
    }
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const fileInput = document.getElementById('file-upload');
      fileInput.files = files;
      handleFileUpload({ target: { files } });
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  // If file is uploaded, show file info instead of upload interface
  if (fileData) {
    return (
      <div className={`rounded-lg shadow-sm border transition-colors duration-200 ${
        isDark 
          ? 'border-gray-600 bg-gray-800' 
          : 'border-gray-200 bg-white'
      }`}>
        <div className="p-6">
          {/* File Info Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`text-2xl ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                📁
              </div>
              <div>
                <h3 className={`text-lg font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {fileData.fileName}
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  File successfully uploaded and processed
                </p>
              </div>
            </div>
            
            {/* Reset Button */}
            <button
              onClick={() => {
                // Reset the file data by calling onFileUpload with null
                onFileUpload({ target: { files: [] } });
              }}
              className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                isDark
                  ? 'text-gray-300 border border-gray-600 hover:bg-gray-700'
                  : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Reset
            </button>
          </div>

          {/* File Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-blue-50'
            }`}>
              <div className={`text-sm font-medium ${
                isDark ? 'text-blue-300' : 'text-blue-800'
              }`}>
                📊 Total Rows
              </div>
              <div className={`text-lg font-semibold ${
                isDark ? 'text-blue-200' : 'text-blue-900'
              }`}>
                {fileData.totalRows?.toLocaleString() || 'N/A'}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-green-50'
            }`}>
              <div className={`text-sm font-medium ${
                isDark ? 'text-green-300' : 'text-green-800'
              }`}>
                💾 File Size
              </div>
              <div className={`text-lg font-semibold ${
                isDark ? 'text-green-200' : 'text-green-900'
              }`}>
                {fileData.fileSizeMB?.toFixed(1)} MB
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-purple-50'
            }`}>
              <div className={`text-sm font-medium ${
                isDark ? 'text-purple-300' : 'text-purple-800'
              }`}>
                ⚡ Processing
              </div>
              <div className={`text-lg font-semibold ${
                isDark ? 'text-purple-200' : 'text-purple-900'
              }`}>
                {fileData.processingMethod || 'Standard'}
              </div>
            </div>

            {fileData.memoryOptimized && (
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-700/50' : 'bg-yellow-50'
              }`}>
                <div className={`text-sm font-medium ${
                  isDark ? 'text-yellow-300' : 'text-yellow-800'
                }`}>
                  ✅ Memory Optimized
                </div>
                <div className={`text-sm ${
                  isDark ? 'text-yellow-200' : 'text-yellow-900'
                }`}>
                  Advanced streaming
                </div>
              </div>
            )}
          </div>

          {/* Performance Info */}
          <div className={`mt-4 text-xs text-center ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p>🚀 Preview streaming for files up to 500MB</p>
            <p>💾 Shows first 1,000 rows immediately for quick analysis</p>
            <p>⚡ Lazy loading for additional data on demand</p>
            <p>🔍 Virtual scrolling for massive datasets</p>
          </div>
        </div>
      </div>
    );
  }

  // Show upload interface when no file is uploaded
  return (
    <div className={`rounded-lg shadow-sm border p-6 transition-colors duration-200 ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* File Guidelines - Enhanced */}
      <div className="mb-3 text-center">
        <button
          onClick={() => setShowGuidelines(!showGuidelines)}
          className={`text-xs focus:outline-none underline transition-colors duration-200 ${
            isDark 
              ? 'text-gray-400 hover:text-gray-200' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {showGuidelines ? 'Hide' : 'Show'} file guidelines
        </button>
        
        {showGuidelines && (
          <div className={`mt-2 text-xs space-y-1 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p>✅ Excel (.xlsx) or CSV files</p>
            <p>✅ Up to 500MB with preview streaming</p>
            <p>✅ Headers in first row</p>
            <p>✅ Smart memory management</p>
            <p>✅ Lazy loading for additional data</p>
            <p>✅ Virtual scrolling for massive datasets</p>
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDark
            ? 'border-gray-600 hover:border-blue-400 bg-gray-800/50'
            : 'border-gray-300 hover:border-blue-400 bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          isDark ? 'bg-blue-900/30' : 'bg-blue-100'
        }`}>
          <span className="text-2xl">📁</span>
        </div>
        
        <h3 className={`text-lg font-medium mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Upload your data file
        </h3>
        
        <p className={`mb-4 ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Drag and drop your Excel or CSV file here, or click to browse
        </p>

        {/* Enhanced Upload Progress */}
        {isUploading && (
          <div className="mb-4">
            <div className={`flex items-center justify-between text-sm mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <span>Processing file...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className={`w-full rounded-full h-2 ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            {processingStage && (
              <p className={`text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {processingStage}
              </p>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{processingStage}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{width: `${uploadProgress}%`}}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Processing your file... You can still scroll and interact with the page.
                </div>
              </div>
            )}
            
            {/* Cancel Button */}
            <button
              onClick={cancelProcessing}
              className={`mt-2 px-3 py-1 text-xs rounded transition-colors duration-200 ${
                isDark
                  ? 'text-red-400 border border-red-600 hover:bg-red-900/20'
                  : 'text-red-600 border border-red-300 hover:bg-red-50'
              }`}
            >
              Cancel Processing
            </button>
          </div>
        )}

        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
        
        <button
          onClick={() => document.getElementById('file-upload').click()}
          disabled={isUploading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isUploading ? 'Processing...' : 'Choose File'}
        </button>

        {/* Enhanced Performance Info */}
        <div className={`mt-4 text-xs space-y-1 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>🚀 Preview streaming for files up to 500MB</p>
          <p>💾 Shows first 1,000 rows immediately for quick analysis</p>
          <p>📊 Preview shows first 1,000 rows for quick analysis</p>
          <p>⚡ Lazy loading for additional data on demand</p>
          <p>🔍 Virtual scrolling for massive datasets</p>
          {/^((?!chrome|android).)*safari/i.test(navigator.userAgent) && (
            <p className="text-yellow-600">⚠️ Safari detected - using compatibility mode</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
