<script>
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { income } from '../../lib/stores/income';
    import { formatCurrency } from '../../lib/utils/formatters';

    let incomeEntries = [];
    let newIncome = {
        source: '',
        amount: 0,
        date: new Date().toISOString().substring(0, 10),
        recurring: false,
        frequency: 'monthly',
        category: 'salary',
        description: '',
        taxable: true,
        id: ''
    };
    let editMode = false;
    let currentEditId = null;
    let formErrors = {};
    let dateFilter = { start: '', end: '' };
    let showSuccess = false;
    let successMessage = '';
    let showDeleteConfirm = false;
    let itemToDelete = null;
    let sourceTotals = {};
    let categoryTotals = {};
    let sortField = 'date';
    let sortDirection = 'desc';

    const incomeCategories = [
        { value: 'salary', label: 'Salary' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'business', label: 'Business' },
        { value: 'investments', label: 'Investments' },
        { value: 'rental', label: 'Rental' },
        { value: 'gifts', label: 'Gifts' },
        { value: 'refunds', label: 'Refunds' },
        { value: 'other', label: 'Other' }
    ];

    onMount(() => {
        const unsubscribe = income.subscribe((value) => {
            incomeEntries = value;
            calculateSourceTotals();
            calculateCategoryTotals();
        });
        return () => unsubscribe();
    });

    function calculateSourceTotals() {
        sourceTotals = {};
        incomeEntries.forEach((entry) => {
            if (!sourceTotals[entry.source]) {
                sourceTotals[entry.source] = 0;
            }
            sourceTotals[entry.source] += Number(entry.amount);
        });
    }

    function calculateCategoryTotals() {
        categoryTotals = {};
        incomeEntries.forEach((entry) => {
            const category = entry.category || 'other';
            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }
            categoryTotals[category] += Number(entry.amount);
        });
    }

    function validateForm() {
        formErrors = {};
        
        // Source validation
        if (!newIncome.source.trim()) {
            formErrors.source = 'Source is required';
        } else if (newIncome.source.length < 2) {
            formErrors.source = 'Source must be at least 2 characters';
        }
        
        // Amount validation
        if (!newIncome.amount) {
            formErrors.amount = 'Amount is required';
        } else if (isNaN(newIncome.amount) || Number(newIncome.amount) <= 0) {
            formErrors.amount = 'Amount must be a positive number';
        }
        
        // Date validation
        if (!newIncome.date) {
            formErrors.date = 'Date is required';
        } else {
            const selectedDate = new Date(newIncome.date);
            const today = new Date();
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(today.getFullYear() - 2);
            
            if (selectedDate > today) {
                formErrors.date = 'Date cannot be in the future';
            } else if (selectedDate < twoYearsAgo) {
                formErrors.date = 'Date cannot be more than 2 years in the past';
            }
        }
        
        // Frequency validation
        if (newIncome.recurring && !newIncome.frequency) {
            formErrors.frequency = 'Frequency is required for recurring income';
        }
        
        // Category validation
        if (!newIncome.category) {
            formErrors.category = 'Category is required';
        }
        
        // Description validation (optional field)
        if (newIncome.description && newIncome.description.length > 200) {
            formErrors.description = 'Description cannot exceed 200 characters';
        }

        return Object.keys(formErrors).length === 0;
    }

    function showSuccessNotification(message) {
        successMessage = message;
        showSuccess = true;
        setTimeout(() => {
            showSuccess = false;
        }, 3000);
    }

    function addIncome() {
        if (!validateForm()) return;

        if (editMode && currentEditId) {
            income.update((current) =>
                current.map((entry) =>
                    entry.id === currentEditId ? { ...newIncome, id: currentEditId } : entry
                )
            );
            showSuccessNotification('Income updated successfully!');
            editMode = false;
            currentEditId = null;
        } else {
            const id = Date.now().toString();
            income.update((current) => [...current, { ...newIncome, id }]);
            showSuccessNotification('New income added successfully!');
        }

        resetForm();
    }

    function resetForm() {
        newIncome = {
            source: '',
            amount: 0,
            date: new Date().toISOString().substring(0, 10),
            recurring: false,
            frequency: 'monthly',
            category: 'salary',
            description: '',
            taxable: true,
            id: ''
        };
    }

    function editIncome(entry) {
        // Create a copy with defaults for backward compatibility
        newIncome = { 
            ...{
                source: '',
                amount: 0,
                date: new Date().toISOString().substring(0, 10),
                recurring: false,
                frequency: 'monthly',
                category: 'salary',
                description: '',
                taxable: true
            },
            ...entry
        };
        editMode = true;
        currentEditId = entry.id;
        
        // Scroll to form
        document.getElementById('income-form').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    function confirmDelete(id) {
        itemToDelete = id;
        showDeleteConfirm = true;
    }

    function cancelDelete() {
        itemToDelete = null;
        showDeleteConfirm = false;
    }

    function removeIncome() {
        income.update((current) => current.filter((entry) => entry.id !== itemToDelete));
        
        showSuccessNotification('Income deleted successfully!');
        
        if (currentEditId === itemToDelete) {
            editMode = false;
            currentEditId = null;
            resetForm();
        }
        
        showDeleteConfirm = false;
        itemToDelete = null;
    }

    function filterIncome() {
        let filtered = $income;

        if (dateFilter.start) {
            filtered = filtered.filter((entry) => entry.date >= dateFilter.start);
        }

        if (dateFilter.end) {
            filtered = filtered.filter((entry) => entry.date <= dateFilter.end);
        }

        return filtered;
    }

    function resetFilters() {
        dateFilter = { start: '', end: '' };
    }

    function sortIncome(field) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'asc';
        }
    }

    function formatFrequency(freq) {
        const mapping = {
            'daily': 'Daily',
            'weekly': 'Weekly',
            'biweekly': 'Bi-weekly',
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'semiannually': 'Semi-annually',
            'annually': 'Annually'
        };
        return mapping[freq] || freq;
    }
    
    function formatCategory(cat) {
        const category = incomeCategories.find(c => c.value === cat);
        return category ? category.label : cat;
    }

    $: filteredIncome = dateFilter.start || dateFilter.end ? filterIncome() : incomeEntries;
    
    $: sortedIncome = [...filteredIncome].sort((a, b) => {
        let compare = 0;
        
        if (sortField === 'date') {
            compare = new Date(a.date) - new Date(b.date);
        } else if (sortField === 'amount') {
            compare = Number(a.amount) - Number(b.amount);
        } else if (sortField === 'source') {
            compare = a.source.localeCompare(b.source);
        } else if (sortField === 'category') {
            compare = (a.category || '').localeCompare(b.category || '');
        }
        
        return sortDirection === 'asc' ? compare : -compare;
    });
    
    $: totalFilteredAmount = filteredIncome.reduce((sum, entry) => sum + Number(entry.amount), 0);
