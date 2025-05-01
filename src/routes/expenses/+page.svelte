<script>
	import { onMount } from 'svelte';
    import { income } from '../../lib/stores/income';
    import { expenses } from '../../lib/stores/expenses';
    import { savings } from '../../lib/stores/savings';
    import ExpenseTracker from '../../components/Dashboard/ExpenseTracker.svelte';
    import ChartComponents from '../../components/Dashboard/ChartComponents.svelte';

    let incomeData = [];
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSavings = 0;

    onMount(() => {
        const unsubscribeIncome = income.subscribe((value) => {
            incomeData = value;
            totalIncome = value.reduce((sum, item) => sum + Number(item.amount), 0);
        });

        const unsubscribeExpenses = expenses.subscribe((value) => {
            totalExpenses = value.reduce((sum, item) => sum + Number(item.amount), 0);
        });

        const unsubscribeSavings = savings.subscribe((value) => {
            totalSavings = value.reduce((sum, item) => sum + Number(item.amount), 0);
        });

        return () => {
            unsubscribeIncome();
            unsubscribeExpenses();
            unsubscribeSavings();
        };
    });
</script>

<div class="bg-gray-100 p-4 dark:bg-gray-900 dark:text-gray-100">
	<h1 class="mb-4 text-2xl font-bold">Expenses</h1>
	<ExpenseTracker />
	<ChartComponents {totalIncome} {totalExpenses} {totalSavings} />
</div>
