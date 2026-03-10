<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { Handbook, HandbookStep, StepStatus } from '$lib/types/handbook';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		CheckCircle2,
		PlayCircle,
		ChevronRight,
		ChevronLeft,
		ExternalLink,
		BookOpen,
		ClipboardList,
		ShieldCheck,
		HelpCircle
	} from 'lucide-svelte';
	import { slide, fade } from 'svelte/transition';

	let { data } = $props<{ data: { handbook: Handbook | null } }>();

	const handbookData = $derived(data.handbook);

	// Mock state for interactive demo - syncs from loaded data for local mutation
	let handbook = $state<Handbook | null>(null);

	let currentStepIndex = $state(0);
	let acknowledged = $state(false);
	let quizAnswers = $state<Record<string, string>>({});

	$effect(() => {
		handbook = handbookData ? JSON.parse(JSON.stringify(handbookData)) : null;
		currentStepIndex = 0;
		acknowledged = false;
		quizAnswers = {};
	});

	// Derived states
	const currentStep = $derived(handbook?.steps[currentStepIndex] || null);
	const totalSteps = $derived(handbook?.steps.length || 0);
	const completedStepsCount = $derived(
		handbook?.steps.filter((s) => s.status === 'completed').length || 0
	);
	const progressPercentage = $derived(
		totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0
	);
	const isAllCompleted = $derived(completedStepsCount === totalSteps && totalSteps > 0);

	// Actions
	const startHandbook = () => {
		if (!handbook) return;
		handbook.status = 'in_progress';
		handbook.steps[0].status = 'in_progress';
		handbook.steps[0].started_at = new Date().toISOString();
	};

	const completeStep = () => {
		if (!handbook || !currentStep) return;

		// Mark current step as completed
		const step = handbook.steps[currentStepIndex];
		step.status = 'completed';
		step.completed_at = new Date().toISOString();

		if (step.kind === 'ack') {
			step.response = { acknowledged: true };
		} else if (step.kind === 'quiz') {
			step.response = { answers: { ...quizAnswers } };
		}

		// Update handbook status
		if (completedStepsCount === totalSteps) {
			handbook.status = 'completed';
		} else {
			// Start next step if available
			if (currentStepIndex + 1 < totalSteps) {
				const nextStep = handbook.steps[currentStepIndex + 1];
				if (nextStep.status === 'not_started') {
					nextStep.status = 'in_progress';
					nextStep.started_at = new Date().toISOString();
				}
				currentStepIndex++;
				resetStepState();
			}
		}
	};

	const nextStep = () => {
		if (currentStepIndex + 1 < totalSteps) {
			currentStepIndex++;
			resetStepState();
		}
	};

	const prevStep = () => {
		if (currentStepIndex > 0) {
			currentStepIndex--;
			resetStepState();
		}
	};

	const resetStepState = () => {
		acknowledged = currentStep?.response?.acknowledged || false;
		quizAnswers = currentStep?.response?.answers || {};
	};

	const getStepIcon = (kind: string) => {
		switch (kind) {
			case 'content':
				return BookOpen;
			case 'ack':
				return ShieldCheck;
			case 'link':
				return ExternalLink;
			case 'quiz':
				return ClipboardList;
			default:
				return HelpCircle;
		}
	};

	const canComplete = $derived.by(() => {
		if (!currentStep) return false;
		if (currentStep.status === 'completed') return false;
		if (currentStep.kind === 'ack') return acknowledged;
		if (currentStep.kind === 'quiz') {
			const questions = currentStep.content.questions;
			return questions.every((q: any) => quizAnswers[q.id]);
		}
		return true;
	});
</script>

