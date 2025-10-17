# Data Visualization Agent

A React application that allows users to upload Excel (.xlsx, .xls) or CSV files and create powerful data visualizations and interactive dashboards.

## Features

- **File Upload**: Drag and drop or click to browse for files
- **Multiple Format Support**: Excel (.xlsx, .xls) and CSV files
- **Column Header Detection**: Automatically extracts and displays column headers
- **Data Preview**: Shows data with virtual scrolling for large datasets
- **Interactive Charting**: Pie charts, bar charts, line charts, KPI cards, gauges, and more
- **Pivot Tables**: Advanced data aggregation with rows, columns, values, and filters
- **Interactive Dashboards**: Create multi-chart layouts with advanced filtering system
- **Smart Recommendations**: Get intelligent insights and chart suggestions based on your data
- **Data Quality Analysis**: Detect issues and get recommendations
- **Data Comparison**: Compare multiple datasets
- **Export Functionality**: Export charts as PNG/JPEG and pivot tables to Excel
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Clean, modern UI built with Tailwind CSS
- **Modular Architecture**: Easy to extend with additional features

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

## Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd data-visualization-agent
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the development server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3002`

3. Upload an Excel or CSV file by:
   - Dragging and dropping the file onto the upload area
   - Clicking the upload area to browse for files

4. Explore the various tabs:
   - **Smart Recommendations**: Get intelligent chart and analysis recommendations
   - **Data Quality**: Analyze data health
   - **Data Comparison**: Compare datasets
   - **Interactive Dashboard**: Create multi-chart layouts
   - **Chart Visualization**: Create individual charts
   - **Pivot Tables**: Build pivot analysis
   - **Data Preview**: View raw data with virtual scrolling

## Dashboard Features

### Layout Options
The Interactive Dashboard supports multiple layout options:
- **1 + 2 Layout**: One full-width chart on top, 2 charts below
- **1 + 3 Layout**: One full-width chart on top, 3 charts below
- **2 Horizontal**: 2 charts side by side
- **3 Horizontal**: 3 charts side by side
- **2x2 Grid**: 4 charts in a 2x2 grid
- **2x3 Grid**: 6 charts in a 2x3 grid
- **3x2 Grid**: 6 charts in a 3x2 grid
- **3x3 Grid**: 9 charts in a 3x3 grid

### Advanced Filtering System
Powerful, collapsible filtering system with multiple filter types:

**Category Filters**
- Multi-select filtering for all categorical columns
- Checkbox interface for easy selection
- OR logic: Select multiple values (e.g., "North OR South")
- Smart display: Grid layout for few values, scrollable list for many

**Numeric Range Filters**
- Filter numeric columns by min/max ranges
- Add only the filters you need (on-demand selection)
- Shows data range for reference
- Useful for sales amounts, ages, quantities, etc.

**Text Search**
- Search specific text columns
- Case-insensitive matching
- Real-time filtering as you type
- Perfect for finding customer names, product IDs, etc.

**Date Range Filters**
- Filter by start and/or end date columns
- Quick date presets: Last 7/30 Days, This/Last Month, Quarter, YTD
- Optional - use one, both, or neither
- Ideal for time-based analysis

**Filter Management**
- All filters work together (cumulative)
- Collapsible section to save screen space
- Clear All button for quick reset
- Active filter badges on each tab
- Save/Load filters with dashboard configuration

## Project Structure

```
src/
├── components/
│   ├── FileUpload.js             # File upload and parsing logic
│   ├── DataPreview.js            # Data display and table rendering
│   ├── ChartPreview.js           # Interactive charts
│   ├── PivotTable.js             # Pivot table analysis
│   ├── Dashboard.js              # Main dashboard with tabs
│   ├── DashboardBuilder.js       # Interactive dashboard builder
│   ├── SmartRecommendations.js   # AI-powered recommendations
│   ├── DataQualityDashboard.js   # Data quality analysis
│   ├── DataComparison.js         # Dataset comparison
│   ├── VirtualDataView.js        # Virtual scrolling data view
│   ├── ThemeToggle.js            # Dark mode toggle
│   └── Welcome.js                # Welcome screen
├── contexts/
│   └── ThemeContext.js           # Theme management
├── App.js                        # Main application component
├── index.js                      # Application entry point
└── index.css                     # Tailwind CSS imports

public/
└── index.html                    # HTML template

Configuration files:
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind CSS configuration
└── postcss.config.js             # PostCSS configuration
```

## Dependencies

- **React**: UI framework
- **SheetJS (xlsx)**: Excel and CSV file parsing
- **html-to-image**: Chart export to PNG/JPEG formats
- **file-saver**: File download functionality
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.
