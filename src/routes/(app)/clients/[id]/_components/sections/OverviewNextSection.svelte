<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Activity, ChevronRight } from 'lucide-svelte';
	import type { ClientOverviewData, ClientOverviewStatus } from '../../overview.shared';
	import PutClientInCareForm from '$lib/components/forms/PutClientInCareForm.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
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
	const actionHref = $derived.by(() => {
		switch (status) {
			case 'scheduled_in_care':
				return localizeHref(resolve('/(app)/clients/[id]/documents', { id: client.id }));
			case 'in_care':
				return localizeHref(resolve('/(app)/clients/[id]/goals', { id: client.id }));
			case 'scheduled_out_of_care':
			case 'out_of_care':
				return localizeHref(resolve('/(app)/clients/[id]/reports', { id: client.id }));
			default:
				return null;
		}
	});

	const handleActionClick = () => {
		if (status !== 'on_waiting_list') return;
		showPutInCareForm = true;
	};
</script>

{#if whatsNext}
	<section
		class="flex flex-col justify-between rounded-3xl border border-brand/20 bg-brand/[0.02] p-6 shadow-sm ring-1 ring-brand/5"
	>
		<div>
			<div class="mb-4 flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
					<Activity class="h-5 w-5" aria-hidden="true" />
				</div>
				<h2 class="text-lg font-semibold tracking-tight text-text">{m.whats_next_heading()}</h2>
			</div>
			<p class="text-sm font-bold text-text">{whatsNext.title}</p>
			<p class="mt-1 text-sm text-text-muted">{whatsNext.description}</p>
		</div>
		{#if status === 'on_waiting_list'}
			<button
				type="button"
				onclick={handleActionClick}
				class="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-sm font-bold text-brand shadow-sm ring-1 ring-brand/20 transition-colors hover:bg-brand hover:text-btn-primary-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
			>
				{whatsNext.action}
				<ChevronRight class="h-4 w-4" aria-hidden="true" />
			</button>
		{:else if actionHref}
			<!-- actionHref is built exclusively with resolve() and localizeHref(). -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={actionHref}
				data-sveltekit-preload-data="hover"
				class="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-sm font-bold text-brand shadow-sm ring-1 ring-brand/20 transition-colors hover:bg-brand hover:text-btn-primary-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
			>
				{whatsNext.action}
				<ChevronRight class="h-4 w-4" aria-hidden="true" />
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	</section>

	{#if status === 'on_waiting_list'}
		<PutClientInCareForm
			bind:open={showPutInCareForm}
			clientId={client.id}
			onSuccess={() => invalidate(`app:client:${client.id}:detail`)}
		/>
	{/if}
{/if}
