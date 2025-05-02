<script>
	import { onMount } from 'svelte';
	import { income } from '../../lib/stores/income';
	import { expenses } from '../../lib/stores/expenses';
	import { savings } from '../../lib/stores/savings';
	import { formatCurrency } from '../../lib/utils/formatters';
	import { browser } from '$app/environment';
	import { settingsStore } from '../../lib/stores/settings';

	// Canvas references
	let barChartCanvas;
	let pieChartCanvas;
	let lineChartCanvas;

	// Chart instances
	let barChart;
	let pieChart;
	let lineChart;

	let chartLoaded = false;
	let ChartJS;
	let selectedChart = 'overview'; // 'overview', 'categories', 'trend'
	let isExporting = false;

	// Props passed from parent
	export let totalIncome = 0;
	export let totalExpenses = 0;
	export let totalSavings = 0;

	// Data for charts
	let expensesByCategory = {};
	let incomeBySource = {};
	let monthlyData = {};

	// Date filter options
	let dateRange = {
		start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
			.toISOString()
			.split('T')[0],
		end: new Date().toISOString().split('T')[0]
	};

	let filterActive = true;

	onMount(async () => {
		if (!browser) return;

		try {
			// Import Chart.js correctly
			const ChartModule = await import('chart.js/auto');
			ChartJS = ChartModule.default || ChartModule;

			chartLoaded = true;

			// Add a small timeout to ensure DOM is ready
			setTimeout(() => {
				processData();
				initializeCharts();
			}, 100);

			// Subscribe to theme changes
			const unsubscribeTheme = settingsStore.subscribe((settings) => {
				if (chartLoaded && browser) {
					// Reinitialize charts when theme changes
					setTimeout(() => {
						initializeCharts();
					}, 0);
				}
			});

			// Clean up subscription
			return () => {
				unsubscribeTheme();
			};
		} catch (e) {
			console.error('Error loading Chart.js:', e);
		}
	});

	// Subscribe to store changes
	$: if (chartLoaded && browser) {
		if ($income?.length || $expenses?.length || $savings?.length) {
			processData();
			initializeCharts();
		}
	}

	// React to date filter changes
	$: if (chartLoaded && browser && (dateRange.start || dateRange.end)) {
		processData();
		initializeCharts();
	}

	// React to chart type changes
	$: if (chartLoaded && browser && selectedChart) {
		setTimeout(() => {
			initializeCharts();
		}, 0);
	}

	function processData() {
		if (!browser) return;

		// Process with dateRange regardless of filterActive state
		const filteredIncome = $income.filter((item) => {
			const date = new Date(item.date);
			return (
				(!dateRange.start || date >= new Date(dateRange.start)) &&
				(!dateRange.end || date <= new Date(dateRange.end))
			);
		});

		const filteredExpenses = $expenses.filter((item) => {
			const date = new Date(item.date);
			return (
				(!dateRange.start || date >= new Date(dateRange.start)) &&
				(!dateRange.end || date <= new Date(dateRange.end))
			);
		});

		// Process expense data by category
		expensesByCategory = {};
		filteredExpenses.forEach((expense) => {
			if (!expensesByCategory[expense.category]) {
				expensesByCategory[expense.category] = 0;
			}
			expensesByCategory[expense.category] += Number(expense.amount);
		});

		// Process income data by source
		incomeBySource = {};
		filteredIncome.forEach((inc) => {
			if (!incomeBySource[inc.source]) {
				incomeBySource[inc.source] = 0;
			}
			incomeBySource[inc.source] += Number(inc.amount);
		});

		// Process monthly data for trends
		monthlyData = {};
		// Get last 6 months or use date filter range
		let startDate, endDate;

		if (filterActive && dateRange.start && dateRange.end) {
			startDate = new Date(dateRange.start);
			endDate = new Date(dateRange.end);
		} else {
			endDate = new Date();
			startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1);
		}

		// Create month entries between start and end dates
		let currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
			monthlyData[month] = { income: 0, expenses: 0 };
			currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
		}

		// Fill in the income data
		filteredIncome.forEach((inc) => {
			const date = new Date(inc.date);
			const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			if (monthlyData[month]) {
				monthlyData[month].income += Number(inc.amount);
			}
		});

		// Fill in the expense data
		filteredExpenses.forEach((exp) => {
			const date = new Date(exp.date);
			const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			if (monthlyData[month]) {
				monthlyData[month].expenses += Number(exp.amount);
			}
		});
	}

	function initializeCharts() {
		if (!chartLoaded || !browser) return;

		initializeBarChart();
		initializePieChart();
		initializeLineChart();
	}

	function initializeBarChart() {
		if (!barChartCanvas) return;

		// Destroy existing chart if it exists
		if (barChart) barChart.destroy();

		// Create the bar chart
		barChart = new ChartJS(barChartCanvas, {
			type: 'bar',
			data: {
				labels: ['Income', 'Expenses', 'Savings Goal'],
				datasets: [
					{
						label: 'Financial Overview',
						data: [totalIncome, totalExpenses, totalSavings],
						backgroundColor: [
							'rgba(75, 192, 192, 0.7)', // Income (teal)
							'rgba(255, 99, 132, 0.7)', // Expenses (red)
							'rgba(153, 102, 255, 0.7)' // Savings goal (purple)
						],
						borderColor: [
							'rgba(75, 192, 192, 1)',
							'rgba(255, 99, 132, 1)',
							'rgba(153, 102, 255, 1)'
						],
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: true,
						position: 'bottom',
						labels: {
							color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
						}
					},
					title: {
						display: true,
						text: 'Financial Overview',
						font: {
							size: 16
						},
						color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
					},
					tooltip: {
						callbacks: {
							label: function (context) {
								let label = context.dataset.label || '';
								if (label) {
									label += ': ';
								}
								if (context.parsed.y !== null) {
									label += formatCurrency(context.parsed.y);
								}
								return label;
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: function (value) {
								return formatCurrency(value);
							},
							color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
						},
						grid: {
							color: document.documentElement.classList.contains('dark')
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(0, 0, 0, 0.1)'
						}
					},
					x: {
						ticks: {
							color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
						},
						grid: {
							color: document.documentElement.classList.contains('dark')
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(0, 0, 0, 0.1)'
						}
					}
				}
			}
		});
	}

	function initializePieChart() {
		if (!pieChartCanvas) return;

		// Destroy existing chart if it exists
		if (pieChart) pieChart.destroy();

		// Create arrays for the pie chart
		const categories = Object.keys(expensesByCategory);
		const values = Object.values(expensesByCategory);
		const backgroundColors = generateColors(categories.length);

		// Create the pie chart
		pieChart = new ChartJS(pieChartCanvas, {
			type: 'pie',
			data: {
				labels: categories,
				datasets: [
					{
						data: values,
						backgroundColor: backgroundColors,
						borderColor: 'rgba(255, 255, 255, 0.5)',
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
						}
					},
					title: {
						display: true,
						text: 'Expenses by Category',
						font: {
							size: 16
						},
						color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
					},
					tooltip: {
						callbacks: {
							label: function (context) {
								const label = context.label || '';
								const value = context.parsed;
								const total = context.dataset.data.reduce((a, b) => a + b, 0);
								const percentage = ((value / total) * 100).toFixed(1);
								return `${label}: ${formatCurrency(value)} (${percentage}%)`;
							}
						}
					}
				}
			}
		});
	}

	function initializeLineChart() {
		if (!lineChartCanvas) return;

		// Destroy existing chart if it exists
		if (lineChart) lineChart.destroy();

		// Extract sorted months and corresponding data
		const months = Object.keys(monthlyData).sort();
		const incomeData = months.map((month) => monthlyData[month].income);
		const expenseData = months.map((month) => monthlyData[month].expenses);

		// Format months for display (e.g., "2023-05" to "May 2023")
		const formattedMonths = months.map((month) => {
			const [year, monthNum] = month.split('-');
			const date = new Date(Number(year), Number(monthNum) - 1);
			return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
		});

		// Create the line chart
		lineChart = new ChartJS(lineChartCanvas, {
			type: 'line',
			data: {
				labels: formattedMonths,
				datasets: [
					{
						label: 'Income',
						data: incomeData,
						borderColor: 'rgba(75, 192, 192, 1)',
						backgroundColor: 'rgba(75, 192, 192, 0.2)',
						tension: 0.3,
						fill: true
					},
					{
						label: 'Expenses',
						data: expenseData,
						borderColor: 'rgba(255, 99, 132, 1)',
						backgroundColor: 'rgba(255, 99, 132, 0.2)',
						tension: 0.3,
						fill: true
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
						}
					},
					title: {
						display: true,
						text: 'Income vs Expenses Trend',
						font: {
							size: 16
						},
						color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
					},
					tooltip: {
						callbacks: {
							label: function (context) {
								let label = context.dataset.label || '';
								if (label) {
									label += ': ';
								}
								if (context.parsed.y !== null) {
									label += formatCurrency(context.parsed.y);
								}
								return label;
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: function (value) {
								return formatCurrency(value);
							},
							color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
						},
						grid: {
							color: document.documentElement.classList.contains('dark')
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(0, 0, 0, 0.1)'
						}
					},
					x: {
						ticks: {
							color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
						},
						grid: {
							color: document.documentElement.classList.contains('dark')
								? 'rgba(255, 255, 255, 0.1)'
								: 'rgba(0, 0, 0, 0.1)'
						}
					}
				}
			}
		});
	}

	function generateColors(count) {
		const colors = [
			'rgba(255, 99, 132, 0.7)',
			'rgba(54, 162, 235, 0.7)',
			'rgba(255, 206, 86, 0.7)',
			'rgba(75, 192, 192, 0.7)',
			'rgba(153, 102, 255, 0.7)',
			'rgba(255, 159, 64, 0.7)',
			'rgba(199, 199, 199, 0.7)',
			'rgba(83, 102, 255, 0.7)',
			'rgba(78, 205, 196, 0.7)',
			'rgba(255, 99, 71, 0.7)'
		];

		// If we need more colors than in our predefined array, generate them
		if (count > colors.length) {
			for (let i = colors.length; i < count; i++) {
				const r = Math.floor(Math.random() * 255);
				const g = Math.floor(Math.random() * 255);
				const b = Math.floor(Math.random() * 255);
				colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
			}
		}

		return colors.slice(0, count);
	}

	// Export chart as image
	async function exportChart() {
		isExporting = true;

		try {
			let canvas;
			let filename;

			if (selectedChart === 'overview') {
				canvas = barChartCanvas;
				filename = 'financial-overview.png';
			} else if (selectedChart === 'categories') {
				canvas = pieChartCanvas;
				filename = 'expense-categories.png';
			} else {
				canvas = lineChartCanvas;
				filename = 'financial-trend.png';
			}

			// Convert chart to image
			const link = document.createElement('a');
			link.download = filename;
			link.href = canvas.toDataURL('image/png');
			link.click();
		} catch (error) {
			console.error('Error exporting chart:', error);
		} finally {
			isExporting = false;
		}
	}

	function toggleDateFilter() {
		filterActive = !filterActive;
		if (!filterActive) {
			// Reset to default 6 months when disabling filter
			dateRange = {
				start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
					.toISOString()
					.split('T')[0],
				end: new Date().toISOString().split('T')[0]
			};
		}
		processData();
		initializeCharts();
	}
