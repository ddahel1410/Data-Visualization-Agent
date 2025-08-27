<<<<<<< HEAD
# Excel/CSV Analyzer

A React application that allows users to upload Excel (.xlsx, .xls) or CSV files and view the detected column headers with data preview.

## Features

- **File Upload**: Drag and drop or click to browse for files
- **Multiple Format Support**: Excel (.xlsx, .xls) and CSV files
- **Column Header Detection**: Automatically extracts and displays column headers
- **Data Preview**: Shows first 20 rows of data for verification
- **Interactive Charting**: Pie charts and bar charts with dynamic column selection
- **Pivot Tables**: Advanced data aggregation with rows, columns, values, and filters
- **Export Functionality**: Export charts as PNG/JPEG and pivot tables to Excel
- **Error Handling**: Validates file types and provides helpful error messages
- **Responsive Design**: Clean, modern UI built with Tailwind CSS
- **Modular Architecture**: Easy to extend with additional features

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

## Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd excel-csv-analyzer
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

2. Open your browser and navigate to `http://localhost:3000`

3. Upload an Excel or CSV file by:
   - Dragging and dropping the file onto the upload area
   - Clicking the upload area to browse for files

4. View the detected column headers and data preview
5. Create interactive charts:
   - **Pie Charts**: Select a category column to see frequency distribution
   - **Bar Charts**: Choose category (X-axis) and optional value (Y-axis) columns
6. Build pivot tables:
   - **Configure rows and columns** for cross-tabulation
   - **Select value columns** for aggregation (sum, count)
   - **Apply filters** to focus on specific data subsets
7. Export your work:
   - **Charts**: Save as PNG or JPEG images
   - **Pivot Tables**: Export to Excel (.xlsx) files

## Project Structure

```
src/
├── components/
│   ├── FileUpload.js      # File upload and parsing logic
│   ├── DataPreview.js     # Data display and table rendering
│   ├── ChartPreview.js    # Interactive charts (pie, bar)
│   └── PivotTable.js      # Pivot table analysis
├── App.js                 # Main application component
├── index.js              # Application entry point
└── index.css             # Tailwind CSS imports

public/
└── index.html            # HTML template

Configuration files:
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
└── postcss.config.js     # PostCSS configuration
```

## Dependencies

- **React**: UI framework
- **SheetJS (xlsx)**: Excel and CSV file parsing
- **Recharts**: Interactive charting library (pie charts, bar charts)
- **html-to-image**: Chart export to PNG/JPEG formats
- **file-saver**: File download functionality
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing

## Future Enhancements

The modular architecture makes it easy to add:
- Additional chart types (line charts, scatter plots, etc.)
- Advanced pivot table features (multiple value columns, custom aggregations)
- Data filtering and sorting
- Additional export formats (PDF, CSV, JSON)
- Multiple sheet support for Excel files
- Advanced analytics and statistical functions
- Machine learning insights and predictions
- Automated reporting and scheduling

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.
=======
# AnalystAgent
>>>>>>> 0b040ef7e80fc075e0f466aa6f7858f94cb47aea
