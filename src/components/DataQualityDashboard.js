import React, { useState, useMemo, useEffect } from 'react';

const DataQualityDashboard = ({ data }) => {
  const [drillDownData, setDrillDownData] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: 'missingPercentage',
    direction: 'desc'
  });
  const [selectedColumns, setSelectedColumns] = useState(null); // null means analyze all columns
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle loading state when data or selected columns change
  useEffect(() => {
    if (data && data.rows && data.headers) {
      setIsAnalyzing(true);
      // Simulate a brief loading state for better UX
      const timer = setTimeout(() => setIsAnalyzing(false), 100);
      return () => clearTimeout(timer);
    }
  }, [data, selectedColumns]);

  // Enhanced helper function to detect outliers using multiple methods
  const detectOutliers = (values) => {
    if (values.length < 4) return { outliers: [], method: 'insufficient_data' };
    
    const sorted = values.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - (iqr * 1.5);
    const upperBound = q3 + (iqr * 1.5);
    
    // IQR method
    const iqrOutliers = values.filter(val => val < lowerBound || val > upperBound);
    
    // Z-score method (for normal distributions)
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length);
    const zScoreOutliers = values.filter(val => Math.abs((val - mean) / stdDev) > 3);
    
    // Modified Z-score method (more robust)
    const median = sorted[Math.floor(sorted.length / 2)];
    const mad = sorted.reduce((acc, val) => acc + Math.abs(val - median), 0) / values.length;
    const modifiedZScoreOutliers = values.filter(val => Math.abs(0.6745 * (val - median) / mad) > 3.5);
    
    // Return the method that detected the most outliers (most conservative)
    const methods = [
      { name: 'IQR', outliers: iqrOutliers, count: iqrOutliers.length },
      { name: 'Z-Score', outliers: zScoreOutliers, count: zScoreOutliers.length },
      { name: 'Modified Z-Score', outliers: modifiedZScoreOutliers, count: modifiedZScoreOutliers.length }
    ];
    
    const bestMethod = methods.reduce((best, current) => 
      current.count > best.count ? current : best
    );
    
    return {
      outliers: bestMethod.outliers,
      method: bestMethod.name,
      iqrOutliers: iqrOutliers,
      zScoreOutliers: zScoreOutliers,
      modifiedZScoreOutliers: modifiedZScoreOutliers
    };
  };

  // Enhanced duplicate detection with similarity scoring
  // Simplified duplicate detection for better performance
  const detectDuplicates = (rows) => {
    const seen = new Set();
    const duplicates = [];
    
    // Only check first 100 rows for duplicates to improve performance
    const sampleSize = Math.min(100, rows.length);
    const sampleRows = rows.slice(0, sampleSize);
    
    sampleRows.forEach((row, index) => {
      const rowString = JSON.stringify(row);
      if (seen.has(rowString)) {
        duplicates.push(index);
      } else {
        seen.add(rowString);
      }
    });
    
    return {
      duplicateCount: duplicates.length,
      duplicateRows: duplicates,
      duplicatePercentage: (duplicates.length / sampleSize) * 100,
      nearDuplicates: {},
      nearDuplicateCount: 0 // Skip near-duplicate detection for performance
    };
  };


  // Enhanced data type detection with confidence scoring
  // Simplified data type detection for better performance
  const detectDataType = (values) => {
    const nonNullValues = values.filter(val => val !== null && val !== undefined && val !== '');
    if (nonNullValues.length === 0) return { type: 'unknown', confidence: 0 };
    
    // Sample only first 50 values for type detection
    const sampleSize = Math.min(50, nonNullValues.length);
    const sampleValues = nonNullValues.slice(0, sampleSize);
    
    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    
    sampleValues.forEach(val => {
      if (typeof val === 'number' || !isNaN(Number(val))) {
        numericCount++;
      } else if (val instanceof Date || !isNaN(Date.parse(val))) {
        dateCount++;
      } else if (typeof val === 'boolean' || val === 'true' || val === 'false') {
        booleanCount++;
      }
    });
    
    const total = sampleValues.length;
    const numericRatio = numericCount / total;
    const dateRatio = dateCount / total;
    const booleanRatio = booleanCount / total;
    
    if (numericRatio > 0.7) return { type: 'numeric', confidence: numericRatio };
    if (dateRatio > 0.7) return { type: 'date', confidence: dateRatio };
    if (booleanRatio > 0.7) return { type: 'boolean', confidence: booleanRatio };
    return { type: 'text', confidence: 0.8 };
  };

  // Enhanced data consistency checks
  const checkDataConsistency = (columnData, dataType, columnName) => {
    const consistency = {
      formatConsistency: 0,
      rangeConsistency: 0,
      businessRuleConsistency: 0,
      overallConsistency: 0,
      issues: []
    };
    
    const nonNullValues = columnData.filter(val => val !== null && val !== undefined && val !== '');
    if (nonNullValues.length === 0) return consistency;
    
    // Format consistency
    let formatMatches = 0;
    nonNullValues.forEach(value => {
      const strValue = String(value);
      let isValid = false;
      
      switch (dataType) {
        case 'numeric':
          isValid = !isNaN(value) && value !== '';
          break;
        case 'date':
          isValid = new Date(value).toString() !== 'Invalid Date' && !isNaN(Date.parse(value));
          break;
        case 'email':
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue);
          break;
        case 'phone':
          isValid = /^[\+]?[1-9][\d]{0,15}$/.test(strValue.replace(/[\s\-\(\)]/g, ''));
          break;
        case 'url':
          isValid = /^https?:\/\/.+/.test(strValue);
          break;
        default:
          isValid = true;
      }
      
      if (isValid) formatMatches++;
    });
    
    consistency.formatConsistency = formatMatches / nonNullValues.length;
    
    // Range consistency (for numeric columns)
    if (dataType === 'numeric') {
      const numericValues = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
      if (numericValues.length > 0) {
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const range = max - min;
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        
        // Check for reasonable ranges (not too extreme)
        const reasonableRange = mean * 100; // Allow 100x the mean as reasonable
        if (range > reasonableRange) {
          consistency.rangeConsistency = 0.5;
          consistency.issues.push('Extreme value range detected');
        } else {
          consistency.rangeConsistency = 1;
        }
      }
    }
    
    // Business rule consistency
    let businessRuleMatches = 0;
    nonNullValues.forEach(value => {
      let passesRules = true;
      
      // Common business rules
      if (dataType === 'email' && String(value).length > 254) {
        passesRules = false; // RFC 5321 limit
      }
      if (dataType === 'phone' && String(value).replace(/[\s\-\(\)]/g, '').length > 15) {
        passesRules = false; // International standard
      }
      if (dataType === 'numeric' && parseFloat(value) < 0 && columnName.toLowerCase().includes('amount')) {
        passesRules = false; // Negative amounts usually invalid
      }
      
      if (passesRules) businessRuleMatches++;
    });
    
    consistency.businessRuleConsistency = businessRuleMatches / nonNullValues.length;
    
    // Calculate overall consistency
    consistency.overallConsistency = (
      consistency.formatConsistency * 0.4 +
      consistency.rangeConsistency * 0.3 +
      consistency.businessRuleConsistency * 0.3
    );
    
    return consistency;
  };

  // Enhanced data quality scoring
  const calculateDataQualityScore = (columnData, columnName) => {
    const nonNullValues = columnData.filter(val => val !== null && val !== undefined && val !== '');
    const totalValues = columnData.length;
    const missingPercentage = ((totalValues - nonNullValues.length) / totalValues) * 100;
    
    // Base score starts at 100
    let score = 100;
    let deductions = [];
    
    // Missing data penalty
    if (missingPercentage > 0) {
      const missingPenalty = Math.min(missingPercentage * 0.5, 30); // Max 30 points off
      score -= missingPenalty;
      deductions.push(`Missing data: -${missingPenalty.toFixed(1)} points`);
    }
    
    // Data type confidence penalty
    const dataTypeInfo = detectDataType(columnData);
    if (dataTypeInfo.confidence < 0.8) {
      const confidencePenalty = (0.8 - dataTypeInfo.confidence) * 20; // Max 16 points off
      score -= confidencePenalty;
      deductions.push(`Low type confidence: -${confidencePenalty.toFixed(1)} points`);
    }
    
    // Consistency penalty
    const consistency = checkDataConsistency(columnData, dataTypeInfo.type, columnName);
    if (consistency.overallConsistency < 0.9) {
      const consistencyPenalty = (0.9 - consistency.overallConsistency) * 25; // Max 25 points off
      score -= consistencyPenalty;
      deductions.push(`Low consistency: -${consistencyPenalty.toFixed(1)} points`);
    }
    
    // Outlier penalty (for numeric columns)
    if (dataTypeInfo.type === 'numeric' && nonNullValues.length > 0) {
      const numericValues = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
      if (numericValues.length > 0) {
        const outlierInfo = detectOutliers(numericValues);
        if (outlierInfo.outliers.length > 0) {
          const outlierPercentage = (outlierInfo.outliers.length / numericValues.length) * 100;
          const outlierPenalty = Math.min(outlierPercentage * 0.3, 15); // Max 15 points off
          score -= outlierPenalty;
          deductions.push(`Outliers detected: -${outlierPenalty.toFixed(1)} points`);
        }
      }
    }
    
    // Ensure score doesn't go below 0
    score = Math.max(0, score);
    
    return {
      score: Math.round(score),
      deductions,
      dataType: dataTypeInfo.type,
      typeConfidence: dataTypeInfo.confidence,
      consistency: consistency.overallConsistency,
      missingPercentage
    };
  };

  // Analyze data quality and generate insights
  const dataQuality = useMemo(() => {
    console.log('🔍 DataQuality: Starting analysis...');
    
    if (!data || !data.rows || !data.headers) {
      console.log('🔍 DataQuality: No data available');
      return null;
    }

    console.log('🔍 DataQuality: Data available -', data.rows.length, 'rows,', data.headers.length, 'columns');

    // Performance optimization: limit data size for analysis
    const MAX_ROWS = 500; // Reasonable limit for analysis
    const MAX_COLUMNS = 15; // Allow more columns for better analysis
    
    // Determine which columns to analyze
    const columnsToAnalyze = selectedColumns === null ? data.headers : selectedColumns;
    const limitedColumns = columnsToAnalyze.length > MAX_COLUMNS ? columnsToAnalyze.slice(0, MAX_COLUMNS) : columnsToAnalyze;
    const limitedRows = data.rows.length > MAX_ROWS ? data.rows.slice(0, MAX_ROWS) : data.rows;

    console.log('🔍 DataQuality: Analyzing', limitedRows.length, 'rows and', limitedColumns.length, 'columns');

    // Log performance warnings
    if (data.rows.length > MAX_ROWS) {
      console.log(`⚠️ Large dataset detected: ${data.rows.length.toLocaleString()} rows. Limiting analysis to first ${MAX_ROWS.toLocaleString()} rows for performance.`);
    }
    if (columnsToAnalyze.length > MAX_COLUMNS) {
      console.log(`⚠️ Many columns detected: ${columnsToAnalyze.length}. Limiting analysis to first ${MAX_COLUMNS} columns for performance.`);
    }

    const analysis = {
      totalRows: data.rows.length,
      totalColumns: data.headers.length,
      analyzedColumns: limitedColumns.length,
      analyzedRows: limitedRows.length,
      columns: {},
      overallHealth: 0,
      issues: [],
      recommendations: [],
      qualityMetrics: {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        validity: 0,
        uniqueness: 0
      }
    };

    // Analyze each selected column
    limitedColumns.forEach(header => {
      const columnData = limitedRows.map(row => row[header]);
      
      // Enhanced data quality analysis
      const qualityInfo = calculateDataQualityScore(columnData, header);
      
      // Data type detection with confidence
      const dataTypeInfo = detectDataType(columnData);
      
      // Missing values analysis
      const nonNullValues = columnData.filter(val => val !== null && val !== undefined && val !== '');
      const missingCount = columnData.length - nonNullValues.length;
      const missingPercentage = (missingCount / columnData.length) * 100;
      
      // Numeric analysis
      let numericStats = null;
      if (dataTypeInfo.type === 'numeric') {
        const numericValues = columnData
          .filter(val => !isNaN(val) && val !== '' && val !== null)
          .map(val => parseFloat(val));
        
        if (numericValues.length > 0) {
          const outlierInfo = detectOutliers(numericValues);
          numericStats = {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            median: numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)],
            uniqueValues: new Set(numericValues).size,
            outliers: outlierInfo.outliers,
            outlierMethod: outlierInfo.method,
            outlierPercentage: (outlierInfo.outliers.length / numericValues.length) * 100
          };
        }
      }

      // Text analysis
      let textStats = null;
      if (dataTypeInfo.type === 'text') {
        const textValues = columnData.filter(val => val !== null && val !== undefined && val !== '');
        textStats = {
          uniqueValues: new Set(textValues).size,
          maxLength: Math.max(...textValues.map(val => String(val).length)),
          minLength: Math.min(...textValues.map(val => String(val).length)),
          avgLength: textValues.reduce((sum, val) => sum + String(val).length, 0) / textValues.length,
          emptyStrings: textValues.filter(val => String(val).trim() === '').length
        };
      }

      // Date analysis
      let dateStats = null;
      if (dataTypeInfo.type === 'date') {
        const dateValues = columnData
          .filter(val => val !== null && val !== undefined && val !== '')
          .map(val => new Date(val))
          .filter(date => !isNaN(date.getTime()));
        
        if (dateValues.length > 0) {
          dateStats = {
            earliest: new Date(Math.min(...dateValues)),
            latest: new Date(Math.max(...dateValues)),
            uniqueDates: new Set(dateValues.map(d => d.toDateString())).size,
            dateRange: Math.ceil((new Date(Math.max(...dateValues)) - new Date(Math.min(...dateValues))) / (1000 * 60 * 60 * 24))
          };
        }
      }

      // Consistency analysis
      const consistency = checkDataConsistency(columnData, dataTypeInfo.type, header);

      analysis.columns[header] = {
        primaryType: dataTypeInfo.type,
        typeConfidence: dataTypeInfo.confidence,
        missingCount,
        missingPercentage,
        columnHealth: qualityInfo.score,
        qualityScore: qualityInfo.score,
        deductions: qualityInfo.deductions,
        numericStats,
        textStats,
        dateStats,
        consistency,
        dataQuality: qualityInfo
      };

      // Collect issues and recommendations based on enhanced analysis
      if (qualityInfo.score < 70) {
        analysis.issues.push(`Poor data quality in "${header}" (Score: ${qualityInfo.score}/100)`);
        analysis.recommendations.push(`Address data quality issues in "${header}": ${qualityInfo.deductions.join(', ')}`);
      }
      
      if (dataTypeInfo.confidence < 0.7) {
        analysis.issues.push(`Low data type confidence for "${header}" (${(dataTypeInfo.confidence * 100).toFixed(1)}%)`);
        analysis.recommendations.push(`Review data format consistency in "${header}" column`);
      }
      
      if (consistency.overallConsistency < 0.8) {
        analysis.issues.push(`Data consistency issues in "${header}" (${(consistency.overallConsistency * 100).toFixed(1)}%)`);
        analysis.recommendations.push(`Improve data consistency in "${header}" column`);
      }
    });

    // Calculate overall health score using enhanced metrics
    const columnHealthScores = Object.values(analysis.columns).map(col => col.columnHealth);
    analysis.overallHealth = Math.round(columnHealthScores.reduce((a, b) => a + b, 0) / columnHealthScores.length);

    // Calculate quality metrics
    const completenessScores = Object.values(analysis.columns).map(col => 1 - (col.missingPercentage / 100));
    analysis.qualityMetrics.completeness = Math.round(completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length * 100);
    
    const accuracyScores = Object.values(analysis.columns).map(col => col.typeConfidence);
    analysis.qualityMetrics.accuracy = Math.round(accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length * 100);
    
    const consistencyScores = Object.values(analysis.columns).map(col => col.consistency.overallConsistency);
    analysis.qualityMetrics.consistency = Math.round(consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length * 100);
    
    const validityScores = Object.values(analysis.columns).map(col => col.consistency.formatConsistency);
    analysis.qualityMetrics.validity = Math.round(validityScores.reduce((a, b) => a + b, 0) / validityScores.length * 100);
    
    const uniquenessScores = Object.entries(analysis.columns).map(([columnName, col]) => {
      const nonNullValues = data.rows.map(row => row[columnName]).filter(v => v !== null && v !== undefined && v !== '');
      return nonNullValues.length > 0 ? new Set(nonNullValues).size / nonNullValues.length : 0;
    });
    analysis.qualityMetrics.uniqueness = Math.round(uniquenessScores.reduce((a, b) => a + b, 0) / uniquenessScores.length * 100);

    // Add duplicate detection
    // Duplicate detection (optimized for performance)
    const duplicateAnalysis = detectDuplicates(limitedRows);
    analysis.duplicates = duplicateAnalysis;
    
    if (duplicateAnalysis.duplicateCount > 0) {
      analysis.issues.push(`${duplicateAnalysis.duplicateCount} duplicate rows detected`);
      analysis.recommendations.push('Consider removing duplicate rows for cleaner analysis');
    }
    
    if (duplicateAnalysis.nearDuplicateCount > 0) {
      analysis.issues.push(`${duplicateAnalysis.nearDuplicateCount} near-duplicate rows detected`);
      analysis.recommendations.push('Review similar rows for potential consolidation');
    }

    console.log('🔍 DataQuality: Analysis complete!');
    return analysis;
  }, [data, selectedColumns]);

  // Manage loading state properly
  useEffect(() => {
    if (data && data.rows && data.headers) {
      setIsAnalyzing(true);
      // Simulate processing time
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnalyzing(false);
    }
  }, [data]);

  // Update sorted columns when dataQuality changes
  const actualSortedColumns = useMemo(() => {
    if (!dataQuality || !dataQuality.columns) return [];
    
    const columns = Object.entries(dataQuality.columns);
    
    return columns.sort(([, a], [, b]) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'columnName':
          aValue = a.columnName || '';
          bValue = b.columnName || '';
          break;
        case 'primaryType':
          aValue = a.primaryType || '';
          bValue = b.primaryType || '';
          break;
        case 'missingCount':
          aValue = a.missingCount || 0;
          bValue = b.missingCount || 0;
          break;
        case 'missingPercentage':
          aValue = a.missingPercentage || 0;
          bValue = b.missingPercentage || 0;
          break;
        case 'columnHealth':
          aValue = a.columnHealth || 0;
          bValue = b.columnHealth || 0;
          break;
        default:
          aValue = a[sortConfig.key] || 0;
          bValue = b[sortConfig.key] || 0;
      }
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [dataQuality, sortConfig]);

  if (!dataQuality) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Upload data to analyze data quality and generate insights.</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Data Quality</h3>
        <p className="text-gray-600">Processing your data for quality insights...</p>
      </div>
    );
  }

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthIcon = (score) => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  };

  // Get sort indicator for column headers
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Handle drill-down into specific data quality issues (optimized for performance)
  const handleDrillDown = (columnName, issueType, issueData) => {
    // Limit drill-down data to first 100 rows for performance
    const MAX_DRILL_ROWS = 100;
    let drillData = [];
    
    if (issueType === 'missing') {
      // Find rows with missing values in this column (limited to first 100)
      drillData = data.rows
        .slice(0, MAX_DRILL_ROWS)
        .map((row, index) => ({ ...row, __rowIndex: index }))
        .filter(row => row[columnName] === null || row[columnName] === undefined || row[columnName] === '');
    } else if (issueType === 'outliers') {
      // Find rows with outlier values in this column (limited to first 100)
      const outlierValues = issueData;
      drillData = data.rows
        .slice(0, MAX_DRILL_ROWS)
        .map((row, index) => ({ ...row, __rowIndex: index }))
        .filter(row => outlierValues.includes(parseFloat(row[columnName])));
    } else if (issueType === 'duplicates') {
      // Find duplicate rows (limited to first 100)
      drillData = data.rows
        .slice(0, MAX_DRILL_ROWS)
        .map((row, index) => ({ ...row, __rowIndex: index }))
        .filter((row, index) => issueData.includes(index));
    }
    
    setDrillDownData({
      columnName,
      issueType,
      data: drillData,
      totalRows: drillData.length
    });
  };

  // Close drill-down modal
  const closeDrillDown = () => {
    setDrillDownData({});
  };

  // Handle column sorting
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };


  // Export data quality summary to Excel
  const exportSummaryToExcel = async () => {
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
        ['Data Quality Summary Report'],
        ['Generated:', new Date().toLocaleString()],
        [''],
        ['Metric', 'Value', 'Details'],
        ['Total Rows', dataQuality.totalRows.toLocaleString(), 'Total number of data rows'],
        ['Total Columns', dataQuality.totalColumns, 'Total number of columns'],
        ['Duplicate Rows', dataQuality.duplicates.duplicateCount, 'Exact duplicate rows found'],
        ['Near Duplicates', dataQuality.duplicates.nearDuplicateCount || 0, 'Similar rows detected'],
        ['Poor Quality Columns', Object.values(dataQuality.columns).filter(col => col.qualityScore < 70).length, 'Columns with quality score < 70'],
        ['Numeric Columns', Object.values(dataQuality.columns).filter(col => col.primaryType === 'numeric').length, 'Columns containing numeric data'],
        [''],
        ['Overall Data Quality Score', `${dataQuality.overallQualityScore.toFixed(1)}%`, 'Weighted average of all column quality scores']
      ];

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWorksheet['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 40 }
      ];
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      // Column Details Sheet
      const columnData = [
        ['Column Name', 'Data Type', 'Quality Score', 'Missing Values', 'Missing %', 'Outliers', 'Outlier %', 'Unique Values', 'Notes']
      ];

      Object.entries(dataQuality.columns).forEach(([columnName, columnData]) => {
        columnData.push([
          columnName,
          columnData.primaryType,
          `${columnData.qualityScore.toFixed(1)}%`,
          columnData.missingCount,
          `${columnData.missingPercentage.toFixed(1)}%`,
          columnData.outlierCount || 0,
          `${(columnData.outlierPercentage || 0).toFixed(1)}%`,
          columnData.uniqueCount,
          columnData.qualityScore < 70 ? 'Poor Quality' : columnData.qualityScore < 85 ? 'Fair Quality' : 'Good Quality'
        ]);
      });

      const columnWorksheet = XLSX.utils.aoa_to_sheet(columnData);
      columnWorksheet['!cols'] = [
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, columnWorksheet, 'Column Details');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Download file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(data);
      link.download = `data_quality_summary_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Error exporting summary to Excel:', error);
      alert('Failed to export summary to Excel: ' + error.message);
    }
  };

  // Export drill-down data to Excel
  const exportToExcel = async (drillData) => {
    try {
      // Validate input data
      if (!drillData || !drillData.data || !drillData.data.length) {
        throw new Error('No data available for export');
      }

      if (!data || !data.headers || !data.headers.length) {
        throw new Error('No column headers available for export');
      }

      // Dynamically import xlsx library
      const XLSX = await import('xlsx');
      
      if (!XLSX || !XLSX.utils) {
        throw new Error('Excel library failed to load');
      }
      
      // Prepare data for Excel export
      const exportData = drillData.data.map(row => {
        const cleanRow = {};
        // Remove internal row index and clean up the data
        Object.keys(row).forEach(key => {
          if (key !== '__rowIndex') {
            cleanRow[key] = row[key] === null || row[key] === undefined || row[key] === '' ? 'NULL' : row[key];
          }
        });
        return cleanRow;
      });

      // Add summary information at the top
      const summaryRow = {};
      data.headers.forEach(header => {
        summaryRow[header] = `SUMMARY: ${drillData.issueType === 'missing' ? 'Missing Values' : 
                                         drillData.issueType === 'outliers' ? 'Outlier Values' : 
                                         'Duplicate Rows'} - Total: ${drillData.totalRows} rows`;
      });
      
      // Insert summary at the beginning
      exportData.unshift(summaryRow);
      exportData.unshift({}); // Empty row for spacing

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const columnWidths = data.headers.map(header => ({
        wch: Math.max(
          header.length,
          ...exportData.map(row => String(row[header] || '').length)
        ) + 2
      }));
      worksheet['!cols'] = columnWidths;

      // Generate descriptive filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const issueType = drillData.issueType === 'missing' ? 'Missing_Values' :
                       drillData.issueType === 'outliers' ? 'Outlier_Values' : 'Duplicate_Rows';
      const columnName = drillData.issueType !== 'duplicates' ? `_${drillData.columnName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `Data_Quality_${issueType}${columnName}_${timestamp}.xlsx`;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Quality Issues');

      // Generate and download Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();

      // Clean up
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      console.error('Error details:', {
        drillData,
        dataHeaders: data?.headers
      });
      alert(`Error exporting to Excel: ${error.message}. Please check the console for details.`);
    }
  };

  console.log('🎨 DataQuality: Starting UI render...');
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Data Quality Dashboard</h3>
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-200"
          >
            <span className="mr-2">📋</span>
            {showColumnSelector ? 'Hide Column Selector' : 'Select Columns to Analyze'}
            <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
              {selectedColumns === null ? 'All' : selectedColumns.length}
            </span>
          </button>
        </div>
        <p className="text-gray-600">Comprehensive analysis of your dataset's health and structure</p>
      </div>

      {/* Column Selector */}
      {showColumnSelector && (
        <div className="bg-white rounded-lg border border-blue-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-900">Select Columns to Analyze</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedColumns(null)}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Analyze All
              </button>
              <button
                onClick={() => {
                  const allHeaders = data.headers || [];
                  
                  // Check if all columns are currently selected
                  const allSelected = selectedColumns === null || 
                    (selectedColumns && selectedColumns.length === allHeaders.length);
                  
                  if (allSelected) {
                    // If all columns are selected, deselect all
                    setSelectedColumns([]);
                  } else {
                    // Otherwise, select all columns
                    setSelectedColumns([...allHeaders]);
                  }
                }}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                {selectedColumns === null || (selectedColumns && selectedColumns.length === (data.headers || []).length) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {(data.headers || []).map((header) => (
              <label key={header} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedColumns ? selectedColumns.includes(header) : true}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (selectedColumns) {
                        setSelectedColumns([...selectedColumns, header]);
                      } else {
                        setSelectedColumns([header]);
                      }
                    } else {
                      if (selectedColumns) {
                        const newSelection = selectedColumns.filter(col => col !== header);
                        setSelectedColumns(newSelection.length > 0 ? newSelection : null);
                      } else {
                        const allColumns = data.headers || [];
                        const newSelection = allColumns.filter(col => col !== header);
                        setSelectedColumns(newSelection.length > 0 ? newSelection : null);
                      }
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 truncate" title={header}>
                  {header}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Analyzing {selectedColumns === null ? data.headers.length : selectedColumns.length} of {data.headers.length} columns for focused insights.
          </div>
        </div>
      )}

      {/* Overall Health Score */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Overall Data Health</h4>
            <p className="text-sm text-gray-600 mt-1">
              Based on analysis of {dataQuality.analyzedColumns} of {dataQuality.totalColumns} columns
              {dataQuality.analyzedRows < dataQuality.totalRows && (
                <span className="text-orange-600"> • Limited to {dataQuality.analyzedRows.toLocaleString()} of {dataQuality.totalRows.toLocaleString()} rows for performance</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(dataQuality.overallHealth)}`}>
              {getHealthIcon(dataQuality.overallHealth)} {dataQuality.overallHealth}/100
            </div>
            <button
              onClick={exportSummaryToExcel}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200 shadow-sm"
            >
              <span className="mr-2">📊</span>
              Export Summary
            </button>
          </div>
        </div>
        
        {/* Enhanced Quality Metrics */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h5 className="text-md font-medium text-blue-900 mb-3">📊 Data Quality Dimensions</h5>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dataQuality.qualityMetrics.completeness}%</div>
              <div className="text-sm text-blue-700">Completeness</div>
              <div className="text-xs text-blue-600">Data coverage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dataQuality.qualityMetrics.accuracy}%</div>
              <div className="text-sm text-green-700">Accuracy</div>
              <div className="text-xs text-green-600">Type confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dataQuality.qualityMetrics.consistency}%</div>
              <div className="text-sm text-purple-700">Consistency</div>
              <div className="text-xs text-purple-600">Format & rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{dataQuality.qualityMetrics.validity}%</div>
              <div className="text-sm text-orange-700">Validity</div>
              <div className="text-xs text-orange-600">Format compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">{dataQuality.qualityMetrics.uniqueness}%</div>
              <div className="text-sm text-teal-700">Uniqueness</div>
              <div className="text-xs text-teal-600">Distinct values</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{dataQuality.totalRows.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Rows</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dataQuality.totalColumns}</div>
            <div className="text-sm text-gray-600">Total Columns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{dataQuality.duplicates.duplicateCount}</div>
            <div className="text-sm text-gray-600">Duplicate Rows</div>
            {dataQuality.duplicates.duplicateCount > 0 && (
              <button
                onClick={() => handleDrillDown('duplicates', 'duplicates', dataQuality.duplicates.duplicateRows)}
                className="mt-1 inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors duration-200 border border-purple-200 hover:border-purple-300"
              >
                <span className="mr-1">👁️</span>
                View Details
              </button>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {dataQuality.duplicates.nearDuplicateCount || 0}
            </div>
            <div className="text-sm text-gray-600">Near Duplicates</div>
            {dataQuality.duplicates.nearDuplicateCount > 0 && (
              <div className="text-xs text-orange-600 mt-1">Similar rows detected</div>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {Object.values(dataQuality.columns).filter(col => col.qualityScore < 70).length}
            </div>
            <div className="text-sm text-gray-600">Poor Quality Columns</div>
            <div className="text-xs text-indigo-600">Score &lt; 70</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600">
              {Object.values(dataQuality.columns).filter(col => col.primaryType === 'numeric').length}
            </div>
            <div className="text-sm text-gray-600">Numeric Columns</div>
          </div>
        </div>
      </div>

      {/* Column Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-gray-900">Column Analysis</h4>
          {sortConfig.key && (
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              <span className="font-medium">Sorted by:</span> {sortConfig.key === 'columnName' ? 'Column Name' : 
                                                              sortConfig.key === 'primaryType' ? 'Data Type' : 
                                                              sortConfig.key === 'missingCount' ? 'Missing Count' : 
                                                              sortConfig.key === 'missingPercentage' ? 'Missing Percentage' : 
                                                              sortConfig.key === 'columnHealth' ? 'Column Health' : 
                                                              sortConfig.key} 
              <span className="ml-2 text-gray-500">
                ({sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'})
              </span>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 w-1/4"
                  onClick={() => handleSort('columnName')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Column</span>
                    <span className="text-gray-400">{getSortIndicator('columnName')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 w-1/6"
                  onClick={() => handleSort('primaryType')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Type</span>
                    <span className="text-gray-400">{getSortIndicator('primaryType')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 w-1/6"
                  onClick={() => handleSort('missingCount')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Missing</span>
                    <span className="text-gray-400">{getSortIndicator('missingCount')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 w-1/6"
                  onClick={() => handleSort('columnHealth')}
                >
                  <div className="flex items-center space-x-2">
                    <span>Quality Score</span>
                    <span className="text-gray-400">{getSortIndicator('columnHealth')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actualSortedColumns.map(([columnName, columnData]) => (
                <tr key={columnName}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {columnName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        columnData.primaryType === 'numeric' ? 'bg-blue-100 text-blue-800' :
                        columnData.primaryType === 'date' ? 'bg-green-100 text-green-800' :
                        columnData.primaryType === 'text' ? 'bg-purple-100 text-purple-800' :
                        columnData.primaryType === 'email' ? 'bg-indigo-100 text-indigo-800' :
                        columnData.primaryType === 'phone' ? 'bg-teal-100 text-teal-800' :
                        columnData.primaryType === 'url' ? 'bg-pink-100 text-pink-800' :
                        columnData.primaryType === 'boolean' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {columnData.primaryType}
                      </span>
                      {columnData.typeConfidence && (
                        <div className="text-xs text-gray-500">
                          Confidence: {(columnData.typeConfidence * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {columnData.missingCount} ({columnData.missingPercentage.toFixed(1)}%)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className={`px-2 py-1 text-xs rounded-full ${getHealthColor(columnData.columnHealth)}`}>
                        {columnData.columnHealth}/100
                      </div>
                      {columnData.deductions && columnData.deductions.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {columnData.deductions.length} issue{columnData.deductions.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {/* Enhanced Details Section */}
                    <div className="space-y-2">
                      {/* Data Type Confidence */}
                      {columnData.typeConfidence && (
                        <div className="text-xs">
                          <span className="font-medium">Type Confidence:</span> 
                          <span className={`ml-1 ${
                            columnData.typeConfidence > 0.8 ? 'text-green-600' :
                            columnData.typeConfidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {(columnData.typeConfidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      
                      {/* Consistency Scores */}
                      {columnData.consistency && (
                        <div className="text-xs">
                          <span className="font-medium">Consistency:</span>
                          <span className={`ml-1 ${
                            columnData.consistency.overallConsistency > 0.8 ? 'text-green-600' :
                            columnData.consistency.overallConsistency > 0.6 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {(columnData.consistency.overallConsistency * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      
                      {/* Numeric Stats */}
                      {columnData.primaryType === 'numeric' && columnData.numericStats && (
                        <div>
                          <div className="text-xs">Min: {columnData.numericStats.min.toFixed(2)}</div>
                          <div className="text-xs">Max: {columnData.numericStats.max.toFixed(2)}</div>
                          <div className="text-xs">Mean: {columnData.numericStats.mean.toFixed(2)}</div>
                          {columnData.numericStats.outliers.length > 0 && (
                            <div className="text-orange-600 text-xs">
                              {columnData.numericStats.outliers.length} outliers ({columnData.numericStats.outlierPercentage.toFixed(1)}%)
                              <div className="text-gray-500">Method: {columnData.numericStats.outlierMethod}</div>
                              <button
                                onClick={() => handleDrillDown(columnName, 'outliers', columnData.numericStats.outliers)}
                                className="mt-1 inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-200 border border-blue-200 hover:border-blue-300"
                              >
                                <span className="mr-1">👁️</span>
                                View Details
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Text Stats */}
                      {columnData.primaryType === 'text' && columnData.textStats && (
                        <div>
                          <div className="text-xs">Unique: {columnData.textStats.uniqueValues}</div>
                          <div className="text-xs">Avg Length: {columnData.textStats.avgLength.toFixed(1)}</div>
                          {columnData.textStats.emptyStrings > 0 && (
                            <div className="text-orange-600 text-xs">
                              {columnData.textStats.emptyStrings} empty strings
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Date Stats */}
                      {columnData.primaryType === 'date' && columnData.dateStats && (
                        <div>
                          <div className="text-xs">Range: {columnData.dateStats.earliest.toLocaleDateString()} - {columnData.dateStats.latest.toLocaleDateString()}</div>
                          <div className="text-xs">Unique Dates: {columnData.dateStats.uniqueDates}</div>
                          <div className="text-xs">Span: {columnData.dateStats.dateRange} days</div>
                        </div>
                      )}
                      
                      {/* Missing Values Drill-Down */}
                      {columnData.missingCount > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={() => handleDrillDown(columnName, 'missing', columnData.missingCount)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors duration-200 border border-red-200 hover:border-red-300"
                          >
                            <span className="mr-1">👁️</span>
                            View Missing Values ({columnData.missingCount})
                          </button>
                        </div>
                      )}
                      
                      {/* Quality Issues Summary */}
                      {columnData.deductions && columnData.deductions.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                          <div className="text-xs font-medium text-red-800 mb-1">Quality Issues:</div>
                          <div className="text-xs text-red-700 space-y-1">
                            {columnData.deductions.map((deduction, idx) => (
                              <div key={idx}>• {deduction}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues and Recommendations */}
      {(dataQuality.issues.length > 0 || dataQuality.recommendations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Issues */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-red-900 mb-4">⚠️ Data Issues</h4>
            <ul className="space-y-2">
              {dataQuality.issues.map((issue, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span className="text-sm text-gray-700">{issue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-blue-900 mb-4">💡 Recommendations</h4>
            <ul className="space-y-2">
              {dataQuality.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Enhanced Drill-Down Modal */}
      {drillDownData.columnName && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 animate-fadeIn">
          <div className="relative top-16 mx-auto p-8 border-0 w-11/12 max-w-7xl shadow-2xl rounded-2xl bg-white transform transition-all duration-300 ease-out">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    drillDownData.issueType === 'missing' ? 'bg-red-100 text-red-600' :
                    drillDownData.issueType === 'outliers' ? 'bg-orange-100 text-orange-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {drillDownData.issueType === 'missing' ? '⚠️' : 
                     drillDownData.issueType === 'outliers' ? '📊' : '🔄'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {drillDownData.issueType === 'missing' ? 'Missing Values' : 
                       drillDownData.issueType === 'outliers' ? 'Outlier Values' : 
                       'Duplicate Rows'} {drillDownData.issueType !== 'duplicates' ? `in "${drillDownData.columnName}"` : ''}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Found {drillDownData.totalRows} rows with {
                        drillDownData.issueType === 'missing' ? 'missing values' : 
                        drillDownData.issueType === 'outliers' ? 'outlier values' : 
                        'duplicate data'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={closeDrillDown}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Data Table Section */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="overflow-x-auto max-h-96 rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <span>#</span>
                          <span className="text-gray-500 text-xs">Row</span>
                        </div>
                      </th>
                      {data.headers.map(header => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {drillDownData.data.map((row, index) => (
                      <tr key={index} className={`hover:bg-blue-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-gray-900">{row.__rowIndex + 1}</span>
                            <div className={`w-2 h-2 rounded-full ${
                              drillDownData.issueType === 'missing' ? 'bg-red-400' :
                              drillDownData.issueType === 'outliers' ? 'bg-orange-400' :
                              'bg-purple-400'
                            }`}></div>
                          </div>
                        </td>
                        {data.headers.map(header => (
                          <td key={header} className="px-4 py-3 text-sm">
                            <div className={`${
                              row[header] === null || row[header] === undefined || row[header] === '' 
                                ? 'text-red-600 font-medium bg-red-50 px-2 py-1 rounded' 
                                : 'text-gray-700'
                            }`}>
                              {row[header] === null || row[header] === undefined || row[header] === '' 
                                ? 'NULL' 
                                : String(row[header])
                              }
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Section */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">💡</span>
                  <span>Export this data for further analysis in Excel or other tools</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => exportToExcel(drillDownData)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center space-x-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="text-lg">📊</span>
                  <span className="font-semibold">Export to Excel</span>
                </button>
                <button
                  onClick={closeDrillDown}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add performance tracking
console.log('🎨 DataQuality: UI render complete!');

export default DataQualityDashboard;
