<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Activity, ChevronRight } from 'lucide-svelte';
	import type { ClientOverviewData, ClientOverviewStatus } from '$lib/mock/client-overview';
	import PutClientInCareForm from '$lib/components/forms/PutClientInCareForm.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatOverviewDate } from '../overview-date';

	interface Props {
		client: ClientOverviewData;
		status: ClientOverviewStatus;
	}

	let { client, status }: Props = $props();
	let showPutInCareForm = $state(false);

	const formatDate = (dateString?: string) =>
		formatOverviewDate(dateString, getLocale(), m.not_available_short());

	const getWhatsNext = (status: ClientOverviewStatus) => {
		switch (status) {
			case 'on_waiting_list':
				return {
					title: m.whats_next_move_client_title(),
					description: m.whats_next_move_client_description(),
					action: m.whats_next_move_client_action()
				};
			case 'scheduled_in_care':
				return {
					title: m.whats_next_onboarding_title(),
					description: m.whats_next_onboarding_description({
						date: formatDate(client.plannedInCareDate)
					}),
					action: m.whats_next_onboarding_action()
				};
			case 'in_care':
				return {
					title: m.whats_next_evaluation_title(),
					description: m.whats_next_evaluation_description({
						date: formatDate(client.nextEvaluationDate)
					}),
					action: m.whats_next_evaluation_action()
				};
			case 'scheduled_out_of_care':
				return {
					title: m.whats_next_discharge_title(),
					description: m.whats_next_discharge_description({
						date: formatDate(client.plannedOutOfCareDate)
					}),
					action: m.whats_next_discharge_action()
				};
			case 'out_of_care':
				return {
					title: m.whats_next_archive_title(),
					description: m.whats_next_archive_description(),
					action: m.whats_next_archive_action()
				};
			default:
				return null;
		}
	};

	const whatsNext = $derived(getWhatsNext(status));

	const handleActionClick = () => {
		if (status !== 'on_waiting_list') return;
		showPutInCareForm = true;
	};
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
				<h3 class="text-lg font-bold text-text">{m.whats_next_heading()}</h3>
			</div>
			<p class="text-sm font-bold text-text">{whatsNext.title}</p>
			<p class="mt-1 text-sm text-text-muted">{whatsNext.description}</p>
		</div>
		<button
			type="button"
			onclick={handleActionClick}
			class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand shadow-sm ring-1 ring-brand/20 transition hover:bg-brand hover:text-white"
		>
			{whatsNext.action}
			<ChevronRight class="h-4 w-4" />
		</button>
	</div>

	{#if status === 'on_waiting_list'}
		<PutClientInCareForm
			bind:open={showPutInCareForm}
			clientId={client.id}
			onSuccess={() => invalidateAll()}
		/>
	{/if}
{/if}