</script>

<div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 dark:text-gray-100">
    <h2 class="mb-6 text-2xl font-bold">Income Tracker</h2>

    <!-- Success Notification -->
    {#if showSuccess}
        <div transition:fade={{ duration: 200 }} class="mb-4 rounded-md bg-green-50 p-4 dark:bg-green-900">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-green-800 dark:text-green-200">{successMessage}</p>
                </div>
            </div>
        </div>
    {/if}

    <!-- Delete Confirmation Modal -->
    {#if showDeleteConfirm}
        <div transition:fade={{ duration: 150 }} class="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
                <!-- Background overlay -->
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                
                <!-- Modal panel -->
                <div class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                    <div class="bg-white px-4 pb-4 pt-5 dark:bg-gray-800 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                                <svg class="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">
                                    Delete Income Entry
                                </h3>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        Are you sure you want to delete this income entry? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 dark:bg-gray-700 sm:flex sm:flex-row-reverse sm:px-6">
                        <button 
                            type="button" 
                            class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-800 sm:ml-3 sm:w-auto sm:text-sm"
                            on:click={removeIncome}
                        >
                            Delete
                        </button>
                        <button 
                            type="button" 
                            class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto sm:text-sm"
                            on:click={cancelDelete}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Date Filter -->
    <div
        class="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-3 dark:bg-gray-700"
    >
        <div>
            <label for="start-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Start Date</label
            >
            <input
                id="start-date"
                type="date"
                bind:value={dateFilter.start}
                class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
            />
        </div>
        <div>
            <label for="end-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >End Date</label
            >
            <input
                id="end-date"
                type="date"
                bind:value={dateFilter.end}
                class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
            />
        </div>
        <div class="flex items-end">
            <button
                on:click={resetFilters}
                class="inline-flex w-full items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
                <svg class="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                </svg>
                Reset Filters
            </button>
        </div>
        {#if dateFilter.start || dateFilter.end}
            <div class="md:col-span-3 text-right">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Showing {filteredIncome.length} income entries totaling {formatCurrency(totalFilteredAmount)}
                </p>
            </div>
        {/if}
    </div>

    <!-- Income Form -->
    <form id="income-form" class="mb-8 space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-700" on:submit|preventDefault={addIncome}>
        <h3 class="mb-4 text-lg font-semibold">{editMode ? 'Update Income' : 'Add New Income'}</h3>
        
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
                <label for="income-source" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Income Source <span class="text-red-500">*</span></label
                >
                <input
                    id="income-source"
                    type="text"
                    bind:value={newIncome.source}
                    placeholder="e.g. Employer Name, Rental Property, Investments"
                    class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                />
                {#if formErrors.source}
                    <p class="mt-1 text-sm text-red-500">{formErrors.source}</p>
                {/if}
            </div>

            <div>
                <label for="income-category" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Category <span class="text-red-500">*</span></label
                >
                <select
                    id="income-category"
                    bind:value={newIncome.category}
                    class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                >
                    {#each incomeCategories as category}
                        <option value={category.value}>{category.label}</option>
                    {/each}
                </select>
                {#if formErrors.category}
                    <p class="mt-1 text-sm text-red-500">{formErrors.category}</p>
                {/if}
            </div>

            <div>
                <label for="income-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Amount <span class="text-red-500">*</span></label
                >
                <div class="relative mt-1 rounded-md shadow-sm">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span class="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        id="income-amount"
                        type="number"
                        bind:value={newIncome.amount}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        class="focus:ring-opacity-50 block w-full rounded-md border-gray-300 pl-7 pr-12 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                    />
                </div>
                {#if formErrors.amount}
                    <p class="mt-1 text-sm text-red-500">{formErrors.amount}</p>
                {/if}
            </div>

            <div>
                <label for="income-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Date <span class="text-red-500">*</span></label
                >
                <input
                    id="income-date"
                    type="date"
                    bind:value={newIncome.date}
                    class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                />
                {#if formErrors.date}
                    <p class="mt-1 text-sm text-red-500">{formErrors.date}</p>
                {/if}
            </div>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="flex items-center">
                <input
                    type="checkbox"
                    id="income-recurring"
                    bind:checked={newIncome.recurring}
                    class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <label for="income-recurring" class="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >This is recurring income</label
                >
            </div>

            <div class="flex items-center">
                <input
                    type="checkbox"
                    id="income-taxable"
                    bind:checked={newIncome.taxable}
                    class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <label for="income-taxable" class="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >This income is taxable</label
                >
            </div>
        </div>

        {#if newIncome.recurring}
            <div transition:slide={{ duration: 200, easing: quintOut }}>
                <label for="income-frequency" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Frequency <span class="text-red-500">*</span></label
                >
                <select
                    id="income-frequency"
                    bind:value={newIncome.frequency}
                    class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semiannually">Semi-annually</option>
                    <option value="annually">Annually</option>
                </select>
                {#if formErrors.frequency}
                    <p class="mt-1 text-sm text-red-500">{formErrors.frequency}</p>
                {/if}
            </div>
        {/if}

        <div>
            <label for="income-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Description (optional)</label
            >
            <textarea
                id="income-description"
                bind:value={newIncome.description}
                rows="2"
                placeholder="Additional details about this income"
                class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
            ></textarea>
            {#if formErrors.description}
                <p class="mt-1 text-sm text-red-500">{formErrors.description}</p>
            {/if}
        </div>

        <div class="flex flex-col space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
            <button
                type="submit"
                class="w-full rounded-md bg-green-500 px-4 py-2 text-white transition duration-200 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
            >
                {editMode ? 'Update Income' : 'Add Income'}
            </button>
            
            {#if editMode}
                <button
                    type="button"
                    on:click={() => { editMode = false; currentEditId = null; resetForm(); }}
                    class="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition duration-200 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                    Cancel
                </button>
            {/if}
        </div>
    </form>

    <!-- Income Category Summary -->
    {#if Object.keys(categoryTotals).length > 0}
        <div class="mb-6">
            <h3 class="mb-3 text-lg font-semibold">Income by Category</h3>
            <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {#each Object.entries(categoryTotals) as [category, amount]}
                    <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <div class="text-sm text-gray-500 dark:text-gray-400">{formatCategory(category)}</div>
                        <div class="mt-1 text-lg font-medium">{formatCurrency(amount)}</div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Income List -->
    <h3 class="mb-3 text-lg font-semibold">Your Income Sources</h3>
    {#if sortedIncome.length === 0}
        <div class="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p class="mt-2 text-gray-500 italic dark:text-gray-400">No income sources recorded yet.</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Add your first income source using the form above.</p>
        </div>
    {:else}
        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th
                            class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                            on:click={() => sortIncome('date')}
                        >
                            <div class="flex items-center">
                                Date
                                {#if sortField === 'date'}
                                    <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        {#if sortDirection === 'asc'}
                                            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                                        {:else}
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        {/if}
                                    </svg>
                                {/if}
                            </div>
                        </th>
                        <th
                            class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                            on:click={() => sortIncome('source')}
                        >
                            <div class="flex items-center">
                                Source
                                {#if sortField === 'source'}
                                    <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        {#if sortDirection === 'asc'}
                                            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                                        {:else}
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        {/if}
                                    </svg>
                                {/if}
                            </div>
                        </th>
                        <th
                            class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                            on:click={() => sortIncome('category')}
                        >
                            <div class="flex items-center">
                                Category
                                {#if sortField === 'category'}
                                    <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        {#if sortDirection === 'asc'}
                                            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 010 1.414z" clip-rule="evenodd" />
                                        {:else}
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        {/if}
                                    </svg>
                                {/if}
                            </div>
                        </th>
                        <th
                            class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                            on:click={() => sortIncome('amount')}
                        >
                            <div class="flex items-center">
                                Amount
                                {#if sortField === 'amount'}
                                    <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        {#if sortDirection === 'asc'}
                                            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 010 1.414z" clip-rule="evenodd" />
                                        {:else}
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        {/if}
                                    </svg>
                                {/if}
                            </div>
                        </th>
                        <th
                            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                            >Recurring</th
                        >
                        <th
                            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                            >Actions</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                    {#each sortedIncome as entry (entry.id)}
                        <tr class="transition hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-200"
                                >{new Date(entry.date).toLocaleDateString()}</td
                            >
                            <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                                <div class="font-medium">{entry.source}</div>
                                {#if entry.description}
                                    <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">{entry.description}</div>
                                {/if}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                                {#if entry.category}
                                    <span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        {formatCategory(entry.category)}
                                    </span>
                                {/if}
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(entry.amount)}</td>
                            <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                                {#if entry.recurring}
                                    <span class="inline-flex items-center">
                                        <svg class="mr-1 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                        </svg>
                                        {formatFrequency(entry.frequency)}
                                    </span>
                                {:else}
                                    No
                                {/if}
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-sm">
                                <button
                                    on:click={() => editIncome(entry)}
                                    class="mr-3 rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/60"
                                >
                                    Edit
                                </button>
                                <button
                                    on:click={() => confirmDelete(entry.id)}
                                    class="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/60"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
                <tfoot class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <td colspan="3" class="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-200">Total</td>
                        <td class="whitespace-nowrap px-6 py-3 text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(totalFilteredAmount)}</td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    {/if}
</div>
