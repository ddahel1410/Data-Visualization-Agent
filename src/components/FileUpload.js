import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const FileUpload = ({ onFileUpload, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE_MB = 10; // 10MB limit
  const RECOMMENDED_FILE_SIZE_MB = 2; // 2MB recommended

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      onError(`File too large: ${fileSizeMB.toFixed(1)}MB. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // Warn about large files
    if (fileSizeMB > RECOMMENDED_FILE_SIZE_MB) {
      const proceed = window.confirm(
        `⚠️ Large File Warning\n\n` +
        `File size: ${fileSizeMB.toFixed(1)}MB\n` +
        `Recommended: Under ${RECOMMENDED_FILE_SIZE_MB}MB\n\n` +
        `Large files may:\n` +
        `• Take longer to process\n` +
        `• Use more memory\n` +
        `• Cause slower performance\n\n` +
        `Do you want to continue?`
      );
      
      if (!proceed) {
        event.target.value = '';
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for large files
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const data = await readFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add file size info to the data
      data.fileSizeMB = fileSizeMB;
      data.totalRows = data.rows ? data.rows.length : (data.preview ? data.preview.length : 0);

      // For large files, limit preview data
      if (data.totalRows > 10000) {
        data.preview = data.preview.slice(0, 1000); // Limit preview to 1000 rows
        data.largeFileWarning = `Large file detected: ${data.totalRows.toLocaleString()} rows. Preview limited to 1,000 rows for performance.`;
      }

      onFileUpload(data);
    } catch (error) {
      console.error('File upload error:', error);
      onError(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with options for large files
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            blankrows: false
          });

          if (jsonData.length === 0) {
            reject(new Error('File appears to be empty or contains no data'));
            return;
          }

          const headers = jsonData[0];
          const rows = jsonData.slice(1);
          
          // For very large files, process in chunks
          let processedRows = rows;
          if (rows.length > 50000) {
            processedRows = rows.slice(0, 50000); // Limit to 50K rows for performance
          }

          // Convert array format back to object format for compatibility
          const objectRows = processedRows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });

          const result = {
            fileName: file.name,
            fileType: file.name.endsWith('.xlsx') ? 'Excel (.xlsx)' : 'CSV',
            headers: headers,
            rows: objectRows, // Use object format for compatibility
            preview: objectRows.slice(0, 50), // Always limit preview to 50 rows
            totalRows: rows.length,
            processedRows: processedRows.length
          };

          console.log('FileUpload - Data processed successfully:', {
            fileName: result.fileName,
            fileType: result.fileType,
            headersCount: result.headers.length,
            totalRows: result.totalRows,
            processedRows: result.processedRows,
            previewRows: result.preview.length,
            samplePreview: result.preview.slice(0, 2),
            sampleHeaders: result.headers.slice(0, 5)
          });

          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse file: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fakeEvent = { target: { files: [file] } };
      handleFileUpload(fakeEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Your Data File</h2>
      
      {/* File Size Guidelines - Collapsible */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md">
        <button
          onClick={() => setShowGuidelines(!showGuidelines)}
          className="w-full p-3 text-left hover:bg-blue-100 transition-colors duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">📁 File Guidelines</span>
            <svg
              className={`w-4 h-4 text-blue-600 transform transition-transform duration-200 ${
                showGuidelines ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {showGuidelines && (
          <div className="px-3 pb-3 border-t border-blue-200">
            <div className="mt-3">
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• <strong>Recommended:</strong> Under {RECOMMENDED_FILE_SIZE_MB}MB for best performance</li>
                <li>• <strong>Maximum:</strong> {MAX_FILE_SIZE_MB}MB</li>
                <li>• <strong>Formats:</strong> Excel (.xlsx) and CSV files</li>
                <li>• <strong>Large files:</strong> Will be processed with performance optimizations</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-lg font-medium text-gray-900">Processing your file...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">This may take a moment for large files</p>
          </div>
        ) : (
          <div className="space-y-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-900">Drop your file here, or click to browse</p>
              <p className="text-sm text-gray-600">Excel (.xlsx) or CSV files up to {MAX_FILE_SIZE_MB}MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
            >
              Choose File
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