<svelte:head>
	<title>{m.my_handbook()} | MaiCare</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header & Progress -->
	<div class="rounded-3xl border border-border/60 bg-glass-surface p-8 shadow-sm backdrop-blur-xl">
		<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-text">
					{handbook?.template_title || m.my_handbook()}
				</h1>
				<p class="mt-2 text-text-muted">
					{handbook?.template_description || m.handbook_description()}
				</p>
				<div class="mt-4 flex flex-wrap gap-4 text-sm font-medium">
					<span class="flex items-center gap-1.5 text-text-muted">
						<span class="h-1.5 w-1.5 rounded-full bg-brand"></span>
						{handbook?.department_name || 'General'}
					</span>
					<span class="flex items-center gap-1.5 text-text-muted">
						<span class="h-1.5 w-1.5 rounded-full bg-secondary"></span>
						v{handbook?.template_version || '1.0.0'}
					</span>
				</div>
			</div>

			{#if handbook && handbook.status !== 'no_handbook'}
				<div class="flex w-full flex-col gap-2 md:w-64">
					<div class="flex items-center justify-between text-sm font-bold">
						<span class="text-text-muted">{m.handbook_progress()}</span>
						<span class="text-brand">{progressPercentage}%</span>
					</div>
					<div class="h-3 w-full overflow-hidden rounded-full bg-border/40">
						<div
							class="h-full bg-brand transition-all duration-700 ease-out"
							style="width: {progressPercentage}%"
						></div>
					</div>
					<p class="text-right text-xs font-medium text-text-subtle">
						{completedStepsCount} / {totalSteps}
						{m.items()}
					</p>
				</div>
			{/if}
		</div>
	</div>

	{#if !handbook}
		<div class="flex flex-col items-center justify-center py-20 text-center" in:fade>
			<div class="mb-6 rounded-full bg-border/20 p-6">
				<HelpCircle class="h-12 w-12 text-text-subtle" />
			</div>
			<h2 class="text-xl font-bold text-text">{m.no_handbook_assigned()}</h2>
		</div>
	{:else if handbook.status === 'not_started'}
		<div class="flex flex-col items-center justify-center py-20 text-center" in:fade>
			<div
				class="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-brand/10 text-brand"
			>
				<PlayCircle class="h-12 w-12" />
			</div>
			<h2 class="text-2xl font-bold text-text">{m.welcome_back()}!</h2>
			<p class="mx-auto mt-2 max-w-md text-text-muted">
				{m.handbook_description()}
			</p>
			<Button class="mt-8 px-8 py-6 text-lg" onclick={startHandbook}>
				{m.start_handbook()}
			</Button>
		</div>
	{:else if isAllCompleted && handbook.status === 'completed' && currentStepIndex === totalSteps - 1 && currentStep?.status === 'completed'}
		<div class="flex flex-col items-center justify-center py-20 text-center" in:fade>
			<div
				class="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500"
			>
				<CheckCircle2 class="h-12 w-12" />
			</div>
			<h2 class="text-2xl font-bold text-text">{m.handbook_completed_title()}</h2>
			<p class="mx-auto mt-2 max-w-md text-text-muted">
				{m.handbook_completed_description()}
			</p>
			<Button
				variant="ghost"
				class="mt-8 border border-border"
				onclick={() => (currentStepIndex = 0)}
			>
				Review Handbook
			</Button>
		</div>
	{:else}
		<div class="grid gap-8 lg:grid-cols-12">
			<!-- Sidebar Steps List -->
			<div class="lg:col-span-4">
				<div class="sticky top-24 space-y-3">
					{#each handbook.steps as step, i (step.step_id)}
						{@const StepIcon = getStepIcon(step.kind)}
						<button
							class="group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300
                            {currentStepIndex === i
								? 'border-brand bg-brand/5 shadow-md ring-1 ring-brand/20'
								: 'border-border/40 bg-surface/40 hover:border-border hover:bg-surface/60'}"
							onclick={() => (currentStepIndex = i)}
						>
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors
                                {step.status === 'completed'
									? 'bg-emerald-500/10 text-emerald-500'
									: currentStepIndex === i
										? 'bg-brand/10 text-brand'
										: 'bg-border/30 text-text-subtle'}"
							>
								{#if step.status === 'completed'}
									<CheckCircle2 class="h-5 w-5" />
								{:else}
									<StepIcon class="h-5 w-5" />
								{/if}
							</div>
							<div class="flex-1 overflow-hidden">
								<p
									class="truncate text-sm font-bold {currentStepIndex === i
										? 'text-text'
										: 'text-text-muted'}"
								>
									{step.title}
								</p>
								<p class="text-xs font-medium text-text-subtle">
									{m[`step_kind_${step.kind}`] || step.kind}
								</p>
							</div>
							{#if currentStepIndex === i}
								<ChevronRight class="h-4 w-4 text-brand" />
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Main Content Area -->
			<div class="lg:col-span-8">
				{#if currentStep}
					{@const CurrentStepIcon = getStepIcon(currentStep.kind)}
					<div
						class="flex flex-col rounded-3xl border border-border/60 bg-surface/80 shadow-lg backdrop-blur-sm"
						in:slide={{ axis: 'y', duration: 400 }}
					>
						<!-- Step Header -->
						<div class="border-b border-border/50 p-6 lg:p-8">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
								>
									<CurrentStepIcon class="h-5 w-5" />
								</div>
								<div>
									<h2 class="text-xl font-bold text-text">{currentStep.title}</h2>
									<p class="text-sm font-medium text-text-muted">{currentStep.body}</p>
								</div>
							</div>
						</div>

						<!-- Step Content -->
						<div class="flex-1 p-6 lg:p-8">
							<div
								class="prose prose-zinc dark:prose-invert prose-headings:text-text prose-p:text-text-muted prose-li:text-text-muted max-w-none"
							>
								{#if currentStep.kind === 'link'}
									<div class="flex flex-col items-center justify-center py-12 text-center">
										<div class="mb-6 rounded-2xl bg-secondary/10 p-4 text-secondary">
											<ExternalLink class="h-8 w-8" />
										</div>
										<p class="mb-6 text-text-muted">
											This step requires you to visit an external resource.
										</p>
										<a
											href={currentStep.content}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 font-bold text-white transition hover:opacity-90 active:scale-95"
										>
											Open Resource <ExternalLink class="h-4 w-4" />
										</a>
									</div>
								{:else if currentStep.kind === 'quiz'}
									<div class="space-y-8">
										{#each currentStep.content.questions as q (q.id)}
											<div class="space-y-4">
												<p class="text-lg font-bold text-text">{q.text}</p>
												<div class="grid gap-3 sm:grid-cols-2">
													{#each q.options as option (option)}
														<button
															class="flex items-center gap-3 rounded-xl border p-4 text-left transition-all
                                                            {quizAnswers[q.id] === option
																? 'border-brand bg-brand/5 ring-1 ring-brand/20'
																: 'border-border/50 hover:border-border'}"
															onclick={() => (quizAnswers[q.id] = option)}
															disabled={currentStep.status === 'completed'}
														>
															<div
																class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border
                                                                {quizAnswers[q.id] === option
																	? 'border-brand bg-brand text-white'
																	: 'border-border'}"
															>
																{#if quizAnswers[q.id] === option}
																	<div class="h-2 w-2 rounded-full bg-white"></div>
																{/if}
															</div>
															<span class="text-sm font-medium">{option}</span>
														</button>
													{/each}
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div>
										{@html currentStep.content}
									</div>
								{/if}
							</div>

							{#if currentStep.kind === 'ack'}
								<div class="mt-12 rounded-2xl border border-brand/20 bg-brand/5 p-6">
									<label class="flex cursor-pointer items-center gap-4">
										<input
											type="checkbox"
											bind:checked={acknowledged}
											disabled={currentStep.status === 'completed'}
											class="h-6 w-6 rounded-lg border-border bg-surface text-brand focus:ring-brand/20"
										/>
										<span class="text-sm font-bold text-text">
											{m.acknowledge_handbook()}
										</span>
									</label>
								</div>
							{/if}
						</div>

						<!-- Step Footer -->
						<div class="flex items-center justify-between border-t border-border/50 p-6 lg:p-8">
							<Button
								variant="ghost"
								class="border border-border"
								onclick={prevStep}
								disabled={currentStepIndex === 0}
							>
								<ChevronLeft class="mr-2 h-4 w-4" />
								{m.previous_step()}
							</Button>

							<div class="flex items-center gap-3">
								{#if currentStep.status === 'completed'}
									<span class="flex items-center gap-2 text-sm font-bold text-emerald-500">
										<CheckCircle2 class="h-5 w-5" />
										{m.completed()}
									</span>
									<Button onclick={nextStep} disabled={currentStepIndex === totalSteps - 1}>
										{m.next_step()}
										<ChevronRight class="ml-2 h-4 w-4" />
									</Button>
								{:else}
									<Button onclick={completeStep} disabled={!canComplete}>
										{m.complete_step()}
										<CheckCircle2 class="ml-2 h-4 w-4" />
									</Button>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
