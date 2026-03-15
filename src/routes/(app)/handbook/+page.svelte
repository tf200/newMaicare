<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { Handbook, HandbookStep } from '$lib/types/handbook';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { completeMyHandbookStep, startMyHandbook } from '$lib/api/handbooks';
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

	interface QuizQuestion {
		id: string;
		text: string;
		options: string[];
	}

	let { data } = $props<{ data: { handbook: Handbook | null; loadError: string | null } }>();

	const pageLoadError = $derived(data.loadError);

	const isRecord = (value: unknown): value is Record<string, unknown> =>
		typeof value === 'object' && value !== null && !Array.isArray(value);

	const responseToObject = (response: HandbookStep['response']): Record<string, unknown> | null =>
		isRecord(response) ? response : null;

	const mapAnswerRecord = (value: unknown): Record<string, string> => {
		const answers: Record<string, string> = {};
		if (!isRecord(value)) return answers;

		for (const [key, item] of Object.entries(value)) {
			if (typeof item === 'string') answers[key] = item;
		}

		return answers;
	};

	function firstPendingStepIndex(value: Handbook): number {
		const index = value.steps.findIndex((step) => step.status === 'pending');
		return index >= 0 ? index : 0;
	}

	const initialStepIndex = (() => {
		const initialHandbook = data.handbook;
		return initialHandbook ? firstPendingStepIndex(initialHandbook) : 0;
	})();
	const initialStepResponse = (() => {
		const initialHandbook = data.handbook;
		return responseToObject(initialHandbook?.steps[initialStepIndex]?.response ?? null);
	})();
	const initialCompletionPanelOpen = (() => {
		const initialHandbook = data.handbook;
		if (!initialHandbook || initialHandbook.status !== 'completed') return false;
		return initialHandbook.steps.every((step: HandbookStep) => step.status !== 'pending');
	})();

	let handbookDraft = $state<Handbook | null>(null);
	const handbook = $derived(handbookDraft ?? data.handbook);
	let currentStepIndex = $state(initialStepIndex);
	let acknowledged = $state(Boolean(initialStepResponse?.acknowledged));
	let quizAnswers = $state<Record<string, string>>(mapAnswerRecord(initialStepResponse?.answers));
	let actionError = $state<string | null>(null);
	let isStarting = $state(false);
	let isCompleting = $state(false);
	let showCompletionPanel = $state(initialCompletionPanelOpen);

	const getQuizQuestions = (step: HandbookStep | null): QuizQuestion[] => {
		if (!step || step.kind !== 'quiz' || !isRecord(step.content)) return [];

		const rawQuestions = step.content.questions;
		if (!Array.isArray(rawQuestions)) return [];

		return rawQuestions.flatMap((raw): QuizQuestion[] => {
			if (!isRecord(raw)) return [];
			const id = typeof raw.id === 'string' ? raw.id : '';
			const text = typeof raw.text === 'string' ? raw.text : '';
			const options = Array.isArray(raw.options)
				? raw.options.filter((option): option is string => typeof option === 'string')
				: [];
			if (!id || !text || options.length === 0) return [];
			return [{ id, text, options }];
		});
	};

	const getLinkUrl = (step: HandbookStep | null): string | null => {
		if (!step || step.kind !== 'link') return null;
		if (typeof step.content === 'string') return step.content;
		if (isRecord(step.content) && typeof step.content.url === 'string') return step.content.url;
		return null;
	};

	const getHtmlContent = (step: HandbookStep | null): string => {
		if (!step) return '';
		if (typeof step.content === 'string') return step.content;
		return step.body ?? '';
	};

	const htmlToPlainText = (html: string): string => {
		if (!html) return '';

		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		for (const selector of ['script', 'iframe', 'object', 'embed', 'style']) {
			for (const element of doc.querySelectorAll(selector)) {
				element.remove();
			}
		}

		for (const element of doc.body.querySelectorAll('*')) {
			for (const attr of [...element.attributes]) {
				const name = attr.name.toLowerCase();
				const value = attr.value.trim().toLowerCase();
				if (name.startsWith('on')) {
					element.removeAttribute(attr.name);
				}
				if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
					element.removeAttribute(attr.name);
				}
			}
		}

		return doc.body.textContent?.trim() ?? '';
	};

	const resetStepState = () => {
		const step = handbook?.steps[currentStepIndex];
		const response = responseToObject(step?.response ?? null);

		acknowledged = Boolean(response?.acknowledged);
		quizAnswers = mapAnswerRecord(response?.answers);
	};

	const ensureMutableHandbook = (): Handbook | null => {
		if (handbookDraft) return handbookDraft;
		if (!data.handbook) return null;

		handbookDraft = structuredClone(data.handbook);
		return handbookDraft;
	};

	const currentStep = $derived(handbook?.steps[currentStepIndex] || null);
	const totalSteps = $derived(handbook?.steps.length || 0);
	const completedStepsCount = $derived(
		handbook?.steps.filter((step: HandbookStep) => step.status !== 'pending').length || 0
	);
	const progressPercentage = $derived(
		totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0
	);
	const isAllCompleted = $derived(
		Boolean(handbook) && handbook.steps.every((step: HandbookStep) => step.status !== 'pending')
	);
	const currentStepQuizQuestions = $derived(getQuizQuestions(currentStep));
	const currentStepLinkUrl = $derived(getLinkUrl(currentStep));
	const currentStepText = $derived(htmlToPlainText(getHtmlContent(currentStep)));

	const getStepIcon = (kind: HandbookStep['kind']) => {
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

	const getStepKindLabel = (kind: HandbookStep['kind']) => {
		switch (kind) {
			case 'content':
				return m.step_kind_content();
			case 'ack':
				return m.step_kind_ack();
			case 'link':
				return m.step_kind_link();
			case 'quiz':
				return m.step_kind_quiz();
		}
	};

	const canComplete = $derived.by(() => {
		if (!currentStep || currentStep.status !== 'pending' || isCompleting) return false;
		if (currentStep.kind === 'ack') return acknowledged;
		if (currentStep.kind === 'quiz') {
			if (currentStepQuizQuestions.length === 0) return false;
			return currentStepQuizQuestions.every((question) => Boolean(quizAnswers[question.id]));
		}
		return true;
	});

	const completionResponse = (step: HandbookStep): Record<string, unknown> => {
		if (step.kind === 'ack') return { acknowledged };
		if (step.kind === 'quiz') return { answers: { ...quizAnswers } };
		return {};
	};

	const startHandbook = async () => {
		if (!handbook || handbook.status !== 'not_started' || isStarting) return;

		isStarting = true;
		actionError = null;
		try {
			const response = await startMyHandbook();
			const mutableHandbook = ensureMutableHandbook();
			if (!mutableHandbook || response.data.handbook_id !== mutableHandbook.handbook_id) return;

			mutableHandbook.status = response.data.status;
			mutableHandbook.started_at = response.data.started_at;
			currentStepIndex = firstPendingStepIndex(mutableHandbook);
			resetStepState();
		} catch (error) {
			actionError = error instanceof Error ? error.message : 'Failed to start handbook.';
		} finally {
			isStarting = false;
		}
	};

	const completeStep = async () => {
		if (!handbook || !currentStep || !canComplete) return;

		const stepIndex = currentStepIndex;
		const mutableHandbook = ensureMutableHandbook();
		if (!mutableHandbook) return;

		const step = mutableHandbook.steps[stepIndex];
		const payload = completionResponse(step);
		actionError = null;
		isCompleting = true;

		try {
			const response = await completeMyHandbookStep(step.step_id, { response: payload });
			if (response.data.handbook_id !== mutableHandbook.handbook_id) return;

			step.status = response.data.step_status;
			step.completed_at = response.data.completed_at;
			step.response = payload;
			mutableHandbook.status = response.data.handbook_status;

			if (response.data.handbook_status === 'completed') {
				mutableHandbook.completed_at = response.data.completed_at;
				showCompletionPanel = true;
				currentStepIndex = totalSteps > 0 ? totalSteps - 1 : 0;
			} else if (stepIndex + 1 < totalSteps) {
				currentStepIndex = stepIndex + 1;
			}

			resetStepState();
		} catch (error) {
			actionError = error instanceof Error ? error.message : 'Failed to complete step.';
		} finally {
			isCompleting = false;
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

	const openExternalLink = () => {
		if (!currentStepLinkUrl) return;
		window.open(currentStepLinkUrl, '_blank', 'noopener,noreferrer');
	};
</script>

<svelte:head>
	<title>{m.my_handbook()} | MaiCare</title>
</svelte:head>

<div class="space-y-8">
	{#if pageLoadError}
		<InlineErrorBanner message={pageLoadError} />
	{/if}

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

			{#if handbook}
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
			<Button class="mt-8 px-8 py-6 text-lg" onclick={startHandbook} disabled={isStarting}>
				{isStarting ? 'Starting...' : m.start_handbook()}
			</Button>
		</div>
	{:else if showCompletionPanel && isAllCompleted && handbook.status === 'completed'}
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
					onclick={() => {
						showCompletionPanel = false;
						currentStepIndex = 0;
						resetStepState();
					}}
				>
					Review Handbook
				</Button>
		</div>
	{:else}
		<div class="grid gap-8 lg:grid-cols-12">
			<div class="lg:col-span-4">
				<div class="sticky top-24 space-y-3">
					{#each handbook.steps as step, i (step.step_id)}
						{@const StepIcon = getStepIcon(step.kind)}
						<button
							class="group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300
                            {currentStepIndex === i
								? 'border-brand bg-brand/5 shadow-md ring-1 ring-brand/20'
								: 'border-border/40 bg-surface/40 hover:border-border hover:bg-surface/60'}"
							onclick={() => {
								currentStepIndex = i;
								resetStepState();
							}}
						>
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors
                                {step.status === 'completed'
									? 'bg-emerald-500/10 text-emerald-500'
									: step.status === 'skipped'
										? 'bg-amber-500/10 text-amber-600'
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
								<p class="text-xs font-medium text-text-subtle">{getStepKindLabel(step.kind)}</p>
							</div>
							{#if currentStepIndex === i}
								<ChevronRight class="h-4 w-4 text-brand" />
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<div class="lg:col-span-8">
				{#if currentStep}
					{@const CurrentStepIcon = getStepIcon(currentStep.kind)}
					<div
						class="flex flex-col rounded-3xl border border-border/60 bg-surface/80 shadow-lg backdrop-blur-sm"
						in:slide={{ axis: 'y', duration: 400 }}
					>
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

						<div class="flex-1 p-6 lg:p-8">
							{#if actionError}
								<div class="mb-6">
									<InlineErrorBanner message={actionError} />
								</div>
							{/if}

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
										{#if currentStepLinkUrl}
											<button
												type="button"
												onclick={openExternalLink}
												class="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-3 font-bold text-white transition hover:opacity-90 active:scale-95"
											>
												Open Resource <ExternalLink class="h-4 w-4" />
											</button>
										{:else}
											<p class="text-sm text-rose-600">No valid link configured for this step.</p>
										{/if}
									</div>
								{:else if currentStep.kind === 'quiz'}
									<div class="space-y-8">
										{#if currentStepQuizQuestions.length === 0}
											<p class="text-sm text-rose-600">Quiz content is missing or invalid.</p>
										{/if}

										{#each currentStepQuizQuestions as q (q.id)}
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
															disabled={currentStep.status !== 'pending'}
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
										<p class="whitespace-pre-line text-text-muted">{currentStepText}</p>
									</div>
								{/if}
							</div>

							{#if currentStep.kind === 'ack'}
								<div class="mt-12 rounded-2xl border border-brand/20 bg-brand/5 p-6">
									<label class="flex cursor-pointer items-center gap-4">
										<input
											type="checkbox"
											bind:checked={acknowledged}
											disabled={currentStep.status !== 'pending'}
											class="h-6 w-6 rounded-lg border-border bg-surface text-brand focus:ring-brand/20"
										/>
										<span class="text-sm font-bold text-text">
											{m.acknowledge_handbook()}
										</span>
									</label>
								</div>
							{/if}
						</div>

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
								{#if currentStep.status !== 'pending'}
									<span
										class="flex items-center gap-2 text-sm font-bold {currentStep.status === 'completed'
											? 'text-emerald-500'
											: 'text-amber-600'}"
									>
										<CheckCircle2 class="h-5 w-5" />
										{currentStep.status === 'completed' ? m.completed() : 'Skipped'}
									</span>
									<Button onclick={nextStep} disabled={currentStepIndex === totalSteps - 1}>
										{m.next_step()}
										<ChevronRight class="ml-2 h-4 w-4" />
									</Button>
								{:else}
									<Button onclick={completeStep} disabled={!canComplete}>
										{isCompleting ? 'Saving...' : m.complete_step()}
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
