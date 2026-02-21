<script lang="ts">
	import { sidebarState } from '$lib/state/sidebar.svelte';
	import { page } from '$app/state';
	import { HeartPulse, LayoutDashboard, FileText, ScrollText } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	let { children } = $props();

	$effect(() => {
		const clientId = page.params.id;
		sidebarState.setScopedSidebar(
			[
				{
					label: m.overview(),
					href: `/clients/${clientId}`,
					icon: LayoutDashboard
				},
				{
					label: 'Medical Dossier',
					href: `/clients/${clientId}/medical`,
					icon: HeartPulse
				},
				{
					label: 'Appointment Card',
					href: `/clients/${clientId}/documents`,
					icon: FileText
				},
				{
					label: 'Goals',
					href: `/clients/${clientId}/goals`,
					icon: FileText
				},
				{
					label: 'Reports',
					href: `/clients/${clientId}/reports`,
					icon: FileText
				},
				{
					label: 'Contracts',
					href: `/clients/${clientId}/contracts`,
					icon: ScrollText
				}
			],
			'Client Details'
		);

		return () => {
			sidebarState.clearScopedSidebar();
		};
	});
</script>

{@render children()}
