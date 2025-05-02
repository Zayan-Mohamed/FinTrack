<script>
	import { onMount } from 'svelte';
	import { expenses } from '../../lib/stores/expenses';
	import { income } from '../../lib/stores/income';
	import { savings } from '../../lib/stores/savings';
	import { settingsStore } from '../../lib/stores/settings';
	import { formatCurrency } from '../../lib/utils/formatters';
	import ChartComponents from '../../components/Dashboard/ChartComponents.svelte';

	// Financial summary data
	let totalIncome = 0;
	let totalExpenses = 0;
	let totalSavings = 0;
	let netIncome = 0;
	let expensesRatio = 0;

	// Filter options
	let period = 'all'; // all, month, year, custom
	let dateRange = { start: '', end: '' };
	let selectedYear = new Date().getFullYear();
	let selectedMonth = new Date().getMonth() + 1;

	// Categories and sources data
	let expensesByCategory = {};
	let incomeBySource = {};
	let transactionCount = { income: 0, expenses: 0 };
	let averageTransaction = { income: 0, expenses: 0 };
	let monthlySummary = [];
	let sorted = { by: 'amount', order: 'desc' };

	// Format options
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	// Subscribe to stores and initialize data
	onMount(() => {
		const unsubIncome = income.subscribe((value) => {
			totalIncome = value.reduce((acc, curr) => acc + Number(curr.amount), 0);
			incomeBySource = calculateIncomeBySource(value);
			transactionCount.income = value.length;
			averageTransaction.income = value.length > 0 ? totalIncome / value.length : 0;
			updateMonthlySummary();
			updateNetIncome();
		});

		const unsubExpenses = expenses.subscribe((value) => {
			totalExpenses = value.reduce((acc, curr) => acc + Number(curr.amount), 0);
			expensesByCategory = calculateExpensesByCategory(value);
			transactionCount.expenses = value.length;
			averageTransaction.expenses = value.length > 0 ? totalExpenses / value.length : 0;
			updateMonthlySummary();
			updateNetIncome();
		});

		const unsubSavings = savings.subscribe((value) => {
			totalSavings = value.reduce((acc, curr) => acc + Number(curr.currentAmount), 0);
		});

		return () => {
			unsubIncome();
			unsubExpenses();
			unsubSavings();
		};
	});

	// Calculate income grouped by source
	function calculateIncomeBySource(incomeData) {
		const filteredData = filterByPeriod(incomeData);
		const bySource = {};

		filteredData.forEach((item) => {
			if (!bySource[item.source]) {
				bySource[item.source] = 0;
			}
			bySource[item.source] += Number(item.amount);
		});

		return bySource;
	}

	// Calculate expenses grouped by category
	function calculateExpensesByCategory(expenseData) {
		const filteredData = filterByPeriod(expenseData);
		const byCategory = {};

		filteredData.forEach((item) => {
			if (!byCategory[item.category]) {
				byCategory[item.category] = 0;
			}
			byCategory[item.category] += Number(item.amount);
		});

		return byCategory;
	}

	// Filter data by selected period
	function filterByPeriod(data) {
		if (period === 'all') return data;

		const filtered = data.filter((item) => {
			const itemDate = new Date(item.date);

			if (period === 'month') {
				return itemDate.getFullYear() === selectedYear && itemDate.getMonth() + 1 === selectedMonth;
			} else if (period === 'year') {
				return itemDate.getFullYear() === selectedYear;
			} else if (period === 'custom' && dateRange.start && dateRange.end) {
				return item.date >= dateRange.start && item.date <= dateRange.end;
			}

			return true;
		});

		return filtered;
	}

	// Update monthly summary data
	function updateMonthlySummary() {
		const summary = {};
		const currentYear = new Date().getFullYear();

		// Initialize all months for the current year
		for (let i = 0; i < 12; i++) {
			const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
			summary[monthKey] = {
				income: 0,
				expenses: 0,
				net: 0,
				month: monthNames[i],
				monthNum: i + 1,
				year: currentYear
			};
		}

		// Add income data
		$income.forEach((item) => {
			const itemDate = new Date(item.date);
			if (itemDate.getFullYear() === currentYear) {
				const monthKey = `${currentYear}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
				if (summary[monthKey]) {
					summary[monthKey].income += Number(item.amount);
					summary[monthKey].net = summary[monthKey].income - summary[monthKey].expenses;
				}
			}
		});

		// Add expense data
		$expenses.forEach((item) => {
			const itemDate = new Date(item.date);
			if (itemDate.getFullYear() === currentYear) {
				const monthKey = `${currentYear}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
				if (summary[monthKey]) {
					summary[monthKey].expenses += Number(item.amount);
					summary[monthKey].net = summary[monthKey].income - summary[monthKey].expenses;
				}
			}
		});

		// Convert to array and sort by month
		monthlySummary = Object.values(summary).sort((a, b) => a.monthNum - b.monthNum);
	}

	// Update net income and expense ratio
	function updateNetIncome() {
		netIncome = totalIncome - totalExpenses;
		expensesRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
	}

	// Handle period change
	function handlePeriodChange() {
		// Recalculate data based on new period
		incomeBySource = calculateIncomeBySource($income);
		expensesByCategory = calculateExpensesByCategory($expenses);
	}

	// Sort objects by key or value
	function sortObject(obj, by = 'key', order = 'asc') {
		return Object.entries(obj).sort(([keyA, valA], [keyB, valB]) => {
			const compareA = by === 'key' ? keyA : valA;
			const compareB = by === 'key' ? keyB : valB;

			return order === 'asc' ? (compareA > compareB ? 1 : -1) : compareA < compareB ? 1 : -1;
		});
	}

	// Format percentage for display
	function formatPercentage(value) {
		return `${value.toFixed(1)}%`;
	}

	// React to period changes
	$: if (period) {
		handlePeriodChange();
	}

	// Sort data based on user selection
	$: sortedExpensesByCategory = sortObject(expensesByCategory, sorted.by, sorted.order);
	$: sortedIncomeBySource = sortObject(incomeBySource, sorted.by, sorted.order);
