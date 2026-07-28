<script lang="ts">
	import { page } from '$app/state';
	import AccessDenied from '$lib/components/ui/AccessDenied.svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{page.status === 403 ? 'Access Denied' : 'Error'} | MaiCare</title>
</svelte:head>

{#if page.status === 403}
	<AccessDenied
		title="Access Denied"
		description={page.error?.message || 'You do not have permission to access this page.'}
	/>
{:else}
	<div class="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
		<div
			class="relative flex max-w-md flex-col items-center rounded-3xl border border-border bg-surface p-8 shadow-sm"
		>
			<h2 class="mb-2 text-xl font-bold tracking-tight text-text">
				{page.status}: {page.error?.message || 'An unexpected error occurred.'}
			</h2>
		</div>
	</div>
{/if}
