import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const DataComparison = ({ onNavigateToTab, onConfigureChart }) => {
  const [datasets, setDatasets] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [selectedComparison, setSelectedComparison] = useState('vlookup');

  // Enhanced VLOOKUP export to Excel with highlighting
  const exportVlookupToExcel = async (exportType = 'all') => {
    if (!comparisonResults || comparisonResults.type !== 'vlookup') {
      alert('No VLOOKUP comparison data available for export');
      return;
    }

    try {
      const XLSX = await import('xlsx');
      
      if (!XLSX || !XLSX.utils) {
        throw new Error('Excel library failed to load');
      }

      const workbook = XLSX.utils.book_new();
      const config = comparisonResults.config;
      
      // Filter results based on export type
      let resultsToExport = comparisonResults.comparisonResults;
      if (exportType === 'mismatches') {
        resultsToExport = comparisonResults.comparisonResults.filter(r => 
          r.status === 'mismatched' || r.status === 'unmatched'
        );
      }

      // Summary Sheet
      const summaryData = [
        ['VLOOKUP Comparison Report'],
        ['Generated:', new Date().toLocaleString()],
        [''],
        ['Configuration'],
        ['Dataset 1:', config.dataset1Name],
        ['Dataset 2:', config.dataset2Name],
        ['Key Column(s):', config.keyColumns.join(', ')],
        ['Compare Column(s):', config.compareColumns.join(', ')],
        [''],
        ['Summary Statistics'],
        ['Metric', 'Value'],
        ['Total Rows', comparisonResults.summary.totalRows],
        ['Matched Rows', comparisonResults.summary.matchedRows],
        ['Mismatched Rows', comparisonResults.summary.mismatchedRows],
        ['Unmatched Rows', comparisonResults.summary.unmatchedRows],
        ['Match Rate', `${comparisonResults.summary.matchRate}%`],
        ['Mismatch Rate', `${comparisonResults.summary.mismatchRate}%`],
        ['Average Confidence', `${comparisonResults.summary.averageConfidence.toFixed(1)}%`]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Detailed Comparison Sheet with all data
      const detailedHeaders = [
        `${config.dataset1Name} Row`,
        `${config.dataset2Name} Row`,
        'Status',
        'Match Type',
        'Confidence',
        ...config.keyColumns.map(col => `Key: ${col}`),
        ...config.compareColumns.flatMap(col => [
          `${config.dataset1Name} - ${col}`,
          `${config.dataset2Name} - ${col}`,
          `${col} Match`
        ])
      ];

      const detailedData = [detailedHeaders];

      resultsToExport.forEach(result => {
        const row = [
          result.rowIndex,
          result.dataset2RowIndex || 'N/A',
          result.status.toUpperCase(),
          result.matchType || 'N/A',
          result.confidence ? `${result.confidence}%` : 'N/A',
          // Key column values
          ...config.keyColumns.map(col => result.row1Data?.[col] || ''),
          // Compare column values and match status
          ...config.compareColumns.flatMap(col => {
            const comparison = result.columnComparisons.find(c => c.column === col);
            return [
              comparison?.value1 || '',
              comparison?.value2 || '',
              comparison ? (comparison.matchMethod === 'exact' ? 'MATCH' : 
                           comparison.matchMethod === 'normalized' ? 'NORMALIZED' :
                           comparison.matchMethod === 'fuzzy' ? 'FUZZY' : 
                           'MISMATCH') : 'N/A'
            ];
          })
        ];
        detailedData.push(row);
      });

      const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
      
      // Set column widths
      const colWidths = [
        { wch: 15 }, // Dataset1 Row
        { wch: 15 }, // Dataset2 Row
        { wch: 12 }, // Status
        { wch: 12 }, // Match Type
        { wch: 10 }, // Confidence
        ...config.keyColumns.map(() => ({ wch: 20 })),
        ...config.compareColumns.flatMap(() => [
          { wch: 25 },
          { wch: 25 },
          { wch: 12 }
        ])
      ];
      detailedSheet['!cols'] = colWidths;

      // Apply cell styling (background colors)
      for (let rowIndex = 1; rowIndex < detailedData.length; rowIndex++) {
        const result = resultsToExport[rowIndex - 1];
        const cellRowIndex = rowIndex + 1; // Excel rows are 1-indexed
        
        // Status cell styling
        const statusCellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 2 });
        if (!detailedSheet[statusCellAddress]) detailedSheet[statusCellAddress] = {};
        detailedSheet[statusCellAddress].s = {
          fill: {
            fgColor: {
              rgb: result.status === 'matched' ? 'C6EFCE' : 
                   result.status === 'mismatched' ? 'FFEB9C' : 'FFC7CE'
            }
          }
        };

        // Color code the match status cells
        config.compareColumns.forEach((col, colIdx) => {
          const matchColIndex = 5 + config.keyColumns.length + (colIdx * 3) + 2;
          const matchCellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: matchColIndex });
          const comparison = result.columnComparisons.find(c => c.column === col);
          
          if (detailedSheet[matchCellAddress]) {
            detailedSheet[matchCellAddress].s = {
              fill: {
                fgColor: {
                  rgb: comparison?.matchMethod === 'exact' || comparison?.matchMethod === 'normalized' ? 'C6EFCE' : 
                       comparison?.matchMethod === 'fuzzy' ? 'BDD7EE' : 'FFC7CE'
                }
              }
            };
          }
        });
      }

      XLSX.utils.book_append_sheet(workbook, detailedSheet, exportType === 'mismatches' ? 'Mismatches Only' : 'All Comparisons');

      // Mismatches Detail Sheet (side-by-side)
      if (exportType === 'all' && comparisonResults.summary.mismatchedRows > 0) {
        const mismatchData = [
          ['Mismatched Rows - Side by Side Comparison'],
          [''],
          ['Row Info', '', 'Dataset 1 Values', ...config.compareColumns, '', 'Dataset 2 Values', ...config.compareColumns],
          [`${config.dataset1Name} Row`, `${config.dataset2Name} Row`, ...config.keyColumns, ...config.compareColumns, 'vs', ...config.keyColumns, ...config.compareColumns]
        ];

        comparisonResults.comparisonResults
          .filter(r => r.status === 'mismatched')
          .forEach(result => {
            mismatchData.push([
              result.rowIndex,
              result.dataset2RowIndex || 'N/A',
              // Dataset 1 values
              ...config.keyColumns.map(col => result.row1Data?.[col] || ''),
              ...config.compareColumns.map(col => result.row1Data?.[col] || ''),
              '→', // Arrow separator
              // Dataset 2 values
              ...config.keyColumns.map(col => result.row2Data?.[col] || ''),
              ...config.compareColumns.map(col => result.row2Data?.[col] || '')
            ]);
          });

        const mismatchSheet = XLSX.utils.aoa_to_sheet(mismatchData);
        mismatchSheet['!cols'] = [
          { wch: 15 },
          { wch: 15 },
          ...config.keyColumns.map(() => ({ wch: 20 })),
          ...config.compareColumns.map(() => ({ wch: 25 })),
          { wch: 3 },
          ...config.keyColumns.map(() => ({ wch: 20 })),
          ...config.compareColumns.map(() => ({ wch: 25 }))
        ];
        XLSX.utils.book_append_sheet(workbook, mismatchSheet, 'Mismatches Side-by-Side');
      }

      // Generate and download Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(data);
      const exportLabel = exportType === 'mismatches' ? 'mismatches' : 'full_comparison';
      link.download = `vlookup_${exportLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Export successful! ${resultsToExport.length} rows exported.`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export comparison to Excel: ' + error.message);
    }
  };

  // Export comparison summary to Excel
  const exportComparisonSummaryToExcel = async () => {
    if (!comparisonResults || comparisonResults.type !== 'summary') {
      alert('No summary data available for export');
      return;
    }

    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');
      
      if (!XLSX || !XLSX.utils) {
        throw new Error('Excel library failed to load');
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Summary Statistics Sheet
      const summaryData = [
        ['Data Comparison Summary Report'],
        ['Generated:', new Date().toLocaleString()],
        [''],
        ['Dataset', 'Total Rows', 'Total Columns', 'Numeric Columns', 'Analyzed Columns']
      ];

      comparisonResults.data.summaries.forEach(summary => {
        summaryData.push([
          summary.dataset,
          summary.totalRows.toLocaleString(),
          summary.totalColumns,
          summary.numericColumns,
          summary.numericStats.length
        ]);
      });

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWorksheet['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      // Detailed Statistics Sheet
      const detailedData = [
        ['Dataset', 'Column', 'Data Type', 'Mean', 'Median', 'Min', 'Max', 'Std Dev', 'Missing %']
      ];

      comparisonResults.data.summaries.forEach(summary => {
        summary.numericStats.forEach(stat => {
          detailedData.push([
            summary.dataset,
            stat.column,
            stat.type,
            stat.mean ? stat.mean.toFixed(2) : 'N/A',
            stat.median ? stat.median.toFixed(2) : 'N/A',
            stat.min !== undefined ? stat.min.toFixed(2) : 'N/A',
            stat.max !== undefined ? stat.max.toFixed(2) : 'N/A',
            stat.stdDev ? stat.stdDev.toFixed(2) : 'N/A',
            stat.missingPercentage ? `${stat.missingPercentage.toFixed(1)}%` : '0%'
          ]);
        });
      });

      const detailedWorksheet = XLSX.utils.aoa_to_sheet(detailedData);
      detailedWorksheet['!cols'] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(workbook, detailedWorksheet, 'Detailed Stats');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Download file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(data);
      link.download = `data_comparison_summary_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Error exporting comparison summary to Excel:', error);
      alert('Failed to export comparison summary to Excel: ' + error.message);
    }
  };
  const [showUpload, setShowUpload] = useState(false);
  
  // Enhanced VLOOKUP comparison state
  const [vlookupConfig, setVlookupConfig] = useState({
    keyColumns: [], // Columns to match rows on (like VLOOKUP key)
    compareColumns: [], // Columns to compare values
    dataset1: null,
    dataset2: null,
    // New fuzzy matching options
    fuzzyMatching: true,
    similarityThreshold: 0.8,
    normalizeData: true,
    caseSensitive: false,
    ignoreSpaces: true,
    customMappings: {} // User-defined value mappings
  });

  // Advanced fuzzy matching configuration
  const [fuzzyConfig, setFuzzyConfig] = useState({
    enableFuzzy: true,
    minSimilarity: 0.7,
    maxCandidates: 5,
    useAdvancedAlgorithms: true,
    customRules: []
  });

  // Comparison types with enhanced options
  const comparisonTypes = [
    {
      id: 'vlookup',
      name: '🔍 Advanced VLOOKUP Comparison',
      description: 'Compare datasets using key columns with fuzzy matching and data reconciliation'
    },
    {
      id: 'fuzzy',
      name: '🔍 Fuzzy Data Reconciliation',
      description: 'Find near-matches using similarity algorithms and data normalization'
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
    },
    {
      id: 'visual',
      name: '👁️ Visual Comparison',
      description: 'Side-by-side data comparison with highlighted differences'
    }
  ];

  // Enhanced data normalization functions
  const normalizeValue = (value, config) => {
    if (value === null || value === undefined || value === '') return '';
    
    let normalized = String(value);
    
    if (!config.caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    
    if (config.ignoreSpaces) {
      normalized = normalized.trim().replace(/\s+/g, ' ');
    }
    
    if (config.normalizeData) {
      // Common abbreviations and standardizations
      const abbreviations = {
        'inc': 'incorporated',
        'corp': 'corporation',
        'ltd': 'limited',
        'co': 'company',
        'nyc': 'new york city',
        'la': 'los angeles',
        'sf': 'san francisco'
      };
      
      Object.entries(abbreviations).forEach(([abbr, full]) => {
        normalized = normalized.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
      });
    }
    
    return normalized;
  };

  // Calculate string similarity using multiple algorithms
  const calculateSimilarity = (str1, str2, config) => {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;
    
    const normalized1 = normalizeValue(str1, config);
    const normalized2 = normalizeValue(str2, config);
    
    if (normalized1 === normalized2) return 1;
    
    // Levenshtein distance
    const levenshteinDistance = (s1, s2) => {
      const matrix = [];
      for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= s1.length; j++) {
        matrix[0][j] = j;
      }
      
      for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
          if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      
      return matrix[s2.length][s1.length];
    };
    
    // Jaro-Winkler similarity
    const jaroWinklerSimilarity = (s1, s2) => {
      if (s1.length === 0 && s2.length === 0) return 1;
      if (s1.length === 0 || s2.length === 0) return 0;
      
      let matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
      if (matchWindow < 0) matchWindow = 0;
      
      const s1Matches = new Array(s1.length).fill(false);
      const s2Matches = new Array(s2.length).fill(false);
      
      let matches = 0;
      let transpositions = 0;
      
      // Find matches
      for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, s2.length);
        
        for (let j = start; j < end; j++) {
          if (s2Matches[j] || s1.charAt(i) !== s2.charAt(j)) continue;
          s1Matches[i] = true;
          s2Matches[j] = true;
          matches++;
          break;
        }
      }
      
      if (matches === 0) return 0;
      
      // Find transpositions
      let k = 0;
      for (let i = 0; i < s1.length; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1.charAt(i) !== s2.charAt(k)) transpositions++;
        k++;
      }
      
      const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
      
      // Winkler modification
      let prefix = 0;
      for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
        if (s1.charAt(i) === s2.charAt(i)) prefix++;
        else break;
      }
      
      return jaro + 0.1 * prefix * (1 - jaro);
    };
    
    // Cosine similarity for longer strings
    const cosineSimilarity = (s1, s2) => {
      const words1 = s1.toLowerCase().split(/\s+/);
      const words2 = s2.toLowerCase().split(/\s+/);
      
      const wordFreq1 = {};
      const wordFreq2 = {};
      
      words1.forEach(word => wordFreq1[word] = (wordFreq1[word] || 0) + 1);
      words2.forEach(word => wordFreq2[word] = (wordFreq2[word] || 0) + 1);
      
      const allWords = new Set([...words1, ...words2]);
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;
      
      allWords.forEach(word => {
        const freq1 = wordFreq1[word] || 0;
        const freq2 = wordFreq2[word] || 0;
        dotProduct += freq1 * freq2;
        norm1 += freq1 * freq1;
        norm2 += freq2 * freq2;
      });
      
      if (norm1 === 0 || norm2 === 0) return 0;
      return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    };
    
    // Calculate similarities using different methods
    const levenshteinSim = 1 - (levenshteinDistance(normalized1, normalized2) / Math.max(normalized1.length, normalized2.length));
    const jaroWinklerSim = jaroWinklerSimilarity(normalized1, normalized2);
    const cosineSim = cosineSimilarity(normalized1, normalized2);
    
    // Weighted combination of methods
    if (config.useAdvancedAlgorithms) {
      return (levenshteinSim * 0.4 + jaroWinklerSim * 0.4 + cosineSim * 0.2);
    } else {
      return levenshteinSim;
    }
  };

  // Enhanced fuzzy matching with confidence scoring
  const findFuzzyMatches = (key1, dataset2, keyColumns, config) => {
    const candidates = [];
    const normalizedKey1 = keyColumns.map(col => normalizeValue(key1[col], config)).join('|');
    
    dataset2.data.rows.forEach((row2, index) => {
      const normalizedKey2 = keyColumns.map(col => normalizeValue(row2[col], config)).join('|');
      
      // Exact match
      if (normalizedKey1 === normalizedKey2) {
        candidates.push({
          row: row2,
          index,
          similarity: 1,
          method: 'exact',
          confidence: 100,
          key: normalizedKey2
        });
        return;
      }
      
      // Fuzzy match
      const similarity = calculateSimilarity(normalizedKey1, normalizedKey2, config);
      if (similarity >= config.minSimilarity) {
        candidates.push({
          row: row2,
          index,
          similarity,
          method: 'fuzzy',
          confidence: Math.round(similarity * 100),
          key: normalizedKey2
        });
      }
    });
    
    // Sort by similarity and limit candidates
    return candidates
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, config.maxCandidates);
  };

  // Enhanced VLOOKUP comparison with fuzzy matching
  const runVlookupComparison = () => {
    if (!vlookupConfig.dataset1 || !vlookupConfig.dataset2 || vlookupConfig.keyColumns.length === 0) {
      alert('Please select two datasets and at least one key column for comparison.');
      return;
    }

    const dataset1 = datasets.find(ds => ds.id === vlookupConfig.dataset1);
    const dataset2 = datasets.find(ds => ds.id === vlookupConfig.dataset2);

    if (!dataset1 || !dataset2) return;

    // Create lookup maps for dataset2 with fuzzy matching
    const lookupMap = new Map();
    const fuzzyLookupMap = new Map();
    
    dataset2.data.rows.forEach((row, rowIndex) => {
      const key = vlookupConfig.keyColumns.map(col => row[col]).join('|');
      const normalizedKey = vlookupConfig.keyColumns.map(col => normalizeValue(row[col], vlookupConfig)).join('|');
      
      // Store row with its original index
      const rowWithIndex = { ...row, __originalRowIndex: rowIndex + 1 };
      lookupMap.set(key, rowWithIndex);
      lookupMap.set(normalizedKey, rowWithIndex);
      
      // Store for fuzzy matching
      if (vlookupConfig.fuzzyMatching) {
        fuzzyLookupMap.set(normalizedKey, rowWithIndex);
      }
    });

    // Compare rows from dataset1
    const comparisonResults = [];
    let matchedRows = 0;
    let unmatchedRows = 0;
    let mismatchedRows = 0;
    let valueMismatches = 0;
    let fuzzyMatches = 0;

    dataset1.data.rows.forEach((row1, index) => {
      const key = vlookupConfig.keyColumns.map(col => row1[col]).join('|');
      const normalizedKey = vlookupConfig.keyColumns.map(col => normalizeValue(row1[col], vlookupConfig)).join('|');
      
      let row2 = lookupMap.get(key) || lookupMap.get(normalizedKey);
      let matchType = 'exact';
      let confidence = 100;
      let fuzzyCandidates = [];

      // Try fuzzy matching if exact match not found
      if (!row2 && vlookupConfig.fuzzyMatching) {
        const candidates = findFuzzyMatches(
          row1, 
          dataset2, 
          vlookupConfig.keyColumns, 
          fuzzyConfig
        );
        
        if (candidates.length > 0) {
          row2 = candidates[0].row;
          matchType = 'fuzzy';
          confidence = candidates[0].confidence;
          fuzzyCandidates = candidates;
          fuzzyMatches++;
        }
      }

      if (row2) {
        // Row found - compare values
        const columnComparisons = vlookupConfig.compareColumns.map(col => {
          const value1 = row1[col] || '';
          const value2 = row2[col] || '';
          const normalized1 = normalizeValue(value1, vlookupConfig);
          const normalized2 = normalizeValue(value2, vlookupConfig);
          
          const exactMatch = value1 === value2;
          const normalizedMatch = normalized1 === normalized2;
          const fuzzyMatch = !exactMatch && !normalizedMatch && vlookupConfig.fuzzyMatching;
          
          let similarity = 0;
          let matchMethod = 'none';
          
          if (exactMatch) {
            matchMethod = 'exact';
            similarity = 1;
          } else if (normalizedMatch) {
            matchMethod = 'normalized';
            similarity = 0.95;
          } else if (fuzzyMatch) {
            similarity = calculateSimilarity(value1, value2, vlookupConfig);
            matchMethod = similarity >= vlookupConfig.similarityThreshold ? 'fuzzy' : 'none';
          }
          
          if (matchMethod === 'none') valueMismatches++;
          
          return {
            column: col,
            value1,
            value2,
            normalized1,
            normalized2,
            exactMatch,
            normalizedMatch,
            fuzzyMatch,
            similarity,
            matchMethod,
            confidence: Math.round(similarity * 100),
            difference: !exactMatch ? `${value1} → ${value2}` : null
          };
        });

        // Determine if this is truly a "matched" row based on value comparisons
        const hasValueMismatches = columnComparisons.some(comp => comp.matchMethod === 'none');
        const overallSimilarity = columnComparisons.reduce((sum, comp) => sum + comp.similarity, 0) / columnComparisons.length;
        
        // Consider it "matched" only if values actually match (not just keys)
        const isTrulyMatched = !hasValueMismatches && overallSimilarity >= 0.8;
        
        // Count based on actual match status
        if (isTrulyMatched) {
          matchedRows++;
        } else {
          mismatchedRows++;
        }
        
        comparisonResults.push({
          rowIndex: index + 1,
          dataset2RowIndex: row2.__originalRowIndex,
          row1Data: row1,
          row2Data: row2,
          key: key,
          normalizedKey: normalizedKey,
          status: isTrulyMatched ? 'matched' : 'mismatched',
          matchType,
          confidence,
          fuzzyCandidates,
          columnComparisons,
          hasMismatches: hasValueMismatches,
          overallSimilarity: overallSimilarity
        });
      } else {
        // Row not found in dataset2
        unmatchedRows++;
        comparisonResults.push({
          rowIndex: index + 1,
          dataset2RowIndex: null,
          row1Data: row1,
          row2Data: null,
          key: key,
          normalizedKey: normalizedKey,
          status: 'unmatched',
          matchType: 'none',
          confidence: 0,
          fuzzyCandidates: [],
          columnComparisons: [],
          hasMismatches: false,
          overallSimilarity: 0
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
      config: {
        keyColumns: vlookupConfig.keyColumns,
        compareColumns: vlookupConfig.compareColumns,
        dataset1Name: dataset1.data.fileName,
        dataset2Name: dataset2.data.fileName
      },
      summary: {
        totalRows: dataset1.data.rows.length,
        matchedRows,
        mismatchedRows,
        unmatchedRows,
        extraRows: extraRows.length,
        valueMismatches,
        fuzzyMatches,
        matchRate: ((matchedRows / dataset1.data.rows.length) * 100).toFixed(1),
        mismatchRate: ((mismatchedRows / dataset1.data.rows.length) * 100).toFixed(1),
        averageConfidence: comparisonResults
          .filter(r => r.status === 'matched')
          .reduce((sum, r) => sum + r.confidence, 0) / matchedRows || 0
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

  // Run visual comparison
  const runVisualComparison = () => {
    if (datasets.length < 2) return;

    const dataset1 = datasets[0];
    const dataset2 = datasets[1];
    
    // Find common columns for comparison
    const commonColumns = getCommonColumns(dataset1, dataset2);
    
    // Sample data for visual comparison (first 20 rows)
    const sampleRows1 = dataset1.data.rows.slice(0, 20);
    const sampleRows2 = dataset2.data.rows.slice(0, 20);
    
    setComparisonResults({
      type: 'visual',
      data: {
        dataset1: { name: dataset1.data.fileName, rows: sampleRows1, headers: dataset1.data.headers },
        dataset2: { name: dataset2.data.fileName, rows: sampleRows2, headers: dataset2.data.headers },
        commonColumns,
        totalRows1: dataset1.data.rows.length,
        totalRows2: dataset2.data.rows.length
      }
    });
  };

  // Run comparison based on type
  const runComparison = () => {
    switch (selectedComparison) {
      case 'vlookup':
        runVlookupComparison();
        break;
      case 'fuzzy':
        runVlookupComparison(); // Reusing runVlookupComparison for fuzzy matching
        break;
      case 'visual':
        runVisualComparison();
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
      dataset2: null,
      fuzzyMatching: true,
      similarityThreshold: 0.8,
      normalizeData: true,
      caseSensitive: false,
      ignoreSpaces: true,
      customMappings: {}
    });
  };

  // Get common columns between two datasets
  const getCommonColumns = (dataset1, dataset2) => {
    if (!dataset1 || !dataset2) return [];
    const headers1 = new Set(dataset1.data.headers);
    const headers2 = new Set(dataset2.data.headers);
    return Array.from(headers1).filter(header => headers2.has(header));
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
          <h4 className="text-lg font-medium text-gray-900 mb-4">🔍 Advanced VLOOKUP Configuration</h4>
          
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

          {/* Fuzzy Matching Configuration */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h5 className="text-md font-medium text-blue-900 mb-3">🔍 Fuzzy Matching Options</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={vlookupConfig.fuzzyMatching}
                    onChange={(e) => setVlookupConfig(prev => ({ ...prev, fuzzyMatching: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-blue-800">Enable Fuzzy Matching</span>
                </label>
                <p className="text-xs text-blue-600 mt-1">Find near-matches when exact matches fail</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Similarity Threshold</label>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={vlookupConfig.similarityThreshold}
                  onChange={(e) => setVlookupConfig(prev => ({ ...prev, similarityThreshold: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-blue-600 mt-1">
                  {(vlookupConfig.similarityThreshold * 100).toFixed(0)}% minimum similarity
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={vlookupConfig.normalizeData}
                    onChange={(e) => setVlookupConfig(prev => ({ ...prev, normalizeData: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-blue-800">Normalize Data</span>
                </label>
                <p className="text-xs text-blue-600 mt-1">Handle abbreviations and standardizations</p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={vlookupConfig.caseSensitive}
                    onChange={(e) => setVlookupConfig(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-blue-800">Case Sensitive</span>
                </label>
                <p className="text-xs text-blue-600 mt-1">Distinguish between upper/lower case</p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={vlookupConfig.ignoreSpaces}
                    onChange={(e) => setVlookupConfig(prev => ({ ...prev, ignoreSpaces: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-blue-800">Ignore Extra Spaces</span>
                </label>
                <p className="text-xs text-blue-600 mt-1">Normalize spacing differences</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Advanced Algorithms</label>
                <div className="text-xs text-blue-600">
                  <div>• Levenshtein Distance</div>
                  <div>• Jaro-Winkler Similarity</div>
                  <div>• Cosine Similarity</div>
                </div>
              </div>
            </div>
          </div>

          {vlookupConfig.keyColumns.length > 0 && vlookupConfig.compareColumns.length > 0 && (
            <div className="mt-6">
              <button
                onClick={runVlookupComparison}
                className="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                🔍 Run Advanced VLOOKUP Comparison
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
              <div className="flex gap-2">
                {comparisonResults.type === 'vlookup' && (
                  <>
                    <button
                      onClick={() => exportVlookupToExcel('all')}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors shadow-sm"
                      title="Export all comparison results with highlighting"
                    >
                      📊 Export All
                    </button>
                    <button
                      onClick={() => exportVlookupToExcel('mismatches')}
                      className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors shadow-sm"
                      title="Export only mismatched and unmatched rows"
                    >
                      ⚠️ Export Mismatches
                    </button>
                  </>
                )}
                {comparisonResults.type !== 'vlookup' && (
                  <button
                    onClick={exportComparison}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                  >
                    📊 Export Results
                  </button>
                )}
              </div>
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
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{comparisonResults.summary.totalRows}</div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{comparisonResults.summary.matchedRows}</div>
                    <div className="text-sm text-gray-600">Matched Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{comparisonResults.summary.mismatchedRows}</div>
                    <div className="text-sm text-gray-600">Mismatched Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{comparisonResults.summary.unmatchedRows}</div>
                    <div className="text-sm text-gray-600">Unmatched Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{comparisonResults.summary.matchRate}%</div>
                    <div className="text-sm text-gray-600">Match Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{comparisonResults.summary.mismatchRate}%</div>
                    <div className="text-sm text-gray-600">Mismatch Rate</div>
                  </div>
                  {comparisonResults.summary.fuzzyMatches > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{comparisonResults.summary.fuzzyMatches}</div>
                      <div className="text-sm text-gray-600">Fuzzy Matches</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">
                      {comparisonResults.summary.averageConfidence ? comparisonResults.summary.averageConfidence.toFixed(1) : 'N/A'}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Confidence</div>
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

                {comparisonResults.summary.fuzzyMatches > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-2">🔍</span>
                      <span className="text-sm text-blue-800">
                        <strong>{comparisonResults.summary.fuzzyMatches}</strong> rows matched using fuzzy algorithms
                        (Average confidence: {comparisonResults.summary.averageConfidence ? comparisonResults.summary.averageConfidence.toFixed(1) : 'N/A'}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Results */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">🔍 Row-by-Row Comparison</h5>
                
                {/* Key Column Information */}
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-600 font-semibold mr-2">🔑 Matching Key Column(s):</span>
                    <div className="flex flex-wrap gap-2">
                      {comparisonResults.config.keyColumns.map((col, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-blue-700">
                    Rows are matched based on these column(s). Use the row numbers below to locate entries in your original files.
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{comparisonResults.config.dataset1Name} Row</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{comparisonResults.config.dataset2Name} Row</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Values</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column Comparisons</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResults.comparisonResults.slice(0, 50).map((result, index) => (
                        <tr key={index} className={`border-t border-gray-200 ${
                          result.hasMismatches ? 'bg-yellow-50' : 
                          result.matchType === 'fuzzy' ? 'bg-blue-50' : ''
                        }`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-800">
                              Row {result.rowIndex}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {result.dataset2RowIndex ? (
                              <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-800">
                                Row {result.dataset2RowIndex}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">Not found</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              result.status === 'matched' 
                                ? 'bg-green-100 text-green-800' 
                                : result.status === 'mismatched'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.status === 'matched' ? '✓ Matched' : 
                               result.status === 'mismatched' ? '⚠ Mismatched' : 
                               '✗ Unmatched'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {(result.status === 'matched' || result.status === 'mismatched') && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                result.matchType === 'exact' ? 'bg-green-100 text-green-800' :
                                result.matchType === 'normalized' ? 'bg-blue-100 text-blue-800' :
                                result.matchType === 'fuzzy' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {result.matchType === 'exact' ? '🔍 Exact' :
                                 result.matchType === 'normalized' ? '🔄 Normalized' :
                                 result.matchType === 'fuzzy' ? '🔍 Fuzzy' : '❓ Unknown'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {(result.status === 'matched' || result.status === 'mismatched') && (
                              <div className="text-center">
                                <div className={`text-sm font-medium ${
                                  result.confidence >= 90 ? 'text-green-600' :
                                  result.confidence >= 70 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {result.confidence}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {result.overallSimilarity ? `(${(result.overallSimilarity * 100).toFixed(1)}% avg)` : ''}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                            <div>{result.key}</div>
                            {result.normalizedKey !== result.key && (
                              <div className="text-blue-600 text-xs mt-1">
                                Normalized: {result.normalizedKey}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {(result.status === 'matched' || result.status === 'mismatched') ? (
                              <div className="space-y-1">
                                {result.columnComparisons.map((comp, compIndex) => (
                                  <div key={compIndex} className={`text-xs ${
                                    comp.matchMethod === 'exact' ? 'text-green-600' :
                                    comp.matchMethod === 'normalized' ? 'text-blue-600' :
                                    comp.matchMethod === 'fuzzy' ? 'text-purple-600' : 'text-red-600'
                                  }`}>
                                    <span className="font-medium">{comp.column}:</span> 
                                    {comp.matchMethod === 'exact' ? ' ✓ Exact Match' :
                                     comp.matchMethod === 'normalized' ? ' 🔄 Normalized Match' :
                                     comp.matchMethod === 'fuzzy' ? ` 🔍 Fuzzy (${comp.confidence}%)` :
                                     ` ✗ ${comp.difference}`}
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
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-md font-medium text-gray-900">📈 Summary Statistics</h5>
                <button
                  onClick={exportComparisonSummaryToExcel}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200 shadow-sm"
                >
                  <span className="mr-2">📊</span>
                  Export Summary
                </button>
              </div>
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

          {/* Visual Comparison Results */}
          {comparisonResults.type === 'visual' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="text-md font-medium text-blue-900 mb-3">👁️ Visual Comparison Overview</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{comparisonResults.data.totalRows1.toLocaleString()}</div>
                    <div className="text-sm text-blue-700">{comparisonResults.data.dataset1.name}</div>
                    <div className="text-xs text-blue-600">Total Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{comparisonResults.data.totalRows2.toLocaleString()}</div>
                    <div className="text-sm text-green-700">{comparisonResults.data.dataset2.name}</div>
                    <div className="text-xs text-green-600">Total Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{comparisonResults.data.commonColumns.length}</div>
                    <div className="text-sm text-purple-700">Common Columns</div>
                    <div className="text-xs text-purple-600">For Comparison</div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Data Comparison */}
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">📊 Side-by-Side Data Comparison</h5>
                <div className="text-sm text-gray-600 mb-4">
                  Showing first 20 rows from each dataset. Green highlights indicate matching values, 
                  red highlights show differences, and yellow highlights indicate potential issues.
                </div>
                
                <div className="overflow-x-auto">
                  <div className="min-w-full bg-white border border-gray-200 rounded-lg">
                    {/* Headers */}
                    <div className="grid grid-cols-2 border-b border-gray-200">
                      <div className="p-3 bg-gray-50 font-medium text-gray-900 text-center">
                        {comparisonResults.data.dataset1.name}
                      </div>
                      <div className="p-3 bg-gray-50 font-medium text-gray-900 text-center">
                        {comparisonResults.data.dataset2.name}
                      </div>
                    </div>
                    
                    {/* Data Rows */}
                    {comparisonResults.data.dataset1.rows.map((row1, index) => {
                      const row2 = comparisonResults.data.dataset2.rows[index];
                      return (
                        <div key={index} className="grid grid-cols-2 border-b border-gray-200">
                          {/* Dataset 1 Row */}
                          <div className="p-3 bg-gray-50">
                            <div className="text-xs font-medium text-gray-500 mb-2">Row {index + 1}</div>
                            {comparisonResults.data.commonColumns.map((col, colIndex) => {
                              const value1 = row1[col] || '';
                              const value2 = row2 ? (row2[col] || '') : '';
                              const isMatch = value1 === value2;
                              const isEmpty1 = value1 === '' || value1 === null || value1 === undefined;
                              const isEmpty2 = value2 === '' || value2 === null || value2 === undefined;
                              
                              let bgColor = 'bg-white';
                              let textColor = 'text-gray-900';
                              let borderColor = 'border-gray-200';
                              
                              if (isEmpty1 && isEmpty2) {
                                bgColor = 'bg-gray-100';
                                textColor = 'text-gray-500';
                              } else if (isMatch) {
                                bgColor = 'bg-green-50';
                                textColor = 'text-green-800';
                                borderColor = 'border-green-200';
                              } else if (isEmpty1 || isEmpty2) {
                                bgColor = 'bg-yellow-50';
                                textColor = 'text-yellow-800';
                                borderColor = 'border-yellow-200';
                              } else {
                                bgColor = 'bg-red-50';
                                textColor = 'text-red-800';
                                borderColor = 'border-red-200';
                              }
                              
                              return (
                                <div key={colIndex} className={`mb-2 p-2 rounded border ${bgColor} ${borderColor}`}>
                                  <div className="text-xs font-medium text-gray-600 mb-1">{col}</div>
                                  <div className={`text-sm ${textColor}`}>
                                    {isEmpty1 ? <span className="italic text-gray-400">(empty)</span> : value1}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Dataset 2 Row */}
                          <div className="p-3 bg-gray-50">
                            <div className="text-xs font-medium text-gray-500 mb-2">Row {index + 1}</div>
                            {comparisonResults.data.commonColumns.map((col, colIndex) => {
                              const value1 = row1[col] || '';
                              const value2 = row2 ? (row2[col] || '') : '';
                              const isMatch = value1 === value2;
                              const isEmpty1 = value1 === '' || value1 === null || value1 === undefined;
                              const isEmpty2 = value2 === '' || value2 === null || value2 === undefined;
                              
                              let bgColor = 'bg-white';
                              let textColor = 'text-gray-900';
                              let borderColor = 'border-gray-200';
                              
                              if (isEmpty1 && isEmpty2) {
                                bgColor = 'bg-gray-100';
                                textColor = 'text-gray-500';
                              } else if (isMatch) {
                                bgColor = 'bg-green-50';
                                textColor = 'text-green-800';
                                borderColor = 'border-green-200';
                              } else if (isEmpty1 || isEmpty2) {
                                bgColor = 'bg-yellow-50';
                                textColor = 'text-yellow-800';
                                borderColor = 'border-yellow-200';
                              } else {
                                bgColor = 'bg-red-50';
                                textColor = 'text-red-800';
                                borderColor = 'border-red-200';
                              }
                              
                              return (
                                <div key={colIndex} className={`mb-2 p-2 rounded border ${bgColor} ${borderColor}`}>
                                  <div className="text-xs font-medium text-gray-600 mb-1">{col}</div>
                                  <div className={`text-sm ${textColor}`}>
                                    {isEmpty2 ? <span className="italic text-gray-400">(empty)</span> : value2}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h6 className="text-sm font-medium text-gray-900 mb-2">Legend</h6>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                      <span className="text-green-800">Matching Values</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                      <span className="text-red-800">Different Values</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
                      <span className="text-yellow-800">Missing/Empty Values</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                      <span className="text-gray-600">Both Empty</span>
                    </div>
                  </div>
                </div>
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