</script>

<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 dark:text-gray-100">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<h2 class="text-2xl font-bold">Financial Analytics</h2>

		<!-- Date Filter Controls -->
		<div class="flex flex-wrap items-center gap-3">
			<button
				class="flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors {filterActive
					? 'bg-blue-500 text-white'
					: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
				on:click={toggleDateFilter}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
					/>
				</svg>
				Filter
			</button>

			<button
				class="flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				on:click={exportChart}
				disabled={isExporting || !chartLoaded}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
					/>
				</svg>
				Export
			</button>
		</div>
	</div>

	{#if filterActive}
		<div
			class="mb-6 grid grid-cols-1 gap-4 rounded-md bg-gray-50 p-4 dark:bg-gray-700 sm:grid-cols-2"
		>
			<div>
				<label
					for="filter-start"
					class="block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Start Date
				</label>
				<input
					id="filter-start"
					type="date"
					bind:value={dateRange.start}
					class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
				/>
			</div>
			<div>
				<label for="filter-end" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
					End Date
				</label>
				<input
					id="filter-end"
					type="date"
					bind:value={dateRange.end}
					class="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
				/>
			</div>
		</div>
	{/if}

	<div class="mb-6 flex flex-wrap items-center gap-3">
		<button
			class="rounded-md px-4 py-2 text-sm font-medium transition-colors {selectedChart ===
			'overview'
				? 'bg-blue-500 text-white'
				: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
			on:click={() => (selectedChart = 'overview')}
		>
			Overview
		</button>
		<button
			class="rounded-md px-4 py-2 text-sm font-medium transition-colors {selectedChart ===
			'categories'
				? 'bg-blue-500 text-white'
				: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
			on:click={() => (selectedChart = 'categories')}
		>
			Categories
		</button>
		<button
			class="rounded-md px-4 py-2 text-sm font-medium transition-colors {selectedChart === 'trend'
				? 'bg-blue-500 text-white'
				: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}"
			on:click={() => (selectedChart = 'trend')}
		>
			Trends
		</button>
	</div>

	<div class="h-96">
		<!-- Fixed height container -->
		{#if chartLoaded}
			{#if selectedChart === 'overview'}
				<canvas bind:this={barChartCanvas} class="block w-full"></canvas>
			{:else if selectedChart === 'categories'}
				<canvas bind:this={pieChartCanvas} class="block w-full"></canvas>
			{:else if selectedChart === 'trend'}
				<canvas bind:this={lineChartCanvas} class="block w-full"></canvas>
			{/if}
		{:else}
			<div class="flex h-full items-center justify-center">
				<div class="text-center">
					<svg
						class="mx-auto h-12 w-12 animate-spin text-gray-400 dark:text-gray-600"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading charts...</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Summary stats below chart -->
	<div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<div class="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
			<div class="text-sm font-medium text-gray-500 dark:text-gray-400">Net Income</div>
			<div
				class="mt-2 text-lg font-semibold {totalIncome > totalExpenses
					? 'text-green-600 dark:text-green-400'
					: 'text-red-600 dark:text-red-400'}"
			>
				{formatCurrency(totalIncome - totalExpenses)}
			</div>
			<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
				{totalIncome > totalExpenses
					? "You're saving money!"
					: "You're spending more than you earn"}
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
			<div class="text-sm font-medium text-gray-500 dark:text-gray-400">Expense Ratio</div>
			<div class="mt-2 text-lg font-semibold">
				{totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}%
			</div>
			<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
				Of your income goes to expenses
			</div>
		</div>

		<div class="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
			<div class="text-sm font-medium text-gray-500 dark:text-gray-400">Savings Progress</div>
			<div class="mt-2 text-lg font-semibold">
				{totalSavings > 0 ? Math.round(((totalIncome - totalExpenses) / totalSavings) * 100) : 0}%
			</div>
			<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">Of your savings goal achieved</div>
		</div>
	</div>
</div>
