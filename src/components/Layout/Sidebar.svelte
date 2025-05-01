<script>
    import { page } from '$app/stores';
    import { slide } from 'svelte/transition';
    import { browser } from '$app/environment';
    import { settingsStore } from '../../lib/stores/settings';
    import { expenses } from '../../lib/stores/expenses';
    import { income } from '../../lib/stores/income';
    import { savings } from '../../lib/stores/savings';
    import { createEventDispatcher } from 'svelte';

    // State management
    let isCollapsed = true;
    let showRecentActivity = true;
    let recentActivities = [];
    let totalIncome = 0;
    let totalExpenses = 0;
    let netBalance = 0;

    // Tell the parent layout when sidebar state changes
    const dispatch = createEventDispatcher();

    // Navigation items with icons
    const navItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>`
        },
        {
            name: 'Income',
            path: '/income',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`
        },
        {
            name: 'Expenses',
            path: '/expenses',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>`
        },
        {
            name: 'Reports',
            path: '/reports',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>`
        },
        {
            name: 'Settings',
            path: '/settings',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`
        }
    ];

    // Toggle sidebar collapse with event dispatch
    function toggleSidebar() {
        isCollapsed = !isCollapsed;
        dispatch('sidebarToggle', { isCollapsed });
    }

    // Toggle recent activity section
    function toggleRecentActivity() {
        showRecentActivity = !showRecentActivity;
    }

    // Format date helper
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    // Format currency helper
    function formatCurrencySimple(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    // Subscribe to stores and update data
    if (browser) {
        income.subscribe(items => {
            totalIncome = items.reduce((sum, item) => sum + Number(item.amount), 0);
            updateRecentActivities();
            updateNetBalance();
        });

        expenses.subscribe(items => {
            totalExpenses = items.reduce((sum, item) => sum + Number(item.amount), 0);
            updateRecentActivities();
            updateNetBalance();
        });

        function updateNetBalance() {
            netBalance = totalIncome - totalExpenses;
        }

        function updateRecentActivities() {
            const incomeItems = browser ? $income.map(item => ({
                ...item, 
                type: 'income',
                date: new Date(item.date)
            })) : [];
            
            const expenseItems = browser ? $expenses.map(item => ({
                ...item, 
                type: 'expense',
                date: new Date(item.date)
            })) : [];
            
            // Combine and sort by date (most recent first)
            recentActivities = [...incomeItems, ...expenseItems]
                .sort((a, b) => b.date - a.date)
                .slice(0, 5); // Take only the 5 most recent
        }
    }
</script>

<aside class="fixed top-16 left-0 z-10 h-[calc(100vh-4rem)] {isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-white border-r dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
    <div class="h-full flex flex-col">
        <!-- Sidebar header with collapse toggle -->
        <div class="flex justify-between items-center h-16 px-4 border-b dark:border-gray-700">
            {#if !isCollapsed}
                <h2 class="font-medium text-lg">Finance Tracker</h2>
            {/if}
            <button 
                on:click={toggleSidebar}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
                {#if isCollapsed}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                    </svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                    </svg>
                {/if}
            </button>
        </div>

        <!-- Navigation -->
        <nav class="px-2 py-4 flex-1 overflow-y-auto">
            <ul class="space-y-1">
                {#each navItems as item}
                    {@const isActive = $page?.path === item.path}
                    <li>
                        <a 
                            href={item.path} 
                            class="flex items-center px-3 py-3 {isCollapsed ? 'justify-center' : 'space-x-3'} rounded-md transition-colors {isActive ? 'bg-primary-50 text-primary dark:bg-gray-700 dark:text-primary-light' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}"
                        >
                            <div class="flex-shrink-0" aria-hidden="true">
                                {@html item.icon}
                            </div>
                            {#if !isCollapsed}
                                <span class="font-medium">{item.name}</span>
                            {/if}
                        </a>
                    </li>
                {/each}
            </ul>
        </nav>

        <!-- Financial summary section -->
        {#if !isCollapsed}
            <div class="p-4 border-t dark:border-gray-700">
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Summary</h3>
                    <div class="mt-2 space-y-3">
                        <div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-300">Income</span>
                                <span class="font-medium text-green-600 dark:text-green-400">
                                    {formatCurrencySimple(totalIncome)}
                                </span>
                            </div>
                            <div class="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                                <div class="h-1.5 rounded-full bg-green-500" style="width: 100%"></div>
                            </div>
                        </div>
                        
                        <div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600 dark:text-gray-300">Expenses</span>
                                <span class="font-medium text-red-600 dark:text-red-400">
                                    {formatCurrencySimple(totalExpenses)}
                                </span>
                            </div>
                            <div class="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                                <div 
                                    class="h-1.5 rounded-full bg-red-500" 
                                    style="width: {totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0}%"
                                ></div>
                            </div>
                        </div>
                        
                        <div class="pt-2 flex justify-between border-t dark:border-gray-600">
                            <span class="font-medium">Balance</span>
                            <span class="font-medium" class:text-green-600={netBalance > 0} class:text-red-600={netBalance < 0} class:dark:text-green-400={netBalance > 0} class:dark:text-red-400={netBalance < 0}>
                                {formatCurrencySimple(netBalance)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Recent Activity Section -->
        {#if !isCollapsed}
            <div class="border-t dark:border-gray-700 p-4">
                <button 
                    class="flex items-center justify-between w-full" 
                    on:click={toggleRecentActivity}
                    aria-expanded={showRecentActivity}
                >
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Recent Activity</h3>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        class="h-4 w-4 text-gray-400 transition-transform {showRecentActivity ? 'rotate-180' : ''}"
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                {#if showRecentActivity}
                    <ul class="mt-3 space-y-3" transition:slide={{ duration: 200 }}>
                        {#if recentActivities.length === 0}
                            <li class="text-sm text-gray-500 dark:text-gray-400 italic">No recent activities</li>
                        {:else}
                            {#each recentActivities as activity}
                                <li class="flex items-center justify-between text-sm">
                                    <div class="flex items-center">
                                        <span 
                                            class="flex-shrink-0 w-2 h-2 rounded-full mr-2" 
                                            class:bg-green-500={activity.type === 'income'} 
                                            class:bg-red-500={activity.type === 'expense'}
                                        ></span>
                                        <span class="truncate max-w-[120px]">
                                            {activity.type === 'income' ? activity.source : activity.description}
                                        </span>
                                    </div>
                                    <div class="flex items-center">
                                        <span 
                                            class:text-green-600={activity.type === 'income'} 
                                            class:text-red-600={activity.type === 'expense'}
                                            class:dark:text-green-400={activity.type === 'income'} 
                                            class:dark:text-red-400={activity.type === 'expense'}
                                        >
                                            {activity.type === 'income' ? '+' : '-'}${activity.amount}
                                        </span>
                                        <span class="ml-2 text-xs text-gray-400">{formatDate(activity.date)}</span>
                                    </div>
                                </li>
                            {/each}
                        {/if}
                    </ul>
                {/if}
            </div>
        {/if}
    </div>
</aside>
