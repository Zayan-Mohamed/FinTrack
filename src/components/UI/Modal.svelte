<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  export let title = '';
  export let content = '';
  const dispatch = createEventDispatcher();

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-1/3">
      <h2 class="text-xl font-semibold mb-4">{title}</h2>
      <p class="mb-4">{content}</p>
      <div class="flex justify-end">
        <button on:click={closeModal} class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Add any additional styles here if needed */
</style>