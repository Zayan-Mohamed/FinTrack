# Personal Finance Dashboard

A comprehensive financial tracking application built with Svelte that helps you manage your income, expenses, savings goals, and visualize your financial health.

## Features

- **Dashboard Overview**: Get a quick snapshot of your financial status with charts and summaries
- **Income Tracking**: Log and categorize your income sources
- **Expense Management**: Track expenses by category and payment method
- **Savings Goals**: Set and monitor progress towards financial goals
- **Reports**: Generate detailed financial reports with insights and trends
- **Settings**: Customize your experience with preferences for currency, theme, date formats, and more
- **Data Management**: Import/export your financial data for backup or migration

## Getting Started

### Prerequisites

- Node.js (v16 or newer recommended)
- npm, yarn, or pnpm package manager

### Installation

1. Clone the repository or download the source code:

   ```bash
   git clone https://github.com/yourusername/personal-finance-dashboard.git
   cd personal-finance-dashboard
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   npm run dev -- --open   # to automatically open in browser
   ```

4. The application will be available at `http://localhost:5173`

## Building for Production

To create a production-ready build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Data Storage

All your financial data is stored locally in your browser using localStorage. No data is sent to any external servers, ensuring your financial information remains private.

## Features in Detail

### Data Management

- **Export Data**: Back up all your financial data as a JSON file
- **Import Data**: Restore from a previously exported backup
- **Clear Data**: Option to reset all stored data when needed

### Customization

- **Currency Options**: Support for USD, EUR, GBP, CAD, AUD, JPY, LKR, INR and more
- **Theme Selection**: Light and dark modes available
- **Display Preferences**: Configure number formats, date formats, and more

## Technologies Used

- Svelte/SvelteKit
- TailwindCSS
- Chart.js
- LocalStorage for data persistence

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
