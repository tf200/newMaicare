<script lang="ts">
	import { sidebarState } from '$lib/state/sidebar.svelte';
	import { page } from '$app/state';
	import {
		HeartPulse,
		LayoutDashboard,
		FileBarChart,
		ScrollText,
		Target,
		CalendarCheck
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	let { data, children } = $props();

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
					icon: CalendarCheck
				},
				{
					label: 'Goals',
					href: `/clients/${clientId}/goals`,
					icon: Target
				},
				{
					label: 'Reports',
					href: `/clients/${clientId}/reports`,
					icon: FileBarChart
				},
				{
					label: 'Contracts',
					href: `/clients/${clientId}/contracts`,
					icon: ScrollText
				}
			],
			data.clientName,
			data.clientInitials
		);

		return () => {
			sidebarState.clearScopedSidebar();
		};
	});
</script>

{@render children()}
