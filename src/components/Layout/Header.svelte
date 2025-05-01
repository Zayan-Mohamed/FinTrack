<script lang="ts">
    import { page } from '$app/stores';
    import { settingsStore } from '../../lib/stores/settings';
    import { browser } from '$app/environment';

    export let title = 'FinTrack - Your Finance Tracker';
    
    let isDropdownOpen = false;
    let isMobileMenuOpen = false;
    
    $: settings = $settingsStore;
    
    function toggleTheme() {
        const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
        settingsStore.update(current => {
            return { ...current, theme: newTheme };
        });
    }
    
    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
    }
    
    function toggleMobileMenu() {
        isMobileMenuOpen = !isMobileMenuOpen;
    }

    // Current date for display
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
</script>

<header class="fixed top-0 left-0 right-0 z-20 bg-white shadow-md dark:bg-gray-800 dark:text-gray-100">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <!-- Left section: Logo and title -->
        <div class="flex items-center">
            <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6">
                    <path d="M2.273 5.625A4.483 4.483 0 0 1 5.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0 0 18.75 3H5.25a3 3 0 0 0-2.977 2.625ZM2.273 8.625A4.483 4.483 0 0 1 5.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0 0 18.75 6H5.25a3 3 0 0 0-2.977 2.625ZM5.25 9a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3H15a.75.75 0 0 0-.75.75 2.25 2.25 0 0 1-4.5 0A.75.75 0 0 0 9 9H5.25Z" />
                </svg>
            </div>
            <h1 class="text-xl font-bold">{title}</h1>
        </div>

        <!-- Middle section: Desktop navigation -->
        <nav class="hidden md:block">
            <ul class="flex space-x-6">
                {#each ['Dashboard', 'Income', 'Expenses', 'Reports', 'Settings'] as item}
                    {@const path = item.toLowerCase() === 'dashboard' ? '/dashboard' : `/${item.toLowerCase()}`}
                    {@const isActive = $page?.path === path}
                    <li>
                        <a 
                            href={path} 
                            class="relative px-1 py-2 font-medium transition-colors hover:text-primary dark:hover:text-primary-light"
                            class:text-primary={isActive}
                            class:dark:text-primary-light={isActive}
                        >
                            {item}
                            {#if isActive}
                                <span class="absolute inset-x-0 bottom-0 h-0.5 bg-primary dark:bg-primary-light"></span>
                            {/if}
                        </a>
                    </li>
                {/each}
            </ul>
        </nav>

        <!-- Right section: Theme toggle, notifications, user -->
        <div class="flex items-center space-x-4">
            <!-- Date display -->
            <span class="hidden text-sm text-gray-600 dark:text-gray-400 lg:block">{currentDate}</span>
            
            <!-- Theme toggle button -->
            <button
                on:click={toggleTheme}
                class="rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {#if settings.theme === 'dark'}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    </svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                    </svg>
                {/if}
            </button>

            <!-- Notifications -->
            <button aria-label="Notifications" class="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            <!-- User Profile Dropdown -->
            <div class="relative">
                <button 
                    on:click={toggleDropdown} 
                    class="flex items-center space-x-2 rounded-full hover:bg-gray-100 p-1 dark:hover:bg-gray-700"
                >
                    <div class="h-8 w-8 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-full w-full text-gray-500 dark:text-gray-300">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                    </div>
                    <span class="hidden text-sm font-medium md:block">Account</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="hidden h-4 w-4 md:block">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
                
                {#if isDropdownOpen}
                    <div class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800">
                        <a href="/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">Settings</a>
                        <a href="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">Profile</a>
                        <button class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
                            Sign out
                        </button>
                    </div>
                {/if}
            </div>

            <!-- Mobile menu button -->
            <button 
				aria-label="Mobile menu"
                on:click={toggleMobileMenu} 
                class="text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 md:hidden"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6 w-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>
        </div>
    </div>

    <!-- Mobile menu -->
    {#if isMobileMenuOpen}
        <nav class="border-t border-gray-200 bg-white py-2 dark:border-gray-700 dark:bg-gray-800 md:hidden">
            <ul class="space-y-1 px-4">
                {#each ['Dashboard', 'Income', 'Expenses', 'Reports', 'Settings'] as item}
                    {@const path = item.toLowerCase() === 'dashboard' ? '/dashboard' : `/${item.toLowerCase()}`}
                    {@const isActive = $page?.path === path}
                    <li>
                        <a 
                            href={path} 
                            class="block rounded-md px-3 py-2 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                            class:bg-gray-100={isActive}
                            class:dark:bg-gray-700={isActive}
                            class:text-primary={isActive}
                        >
                            {item}
                        </a>
                    </li>
                {/each}
            </ul>
        </nav>
    {/if}
</header>
