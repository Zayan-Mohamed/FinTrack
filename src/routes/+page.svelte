<script>
	import { onMount } from 'svelte';

	onMount(() => {
		window.location.href = '/dashboard';
	});
</script>

<div class="flex h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="mb-4 text-3xl font-bold">Loading Personal Finance Dashboard...</h1>
		<p>Redirecting to dashboard...</p>
	</div>
</div>
