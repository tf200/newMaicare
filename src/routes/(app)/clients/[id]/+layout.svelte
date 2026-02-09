<script lang="ts">
	import { sidebarState } from '$lib/state/sidebar.svelte';
	import { page } from '$app/state';
	import {
		LayoutDashboard,
		ClipboardList,
		CalendarClock,
		Heart,
		CalendarCheck,
		LogOut,
		FileText
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	let { children } = $props();

	$effect(() => {
		const clientId = page.params.id;
		sidebarState.setScopedSidebar(
			[
				{
					label: m.overview(),
					href: `/clients/${clientId}/in-care`,
					icon: LayoutDashboard
				},
				{
					label: 'Waiting list view',
					href: `/clients/${clientId}/on-waiting-list`,
					icon: ClipboardList
				},
				{
					label: 'Scheduled in care',
					href: `/clients/${clientId}/scheduled-in-care`,
					icon: CalendarClock
				},
				{
					label: m.in_care(),
					href: `/clients/${clientId}/in-care`,
					icon: Heart
				},
				{
					label: 'Scheduled out of care',
					href: `/clients/${clientId}/scheduled-out-of-care`,
					icon: CalendarCheck
				},
				{
					label: 'Out of care',
					href: `/clients/${clientId}/out-of-care`,
					icon: LogOut
				},
				{
					label: 'Resources',
					icon: FileText,
					children: [
						{ label: m.documents(), href: `/clients/${clientId}/documents` },
						{ label: 'Goals', href: `/clients/${clientId}/goals` },
						{ label: 'Reports', href: `/clients/${clientId}/reports` }
					]
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
