import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

const DataComparison = ({ onNavigateToTab, onConfigureChart }) => {
  const [datasets, setDatasets] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [selectedComparison, setSelectedComparison] = useState('vlookup');
  const [showUpload, setShowUpload] = useState(false);
  
  // VLOOKUP comparison state
  const [vlookupConfig, setVlookupConfig] = useState({
    keyColumns: [], // Columns to match rows on (like VLOOKUP key)
    compareColumns: [], // Columns to compare values
    dataset1: null,
    dataset2: null
  });

  // Comparison types
  const comparisonTypes = [
    {
      id: 'vlookup',
      name: '🔍 VLOOKUP Comparison',
      description: 'Compare datasets using key columns and validate matching values'
    },
    {
      id: 'structure',
      name: '📊 Structure Analysis',
      description: 'Compare column names, data types, and table structure'
    },
    {
      id: 'summary',
      name: '📈 Summary Stats',
      description: 'Compare statistical summaries across datasets'
    }
  ];

  // Handle file upload for comparison
  const handleFileUpload = (event) => {
    console.log('File upload triggered:', event.target.files);
    const files = Array.from(event.target.files);
    
    if (files.length === 0) {
      console.log('No files selected');
      return;
    }
    
    console.log('Processing files:', files.map(f => f.name));
    
    files.forEach((file, index) => {
      console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('File read complete for:', file.name);
        try {
          let data;
          if (file.name.endsWith('.csv')) {
            // Parse CSV
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1).filter(line => line.trim()).map(line => {
              const values = line.split(',').map(v => v.trim());
              const row = {};
              headers.forEach((header, i) => {
                row[header] = values[i] || '';
              });
              return row;
            });
            data = { headers, rows, fileName: file.name, fileSize: file.size };
            console.log('CSV parsed:', { headers: headers.length, rows: rows.length });
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            // Parse Excel file using xlsx library
            const arrayBuffer = e.target.result;
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 0) {
              const headers = jsonData[0];
              const rows = jsonData.slice(1).map(row => {
                const rowObj = {};
                headers.forEach((header, index) => {
                  rowObj[header] = row[index] || '';
                });
                return rowObj;
              });
              data = { headers, rows, fileName: file.name, fileSize: file.size };
              console.log('Excel parsed:', { headers: headers.length, rows: rows.length });
            } else {
              data = { headers: [], rows: [], fileName: file.name, fileSize: file.size };
              console.log('Excel file empty');
            }
          }
          
          console.log('Adding dataset:', data);
          setDatasets(prev => [...prev, { id: Date.now() + index, data, file }]);
        } catch (error) {
          console.error('Error parsing file:', error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error for:', file.name, error);
      };
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  // Remove dataset
  const removeDataset = (id) => {
    setDatasets(prev => prev.filter(ds => ds.id !== id));
    setComparisonResults(null);
    setVlookupConfig({
      keyColumns: [],
      compareColumns: [],
      dataset1: null,
      dataset2: null
    });
  };

  // Get common columns between two datasets
  const getCommonColumns = (dataset1, dataset2) => {
    if (!dataset1 || !dataset2) return [];
    const headers1 = new Set(dataset1.data.headers);
    const headers2 = new Set(dataset2.data.headers);
    return Array.from(headers1).filter(header => headers2.has(header));
  };

  // Run VLOOKUP comparison
  const runVlookupComparison = () => {
    if (!vlookupConfig.dataset1 || !vlookupConfig.dataset2 || vlookupConfig.keyColumns.length === 0) {
      alert('Please select two datasets and at least one key column for comparison.');
      return;
    }

    const dataset1 = datasets.find(ds => ds.id === vlookupConfig.dataset1);
    const dataset2 = datasets.find(ds => ds.id === vlookupConfig.dataset2);

    if (!dataset1 || !dataset2) return;

    // Create lookup maps for dataset2
    const lookupMap = new Map();
    dataset2.data.rows.forEach(row => {
      const key = vlookupConfig.keyColumns.map(col => row[col]).join('|');
      lookupMap.set(key, row);
    });

    // Compare rows from dataset1
    const comparisonResults = [];
    let matchedRows = 0;
    let unmatchedRows = 0;
    let valueMismatches = 0;

    dataset1.data.rows.forEach((row1, index) => {
      const key = vlookupConfig.keyColumns.map(col => row1[col]).join('|');
      const row2 = lookupMap.get(key);

      if (row2) {
        // Row found - compare values
        matchedRows++;
        const columnComparisons = vlookupConfig.compareColumns.map(col => {
          const value1 = row1[col] || '';
          const value2 = row2[col] || '';
          const matches = value1 === value2;
          if (!matches) valueMismatches++;
          
          return {
            column: col,
            value1,
            value2,
            matches,
            difference: value1 !== value2 ? `${value1} → ${value2}` : null
          };
        });

        comparisonResults.push({
          rowIndex: index + 1,
          key: key,
          status: 'matched',
          columnComparisons,
          hasMismatches: columnComparisons.some(comp => !comp.matches)
        });
      } else {
        // Row not found in dataset2
        unmatchedRows++;
        comparisonResults.push({
          rowIndex: index + 1,
          key: key,
          status: 'unmatched',
          columnComparisons: [],
          hasMismatches: false
        });
      }
    });

    // Find rows in dataset2 that don't exist in dataset1
    const dataset1Keys = new Set(dataset1.data.rows.map(row => 
      vlookupConfig.keyColumns.map(col => row[col]).join('|')
    ));
    
    const extraRows = dataset2.data.rows.filter(row => {
      const key = vlookupConfig.keyColumns.map(col => row[col]).join('|');
      return !dataset1Keys.has(key);
    });

    setComparisonResults({
      type: 'vlookup',
      summary: {
        totalRows: dataset1.data.rows.length,
        matchedRows,
        unmatchedRows,
        extraRows: extraRows.length,
        valueMismatches,
        matchRate: ((matchedRows / dataset1.data.rows.length) * 100).toFixed(1)
      },
      comparisonResults,
      extraRows: extraRows.map((row, index) => ({
        rowIndex: index + 1,
        key: vlookupConfig.keyColumns.map(col => row[col]).join('|'),
        status: 'extra',
        row: row
      }))
    });
  };

  // Run structure analysis
  const runStructureAnalysis = () => {
    if (datasets.length < 2) return;

    const allHeaders = new Set();
    const datasetStructures = datasets.map(ds => ({
      name: ds.data.fileName,
      headers: ds.data.headers,
      rowCount: ds.data.rows.length,
      columnCount: ds.data.headers.length
    }));

    datasets.forEach(ds => {
      ds.data.headers.forEach(header => allHeaders.add(header));
    });

    const commonHeaders = datasets[0].data.headers.filter(header =>
      datasets.every(ds => ds.data.headers.includes(header))
    );

    const uniqueHeaders = Array.from(allHeaders).filter(header =>
      !commonHeaders.includes(header)
    );

    setComparisonResults({
      type: 'structure',
      data: {
        commonHeaders,
        uniqueHeaders,
        datasetStructures,
        totalColumns: allHeaders.size
      }
    });
  };

  // Run summary analysis
  const runSummaryAnalysis = () => {
    const summaries = datasets.map(ds => {
      const numericColumns = ds.data.headers.filter(header => {
        const values = ds.data.rows.map(row => row[header]).filter(v => v !== null && v !== '');
        return values.some(v => !isNaN(parseFloat(v)));
      });

      const numericStats = numericColumns.map(header => {
        const values = ds.data.rows
          .map(row => row[header])
          .filter(v => v !== null && v !== '')
          .map(v => parseFloat(v))
          .filter(v => !isNaN(v));

        if (values.length === 0) return null;

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return {
          header,
          count: values.length,
          sum: sum.toFixed(2),
          average: avg.toFixed(2),
          min: min.toFixed(2),
          max: max.toFixed(2)
        };
      }).filter(Boolean);

      return {
        dataset: ds.data.fileName,
        totalRows: ds.data.rows.length,
        totalColumns: ds.data.headers.length,
        numericColumns: numericColumns.length,
        numericStats
      };
    });

    setComparisonResults({
      type: 'summary',
      data: { summaries }
    });
  };

  // Run comparison based on type
  const runComparison = () => {
    switch (selectedComparison) {
      case 'vlookup':
        runVlookupComparison();
        break;
      case 'structure':
        runStructureAnalysis();
        break;
      case 'summary':
        runSummaryAnalysis();
        break;
      default:
        break;
    }
  };

  // Export comparison results
  const exportComparison = () => {
    if (!comparisonResults) return;

    const data = {
      comparisonType: selectedComparison,
      results: comparisonResults,
      timestamp: new Date().toISOString(),
      datasets: datasets.map(ds => ds.data.fileName),
      vlookupConfig: selectedComparison === 'vlookup' ? vlookupConfig : null
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-comparison-${selectedComparison}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-purple-900">Smart Data Comparison Tool</h3>
              <p className="text-purple-700">
                VLOOKUP-style comparison with row matching and value validation
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>{showUpload ? '▼' : '▶'}</span>
            <span>Upload Datasets</span>
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      {showUpload && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Datasets for Comparison</h4>
            <p className="text-sm text-gray-600">
              Select multiple CSV or Excel files to compare. You need at least 2 datasets for VLOOKUP comparison.
            </p>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {/* Visible file input for testing */}
            <div className="mb-4">
              <input
                type="file"
                multiple
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
            
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-gray-600">
              <span className="font-medium text-purple-600">
                Or use the file input above
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">CSV, Excel files up to 10MB each</p>
          </div>

          {/* Uploaded Datasets */}
          {datasets.length > 0 && (
            <div className="mt-6">
              <h5 className="text-md font-medium text-gray-900 mb-3">Uploaded Datasets ({datasets.length})</h5>
              <div className="space-y-3">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{dataset.data.fileName}</div>
                        <div className="text-sm text-gray-500">
                          {dataset.data.headers.length} columns, {dataset.data.rows.length} rows
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDataset(dataset.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VLOOKUP Configuration */}
      {datasets.length >= 2 && selectedComparison === 'vlookup' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">🔍 VLOOKUP Configuration</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dataset Selection */}
            <div>
              <h5 className="text-md font-medium text-gray-700 mb-3">Select Datasets</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dataset 1 (Source)</label>
                  <select
                    value={vlookupConfig.dataset1 || ''}
                    onChange={(e) => setVlookupConfig(prev => ({ ...prev, dataset1: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select dataset...</option>
                    {datasets.map((ds) => (
                      <option key={ds.id} value={ds.id}>{ds.data.fileName}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dataset 2 (Lookup)</label>
                  <select
                    value={vlookupConfig.dataset2 || ''}
                    onChange={(e) => setVlookupConfig(prev => ({ ...prev, dataset2: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select dataset...</option>
                    {datasets.map((ds) => (
                      <option key={ds.id} value={ds.id}>{ds.data.fileName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Column Selection */}
            <div>
              <h5 className="text-md font-medium text-gray-700 mb-3">Select Columns</h5>
              {vlookupConfig.dataset1 && vlookupConfig.dataset2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Columns (for matching rows)</label>
                    <select
                      multiple
                      value={vlookupConfig.keyColumns}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setVlookupConfig(prev => ({ ...prev, keyColumns: selected }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      size="4"
                    >
                      {getCommonColumns(
                        datasets.find(ds => ds.id === vlookupConfig.dataset1),
                        datasets.find(ds => ds.id === vlookupConfig.dataset2)
                      ).map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Columns to Compare</label>
                    <select
                      multiple
                      value={vlookupConfig.compareColumns}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setVlookupConfig(prev => ({ ...prev, compareColumns: selected }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      size="4"
                    >
                      {getCommonColumns(
                        datasets.find(ds => ds.id === vlookupConfig.dataset1),
                        datasets.find(ds => ds.id === vlookupConfig.dataset2)
                      ).map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple columns</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {vlookupConfig.keyColumns.length > 0 && vlookupConfig.compareColumns.length > 0 && (
            <div className="mt-6">
              <button
                onClick={runVlookupComparison}
                className="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                🔍 Run VLOOKUP Comparison
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comparison Type Selector */}
      {datasets.length >= 2 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Comparison Type</h4>
            {comparisonResults && (
              <button
                onClick={exportComparison}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                📊 Export Results
              </button>
            )}
          </div>

          <div className="flex space-x-2 mb-6">
            {comparisonTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedComparison(type.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedComparison === type.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>

          {selectedComparison !== 'vlookup' && (
            <button
              onClick={runComparison}
              className="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              🔍 Run {comparisonTypes.find(t => t.id === selectedComparison)?.name}
            </button>
          )}
        </div>
      )}

      {/* Comparison Results */}
      {comparisonResults && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900">Comparison Results</h4>
            <p className="text-sm text-gray-600">
              {comparisonTypes.find(t => t.id === selectedComparison)?.description}
            </p>
          </div>

          {/* VLOOKUP Results */}
          {comparisonResults.type === 'vlookup' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-md font-medium text-gray-900 mb-3">📊 Comparison Summary</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{comparisonResults.summary.totalRows}</div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{comparisonResults.summary.matchedRows}</div>
                    <div className="text-sm text-gray-600">Matched Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{comparisonResults.summary.unmatchedRows}</div>
                    <div className="text-sm text-gray-600">Unmatched Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{comparisonResults.summary.matchRate}%</div>
                    <div className="text-sm text-gray-600">Match Rate</div>
                  </div>
                </div>
                
                {comparisonResults.summary.valueMismatches > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-yellow-600 mr-2">⚠️</span>
                      <span className="text-sm text-yellow-800">
                        <strong>{comparisonResults.summary.valueMismatches}</strong> value mismatches found in matched rows
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Results */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">🔍 Row-by-Row Comparison</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Values</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column Comparisons</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResults.comparisonResults.slice(0, 50).map((result, index) => (
                        <tr key={index} className={`border-t border-gray-200 ${result.hasMismatches ? 'bg-yellow-50' : ''}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{result.rowIndex}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              result.status === 'matched' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.status === 'matched' ? '✓ Matched' : '✗ Unmatched'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                            {result.key}
                          </td>
                          <td className="px-4 py-3">
                            {result.status === 'matched' ? (
                              <div className="space-y-1">
                                {result.columnComparisons.map((comp, compIndex) => (
                                  <div key={compIndex} className={`text-xs ${
                                    comp.matches ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    <span className="font-medium">{comp.column}:</span> {comp.matches ? '✓ Match' : `✗ ${comp.difference}`}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">No comparison data</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {comparisonResults.comparisonResults.length > 50 && (
                  <div className="mt-3 text-center text-sm text-gray-500">
                    Showing first 50 rows. Export results to see all data.
                  </div>
                )}
              </div>

              {/* Extra Rows */}
              {comparisonResults.extraRows.length > 0 && (
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-3">➕ Extra Rows in Dataset 2</h5>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>{comparisonResults.extraRows.length}</strong> rows found in Dataset 2 that don't exist in Dataset 1
                    </p>
                    <div className="text-xs text-blue-600">
                      These rows have unique key combinations not present in the source dataset.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Structure Results */}
          {comparisonResults.type === 'structure' && (
            <div className="space-y-6">
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">📊 Structure Overview</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">{comparisonResults.data.totalColumns}</div>
                    <div className="text-sm text-gray-600">Total Unique Columns</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">{comparisonResults.data.commonHeaders.length}</div>
                    <div className="text-sm text-gray-600">Common Columns</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-orange-600">{comparisonResults.data.uniqueHeaders.length}</div>
                    <div className="text-sm text-gray-600">Unique Columns</div>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">📋 Dataset Details</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dataset</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Columns</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResults.data.datasetStructures.map((ds, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{ds.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{ds.columnCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{ds.rowCount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {comparisonResults.data.commonHeaders.length > 0 && (
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-3">🔗 Common Columns</h5>
                  <div className="flex flex-wrap gap-2">
                    {comparisonResults.data.commonHeaders.map((header, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {header}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {comparisonResults.data.uniqueHeaders.length > 0 && (
                <div>
                  <h5 className="text-md font-medium text-gray-900 mb-3">⭐ Unique Columns</h5>
                  <div className="flex flex-wrap gap-2">
                    {comparisonResults.data.uniqueHeaders.map((header, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        {header}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary Results */}
          {comparisonResults.type === 'summary' && (
            <div className="space-y-6">
              <h5 className="text-md font-medium text-gray-900 mb-3">📈 Summary Statistics</h5>
              <div className="space-y-4">
                {comparisonResults.data.summaries.map((summary, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border">
                    <h6 className="font-medium text-gray-900 mb-3">{summary.dataset}</h6>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{summary.totalRows.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Rows</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{summary.totalColumns}</div>
                        <div className="text-sm text-gray-600">Total Columns</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{summary.numericColumns}</div>
                        <div className="text-sm text-gray-600">Numeric Columns</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{summary.numericStats.length}</div>
                        <div className="text-sm text-gray-600">Analyzed Columns</div>
                      </div>
                    </div>
                    
                    {summary.numericStats.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Min</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summary.numericStats.map((stat, statIndex) => (
                              <tr key={statIndex} className="border-t border-gray-200">
                                <td className="px-3 py-2 font-medium text-gray-900">{stat.header}</td>
                                <td className="px-3 py-2 text-gray-600">{stat.count}</td>
                                <td className="px-3 py-2 text-gray-600">{stat.average}</td>
                                <td className="px-3 py-2 text-gray-600">{stat.min}</td>
                                <td className="px-3 py-2 text-gray-600">{stat.max}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data Message */}
      {datasets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Ready for VLOOKUP Comparison?</h4>
          <p className="text-gray-600 mb-4">
            Upload 2 or more datasets to start comparing data with VLOOKUP-style row matching and value validation.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            🚀 Start Comparison
          </button>
        </div>
      )}
    </div>
  );
};

export default DataComparison;
