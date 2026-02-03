<script lang="ts">
	import { goto } from '$app/navigation';
	import { intakes } from '$lib/api/intakes';
	import AssessmentCard from '$lib/components/intake/AssessmentCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-svelte';

	let { data } = $props();
	const intake = $derived(data.intake);
	const assessments = $derived(data.assessments ?? []);

	let isPromoting = $state(false);
	let promoteError = $state('');

	async function handlePromote() {
		// Basic validation: Check if assessments are completed?
		// For now, just allow promotion.
		if (
			!confirm(
				'Are you sure you want to promote this intake to a client? This will create a care plan based on the goals.'
			)
		) {
			return;
		}

		isPromoting = true;
		promoteError = '';
		try {
			const res = await intakes.promote(intake.id);
			if (res.data?.client_id) {
				goto(`/clients/${res.data.client_id}`);
			} else {
				// Fallback if no client_id returned (should not happen based on spec)
				promoteError = 'Promotion succeeded but no client ID returned.';
			}
		} catch (e) {
			console.error(e);
			promoteError = e instanceof Error ? e.message : 'Failed to promote intake.';
		} finally {
			isPromoting = false;
		}
	}
</script>

<div class="mx-auto max-w-5xl space-y-8 p-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex items-center gap-4">
			<button
				onclick={() => history.back()}
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-text-subtle transition-colors hover:bg-zinc-100 hover:text-text"
			>
				<ArrowLeft class="h-5 w-5" />
			</button>
			<div>
				<h1 class="text-2xl font-bold text-text">Assessment Workspace</h1>
				<p class="text-text-subtle">
					Intake for <span class="font-medium text-text"
						>{intake.intake_participants || 'Client'}</span
					>
				</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<div class="text-sm font-medium text-text-muted">
				{assessments.length} Topics
			</div>
			<Button onclick={handlePromote} disabled={isPromoting} variant="primary">
				{#if isPromoting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" /> Promoting...
				{:else}
					<CheckCircle2 class="mr-2 h-4 w-4" /> Promote to Client
				{/if}
			</Button>
		</div>
	</div>

	{#if promoteError}
		<div class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
			{promoteError}
		</div>
	{/if}

	<!-- Grid of Assessments -->
	<div class="grid gap-6 md:grid-cols-2">
		{#each assessments as assessment (assessment.id)}
			<AssessmentCard {assessment} />
		{/each}
	</div>

	{#if assessments.length === 0}
		<div class="rounded-3xl border border-dashed border-border bg-zinc-50/50 p-12 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
				<Loader2 class="h-6 w-6 animate-spin text-text-subtle" />
			</div>
			<h3 class="text-lg font-bold text-text">Initializing Assessments...</h3>
			<p class="text-text-subtle">Please wait while we set up the topics.</p>
		</div>
	{/if}
</div>
