<script>
    import { onMount } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { expenses } from '../../lib/stores/expenses';
    import { formatCurrency } from '../../lib/utils/formatters';

    let expenseList = [];
    let newExpense = {
        description: '',
        amount: 0,
        category: '',
        date: new Date().toISOString().substring(0, 10),
        paymentMethod: 'cash',
        merchant: '',
        taxDeductible: false,
        notes: '',
        tags: [],
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
    let categoryTotals = {};
    let merchantTotals = {};
    let sortField = 'date';
    let sortDirection = 'desc';
    let newTag = '';
    let tagsList = ['Recurring', 'Essential', 'Leisure', 'Work'];

    const expenseCategories = [
        { value: 'food', label: 'Food & Dining' },
        { value: 'housing', label: 'Housing' },
        { value: 'transportation', label: 'Transportation' },
        { value: 'utilities', label: 'Utilities' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'personal', label: 'Personal Care' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'education', label: 'Education' },
        { value: 'debt', label: 'Debt Payments' },
        { value: 'savings', label: 'Savings' },
        { value: 'gifts', label: 'Gifts & Donations' },
        { value: 'travel', label: 'Travel' },
        { value: 'other', label: 'Other' }
    ];

    const paymentMethods = [
        { value: 'cash', label: 'Cash' },
        { value: 'credit', label: 'Credit Card' },
        { value: 'debit', label: 'Debit Card' },
        { value: 'bank', label: 'Bank Transfer' },
        { value: 'mobile', label: 'Mobile Payment' },
        { value: 'check', label: 'Check' },
        { value: 'other', label: 'Other' }
    ];

    onMount(() => {
        const unsubscribe = expenses.subscribe((value) => {
            expenseList = value;
            calculateCategoryTotals();
            calculateMerchantTotals();
        });
        return () => unsubscribe();
    });

    function calculateCategoryTotals() {
        categoryTotals = {};
        expenseList.forEach((expense) => {
            if (!expense.category) return;
            
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += Number(expense.amount);
        });
    }
    
    function calculateMerchantTotals() {
        merchantTotals = {};
        expenseList.forEach((expense) => {
            if (!expense.merchant) return;
            
            if (!merchantTotals[expense.merchant]) {
                merchantTotals[expense.merchant] = 0;
            }
            merchantTotals[expense.merchant] += Number(expense.amount);
        });
    }

    function validateForm() {
        formErrors = {};
        
        // Description validation
        if (!newExpense.description.trim()) {
            formErrors.description = 'Description is required';
        } else if (newExpense.description.length < 2) {
            formErrors.description = 'Description must be at least 2 characters';
        }
        
        // Amount validation
        if (!newExpense.amount) {
            formErrors.amount = 'Amount is required';
        } else if (isNaN(newExpense.amount) || Number(newExpense.amount) <= 0) {
            formErrors.amount = 'Amount must be a positive number';
        }
        
        // Category validation
        if (!newExpense.category) {
            formErrors.category = 'Category is required';
        }
        
        // Date validation
        if (!newExpense.date) {
            formErrors.date = 'Date is required';
        } else {
            const selectedDate = new Date(newExpense.date);
            const today = new Date();
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(today.getFullYear() - 2);
            
            if (selectedDate > today) {
                formErrors.date = 'Date cannot be in the future';
            } else if (selectedDate < twoYearsAgo) {
                formErrors.date = 'Date cannot be more than 2 years in the past';
            }
        }
        
        // Payment method validation
        if (!newExpense.paymentMethod) {
            formErrors.paymentMethod = 'Payment method is required';
        }
        
        // Merchant validation (optional but with validation)
        if (newExpense.merchant && newExpense.merchant.length < 2) {
            formErrors.merchant = 'Merchant name must be at least 2 characters';
        }
        
        // Notes validation (optional field)
        if (newExpense.notes && newExpense.notes.length > 200) {
            formErrors.notes = 'Notes cannot exceed 200 characters';
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

    function addExpense() {
        if (!validateForm()) return;

        if (editMode && currentEditId) {
            expenses.update((current) =>
                current.map((expense) =>
                    expense.id === currentEditId ? { ...newExpense, id: currentEditId } : expense
                )
            );
            showSuccessNotification('Expense updated successfully!');
            editMode = false;
            currentEditId = null;
        } else {
            const id = Date.now().toString();
            expenses.update((current) => [...current, { ...newExpense, id }]);
            showSuccessNotification('New expense added successfully!');
        }

        resetForm();
    }
    
    function resetForm() {
        newExpense = {
            description: '',
            amount: 0,
            category: '',
            date: new Date().toISOString().substring(0, 10),
            paymentMethod: 'cash',
            merchant: '',
            taxDeductible: false,
            notes: '',
            tags: [],
            id: ''
        };
        newTag = '';
    }

    function editExpense(expense) {
        // Create a copy with defaults for backward compatibility
        newExpense = { 
            ...{
                description: '',
                amount: 0,
                category: '',
                date: new Date().toISOString().substring(0, 10),
                paymentMethod: 'cash',
                merchant: '',
                taxDeductible: false,
                notes: '',
                tags: []
            },
            ...expense
        };
        
        editMode = true;
        currentEditId = expense.id;
        
        // Scroll to form
        document.getElementById('expense-form').scrollIntoView({ 
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

    function removeExpense() {
        expenses.update((current) => current.filter((expense) => expense.id !== itemToDelete));
        
        showSuccessNotification('Expense deleted successfully!');
        
        if (currentEditId === itemToDelete) {
            editMode = false;
            currentEditId = null;
            resetForm();
        }
        
        showDeleteConfirm = false;
        itemToDelete = null;
    }

    function filterExpenses() {
        let filtered = $expenses;

        if (dateFilter.start) {
            filtered = filtered.filter((expense) => expense.date >= dateFilter.start);
        }

        if (dateFilter.end) {
            filtered = filtered.filter((expense) => expense.date <= dateFilter.end);
        }

        return filtered;
    }

    function resetFilters() {
        dateFilter = { start: '', end: '' };
    }
    
    function sortExpenses(field) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'asc';
        }
    }
    
    function formatCategory(cat) {
        const category = expenseCategories.find(c => c.value === cat);
        return category ? category.label : cat;
    }
    
    function formatPaymentMethod(method) {
        const paymentMethod = paymentMethods.find(m => m.value === method);
        return paymentMethod ? paymentMethod.label : method;
    }
    
    function addTag() {
        if (!newTag.trim() || newExpense.tags.includes(newTag.trim())) return;
        
        newExpense.tags = [...newExpense.tags, newTag.trim()];
        newTag = '';
    }
    
    function removeTag(tag) {
        newExpense.tags = newExpense.tags.filter(t => t !== tag);
    }
    
    function getTagBackgroundColor(tag) {
        // Generate consistent colors for tags
        const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'red', 'pink', 'indigo', 'yellow'];
        const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    $: filteredExpenses = dateFilter.start || dateFilter.end ? filterExpenses() : expenseList;
    
    $: sortedExpenses = [...filteredExpenses].sort((a, b) => {
        let compare = 0;
        
        if (sortField === 'date') {
            compare = new Date(a.date) - new Date(b.date);
        } else if (sortField === 'amount') {
            compare = Number(a.amount) - Number(b.amount);
        } else if (sortField === 'description') {
            compare = a.description.localeCompare(b.description);
        } else if (sortField === 'category') {
            compare = (a.category || '').localeCompare(b.category || '');
        } else if (sortField === 'merchant') {
            compare = (a.merchant || '').localeCompare(b.merchant || '');
        }
        
        return sortDirection === 'asc' ? compare : -compare;
    });
    
    $: totalFilteredAmount = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
</script>

<div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 dark:text-gray-100">
    <h2 class="mb-6 text-2xl font-bold">Expense Tracker</h2>

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
                                    Delete Expense
                                </h3>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        Are you sure you want to delete this expense? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 dark:bg-gray-700 sm:flex sm:flex-row-reverse sm:px-6">
                        <button 
                            type="button" 
                            class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-800 sm:ml-3 sm:w-auto sm:text-sm"
                            on:click={removeExpense}
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
            <label for="expense-start-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Start Date</label
            >
            <input
                id="expense-start-date"
                type="date"
                bind:value={dateFilter.start}
                class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
            />
        </div>
        <div>
            <label for="expense-end-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >End Date</label
            >
            <input
                id="expense-end-date"
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
                    Showing {filteredExpenses.length} expense entries totaling {formatCurrency(totalFilteredAmount)}
                </p>
            </div>
        {/if}
    </div>

    <!-- Expense Form -->
    <form id="expense-form" class="mb-8 space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-700" on:submit|preventDefault={addExpense}>
        <h3 class="mb-4 text-lg font-semibold">{editMode ? 'Update Expense' : 'Add New Expense'}</h3>
        
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
                <label for="expense-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Description <span class="text-red-500">*</span></label
                >
                <input
                    id="expense-description"
                    type="text"
                    bind:value={newExpense.description}
                    placeholder="e.g. Grocery shopping, Restaurant bill, etc."
                    class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                />
                {#if formErrors.description}
                    <p class="mt-1 text-sm text-red-500">{formErrors.description}</p>
                {/if}
            </div>

            <div>
                <label for="expense-category" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Category <span class="text-red-500">*</span></label
                >
                <select
                    id="expense-category"
                    bind:value={newExpense.category}
                    class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                >
                    <option value="" disabled selected>Select a category</option>
                    {#each expenseCategories as category}
                        <option value={category.value}>{category.label}</option>
                    {/each}
                </select>
                {#if formErrors.category}
                    <p class="mt-1 text-sm text-red-500">{formErrors.category}</p>
                {/if}
            </div>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
                <label for="expense-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Amount <span class="text-red-500">*</span></label
                >
                <div class="relative mt-1 rounded-md shadow-sm">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span class="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        id="expense-amount"
                        type="number"
                        bind:value={newExpense.amount}
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
                <label for="expense-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Date <span class="text-red-500">*</span></label
                >
                <input
                    id="expense-date"
                    type="date"
                    bind:value={newExpense.date}
                    class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                />
                {#if formErrors.date}
                    <p class="mt-1 text-sm text-red-500">{formErrors.date}</p>
                {/if}
            </div>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
                <label for="expense-merchant" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Merchant/Vendor (optional)</label
                >
                <input
                    id="expense-merchant"
                    type="text"
                    bind:value={newExpense.merchant}
                    placeholder="e.g. Amazon, Walmart, Target, etc."
                    class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                />
                {#if formErrors.merchant}
                    <p class="mt-1 text-sm text-red-500">{formErrors.merchant}</p>
                {/if}
            </div>

            <div>
                <label for="expense-payment-method" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Payment Method <span class="text-red-500">*</span></label
                >
                <select
                    id="expense-payment-method"
                    bind:value={newExpense.paymentMethod}
                    class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                >
                    {#each paymentMethods as method}
                        <option value={method.value}>{method.label}</option>
                    {/each}
                </select>
                {#if formErrors.paymentMethod}
                    <p class="mt-1 text-sm text-red-500">{formErrors.paymentMethod}</p>
                {/if}
            </div>
        </div>

        <div>
            <div class="flex items-center">
                <input
                    type="checkbox"
                    id="expense-tax-deductible"
                    bind:checked={newExpense.taxDeductible}
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <label for="expense-tax-deductible" class="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >This expense is tax deductible</label
                >
            </div>
        </div>

        <div>
            <label for="expense-tags" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Tags (optional)</label
            >
            <div class="mt-1 flex rounded-md">
                <input
                    type="text"
                    id="expense-tags"
                    bind:value={newTag}
                    placeholder="Add tags..."
                    class="focus:ring-opacity-50 block w-full flex-1 rounded-none rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                    list="tag-suggestions"
                />
                <datalist id="tag-suggestions">
                    {#each tagsList as tag}
                        <option value={tag} ></option>
                    {/each}
                </datalist>
                <button
                    type="button"
                    on:click={addTag}
                    class="-ml-px inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                    Add
                </button>
            </div>
            
            {#if newExpense.tags.length > 0}
                <div class="mt-2 flex flex-wrap gap-2">
                    {#each newExpense.tags as tag}
                        <span class="inline-flex items-center rounded-full bg-{getTagBackgroundColor(tag)}-100 px-3 py-0.5 text-sm font-medium text-{getTagBackgroundColor(tag)}-800 dark:bg-{getTagBackgroundColor(tag)}-900/30 dark:text-{getTagBackgroundColor(tag)}-300">
                            {tag}
                            <button
								aria-label="Remove tag"
                                type="button"
                                on:click={() => removeTag(tag)}
                                class="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-{getTagBackgroundColor(tag)}-700 hover:bg-{getTagBackgroundColor(tag)}-200 hover:text-{getTagBackgroundColor(tag)}-900 focus:outline-none dark:text-{getTagBackgroundColor(tag)}-300 dark:hover:bg-{getTagBackgroundColor(tag)}-800"
                            >
                                <svg class="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                    <path stroke-linecap="round" stroke-width="1.5" d="M1 1l6 6m0-6L1 7" />
                                </svg>
                            </button>
                        </span>
                    {/each}
                </div>
            {/if}
        </div>

        <div>
            <label for="expense-notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Notes (optional)</label
            >
            <textarea
                id="expense-notes"
                bind:value={newExpense.notes}
                rows="2"
                placeholder="Additional details about this expense"
                class="focus:ring-opacity-50 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
            ></textarea>
            {#if formErrors.notes}
                <p class="mt-1 text-sm text-red-500">{formErrors.notes}</p>
            {/if}
        </div>

        <div class="flex flex-col space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
            <button
                type="submit"
                class="w-full rounded-md bg-red-500 px-4 py-2 text-white transition duration-200 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
                {editMode ? 'Update Expense' : 'Add Expense'}
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

    <!-- Expense Category Summary -->
    {#if Object.keys(categoryTotals).length > 0}
        <div class="mb-6">
            <h3 class="mb-3 text-lg font-semibold">Expenses by Category</h3>
            <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {#each Object.entries(categoryTotals) as [category, amount]}
                    <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <div class="text-sm text-gray-500 dark:text-gray-400">{formatCategory(category)}</div>
                        <div class="mt-1 text-lg font-medium text-red-600 dark:text-red-400">{formatCurrency(amount)}</div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Expense List -->
    <h3 class="mb-3 text-lg font-semibold">Your Expenses</h3>
    {#if sortedExpenses.length === 0}
        <div class="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p class="mt-2 text-gray-500 italic dark:text-gray-400">No expenses recorded yet.</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Add your first expense using the form above.</p>
        </div>
    {:else}
        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th
                            class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                            on:click={() => sortExpenses('date')}
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
                            on:click={() => sortExpenses('description')}
                        >
                            <div class="flex items-center">
                                Description
                                {#if sortField === 'description'}
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
                            on:click={() => sortExpenses('category')}
                        >
                            <div class="flex items-center">
                                Category
                                {#if sortField === 'category'}
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
                            on:click={() => sortExpenses('amount')}
                        >
                            <div class="flex items-center">
                                Amount
                                {#if sortField === 'amount'}
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
                            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                            >Payment</th
                        >
                        <th
                            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                            >Actions</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                    {#each sortedExpenses as expense (expense.id)}
                        <tr class="transition hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-200"
                                >{new Date(expense.date).toLocaleDateString()}</td
                            >
                            <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                                <div class="font-medium">{expense.description}</div>
                                {#if expense.merchant}
                                    <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {expense.merchant}
                                    </div>
                                {/if}
                                {#if expense.tags && expense.tags.length > 0}
                                    <div class="mt-1.5 flex flex-wrap gap-1">
                                        {#each expense.tags as tag}
                                            <span class="inline-flex rounded-full bg-{getTagBackgroundColor(tag)}-100 px-2 py-0.5 text-xs text-{getTagBackgroundColor(tag)}-800 dark:bg-{getTagBackgroundColor(tag)}-900/30 dark:text-{getTagBackgroundColor(tag)}-300">
                                                {tag}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                                {#if expense.category}
                                    <span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                        {formatCategory(expense.category)}
                                    </span>
                                    {#if expense.taxDeductible}
                                        <span class="ml-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                            Tax
                                        </span>
                                    {/if}
                                {/if}
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(expense.amount)}</td>
                            <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                                {formatPaymentMethod(expense.paymentMethod)}
                            </td>
                            <td class="whitespace-nowrap px-6 py-4 text-sm">
                                <button
                                    on:click={() => editExpense(expense)}
                                    class="mr-3 rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/60"
                                >
                                    Edit
                                </button>
                                <button
                                    on:click={() => confirmDelete(expense.id)}
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
                        <td class="whitespace-nowrap px-6 py-3 text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(totalFilteredAmount)}</td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    {/if}

    <!-- Top merchants section (only show if we have merchant data) -->
    {#if Object.keys(merchantTotals).length > 0}
        <div class="mt-8">
            <h3 class="mb-3 text-lg font-semibold">Top Merchants</h3>
            <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {#each Object.entries(merchantTotals).sort((a, b) => b[1] - a[1]).slice(0, 8) as [merchant, amount]}
                    <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{merchant}</div>
                        <div class="mt-1 text-lg font-medium text-red-600 dark:text-red-400">{formatCurrency(amount)}</div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
