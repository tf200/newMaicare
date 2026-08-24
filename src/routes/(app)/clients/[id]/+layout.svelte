<script lang="ts">
	import type { LayoutProps } from './$types';
	import { sidebarState } from '$lib/state/sidebar.svelte';
	import { resolve } from '$app/paths';
	import {
		HeartPulse,
		LayoutDashboard,
		FileBarChart,
		ScrollText,
		Target,
		CalendarCheck,
		UsersRound
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	let { data, children }: LayoutProps = $props();

	$effect(() => {
		const clientId = data.clientId;
		let disposed = false;

		void data.clientData.then((client) => {
			if (disposed) return;

			sidebarState.setScopedSidebar(
				[
					{
						label: m.overview(),
						href: resolve('/(app)/clients/[id]', { id: clientId }),
						icon: LayoutDashboard
					},
					{
						label: m.medical_dossier(),
						href: resolve('/(app)/clients/[id]/medical', { id: clientId }),
						icon: HeartPulse
					},
					{
						label: m.appointment_card(),
						href: resolve('/(app)/clients/[id]/documents', { id: clientId }),
						icon: CalendarCheck
					},
					{
						label: m.goals(),
						href: resolve('/(app)/clients/[id]/goals', { id: clientId }),
						icon: Target
					},
					{
						label: m.progress_reports(),
						href: resolve('/(app)/clients/[id]/reports', { id: clientId }),
						icon: FileBarChart
					},
					{
						label: m.contracts(),
						href: resolve('/(app)/clients/[id]/contracts', { id: clientId }),
						icon: ScrollText
					},
					{
						label: m.involved_employees(),
						href: resolve('/(app)/clients/[id]/involved-employees', { id: clientId }),
						icon: UsersRound
					}
				],
				client.clientName,
				client.clientInitials
			);
		});

		return () => {
			disposed = true;
			sidebarState.clearScopedSidebar();
		};
	});
</script>

{@render children()}
