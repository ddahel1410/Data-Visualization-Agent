import React, { useState, useMemo, useEffect } from 'react';

const SmartRecommendations = ({ data, onNavigateToTab, onConfigureChart }) => {
  const [selectedColumns, setSelectedColumns] = useState(null); // null means analyze all columns
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  // Statistical utility functions
  const calculateStats = (values) => {
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 
      : sorted[Math.floor(sorted.length / 2)];
    
    // Quartiles
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    // Outlier detection using IQR method
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = values.filter(val => val < lowerBound || val > upperBound);
    
    return {
      count: values.length,
      sum,
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      stdDev: stdDev.toFixed(2),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      range: (sorted[sorted.length - 1] - sorted[0]).toFixed(2),
      q1: q1.toFixed(2),
      q3: q3.toFixed(2),
      iqr: iqr.toFixed(2),
      outliers: outliers.length,
      outlierPercentage: ((outliers.length / values.length) * 100).toFixed(1),
      skewness: calculateSkewness(values, mean, stdDev),
      kurtosis: calculateKurtosis(values, mean, stdDev)
    };
  };

  const calculateSkewness = (values, mean, stdDev) => {
    if (stdDev === 0) return 0;
    const n = values.length;
    const skewness = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / n;
    return skewness.toFixed(3);
  };

  const calculateKurtosis = (values, mean, stdDev) => {
    if (stdDev === 0) return 0;
    const n = values.length;
    const kurtosis = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / n - 3;
    return kurtosis.toFixed(3);
  };

  const calculateCorrelation = (xValues, yValues) => {
    if (xValues.length !== yValues.length || xValues.length < 2) return null;
    
    const n = xValues.length;
    const xMean = xValues.reduce((acc, val) => acc + val, 0) / n;
    const yMean = yValues.reduce((acc, val) => acc + val, 0) / n;
    
    const numerator = xValues.reduce((acc, x, i) => acc + (x - xMean) * (yValues[i] - yMean), 0);
    const xDenominator = Math.sqrt(xValues.reduce((acc, x) => acc + Math.pow(x - xMean, 2), 0));
    const yDenominator = Math.sqrt(yValues.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0));
    
    if (xDenominator === 0 || yDenominator === 0) return null;
    
    const correlation = numerator / (xDenominator * yDenominator);
    return correlation.toFixed(3);
  };

  const detectPatterns = (values) => {
    if (values.length < 3) return null;
    
    // Check for trends
    let increasing = 0, decreasing = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i-1]) increasing++;
      else if (values[i] < values[i-1]) decreasing++;
    }
    
    const trendStrength = Math.abs(increasing - decreasing) / (values.length - 1);
    const trend = increasing > decreasing ? 'increasing' : decreasing > increasing ? 'decreasing' : 'stable';
    
    // Check for seasonality (simple pattern detection)
    const midPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    const firstHalfAvg = firstHalf.reduce((acc, val) => acc + val, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((acc, val) => acc + val, 0) / secondHalf.length;
    const seasonality = Math.abs(firstHalfAvg - secondHalfAvg) / Math.max(firstHalfAvg, secondHalfAvg);
    
    return {
      trend,
      trendStrength: trendStrength.toFixed(3),
      seasonality: seasonality.toFixed(3),
      hasSeasonality: seasonality > 0.1
    };
  };

  // Analyze data and generate smart recommendations
  const recommendations = useMemo(() => {
    if (!data || (!data.rows && !data.preview)) {
      return { insights: [], suggestions: [], warnings: [], statistics: {}, correlations: [], patterns: {} };
    }

    const rows = data.rows || data.preview || [];
    const headers = data.headers || [];
    
    if (rows.length === 0 || headers.length === 0) {
      return { insights: [], suggestions: [], warnings: [], statistics: {}, correlations: [], patterns: {} };
    }

    // Performance optimization: limit data size for analysis
    const MAX_ROWS = 1000; // Reasonable limit for recommendations
    const MAX_COLUMNS = 20; // Allow more columns for better analysis
    
    const limitedRows = rows.length > MAX_ROWS ? rows.slice(0, MAX_ROWS) : rows;
    const limitedHeaders = headers.length > MAX_COLUMNS ? headers.slice(0, MAX_COLUMNS) : headers;
    
    if (rows.length > MAX_ROWS) {
      console.log(`⚠️ Large dataset detected: ${rows.length.toLocaleString()} rows. Limiting analysis to first ${MAX_ROWS.toLocaleString()} rows for performance.`);
    }
    
    if (headers.length > MAX_COLUMNS) {
      console.log(`⚠️ Many columns detected: ${headers.length}. Limiting analysis to first ${MAX_COLUMNS} columns for performance.`);
    }

    // Filter columns based on user selection
    const columnsToAnalyze = selectedColumns ? selectedColumns : limitedHeaders;

    // Early return for very large datasets to prevent lag
    if (limitedRows.length > 5000 || columnsToAnalyze.length > 20) {
      return {
        insights: [{
          title: "Large Dataset Detected",
          description: "Dataset is too large for real-time analysis. Please use column selection to focus on specific data.",
          priority: "high"
        }],
        suggestions: [],
        warnings: [{
          type: 'performance',
          message: 'Dataset too large for optimal performance. Use column selection for focused analysis.',
          priority: 'high'
        }],
        statistics: {},
        correlations: [],
        patterns: {}
      };
    }

    const insights = [];
    const suggestions = [];
    const warnings = [];
    const statistics = {};
    const correlations = [];
    const patterns = {};
    
    // Analyze data types and patterns
    const columnAnalysis = columnsToAnalyze.map(header => {
      const values = limitedRows.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
      const numericValues = values.filter(val => !isNaN(parseFloat(val))).map(val => parseFloat(val));
      const uniqueValues = new Set(values);
      const isNumeric = numericValues.length > values.length * 0.8;
      const isDate = values.some(val => !isNaN(Date.parse(val)));
      const isCategorical = uniqueValues.size < Math.min(values.length * 0.5, 50);
      
      // Calculate advanced statistics for numeric columns (only if very small)
      let stats = null;
      if (isNumeric && numericValues.length > 0 && numericValues.length < 1000) {
        try {
          stats = calculateStats(numericValues);
          statistics[header] = stats;
          
          // Detect patterns (only for very small datasets)
          if (numericValues.length < 500) {
            patterns[header] = detectPatterns(numericValues);
          }
        } catch (error) {
          console.warn(`Error calculating stats for column ${header}:`, error);
        }
      }
      
      return {
        header,
        isNumeric,
        isDate,
        isCategorical,
        uniqueCount: uniqueValues.size,
        totalCount: values.length,
        numericValues: isNumeric ? numericValues : [],
        sampleValues: Array.from(uniqueValues).slice(0, 5),
        stats
      };
    });

    // 1. Enhanced Chart Type Recommendations with Statistical Insights
    const numericColumns = columnAnalysis.filter(col => col.isNumeric);
    const categoricalColumns = columnAnalysis.filter(col => col.isCategorical);
    const dateColumns = columnAnalysis.filter(col => col.isDate);

    if (numericColumns.length >= 2) {
      // Performance optimization: limit correlation analysis for large datasets
      const maxCorrelations = Math.min(numericColumns.length, 5); // Reduced to 5 columns max
      const limitedNumericColumns = numericColumns.slice(0, maxCorrelations);
      
      if (numericColumns.length > maxCorrelations) {
        console.log(`⚠️ Limiting correlation analysis to ${maxCorrelations} columns for performance`);
      }
      
      // Find best correlation pairs (limited scope)
      let bestCorrelation = { strength: 0, columns: [], value: 0 };
      
      for (let i = 0; i < limitedNumericColumns.length; i++) {
        for (let j = i + 1; j < limitedNumericColumns.length; j++) {
          // Skip if datasets are too large for correlation
          if (limitedNumericColumns[i].numericValues.length > 1000 || limitedNumericColumns[j].numericValues.length > 1000) {
            continue;
          }
          
          const corr = calculateCorrelation(limitedNumericColumns[i].numericValues, limitedNumericColumns[j].numericValues);
          if (corr && Math.abs(parseFloat(corr)) > Math.abs(bestCorrelation.value)) {
            bestCorrelation = {
              strength: Math.abs(parseFloat(corr)),
              columns: [limitedNumericColumns[i].header, limitedNumericColumns[j].header],
              value: parseFloat(corr)
            };
          }
        }
      }

      if (bestCorrelation.columns.length > 0) {
        const strength = bestCorrelation.strength;
        const correlationValue = bestCorrelation.value;
        let description = '';
        
        if (strength > 0.7) {
          description = `Strong ${correlationValue > 0 ? 'positive' : 'negative'} correlation (${correlationValue}) detected between ${bestCorrelation.columns[0]} and ${bestCorrelation.columns[1]}. Perfect for scatter plots!`;
        } else if (strength > 0.5) {
          description = `Moderate correlation (${correlationValue}) between ${bestCorrelation.columns[0]} and ${bestCorrelation.columns[1]}. Worth exploring with scatter plots.`;
        } else {
          description = `Weak correlation (${correlationValue}) between ${bestCorrelation.columns[0]} and ${bestCorrelation.columns[1]}. Scatter plots may reveal hidden patterns.`;
        }

        suggestions.push({
          type: 'chart',
          priority: 'high',
          title: '📊 Correlation Analysis',
          description,
          action: 'scatter',
          columns: bestCorrelation.columns,
          correlation: correlationValue,
          strength: strength
        });
      }
    }

    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      // Find best categorical-numeric pair based on variance
      let bestPair = { variance: 0, columns: [] };
      
      categoricalColumns.forEach(catCol => {
        numericColumns.forEach(numCol => {
          const groups = {};
          limitedRows.forEach(row => {
            const category = row[catCol.header];
            const value = parseFloat(row[numCol.header]);
            if (category && !isNaN(value)) {
              if (!groups[category]) groups[category] = [];
              groups[category].push(value);
            }
          });
          
          // Calculate variance between groups
          const groupMeans = Object.values(groups).map(group => 
            group.reduce((acc, val) => acc + val, 0) / group.length
          );
          const overallMean = groupMeans.reduce((acc, val) => acc + val, 0) / groupMeans.length;
          const variance = groupMeans.reduce((acc, val) => acc + Math.pow(val - overallMean, 2), 0) / groupMeans.length;
          
          if (variance > bestPair.variance) {
            bestPair = { variance, columns: [catCol.header, numCol.header] };
          }
        });
      });

      if (bestPair.columns.length > 0) {
        suggestions.push({
          type: 'chart',
          priority: 'high',
          title: '📈 Comparative Analysis',
          description: `High variance detected between ${bestPair.columns[0]} categories and ${bestPair.columns[1]} values. Perfect for bar charts to show clear differences!`,
          action: 'bar',
          columns: bestPair.columns,
          variance: bestPair.variance.toFixed(3)
        });
      }
    }

    if (dateColumns.length > 0 && numericColumns.length > 0) {
      // Find best time series candidate
      const timeSeriesCandidates = dateColumns.map(dateCol => {
        const dateValues = limitedRows.map(row => new Date(row[dateCol.header])).filter(date => !isNaN(date.getTime()));
        const sortedDates = dateValues.sort((a, b) => a - b);
        const timeSpan = sortedDates[sortedDates.length - 1] - sortedDates[0];
        const dataPoints = dateValues.length;
        
        return {
          dateColumn: dateCol.header,
          timeSpan: timeSpan / (1000 * 60 * 60 * 24), // in days
          dataPoints,
          regularity: dataPoints / (timeSpan / (1000 * 60 * 60 * 24)) // data points per day
        };
      });

      const bestTimeSeries = timeSeriesCandidates.sort((a, b) => b.regularity - a.regularity)[0];
      
      if (bestTimeSeries && bestTimeSeries.regularity > 0.1) {
        suggestions.push({
          type: 'chart',
          priority: 'high',
          title: '⏰ Time Series Analysis',
          description: `Regular time series data detected! ${bestTimeSeries.dataPoints} data points over ${bestTimeSeries.timeSpan.toFixed(0)} days. Create line charts to visualize trends over time.`,
          action: 'line',
          columns: [bestTimeSeries.dateColumn, numericColumns[0].header],
          regularity: bestTimeSeries.regularity.toFixed(3)
        });
      }
    }

    // 2. Enhanced Data Quality Insights with Statistical Validation
    const lowQualityColumns = columnAnalysis.filter(col => 
      col.totalCount > 0 && (col.totalCount - col.uniqueCount) / col.totalCount > 0.8
    );

    if (lowQualityColumns.length > 0) {
      warnings.push({
        type: 'quality',
        priority: 'medium',
        title: '⚠️ Low Data Variety',
        description: `${lowQualityColumns.length} column(s) have very few unique values, which may limit analysis options.`,
        columns: lowQualityColumns.map(col => col.header),
        qualityScore: ((lowQualityColumns[0].uniqueCount / lowQualityColumns[0].totalCount) * 100).toFixed(1)
      });
    }

    // 3. Statistical Pattern Detection
    numericColumns.forEach(col => {
      if (col.stats) {
        // Outlier analysis
        if (col.stats.outliers > 0) {
          const severity = col.stats.outlierPercentage > 10 ? 'high' : col.stats.outlierPercentage > 5 ? 'medium' : 'low';
          warnings.push({
            type: 'outliers',
            priority: severity,
            title: `🔍 Outliers Detected in ${col.header}`,
            description: `${col.stats.outliers} outliers (${col.stats.outlierPercentage}%) detected. Consider investigating these unusual values.`,
            columns: [col.header],
            outlierCount: col.stats.outliers,
            outlierPercentage: col.stats.outlierPercentage
          });
        }

        // Distribution insights
        if (col.stats.skewness > 1 || col.stats.skewness < -1) {
          insights.push({
            type: 'distribution',
            priority: 'medium',
            title: `📊 Skewed Distribution in ${col.header}`,
            description: `Data is ${parseFloat(col.stats.skewness) > 0 ? 'right' : 'left'}-skewed (skewness: ${col.stats.skewness}). Consider log transformation for better visualization.`,
            columns: [col.header],
            skewness: col.stats.skewness
          });
        }

        // Pattern detection
        if (col.patterns) {
          if (col.patterns.trendStrength > 0.3) {
            insights.push({
              type: 'trend',
              priority: 'medium',
              title: `📈 Trend Detected in ${col.header}`,
              description: `Clear ${col.patterns.trend} trend detected (strength: ${col.patterns.trendStrength}). Time series analysis recommended.`,
              columns: [col.header],
              trend: col.patterns.trend,
              strength: col.patterns.trendStrength
            });
          }

          if (col.patterns.hasSeasonality) {
            insights.push({
              type: 'seasonality',
              priority: 'medium',
              title: `🔄 Seasonal Pattern in ${col.header}`,
              description: `Seasonal variation detected (strength: ${col.patterns.seasonality}). Consider seasonal decomposition analysis.`,
              columns: [col.header],
              seasonality: col.patterns.seasonality
            });
          }
        }
      }
    });

    // 4. Enhanced Missing Data Analysis
    const columnsWithMissingData = columnAnalysis.filter(col => 
      col.totalCount < limitedRows.length
    );

    if (columnsWithMissingData.length > 0) {
      const missingPercentage = ((limitedRows.length - Math.min(...columnsWithMissingData.map(col => col.totalCount))) / limitedRows.length * 100).toFixed(1);
      warnings.push({
        type: 'missing',
        priority: 'high',
        title: '❌ Missing Data Detected',
        description: `${missingPercentage}% of your data has missing values. Consider data cleaning before analysis.`,
        columns: columnsWithMissingData.map(col => col.header),
        missingPercentage
      });
    }

    // 5. Optimal Chart Suggestions with Statistical Validation
    if (categoricalColumns.length > 0) {
      const bestCategorical = categoricalColumns.sort((a, b) => b.uniqueCount - a.uniqueCount)[0];
      if (bestCategorical.uniqueCount <= 10) {
        suggestions.push({
          type: 'chart',
          priority: 'medium',
          title: '🥧 Pie Chart Opportunity',
          description: `${bestCategorical.header} has ${bestCategorical.uniqueCount} categories - perfect for pie charts!`,
          action: 'pie',
          columns: [bestCategorical.header]
        });
      }
    }

    // 6. Enhanced Histogram Opportunities with Distribution Analysis
    const histogramCandidates = numericColumns.filter(col => 
      col.numericValues.length > 20 && 
      (Math.max(...col.numericValues) - Math.min(...col.numericValues)) > 0
    );

    if (histogramCandidates.length > 0) {
      const bestHistogram = histogramCandidates.sort((a, b) => 
        (b.stats?.iqr || 0) - (a.stats?.iqr || 0)
      )[0];
      
      if (bestHistogram.stats) {
        suggestions.push({
          type: 'chart',
          priority: 'medium',
          title: '📊 Distribution Analysis',
          description: `Create histograms to understand the distribution of ${bestHistogram.header}. IQR: ${bestHistogram.stats.iqr}, Std Dev: ${bestHistogram.stats.stdDev}`,
          action: 'histogram',
          columns: [bestHistogram.header],
          iqr: bestHistogram.stats.iqr,
          stdDev: bestHistogram.stats.stdDev
        });
      }
    }

    // 7. Generate correlation matrix for all numeric columns
    if (numericColumns.length > 1) {
      for (let i = 0; i < numericColumns.length; i++) {
        for (let j = i + 1; j < numericColumns.length; j++) {
          const corr = calculateCorrelation(numericColumns[i].numericValues, numericColumns[j].numericValues);
          if (corr && Math.abs(parseFloat(corr)) > 0.3) { // Only show moderate+ correlations
            correlations.push({
              column1: numericColumns[i].header,
              column2: numericColumns[j].header,
              correlation: parseFloat(corr),
              strength: Math.abs(parseFloat(corr))
            });
          }
        }
      }
      // Sort by correlation strength
      correlations.sort((a, b) => b.strength - a.strength);
    }

    return { insights, suggestions, warnings, statistics, correlations, patterns };
  }, [data, selectedColumns, calculateStats]);

  // Manage loading state properly
  useEffect(() => {
    if (data && (data.rows || data.preview)) {
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

  if (!data || (!data.rows && !data.preview)) {
    return null;
  }

  if (isAnalyzing) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <span className="text-2xl">🧠</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Generating AI Recommendations</h3>
        <p className="text-gray-600">Analyzing your data patterns and generating smart insights...</p>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Smart Recommendations</h3>
            <p className="text-sm text-blue-700">
              {selectedColumns 
                ? `Intelligent insights for ${selectedColumns.length} selected column${selectedColumns.length > 1 ? 's' : ''}`
                : 'Advanced statistical analysis and intelligent recommendations'
              }
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <span>{showAdvancedStats ? '📊' : '📈'}</span>
            <span>{showAdvancedStats ? 'Hide Stats' : 'Show Stats'}</span>
          </button>
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>{showColumnSelector ? '▼' : '▶'}</span>
            <span>{selectedColumns ? `${selectedColumns.length} Selected` : 'Select Columns'}</span>
          </button>
        </div>
      </div>

      {/* Performance Warning for Large Datasets */}
      {data.rows && data.rows.length > 2000 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Large Dataset Detected</p>
              <p>Your dataset has {data.rows.length.toLocaleString()} rows. For optimal performance, analysis is limited to the first 2,000 rows.</p>
              <p className="text-xs mt-1">💡 Tip: Use column selection above to focus on specific data for faster analysis.</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Status */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">⚡</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Performance Optimized</p>
            <p>Analysis limited to {Math.min(data.rows?.length || 0, 2000).toLocaleString()} rows and {Math.min(data.headers?.length || 0, 10)} columns for smooth performance.</p>
          </div>
        </div>
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 truncate" title={header}>
                  {header}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {selectedColumns 
              ? `Analyzing ${selectedColumns.length} selected column${selectedColumns.length > 1 ? 's' : ''} for focused insights.`
              : '💡 Tip: Currently analyzing ALL columns. Select specific columns above to get focused recommendations.'
            }
          </div>
        </div>
      )}

      {/* Advanced Statistics Panel */}
      {showAdvancedStats && Object.keys(recommendations.statistics).length > 0 && (
        <div className="bg-white rounded-lg border border-indigo-200 p-4 mb-6">
          <h4 className="text-md font-medium text-indigo-800 mb-3 flex items-center justify-between">
            <span className="flex items-center">
              <span className="mr-2">📊</span> Statistical Summary
            </span>
            <span className="text-sm text-indigo-600 font-normal">
              {Object.keys(recommendations.statistics).length} numeric columns analyzed
            </span>
          </h4>
          
          {/* Column Selection Dropdown for Stats */}
          <div className="mb-3">
            <label className="text-sm font-medium text-indigo-800 mb-2 block">Select a column to view statistics:</label>
            <select
              onChange={(e) => {
                const selectedColumn = e.target.value;
                if (selectedColumn) {
                  // Hide all stats first
                  Object.keys(recommendations.statistics).forEach(col => {
                    const statsElement = document.getElementById(`stats-${col}`);
                    if (statsElement) {
                      statsElement.classList.add('hidden');
                    }
                  });
                  // Show selected column's stats
                  const selectedStats = document.getElementById(`stats-${selectedColumn}`);
                  if (selectedStats) {
                    selectedStats.classList.remove('hidden');
                  }
                }
              }}
              className="px-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">Choose a column...</option>
              {Object.keys(recommendations.statistics).map((column) => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
          
          {/* Statistics Display */}
          <div className="space-y-3">
            {Object.entries(recommendations.statistics).map(([column, stats]) => (
              <div key={column} id={`stats-${column}`} className="bg-indigo-50 rounded-lg p-3 hidden">
                <h5 className="font-medium text-indigo-900 text-sm mb-2">{column}</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Count:</span>
                    <span className="font-medium">{stats.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Mean:</span>
                    <span className="font-medium">{stats.mean}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Median:</span>
                    <span className="font-medium">{stats.median}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Std Dev:</span>
                    <span className="font-medium">{stats.stdDev}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Min:</span>
                    <span className="font-medium">{stats.min}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Max:</span>
                    <span className="font-medium">{stats.max}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">IQR:</span>
                    <span className="font-medium">{stats.iqr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Outliers:</span>
                    <span className="font-medium">{stats.outliers}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correlation Matrix */}
      {recommendations.correlations.length > 0 && (
        <div className="bg-white rounded-lg border border-green-200 p-4 mb-6">
          <h4 className="text-md font-medium text-green-800 mb-3 flex items-center">
            <span className="mr-2">🔗</span> Correlation Matrix
          </h4>
          <div className="space-y-2">
            {recommendations.correlations.slice(0, 5).map((corr, index) => (
              <div key={index} className="p-3 bg-green-50 rounded border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-900">{corr.column1}</span>
                    <span className="text-green-500">↔</span>
                    <span className="text-sm font-medium text-green-900">{corr.column2}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      corr.strength > 0.7 ? 'bg-green-100 text-green-800' :
                      corr.strength > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {corr.correlation > 0 ? '+' : ''}{corr.correlation}
                    </span>
                    <span className="text-xs text-green-600">
                      {corr.strength > 0.7 ? 'Strong' : corr.strength > 0.5 ? 'Moderate' : 'Weak'}
                    </span>
                  </div>
                </div>
                
                {/* Show data used for correlation */}
                <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                  <div className="font-medium mb-1">🔍 Data Used for Correlation:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">{corr.column1}:</span>
                      <div className="text-green-600">
                        {(() => {
                          const rows = data.rows || data.preview || [];
                          const values = rows.map(row => row[corr.column1]).filter(v => v !== null && v !== undefined && v !== '');
                          const numericValues = values.filter(val => !isNaN(parseFloat(val))).map(val => parseFloat(val));
                          return `${numericValues.length} values, sample: ${numericValues.slice(0, 2).map(v => v.toFixed(2)).join(', ')}${numericValues.length > 2 ? '...' : ''}`;
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">{corr.column2}:</span>
                      <div className="text-green-600">
                        {(() => {
                          const rows = data.rows || data.preview || [];
                          const values = rows.map(row => row[corr.column2]).filter(v => v !== null && v !== undefined && v !== '');
                          const numericValues = values.filter(val => !isNaN(parseFloat(val))).map(val => parseFloat(val));
                          return `${numericValues.length} values, sample: ${numericValues.slice(0, 2).map(v => v.toFixed(2)).join(', ')}${numericValues.length > 2 ? '...' : ''}`;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 text-green-600">
                    <span className="font-medium">Correlation method:</span> Pearson correlation coefficient
                  </div>
                </div>
              </div>
            ))}
            {recommendations.correlations.length > 5 && (
              <div className="text-center text-sm text-green-600">
                ... and {recommendations.correlations.length - 5} more correlations
              </div>
            )}
          </div>
        </div>
      )}

      {/* High Priority Suggestions */}
      {recommendations.suggestions.filter(s => s.priority === 'high').length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-blue-800 mb-3 flex items-center">
            <span className="mr-2">🚀</span> High Priority Actions
          </h4>
          <div className="space-y-3">
            {recommendations.suggestions
              .filter(s => s.priority === 'high')
              .map((suggestion, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">{suggestion.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                      {suggestion.columns && (
                        <div className="flex flex-wrap gap-2">
                          {suggestion.columns.map((col, colIndex) => (
                            <span key={colIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {col}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Show statistical context if available */}
                      {suggestion.correlation && (
                        <div className="mt-2 text-xs text-blue-600">
                          Correlation: {suggestion.correlation} (Strength: {suggestion.strength})
                        </div>
                      )}
                      {suggestion.variance && (
                        <div className="mt-2 text-xs text-blue-600">
                          Variance: {suggestion.variance}
                        </div>
                      )}
                      {suggestion.regularity && (
                        <div className="mt-2 text-xs text-blue-600">
                          Data regularity: {suggestion.regularity}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <button 
                        onClick={() => {
                          if (onNavigateToTab && onConfigureChart) {
                            onNavigateToTab('charts');
                            setTimeout(() => {
                              onConfigureChart({
                                chartType: suggestion.action,
                                categoryColumn: suggestion.columns?.[0] || '',
                                valueColumn: suggestion.columns?.[1] || '',
                                title: suggestion.title
                              });
                            }, 100);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors transition-all duration-200 hover:scale-105"
                        title={`Create ${suggestion.action} chart with ${suggestion.columns?.join(' and ') || 'selected columns'}`}
                      >
                        Try This
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Medium Priority Suggestions */}
      {recommendations.suggestions.filter(s => s.priority === 'medium').length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-blue-800 mb-3 flex items-center">
            <span className="mr-2">💡</span> Smart Ideas
          </h4>
          <div className="space-y-3">
            {recommendations.suggestions
              .filter(s => s.priority === 'medium')
              .map((suggestion, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">{suggestion.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                      {suggestion.columns && (
                        <div className="flex flex-wrap gap-2">
                          {suggestion.columns.map((col, colIndex) => (
                            <span key={colIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {col}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Show statistical context if available */}
                      {suggestion.iqr && suggestion.stdDev && (
                        <div className="mt-2 text-xs text-blue-600">
                          IQR: {suggestion.iqr}, Std Dev: {suggestion.stdDev}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <button 
                        onClick={() => {
                          if (onNavigateToTab && onConfigureChart) {
                            onNavigateToTab('charts');
                            setTimeout(() => {
                              onConfigureChart({
                                chartType: suggestion.action,
                                categoryColumn: suggestion.columns?.[0] || '',
                                valueColumn: suggestion.columns?.[1] || '',
                                title: suggestion.title
                              });
                            }, 100);
                          }
                        }}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors transition-all duration-200 hover:scale-105"
                        title={`Create ${suggestion.action} chart with ${suggestion.columns?.join(' and ') || 'selected columns'}`}
                      >
                        Explore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Enhanced Insights with Statistical Context */}
      {recommendations.insights.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-blue-800 mb-3 flex items-center">
            <span className="mr-2">🔍</span> Data Insights
          </h4>
          <div className="space-y-3">
            {recommendations.insights.map((insight, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                <h5 className="font-medium text-gray-900 mb-1">{insight.title}</h5>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                {insight.columns && (
                  <div className="flex flex-wrap gap-2">
                    {insight.columns.map((col, colIndex) => (
                      <span key={colIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {col}
                      </span>
                    ))}
                  </div>
                )}
                {/* Show statistical context if available */}
                {insight.skewness && (
                  <div className="mt-2 text-xs text-blue-600">
                    Skewness: {insight.skewness}
                  </div>
                )}
                {insight.trend && insight.strength && (
                  <div className="mt-2 text-xs text-blue-600">
                    Trend: {insight.trend} (Strength: {insight.strength})
                  </div>
                )}
                {insight.seasonality && (
                  <div className="mt-2 text-xs text-blue-600">
                    Seasonality: {insight.seasonality}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Warnings with Statistical Context */}
      {recommendations.warnings.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-orange-800 mb-3 flex items-center">
            <span className="mr-2">⚠️</span> Data Quality Alerts
          </h4>
          <div className="space-y-3">
            {recommendations.warnings.map((warning, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
                <h5 className="font-medium text-gray-900 mb-1">{warning.title}</h5>
                <p className="text-sm text-gray-600 mb-2">{warning.description}</p>
                {warning.columns && (
                  <div className="flex flex-wrap gap-2">
                    {warning.columns.map((col, colIndex) => (
                      <span key={colIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {col}
                      </span>
                    ))}
                  </div>
                )}
                {/* Show statistical context if available */}
                {warning.qualityScore && (
                  <div className="mt-2 text-xs text-orange-600">
                    Quality Score: {warning.qualityScore}%
                  </div>
                )}
                {warning.outlierCount && warning.outlierPercentage && (
                  <div className="mt-2 text-xs text-orange-600">
                    Outliers: {warning.outlierCount} ({warning.outlierPercentage}%)
                  </div>
                )}
                {warning.missingPercentage && (
                  <div className="mt-2 text-xs text-orange-600">
                    Missing Data: {warning.missingPercentage}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Analysis Summary */}
      {selectedColumns && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-md font-medium text-blue-800 mb-2 flex items-center">
            <span className="mr-2">📊</span> Analysis Scope
          </h4>
          <p className="text-sm text-blue-700 mb-2">
            Currently analyzing <strong>{selectedColumns.length}</strong> selected column{selectedColumns.length > 1 ? 's' : ''}:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedColumns.map((col, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No Recommendations */}
      {recommendations.suggestions.length === 0 && recommendations.insights.length === 0 && recommendations.warnings.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤔</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {selectedColumns ? 'No Recommendations for Selected Columns' : 'Analyzing Your Data...'}
          </h4>
          <p className="text-gray-600">
            {selectedColumns 
              ? 'Try selecting different columns or analyze all columns for comprehensive insights.'
              : 'Upload more data or try different columns to get personalized recommendations!'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartRecommendations;
