<!-- src/routes/+layout.svelte -->
<script>
    import '../styles/app.css';
    import Header from '../components/Layout/Header.svelte';
    import Sidebar from '../components/Layout/Sidebar.svelte';
    import Footer from '../components/Layout/Footer.svelte';
    import { settingsStore } from '../lib/stores/settings';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';

    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    let isCollapsed = true; // Track sidebar state

    $: settings = $settingsStore;

    // Handle sidebar toggle event
    function handleSidebarToggle(event) {
        isCollapsed = event.detail.isCollapsed;
    }

    // Apply theme changes from settings store
    settingsStore.subscribe(({ theme }) => {
        if (browser) {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    });

    onMount(() => {
        if (browser) {
            const currentTheme = $settingsStore.theme || 'light';
            if (currentTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    });
</script>

<div class="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 pt-16"> <!-- Add pt-16 to account for header height -->
    <Header />
    <div class="flex flex-1">
        <Sidebar on:sidebarToggle={handleSidebarToggle} />
        <main class="flex-1 p-6 transition-all duration-300 overflow-y-auto" 
              style="margin-left: {isCollapsed ? '5rem' : '16rem'}">
            <div class="mx-auto max-w-7xl">
                <slot />
            </div>
        </main>
    </div>
    <Footer {year} />
</div>