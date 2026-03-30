<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { UsersRound, LayoutDashboard, CalendarClock, ChevronRight } from 'lucide-svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(true), onClose }: Props = $props();

	let currentStep = $state(0);

	const steps = [
		{
			icon: LayoutDashboard,
			title: m.onboarding_step_explore(),
			desc: m.onboarding_step_explore_desc(),
			color: 'text-brand',
			bg: 'bg-brand/10'
		},
		{
			icon: UsersRound,
			title: m.onboarding_step_clients(),
			desc: m.onboarding_step_clients_desc(),
			color: 'text-emerald-500',
			bg: 'bg-emerald-500/10'
		},
		{
			icon: CalendarClock,
			title: m.onboarding_step_schedule(),
			desc: m.onboarding_step_schedule_desc(),
			color: 'text-indigo-500',
			bg: 'bg-indigo-500/10'
		}
	];

	$effect(() => {
		if (!open) {
			onClose();
		}
	});

	function handleNext() {
		if (currentStep < steps.length - 1) {
			currentStep++;
		} else {
			open = false;
		}
	}

	function handleBack() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function handleSkip() {
		open = false;
	}

	const step = $derived(steps[currentStep]);
	const isLast = $derived(currentStep === steps.length - 1);
	const progressPercent = $derived(((currentStep + 1) / steps.length) * 100);
</script>

<Modal
	bind:open
	title={m.onboarding_welcome_title()}
	description={m.onboarding_welcome_subtitle()}
	size="md"
>
	<div class="space-y-6">
		<div>
			<p class="text-sm font-medium text-text-muted">{m.onboarding_welcome_subtitle()}</p>
		</div>

		<!-- Progress Bar -->
		<div class="space-y-2">
			<div class="flex items-center justify-between text-xs font-semibold text-text-subtle">
				<span>
					{m.onboarding_step_progress({
						current: String(currentStep + 1),
						total: String(steps.length)
					})}
				</span>
				<span>{Math.round(progressPercent)}%</span>
			</div>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
				<div
					class="h-full rounded-full bg-brand transition-all duration-500 ease-out"
					style="width: {progressPercent}%"
				></div>
			</div>
		</div>

		<!-- Step Content -->
		<div class="flex flex-col items-center gap-4 py-4 text-center">
			<div
				class="flex h-20 w-20 items-center justify-center rounded-3xl border border-border/50 {step.bg} transition-all duration-300"
			>
				<step.icon class="h-10 w-10 {step.color}" />
			</div>
			<div>
				<h3 class="text-lg font-bold tracking-tight text-text">{step.title}</h3>
				<p class="mt-1 text-sm text-text-muted">{step.desc}</p>
			</div>
		</div>

		<!-- Step Indicators -->
		<div class="flex items-center justify-center gap-2">
			{#each steps as _, i (i)}
				<button
					onclick={() => (currentStep = i)}
					class="h-2 rounded-full transition-all duration-300 {i === currentStep
						? 'w-8 bg-brand'
						: i < currentStep
							? 'w-2 bg-brand/40'
							: 'w-2 bg-border/50'}"
					aria-label="Go to step {i + 1}"
				></button>
			{/each}
		</div>
	</div>

	{#snippet footer()}
		<div class="flex w-full items-center justify-between">
			<button
				onclick={handleSkip}
				class="text-sm font-semibold text-text-muted transition-colors hover:text-text"
			>
				{m.onboarding_skip()}
			</button>

			<div class="flex items-center gap-3">
				{#if currentStep > 0}
					<button
						onclick={handleBack}
						class="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-text transition-all hover:bg-border/30 active:scale-95"
					>
						{m.onboarding_back()}
					</button>
				{/if}
				<button
					onclick={handleNext}
					class="inline-flex h-10 items-center gap-2 rounded-xl bg-btn-primary-bg px-5 text-sm font-semibold text-btn-primary-text shadow-sm transition-all hover:opacity-90 active:scale-95"
				>
					{isLast ? m.onboarding_finish() : m.onboarding_next()}
					{#if !isLast}
						<ChevronRight class="h-4 w-4" />
					{/if}
				</button>
			</div>
		</div>
	{/snippet}
</Modal>
