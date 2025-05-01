<script>
	import { onMount } from 'svelte';
	import { expenses } from '../../lib/stores/expenses';
	import { income } from '../../lib/stores/income';
	import { savings } from '../../lib/stores/savings';
	import { settingsStore } from '../../lib/stores/settings';
	import { formatCurrency } from '../../lib/utils/formatters';
	import ChartComponents from '../../components/Dashboard/ChartComponents.svelte';

	// Financial summary
	let totalIncome = 0;
	let totalExpenses = 0;
	let totalSavings = 0;
	let netIncome = 0;
	let savingsProgress = 0;
	let recentTransactions = [];

	onMount(() => {
		const unsubIncome = income.subscribe((value) => {
			totalIncome = value.reduce((acc, curr) => acc + Number(curr.amount), 0);
			updateNetIncome();
			updateRecentTransactions();
		});

		const unsubExpenses = expenses.subscribe((value) => {
			totalExpenses = value.reduce((acc, curr) => acc + Number(curr.amount), 0);
			updateNetIncome();
			updateRecentTransactions();
		});

		const unsubSavings = savings.subscribe((value) => {
			totalSavings = value.reduce((acc, curr) => acc + Number(curr.currentAmount), 0);
			updateSavingsProgress();
		});

		return () => {
			unsubIncome();
			unsubExpenses();
			unsubSavings();
		};
	});

	function updateNetIncome() {
		netIncome = totalIncome - totalExpenses;
	}

	function updateSavingsProgress() {
		savingsProgress = totalSavings > 0 ? (totalIncome / totalSavings) * 100 : 0;
		if (savingsProgress > 100) savingsProgress = 100;
	}

	function getFinancialHealthStatus() {
		if (netIncome > totalExpenses * 0.5) return 'excellent';
		if (netIncome > 0) return 'good';
		if (netIncome === 0) return 'neutral';
		return 'needs-attention';
	}

	function updateRecentTransactions() {
		const incomeItems = $income.map((item) => ({
			...item,
			type: 'income',
			date: new Date(item.date)
		}));

		const expenseItems = $expenses.map((item) => ({
			...item,
			type: 'expense',
			date: new Date(item.date)
		}));

		recentTransactions = [...incomeItems, ...expenseItems]
			.sort((a, b) => b.date - a.date)
			.slice(0, 5);
	}
</script>

<div class="space-y-16">
	<!-- Increased spacing between major sections -->
	<!-- Financial Overview Cards section -->
	<section class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Income Card -->
		<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</h3>
			<p class="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
				{formatCurrency(totalIncome)}
			</p>
			<a
				href="/income"
				class="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
			>
				View Details
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="ml-1 h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>

		<!-- Expenses Card -->
		<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</h3>
			<p class="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
				{formatCurrency(totalExpenses)}
			</p>
			<a
				href="/expenses"
				class="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
			>
				View Details
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="ml-1 h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>

		<!-- Net Income Card -->
		<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Net Income</h3>
			<p
				class="mt-2 text-3xl font-bold"
				class:text-green-600={netIncome > 0}
				class:text-red-600={netIncome < 0}
				class:dark:text-green-400={netIncome > 0}
				class:dark:text-red-400={netIncome < 0}
			>
				{formatCurrency(netIncome)}
			</p>
			<p class="mt-1 flex items-center text-sm">
				<span
					class="inline-flex rounded-full px-2 text-xs font-semibold uppercase"
					class:bg-green-100={getFinancialHealthStatus() === 'excellent'}
					class:text-green-800={getFinancialHealthStatus() === 'excellent'}
					class:bg-blue-100={getFinancialHealthStatus() === 'good'}
					class:text-blue-800={getFinancialHealthStatus() === 'good'}
					class:bg-yellow-100={getFinancialHealthStatus() === 'neutral'}
					class:text-yellow-800={getFinancialHealthStatus() === 'neutral'}
					class:bg-red-100={getFinancialHealthStatus() === 'needs-attention'}
					class:text-red-800={getFinancialHealthStatus() === 'needs-attention'}
				>
					{getFinancialHealthStatus()}
				</span>
			</p>
		</div>

		<!-- Savings Goal Progress -->
		<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
			<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Savings Goal Progress</h3>
			<p class="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
				{savingsProgress.toFixed(0)}%
			</p>
			<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
				<div class="h-full rounded-full bg-blue-500" style="width: {savingsProgress}%;"></div>
			</div>
			<a
				href="/savings"
				class="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
			>
				Manage Goals
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="ml-1 h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</section>

	<!-- Quick Actions Section - Moving this section before the charts -->
	<section class="grid grid-cols-1 gap-5 sm:grid-cols-3">
		<a
			href="/income"
			class="flex items-center justify-center rounded-lg bg-white p-6 shadow-md transition hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
		>
			<div class="text-center">
				<div
					class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-green-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						/>
					</svg>
				</div>
				<h3 class="font-medium">Add Income</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Record a new income source</p>
			</div>
		</a>

		<a
			href="/expenses"
			class="flex items-center justify-center rounded-lg bg-white p-6 shadow-md transition hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
		>
			<div class="text-center">
				<div
					class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-red-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<h3 class="font-medium">Add Expense</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Record a new expense</p>
			</div>
		</a>

		<a
			href="/reports"
			class="flex items-center justify-center rounded-lg bg-white p-6 shadow-md transition hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
		>
			<div class="text-center">
				<div
					class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				</div>
				<h3 class="font-medium">View Reports</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Analyze your finances</p>
			</div>
		</a>
	</section>

	<!-- Recent Transactions Section -->
	<section>
		<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
			<h3 class="mb-4 text-lg font-medium">Recent Transactions</h3>
			{#if recentTransactions.length === 0}
				<p class="italic text-gray-500 dark:text-gray-400">No recent transactions</p>
			{:else}
				<div class="overflow-hidden">
					<ul class="divide-y divide-gray-200 dark:divide-gray-700">
						{#each recentTransactions as transaction}
							<li class="py-3">
								<div class="flex items-center justify-between">
									<div class="flex items-center">
										<span
											class="mr-3 flex h-8 w-8 items-center justify-center rounded-full"
											class:bg-green-100={transaction.type === 'income'}
											class:text-green-800={transaction.type === 'income'}
											class:bg-red-100={transaction.type === 'expense'}
											class:text-red-800={transaction.type === 'expense'}
										>
											{#if transaction.type === 'income'}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 6v6m0 0v6m0-6h6m-6 0H6"
													/>
												</svg>
											{:else}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M20 12H4"
													/>
												</svg>
											{/if}
										</span>
										<div>
											<p class="font-medium text-gray-900 dark:text-white">
												{transaction.type === 'income'
													? transaction.source
													: transaction.description}
											</p>
											<p class="text-sm text-gray-500 dark:text-gray-400">
												{transaction.date.toLocaleDateString()}
											</p>
										</div>
									</div>
									<span
										class="font-medium"
										class:text-green-600={transaction.type === 'income'}
										class:text-red-600={transaction.type === 'expense'}
										class:dark:text-green-400={transaction.type === 'income'}
										class:dark:text-red-400={transaction.type === 'expense'}
									>
										{transaction.type === 'income' ? '+' : '-'}
										{formatCurrency(transaction.amount)}
									</span>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</section>

	<!-- Data Visualization Section -->
	<section>
		<div class="mb-8 h-[500] rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
			<h3 class="mb-6 text-lg font-medium">Financial Overview</h3>
			<ChartComponents {totalIncome} {totalExpenses} {totalSavings} />
		</div>
	</section>
</div>
