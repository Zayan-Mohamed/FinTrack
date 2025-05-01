<script>
    import { onMount } from 'svelte';
    import { income } from '../../lib/stores/income';
    import { expenses } from '../../lib/stores/expenses';
    import { savings } from '../../lib/stores/savings';
    import { formatCurrency } from '../../lib/utils/formatters';
    import SavingsGoals from '../../components/Dashboard/SavingsGoals.svelte';

    let totalIncome = 0;
    let totalExpenses = 0;
    let savingsGoals = [];
    let availableFunds = 0;

    onMount(() => {
        const unsubIncome = income.subscribe(value => {
            totalIncome = value.reduce((sum, item) => sum + Number(item.amount), 0);
            updateAvailableFunds();
        });

        const unsubExpenses = expenses.subscribe(value => {
            totalExpenses = value.reduce((sum, item) => sum + Number(item.amount), 0);
            updateAvailableFunds();
        });

        const unsubSavings = savings.subscribe(value => {
            savingsGoals = value;
        });

        return () => {
            unsubIncome();
            unsubExpenses();
            unsubSavings();
        };
    });

    function updateAvailableFunds() {
        availableFunds = totalIncome - totalExpenses;
    }

    function calculateTotalSavingsTarget() {
        return savingsGoals.reduce((sum, goal) => sum + Number(goal.targetAmount), 0);
    }

    function calculateTotalCurrentSavings() {
        return savingsGoals.reduce((sum, goal) => sum + Number(goal.currentAmount || 0), 0);
    }

    function calculateOverallProgress() {
        const totalTarget = calculateTotalSavingsTarget();
        if (totalTarget === 0) return 0;
        
        const totalCurrent = calculateTotalCurrentSavings();
        return (totalCurrent / totalTarget) * 100;
    }
</script>

<div class="bg-gray-100 p-4 dark:bg-gray-900 dark:text-gray-100">
    <h1 class="mb-4 text-2xl font-bold">Savings Goals</h1>

    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-lg bg-white p-5 shadow-md dark:bg-gray-800">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Available Funds</h3>
            <p class="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(availableFunds)}
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Income minus expenses</p>
        </div>

        <div class="rounded-lg bg-white p-5 shadow-md dark:bg-gray-800">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Savings Target</h3>
            <p class="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(calculateTotalSavingsTarget())}
            </p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Combined goal amount</p>
        </div>

        <div class="rounded-lg bg-white p-5 shadow-md dark:bg-gray-800">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Progress</h3>
            <p class="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {calculateOverallProgress().toFixed(1)}%
            </p>
            <div class="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                    class="h-2 rounded-full bg-purple-500"
                    style="width: {calculateOverallProgress()}%"
                ></div>
            </div>
        </div>
    </div>

    <SavingsGoals />
</div>