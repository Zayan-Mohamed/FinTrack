<script lang="ts">
  export let label: string;
  export let onClick: () => void;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled: boolean = false;
</script>

<button
  class="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
  on:click={onClick}
  type={type}
  disabled={disabled}
>
  {label}
</button>