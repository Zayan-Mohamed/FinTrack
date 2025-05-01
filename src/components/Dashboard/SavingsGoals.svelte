<script>
    import { savings } from '../../lib/stores/savings.js';
    import { income } from '../../lib/stores/income.js'; 
    import { expenses } from '../../lib/stores/expenses.js';
    import { formatCurrency } from '../../lib/utils/formatters';
    import { onMount } from 'svelte';
    import { slide, fade } from 'svelte/transition';

    let savingsGoals = [];
    let newGoal = { 
        name: '', 
        targetAmount: 0, 
        currentAmount: 0,
        targetDate: '',
        id: '',
        color: getRandomColor(),
        category: 'general',
        priority: 'medium',
        notes: ''
    };
    let editMode = false;
    let currentEditId = null;
    let formErrors = {};
    let totalIncome = 0;
    let totalExpenses = 0;
    let availableFunds = 0;
    let showForm = false;
    let addContributionId = null;
    let contributionAmount = 0;
    let showContributionForm = false;
    let searchTerm = '';
    let sortBy = 'targetDate';
    let sortDirection = 'asc';
    let contributionHistory = [];

    function getRandomColor() {
        const colors = ['blue', 'green', 'purple', 'indigo', 'pink', 'red', 'yellow', 'teal'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function validateForm() {
        formErrors = {};
        if (!newGoal.name.trim()) formErrors.name = 'Goal name is required';
        if (!newGoal.targetAmount || newGoal.targetAmount <= 0) formErrors.targetAmount = 'Enter a valid target amount';
        if (newGoal.currentAmount < 0) formErrors.currentAmount = 'Current amount cannot be negative';
        if (!newGoal.targetDate) formErrors.targetDate = 'Target date is required';
        
        const targetDateObj = new Date(newGoal.targetDate);
        if (targetDateObj <= new Date()) {
            formErrors.targetDate = 'Target date must be in the future';
        }

        if (!newGoal.category) formErrors.category = 'Category is required';
        
        return Object.keys(formErrors).length === 0;
    }

    onMount(() => {
        const unsubscribeSavings = savings.subscribe((value) => {
            savingsGoals = value;
            calculateContributionHistory();
        });

        const unsubscribeIncome = income.subscribe((value) => {
            totalIncome = value.reduce((sum, item) => sum + Number(item.amount), 0);
            updateAvailableFunds();
        });
        
        const unsubscribeExpenses = expenses.subscribe((value) => {
            totalExpenses = value.reduce((sum, item) => sum + Number(item.amount), 0);
            updateAvailableFunds();
        });

        return () => {
            unsubscribeSavings();
            unsubscribeIncome();
            unsubscribeExpenses();
        };
    });

    function updateAvailableFunds() {
        availableFunds = totalIncome - totalExpenses;
    }
    
    function calculateContributionHistory() {
        // This would typically fetch from a separate store
        // For demo purposes, generating from goals
        contributionHistory = savingsGoals.flatMap(goal => {
            // Simulating 1-3 contributions per goal
            const numContributions = Math.floor(Math.random() * 3) + 1;
            const contributions = [];
            
            for (let i = 0; i < numContributions; i++) {
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                
                contributions.push({
                    goalId: goal.id,
                    goalName: goal.name,
                    amount: Math.floor(goal.currentAmount / numContributions),
                    date: date.toISOString().split('T')[0]
                });
            }
            
            return contributions;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function addGoal() {
        if (!validateForm()) return;
        
        if (editMode && currentEditId) {
            savings.update((current) =>
                current.map((goal) =>
                    goal.id === currentEditId ? { ...newGoal, id: currentEditId } : goal
                )
            );
            editMode = false;
            currentEditId = null;
        } else {
            const goalId = Date.now().toString();
            savings.update((current) => [...current, { ...newGoal, id: goalId }]);
        }
        
        showForm = false;
        newGoal = { 
            name: '', 
            targetAmount: 0, 
            currentAmount: 0,
            targetDate: '',
            id: '',
            color: getRandomColor(),
            category: 'general',
            priority: 'medium',
            notes: ''
        };
    }
    
    function editGoal(goal) {
        editMode = true;
        currentEditId = goal.id;
        newGoal = { ...goal };
        showForm = true;
        window.scrollTo(0, 0);
    }
    
    function removeGoal(id) {
        if (confirm('Are you sure you want to delete this goal?')) {
            savings.update((current) => current.filter((goal) => goal.id !== id));
        }
    }
    
    function showAddContribution(goal) {
        addContributionId = goal.id;
        contributionAmount = 0;
        showContributionForm = true;
    }
    
    function addContribution() {
        if (contributionAmount <= 0) return;
        
        const parsedAmount = Number(contributionAmount);
        
        if (isNaN(parsedAmount) || parsedAmount <= 0) return;
        
        if (parsedAmount > availableFunds) {
            alert("You don't have enough available funds for this contribution!");
            return;
        }
        
        savings.update((current) =>
            current.map((g) => {
                if (g.id === addContributionId) {
                    // Add to contribution history
                    const newContribution = {
                        goalId: g.id,
                        goalName: g.name,
                        amount: parsedAmount,
                        date: new Date().toISOString().split('T')[0]
                    };
                    
                    contributionHistory = [newContribution, ...contributionHistory];
                    
                    return { ...g, currentAmount: Number(g.currentAmount) + parsedAmount };
                }
                return g;
            })
        );
        
        showContributionForm = false;
        addContributionId = null;
        contributionAmount = 0;
    }

    function calculateDaysRemaining(targetDate) {
        const target = new Date(targetDate);
        const today = new Date();
        const diff = target.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    function getProgressColor(goal) {
        const percentage = (goal.currentAmount / goal.targetAmount) * 100;
        if (percentage < 25) return 'bg-red-500';
        if (percentage < 50) return 'bg-yellow-500';
        if (percentage < 75) return 'bg-blue-500';
        return 'bg-green-500';
    }
    
    function calculateAmountNeededMonthly(goal) {
        const today = new Date();
        const targetDate = new Date(goal.targetDate);
        const monthsRemaining = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
                               (targetDate.getMonth() - today.getMonth());
        
        if (monthsRemaining <= 0) return goal.targetAmount - goal.currentAmount;
        
        return (goal.targetAmount - goal.currentAmount) / monthsRemaining;
    }
    
    function calculateOverallProgress() {
        if (savingsGoals.length === 0) return 0;
        
        const totalCurrentAmount = savingsGoals.reduce((sum, goal) => sum + Number(goal.currentAmount), 0);
        const totalTargetAmount = savingsGoals.reduce((sum, goal) => sum + Number(goal.targetAmount), 0);
        
        return totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
    }
    
    // Filter and sort functions
    $: filteredGoals = searchTerm ? 
        savingsGoals.filter(goal => 
            goal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            goal.category.toLowerCase().includes(searchTerm.toLowerCase())
        ) : savingsGoals;
        
    $: sortedGoals = [...filteredGoals].sort((a, b) => {
        let valA, valB;
        
        switch(sortBy) {
            case 'name':
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                break;
            case 'targetAmount':
                valA = Number(a.targetAmount);
                valB = Number(b.targetAmount);
                break;
            case 'currentAmount':
                valA = Number(a.currentAmount);
                valB = Number(b.currentAmount);
                break;
            case 'progress':
                valA = (a.currentAmount / a.targetAmount) * 100;
                valB = (b.currentAmount / b.targetAmount) * 100;
                break;
            case 'targetDate':
                valA = new Date(a.targetDate);
                valB = new Date(b.targetDate);
                break;
            case 'category':
                valA = a.category.toLowerCase();
                valB = b.category.toLowerCase();
                break;
            default:
                valA = new Date(a.targetDate);
                valB = new Date(b.targetDate);
        }
        
        return sortDirection === 'asc' ? 
            valA > valB ? 1 : -1 :
            valA < valB ? 1 : -1;
    });
    
    function toggleSortDirection() {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    function formatTargetDate(dateStr) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString(undefined, options);
    }

    function toggleForm() {
        showForm = !showForm;
        if (!showForm && editMode) {
            editMode = false;
            currentEditId = null;
            newGoal = { 
                name: '', 
                targetAmount: 0, 
                currentAmount: 0,
                targetDate: '',
                id: '',
                color: getRandomColor(),
                category: 'general',
                priority: 'medium',
                notes: ''
            };
        }
    }
</script>

<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 dark:text-gray-100">
    <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">Savings Goals</h2>
        <button 
            on:click={toggleForm}
            class="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
            {showForm ? 'Cancel' : 'Add New Goal'}
        </button>
    </div>

    {#if showForm}
        <form class="mb-8 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700" on:submit|preventDefault={addGoal} transition:slide>
            <h3 class="text-lg font-medium">{editMode ? 'Edit' : 'New'} Savings Goal</h3>
            
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label for="goal-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Goal Name</label>
                    <input
                        type="text"
                        id="goal-name"
                        bind:value={newGoal.name}
                        placeholder="Vacation, Emergency Fund, etc."
                        class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                    {#if formErrors.name}
                        <p class="mt-1 text-xs text-red-500">{formErrors.name}</p>
                    {/if}
                </div>

                <div>
                    <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                    <select
                        id="category"
                        bind:value={newGoal.category}
                        class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    >
                        <option value="general">General</option>
                        <option value="emergency">Emergency Fund</option>
                        <option value="retirement">Retirement</option>
                        <option value="travel">Travel</option>
                        <option value="house">Housing</option>
                        <option value="education">Education</option>
                        <option value="car">Vehicle</option>
                        <option value="other">Other</option>
                    </select>
                    {#if formErrors.category}
                        <p class="mt-1 text-xs text-red-500">{formErrors.category}</p>
                    {/if}
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label for="target-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Amount</label>
                    <input
                        type="number"
                        id="target-amount"
                        bind:value={newGoal.targetAmount}
                        min="1"
                        step="0.01"
                        placeholder="5000"
                        class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                    {#if formErrors.targetAmount}
                        <p class="mt-1 text-xs text-red-500">{formErrors.targetAmount}</p>
                    {/if}
                </div>

                <div>
                    <label for="current-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Amount</label>
                    <input
                        type="number"
                        id="current-amount"
                        bind:value={newGoal.currentAmount}
                        min="0"
                        step="0.01"
                        placeholder="0"
                        class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                    {#if formErrors.currentAmount}
                        <p class="mt-1 text-xs text-red-500">{formErrors.currentAmount}</p>
                    {/if}
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label for="target-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Date</label>
                    <input
                        type="date"
                        id="target-date"
                        bind:value={newGoal.targetDate}
                        class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                    {#if formErrors.targetDate}
                        <p class="mt-1 text-xs text-red-500">{formErrors.targetDate}</p>
                    {/if}
                </div>

                <div>
                    <label for="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                    <select
                        id="priority"
                        bind:value={newGoal.priority}
                        class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                    </select>
                </div>
            </div>

            <div>
                <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                <textarea
                    id="notes"
                    bind:value={newGoal.notes}
                    rows="3"
                    placeholder="Additional notes about your goal..."
                    class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                ></textarea>
            </div>

            <button
                type="submit"
                class="w-full rounded-md bg-blue-500 px-4 py-2 text-white transition duration-200 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
                {editMode ? 'Update Goal' : 'Add Goal'}
            </button>
        </form>
    {/if}

    <!-- Contribution Modal -->
    {#if showContributionForm}
        <div class="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50" transition:fade>
            <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 class="mb-4 text-lg font-medium">Add Contribution</h3>
                
                <form on:submit|preventDefault={addContribution} class="space-y-4">
                    <div>
                        <label for="available-funds" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Available Funds: {formatCurrency(availableFunds)}
                        </label>
                    </div>
                    
                    <div>
                        <label for="contribution-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contribution Amount
                        </label>
                        <input
                            type="number"
                            id="contribution-amount"
                            bind:value={contributionAmount}
                            min="1"
                            max={availableFunds}
                            step="0.01"
                            placeholder="Amount to contribute"
                            class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                    
                    <div class="flex space-x-3">
                        <button
                            type="submit"
                            class="flex-1 rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                        >
                            Add Funds
                        </button>
                        <button
                            type="button"
                            on:click={() => showContributionForm = false}
                            class="flex-1 rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    {/if}

    <!-- Available funds indicator -->
    <div class="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
        <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Available Funds</span>
            <span class="text-lg font-semibold {availableFunds >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                {formatCurrency(availableFunds)}
            </span>
        </div>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            This is your current balance available for savings goals
        </div>
    </div>
    
    <!-- Goals Summary -->
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/30">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Total Goals</h3>
            <p class="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {savingsGoals.length}
            </p>
        </div>
        
        <div class="rounded-lg bg-green-50 p-4 dark:bg-green-900/30">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Total Saved</h3>
            <p class="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(savingsGoals.reduce((sum, goal) => sum + Number(goal.currentAmount), 0))}
            </p>
        </div>
        
        <div class="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/30">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</h3>
            <p class="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {calculateOverallProgress().toFixed(1)}%
            </p>
            <div class="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                <div
                    class="h-2 rounded-full bg-purple-500"
                    style="width: {calculateOverallProgress()}%"
                ></div>
            </div>
        </div>
    </div>

    <!-- Search and sort controls -->
    <div class="mb-4 flex flex-wrap items-center gap-4">
        <div class="flex-1">
            <input
                type="text"
                placeholder="Search goals..."
                bind:value={searchTerm}
                class="focus:ring-opacity-50 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
        </div>
        <div class="flex items-center gap-2">
            <label for="sort-by" class="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
            <select
                id="sort-by"
                bind:value={sortBy}
                class="focus:ring-opacity-50 rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
                <option value="targetDate">Date</option>
                <option value="name">Name</option>
                <option value="targetAmount">Target Amount</option>
                <option value="currentAmount">Current Amount</option>
                <option value="progress">Progress</option>
                <option value="category">Category</option>
            </select>
            <button
                on:click={toggleSortDirection}
                class="rounded-md border border-gray-300 bg-white p-1 text-gray-500 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
                {#if sortDirection === 'asc'}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                    </svg>
                {/if}
            </button>
        </div>
    </div>

    {#if savingsGoals.length === 0}
        <div class="flex flex-col items-center justify-center py-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">No savings goals added yet</p>
            <p class="mt-1 text-gray-500 dark:text-gray-400">Add your first goal to start tracking your savings progress!</p>
        </div>
    {:else}
        <div class="space-y-4">
            {#each sortedGoals as goal (goal.id)}
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800" transition:slide>
                    <div class="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
                        <div class="flex-1">
                            <div class="flex items-center">
                                <span class="inline-block h-4 w-4 rounded-full bg-{goal.color}-500 mr-2"></span>
                                <h3 class="text-lg font-semibold">{goal.name}</h3>
                                <span class="ml-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{goal.category}</span>
                                {#if goal.priority === 'high'}
                                    <span class="ml-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-300">High Priority</span>
                                {:else if goal.priority === 'medium'}
                                    <span class="ml-2 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Medium Priority</span>
                                {:else}
                                    <span class="ml-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Low Priority</span>
                                {/if}
                            </div>
                            
                            <div class="mt-2">
                                <div class="flex items-center justify-between">
                                    <span class="text-2xl font-semibold">{formatCurrency(goal.currentAmount)}</span>
                                    <span class="ml-1 text-sm text-gray-500 dark:text-gray-400">of {formatCurrency(goal.targetAmount)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="space-x-2">
                            <button
                                on:click={() => showAddContribution(goal)}
                                class="rounded bg-green-500 px-3 py-1 text-xs text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                            >
                                Add Funds
                            </button>
                            <button
                                on:click={() => editGoal(goal)}
                                class="rounded bg-indigo-500 px-3 py-1 text-xs text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700"
                            >
                                Edit
                            </button>
                            <button
                                on:click={() => removeGoal(goal.id)}
                                class="rounded bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    <div class="mt-4">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-500 dark:text-gray-400">
                                {Math.round((goal.currentAmount / goal.targetAmount) * 100)}% complete
                            </span>
                            <span class="text-gray-500 dark:text-gray-400">
                                {calculateDaysRemaining(goal.targetDate)} days remaining
                            </span>
                        </div>
                        <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                            <div
                                class={`h-2 transition-all duration-500 ${getProgressColor(goal)}`}
                                style={`width: ${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%`}
                            ></div>
                        </div>
                    </div>

                    <div class="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>Target date: {formatTargetDate(goal.targetDate)}</span>
                        <span class="ml-4">
                            {formatCurrency(goal.targetAmount - goal.currentAmount)} remaining
                        </span>
                    </div>

                    <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Required monthly: {formatCurrency(calculateAmountNeededMonthly(goal))}</span>
                    </div>
                    
                    {#if goal.notes}
                        <div class="mt-2 rounded bg-gray-50 p-2 text-sm dark:bg-gray-700">
                            <span class="font-medium">Notes:</span> {goal.notes}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
    
    <!-- Recent Contributions -->
    {#if contributionHistory.length > 0}
        <div class="mt-8">
            <h3 class="mb-3 text-lg font-medium">Recent Contributions</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Goal</th>
                            <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Amount</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {#each contributionHistory.slice(0, 5) as contribution}
                            <tr>
                                <td class="whitespace-nowrap px-6 py-4">
                                    {formatTargetDate(contribution.date)}
                                </td>
                                <td class="px-6 py-4">{contribution.goalName}</td>
                                <td class="whitespace-nowrap px-6 py-4 text-right font-medium text-green-600 dark:text-green-400">
                                    +{formatCurrency(contribution.amount)}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>
