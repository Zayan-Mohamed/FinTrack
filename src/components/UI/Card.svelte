<script lang="ts">
  export let title: string;
  export let content: string;
</script>

<div class="bg-white shadow-md rounded-lg p-4 m-4">
  <h2 class="text-lg font-semibold mb-2">{title}</h2>
  <p class="text-gray-700">{content}</p>
</div>