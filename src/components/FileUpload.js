import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

const FileUpload = ({ onFileUpload, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Performance optimization constants
  const CHUNK_SIZE = 1000; // Process data in 1000-row chunks
  const PREVIEW_ROWS = 1000; // Show first 1000 rows in preview
  const MAX_PREVIEW_ROWS = 5000; // Maximum rows to show in preview
  const PROCESSING_DELAY = 50; // Small delay between chunks to keep UI responsive

  const processDataInChunks = useCallback(async (workbook, sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) return { headers: [], rows: [], preview: [] };

    const headers = jsonData[0];
    const allRows = jsonData.slice(1);
    const totalRows = allRows.length;

    // Create preview data (first chunk)
    const previewRows = allRows.slice(0, Math.min(PREVIEW_ROWS, totalRows));
    const preview = previewRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    // Process full dataset in chunks
    const processedRows = [];
    let currentIndex = 0;

    while (currentIndex < totalRows) {
      const endIndex = Math.min(currentIndex + CHUNK_SIZE, totalRows);
      const chunk = allRows.slice(currentIndex, endIndex);
      
      const processedChunk = chunk.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      processedRows.push(...processedChunk);

      // Update progress
      const progress = Math.round((endIndex / totalRows) * 100);
      setUploadProgress(progress);

      // Small delay to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY));
      
      currentIndex = endIndex;
    }
    
    return {
      headers,
      rows: processedRows,
      preview,
      totalRows,
      processedRows: processedRows.length
    };
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // File size validation with better messaging
    const fileSizeMB = file.size / (1024 * 1024);
    const MAX_FILE_SIZE_MB = 50; // Increased from 10MB
    const RECOMMENDED_FILE_SIZE_MB = 5;

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      onError(`File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    if (fileSizeMB > RECOMMENDED_FILE_SIZE_MB) {
      console.log(`Large file detected: ${fileSizeMB.toFixed(1)}MB - Using optimized processing`);
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        throw new Error('No sheets found in the file');
      }

      // Process data with progress updates
      const processedData = await processDataInChunks(workbook, sheetName);
      
      // Add file metadata
      const result = {
        ...processedData,
        fileName: file.name,
        fileType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: file.size,
        fileSizeMB: fileSizeMB,
        sheetName: sheetName
      };

      console.log('File processing complete:', {
        fileName: result.fileName,
        totalRows: result.totalRows,
        processedRows: result.processedRows,
        fileSizeMB: result.fileSizeMB,
        processingTime: 'Optimized with chunked loading'
      });

      onFileUpload(result);
    } catch (error) {
      console.error('File processing error:', error);
      onError(`Error processing file: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      event.target.value = '';
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
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* File Guidelines - Minimal */}
      <div className="mb-3 text-center">
        <button
          onClick={() => setShowGuidelines(!showGuidelines)}
          className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none underline"
        >
          {showGuidelines ? 'Hide' : 'Show'} file guidelines
        </button>
        
        {showGuidelines && (
          <div className="mt-2 text-xs text-gray-500">
            Excel (.xlsx) or CSV, up to 50MB, headers in first row
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📁</span>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload your data file
        </h3>
        
        <p className="text-gray-600 mb-4">
          Drag and drop your Excel or CSV file here, or click to browse
        </p>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Processing file...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <p className="text-xs text-gray-500 mt-1">
                Optimized processing for large files...
              </p>
            )}
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

        {/* Performance Info */}
        <div className="mt-4 text-xs text-gray-500">
          <p>✨ Optimized for files up to 50MB with chunked processing</p>
          <p>📊 Preview shows first 1,000 rows for quick analysis</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
