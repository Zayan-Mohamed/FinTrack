<script>
	import { settingsStore } from '../../lib/stores/settings';
	import { income } from '../../lib/stores/income';
	import { expenses } from '../../lib/stores/expenses';
	import { savings } from '../../lib/stores/savings';
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	// Use reactive store
	$: settings = $settingsStore;

	// State for notifications
	let showSuccess = false;
	let showError = false;
	let notificationMessage = '';
	let backupData = null;
	let confirmingReset = false;
	let fileInputRef;
	let exportFilename = `fintrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
	let importError = '';

	// Use the advanced mode value from settings instead of local state
	$: advancedMode = settings.advancedMode;

	// Storage usage tracking
	let storageUsage = 0;

	const updateSettings = (key, value) => {
		settingsStore.update((current) => {
			return { ...current, [key]: value };
		});
		showNotification(`${key} setting updated successfully`);
	};

	function showNotification(message, isError = false) {
		notificationMessage = message;

		if (isError) {
			showError = true;
			setTimeout(() => (showError = false), 3000);
		} else {
			showSuccess = true;
			setTimeout(() => (showSuccess = false), 3000);
		}
	}

	function clearAllData() {
		if (browser) {
			try {
				// Clear all stores
				income.set([]);
				expenses.set([]);
				savings.set([]);

				// Reset settings to defaults but keep language/theme
				const currentTheme = settings.theme;
				const currentLanguage = settings.language;
				settingsStore.update((current) => {
					return {
						currency: 'LKR',
						theme: currentTheme,
						notifications: true,
						language: currentLanguage,
						displayDecimal: true,
						compactNumbers: false,
						dateFormat: 'MM/DD/YYYY',
						startDayOfWeek: 'sunday',
						advancedMode: false
					};
				});

				showNotification('All data has been cleared successfully');
				confirmingReset = false;
			} catch (error) {
				showNotification(`Error clearing data: ${error.message}`, true);
			}
		}
	}

	function exportData() {
		if (browser) {
			try {
				const data = {
					income: JSON.parse(localStorage.getItem('income')),
					expenses: JSON.parse(localStorage.getItem('expenses')),
					savings: JSON.parse(localStorage.getItem('savings')),
					settings: JSON.parse(localStorage.getItem('settings')),
					exportDate: new Date().toISOString(),
					version: '1.0'
				};

				// Create downloadable file
				const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = exportFilename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

				showNotification('Data exported successfully');
			} catch (error) {
				showNotification(`Error exporting data: ${error.message}`, true);
			}
		}
	}

	// Calculate storage usage
	function calculateStorageUsage() {
		if (browser) {
			try {
				// Calculate total storage used
				const totalBytes =
					(localStorage.getItem('income') || '').length +
					(localStorage.getItem('expenses') || '').length +
					(localStorage.getItem('savings') || '').length +
					(localStorage.getItem('settings') || '').length;

				// Approximate max storage (5MB is common limit)
				const maxStorage = 5 * 1024 * 1024;
				storageUsage = Math.min(100, Math.round((totalBytes / maxStorage) * 100));
			} catch (error) {
				console.error('Error calculating storage:', error);
				storageUsage = 0;
			}
		}
	}

	// Toggle advanced mode
	function toggleAdvancedMode() {
		updateSettings('advancedMode', !settings.advancedMode);

		// If enabling advanced mode, show a notification explaining what it does
		if (!settings.advancedMode) {
			showNotification('Advanced mode enabled - additional features unlocked!');
		}
	}

	// Call on component mount to initialize values
	onMount(() => {
		calculateStorageUsage();
	});

	function handleFileUpload(e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = function (event) {
			try {
				const data = JSON.parse(event.target.result.toString());
				backupData = data;

				// Validate backup data structure
				if (!data.income || !data.expenses || !data.savings || !data.settings) {
					importError = 'Invalid backup file format';
					backupData = null;
					return;
				}

				importError = '';
			} catch (error) {
				importError = `Error parsing file: ${error.message}`;
				backupData = null;
			}
		};
		reader.readAsText(file);
	}

	function importData() {
		if (!backupData) return;

		try {
			// Import all data from backup
			if (backupData.income) localStorage.setItem('income', JSON.stringify(backupData.income));
			if (backupData.expenses)
				localStorage.setItem('expenses', JSON.stringify(backupData.expenses));
			if (backupData.savings) localStorage.setItem('savings', JSON.stringify(backupData.savings));
			if (backupData.settings)
				localStorage.setItem('settings', JSON.stringify(backupData.settings));

			// Refresh the page to load the new data
			showNotification('Data imported successfully! Refreshing page...');
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} catch (error) {
			showNotification(`Error importing data: ${error.message}`, true);
		}
	}
</script>

<div class="bg-gray-100 p-6 dark:bg-gray-900 dark:text-gray-100">
	<h1 class="mb-8 text-2xl font-bold">Settings</h1>

	<!-- Notification Toast Messages -->
	{#if showSuccess}
		<div
			transition:fade={{ duration: 300 }}
			class="fixed right-4 top-4 z-50 w-72 rounded-lg bg-green-100 p-4 text-green-800 shadow-lg dark:bg-green-800 dark:text-green-200"
		>
			<div class="flex items-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				<span class="ml-2 text-sm">{notificationMessage}</span>
			</div>
		</div>
	{/if}

	{#if showError}
		<div
			transition:fade={{ duration: 300 }}
			class="fixed right-4 top-4 z-50 w-72 rounded-lg bg-red-100 p-4 text-red-800 shadow-lg dark:bg-red-800 dark:text-red-200"
		>
			<div class="flex items-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				<span class="ml-2 text-sm">{notificationMessage}</span>
			</div>
		</div>
	{/if}

	<div class="grid gap-6 md:grid-cols-2">
		<!-- General Preferences -->
		<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
			<div class="mb-6">
				<h2 class="mb-4 text-xl font-semibold dark:text-white">Preferences</h2>

				<!-- Currency Dropdown -->
				<div class="mb-4">
					<label
						for="currency"
						class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label
					>
					<select
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						bind:value={settings.currency}
						on:change={(e) => updateSettings('currency', e.target.value)}
					>
						<option value="USD">USD ($)</option>
						<option value="EUR">EUR (€)</option>
						<option value="GBP">GBP (£)</option>
						<option value="CAD">CAD ($)</option>
						<option value="AUD">AUD ($)</option>
						<option value="JPY">JPY (¥)</option>
						<option value="LKR">LKR (රු)</option>
						<option value="INR">INR (₹)</option>
					</select>
				</div>

				<!-- Theme Toggle -->
				<div class="mb-4">
					<fieldset>
						<legend class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>Theme</legend
						>
						<div class="flex space-x-4">
							<label class="inline-flex items-center">
								<input
									type="radio"
									class="form-radio"
									name="theme"
									value="light"
									checked={settings.theme === 'light'}
									on:change={() => updateSettings('theme', 'light')}
									aria-label="Light theme"
								/>
								<span class="ml-2 dark:text-gray-300">Light</span>
							</label>
							<label class="inline-flex items-center">
								<input
									type="radio"
									class="form-radio"
									name="theme"
									value="dark"
									checked={settings.theme === 'dark'}
									on:change={() => updateSettings('theme', 'dark')}
									aria-label="Dark theme"
								/>
								<span class="ml-2 dark:text-gray-300">Dark</span>
							</label>
						</div>
					</fieldset>
				</div>

				<!-- Language Dropdown -->
				<div class="mb-4">
					<label
						for="language"
						class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label
					>
					<select
						id="language"
						class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						bind:value={settings.language}
						on:change={(e) => updateSettings('language', e.target.value)}
					>
						<option value="en">English</option>
						<option value="fr">French</option>
						<option value="es">Spanish</option>
						<option value="de">German</option>
						<option value="si">Sinhala</option>
					</select>
				</div>

				<!-- Notification toggle -->
				<div class="mb-4">
					<div class="flex items-center justify-between">
						<label
							for="notifications"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>Notifications</label
						>
						<button
							aria-label="Toggle notifications"
							type="button"
							class={`${
								settings.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
							} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
							on:click={() => updateSettings('notifications', !settings.notifications)}
							aria-pressed={settings.notifications}
						>
							<span
								class={`${
									settings.notifications ? 'translate-x-6' : 'translate-x-1'
								} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
							></span>
						</button>
					</div>
					<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
						Enable or disable all notifications
					</p>
				</div>
			</div>
		</div>

		<!-- Display Preferences -->
		<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
			<h2 class="mb-4 text-xl font-semibold dark:text-white">Display Preferences</h2>

			<!-- Number Format -->
			<div class="mb-4">
				<div class="flex items-center justify-between">
					<label
						for="displayDecimal"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>Display Decimals</label
					>
					<button
						type="button"
						aria-label="Toggle decimal display"
						class={`${
							settings.displayDecimal ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
						} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
						on:click={() => updateSettings('displayDecimal', !settings.displayDecimal)}
						aria-pressed={settings.displayDecimal}
					>
						<span
							class={`${
								settings.displayDecimal ? 'translate-x-6' : 'translate-x-1'
							} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
						></span>
					</button>
				</div>
				<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
					Show decimal places in currency values
				</p>
			</div>

			<!-- Compact Numbers -->
			<div class="mb-4">
				<div class="flex items-center justify-between">
					<label
						for="compactNumbers"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>Compact Numbers</label
					>
					<button
						type="button"
						aria-label="Toggle compact numbers"
						class={`${
							settings.compactNumbers ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
						} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
						on:click={() => updateSettings('compactNumbers', !settings.compactNumbers)}
						aria-pressed={settings.compactNumbers}
					>
						<span
							class={`${
								settings.compactNumbers ? 'translate-x-6' : 'translate-x-1'
							} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
						></span>
					</button>
				</div>
				<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
					Display large numbers in compact form (1k, 1M instead of 1,000, 1,000,000)
				</p>
			</div>

			<!-- Date Format -->
			<div class="mb-4">
				<label
					for="dateFormat"
					class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Date Format</label
				>
				<select
					id="dateFormat"
					class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					bind:value={settings.dateFormat}
					on:change={(e) => updateSettings('dateFormat', e.target.value)}
				>
					<option value="MM/DD/YYYY">MM/DD/YYYY</option>
					<option value="DD/MM/YYYY">DD/MM/YYYY</option>
					<option value="YYYY-MM-DD">YYYY-MM-DD</option>
				</select>
				<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
					Choose how dates are formatted throughout the application
				</p>
			</div>

			<!-- Start of Week -->
			<div class="mb-4">
				<label
					for="startDayOfWeek"
					class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>Week Starts On</label
				>
				<select
					id="startDayOfWeek"
					class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					bind:value={settings.startDayOfWeek}
					on:change={(e) => updateSettings('startDayOfWeek', e.target.value)}
				>
					<option value="sunday">Sunday</option>
					<option value="monday">Monday</option>
				</select>
				<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
					Choose which day of the week should be considered the first
				</p>
			</div>
		</div>

		<!-- Data Management -->
		<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
			<h2 class="mb-4 text-xl font-semibold dark:text-white">Data Management</h2>

			<!-- Export Data -->
			<div class="mb-6">
				<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Export Data</h3>
				<p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
					Download all your financial data as a JSON file for backup
				</p>
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={exportFilename}
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						placeholder="backup-filename.json"
					/>
					<button
						on:click={exportData}
						class="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
					>
						Export
					</button>
				</div>
			</div>

			<!-- Import Data -->
			<div class="mb-6">
				<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Import Data</h3>
				<p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
					Restore your data from a previously exported backup file
				</p>
				<div class="flex flex-col gap-2">
					<input
						type="file"
						accept=".json"
						on:change={handleFileUpload}
						bind:this={fileInputRef}
						class="block w-full cursor-pointer rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
					/>
					{#if importError}
						<p class="text-xs text-red-500">{importError}</p>
					{/if}
					<button
						on:click={importData}
						disabled={!backupData}
						class="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-700 dark:hover:bg-green-800"
					>
						Import Data
					</button>
				</div>
			</div>

			<!-- Clear All Data -->
			<div>
				<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Reset Application</h3>
				<p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
					Delete all your data and reset to defaults. This cannot be undone.
				</p>

				{#if !confirmingReset}
					<button
						on:click={() => (confirmingReset = true)}
						class="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
					>
						Clear All Data
					</button>
				{:else}
					<div class="rounded-md bg-red-100 p-4 dark:bg-red-900/30">
						<div class="mb-2 text-sm text-red-800 dark:text-red-300">
							Are you sure you want to delete all your data? This action cannot be undone.
						</div>
						<div class="flex gap-2">
							<button
								on:click={clearAllData}
								class="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
							>
								Yes, Delete Everything
							</button>
							<button
								on:click={() => (confirmingReset = false)}
								class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- About & More -->
		<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
			<h2 class="mb-4 text-xl font-semibold dark:text-white">About</h2>

			<div class="mb-6 text-sm text-gray-600 dark:text-gray-300">
				<p class="mb-2"><strong>FinTrack Personal Finance Dashboard</strong></p>
				<p class="mb-4">Version 1.0.0</p>

				<p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
					FinTrack is your personal finance tracking solution, helping you manage expenses, income,
					and savings goals.
				</p>
				<p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
					All data is stored locally in your browser and is never sent to any server.
				</p>
			</div>

			<!-- Advanced Mode Toggle -->
			<div class="mb-6">
				<div class="flex items-center justify-between">
					<label
						for="advancedMode"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300">Advanced Mode</label
					>
					<button
						type="button"
						aria-label="Toggle advanced mode"
						class={`${
							advancedMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
						} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500`}
						on:click={toggleAdvancedMode}
						aria-pressed={advancedMode}
					>
						<span
							class={`${
								advancedMode ? 'translate-x-6' : 'translate-x-1'
							} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
						></span>
					</button>
				</div>
				<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
					Enable advanced features and detailed analytics
				</p>
			</div>

			{#if advancedMode}
				<div
					transition:fade={{ duration: 200 }}
					class="mt-4 rounded-lg bg-purple-50 p-4 dark:bg-purple-900/30"
				>
					<h3 class="mb-2 text-sm font-medium text-purple-700 dark:text-purple-300">
						Advanced Features Enabled
					</h3>
					<ul class="ml-5 list-disc text-xs text-purple-600 dark:text-purple-400">
						<li>Detailed financial analytics</li>
						<li>Custom data visualization options</li>
						<li>Advanced budget forecasting</li>
						<li>Custom category management</li>
						<li>Data export in multiple formats</li>
					</ul>
					<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
						Some features may still be in development
					</p>
				</div>
			{/if}

			<!-- Storage Usage -->
			<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
				<h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
					Local Storage Usage
				</h3>

				<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
					<div class="h-full rounded-full bg-blue-500" style="width: {storageUsage}%;"></div>
				</div>
				<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
					Using approximately {storageUsage}% of available local storage
				</p>
			</div>
		</div>
	</div>
</div>
