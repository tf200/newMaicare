<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getAuthState } from '$lib/state/auth.svelte';
	import AccessDenied from '$lib/components/ui/AccessDenied.svelte';

	interface Props {
		permission?: string;
		anyOf?: string[];
		allOf?: string[];
		fallback?: Snippet;
		showAccessDenied?: boolean;
		children?: Snippet;
	}

	let {
		permission,
		anyOf = [],
		allOf = [],
		fallback,
		showAccessDenied = false,
		children
	}: Props = $props();
	const auth = getAuthState();

	const isAllowed = $derived.by(() => {
		if (permission) return auth.hasPermission(permission);
		if (allOf.length) return auth.hasAllPermissions(allOf);
		if (anyOf.length) return auth.hasAnyPermission(anyOf);
		return true;
	});
</script>

{#if isAllowed}
	{@render children?.()}
{:else if fallback}
	{@render fallback()}
{:else if showAccessDenied}
	<AccessDenied />
{/if}
