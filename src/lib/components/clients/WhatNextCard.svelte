<script lang="ts">
	import { Activity, ChevronRight } from 'lucide-svelte';
	import type { ClientOverviewData, ClientOverviewStatus } from '$lib/mock/client-overview';

	interface Props {
		client: ClientOverviewData;
		status: ClientOverviewStatus;
	}

	let { client, status }: Props = $props();

	const formatDate = (dateString?: string) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const getWhatsNext = (status: ClientOverviewStatus) => {
		switch (status) {
			case 'on_waiting_list':
				return {
					title: 'Prepare for Intake',
					description: 'Review missing documents and finalize intake appointment.',
					action: 'View Checklist'
				};
			case 'scheduled_in_care':
				return {
					title: 'Onboarding Start',
					description: `Planned start date: ${formatDate(client.plannedInCareDate)}. Verify readiness checks and coordinator handoff.`,
					action: 'Prepare Start'
				};
			case 'in_care':
				return {
					title: 'Periodic Evaluation',
					description: `Next evaluation scheduled for ${formatDate(client.nextEvaluationDate)}.`,
					action: 'Open Plan'
				};
			case 'scheduled_out_of_care':
				return {
					title: 'Discharge Preparation',
					description: `Planned discharge date: ${formatDate(client.plannedOutOfCareDate)}. Finalize aftercare and close documentation.`,
					action: 'Discharge Plan'
				};
			case 'out_of_care':
				return {
					title: 'Archive Client',
					description: 'Closing report pending. Complete to archive file.',
					action: 'Final Report'
				};
			default:
				return null;
		}
	};

	const whatsNext = $derived(getWhatsNext(status));
</script>

{#if whatsNext}
	<div
		class="flex flex-col justify-between rounded-3xl border border-brand/20 bg-brand/[0.02] p-6 shadow-sm ring-1 ring-brand/5"
	>
		<div>
			<div class="mb-4 flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
					<Activity class="h-5 w-5" />
				</div>
				<h3 class="text-lg font-bold text-text">What's Next?</h3>
			</div>
			<p class="text-sm font-bold text-text">{whatsNext.title}</p>
			<p class="mt-1 text-sm text-text-muted">{whatsNext.description}</p>
		</div>
		<button
			class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand shadow-sm ring-1 ring-brand/20 transition hover:bg-brand hover:text-white"
		>
			{whatsNext.action}
			<ChevronRight class="h-4 w-4" />
		</button>
	</div>
{/if}