</script>

<div class="bg-gray-100 p-6 dark:bg-gray-900 dark:text-gray-100">
	<h1 class="mb-8 text-3xl font-bold">Financial Reports</h1>

	<!-- Period Selection -->
	<div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
		<h2 class="mb-4 text-xl font-semibold">Report Period</h2>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
			<div>
				<label for="time-period" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Period</label
				>
				<select
					bind:value={period}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				>
					<option value="all">All Time</option>
					<option value="month">This Month</option>
					<option value="year">This Year</option>
					<option value="custom">Custom Range</option>
				</select>
			</div>

			{#if period === 'month'}
				<div>
					<label for="month" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
					<select
						bind:value={selectedMonth}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					>
						{#each monthNames as name, index}
							<option value={index + 1}>{name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="year" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
					<select
						bind:value={selectedYear}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					>
						{#each Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i) as year}
							<option value={year}>{year}</option>
						{/each}
					</select>
				</div>
			{:else if period === 'year'}
				<div>
					<label for="year" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
					<select
						bind:value={selectedYear}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					>
						{#each Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i) as year}
							<option value={year}>{year}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
	</div>

	<!-- Financial Summary -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3 mb-5 ">
		<div class="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 dark:text-gray-200">
			<h2 class="text-xl font-semibold">Total Income</h2>
			<p class="text-lg">{formatCurrency(totalIncome)}</p>
		</div>
		<div class="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 dark:text-gray-200">
			<h2 class="text-xl font-semibold">Total Expenses</h2>
			<p class="text-lg">{formatCurrency(totalExpenses)}</p>
		</div>
		<div class="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 dark:text-gray-200">
			<h2 class="text-xl font-semibold">Total Savings</h2>
			<p class="text-lg">{formatCurrency(totalSavings)}</p>
		</div>
	</div>

	<ChartComponents {totalIncome} {totalExpenses} {totalSavings} />
</div>
