<script lang="ts">
	import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-svelte';
	import { scale, fade, fly } from 'svelte/transition';
	import { portal } from '$lib/actions/portal';
	import { floating } from '$lib/actions/floating';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		label?: string;
		value?: string;
		error?: string;
		id?: string;
		previousLabel?: string;
		nextLabel?: string;
		changeViewLabel?: string;
	}

	const generatedId = $props.id();
	let {
		label = undefined,
		value = $bindable(),
		error = undefined,
		id = generatedId,
		previousLabel = m.previous(),
		nextLabel = m.next(),
		changeViewLabel = m.select_date_time_placeholder()
	}: Props = $props();

	type View = 'days' | 'months' | 'years';

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const addDays = (date: Date, amount: number) => {
		const next = new SvelteDate(date);
		next.setDate(next.getDate() + amount);
		return next;
	};

	let isOpen = $state(false);
	let triggerEl = $state<HTMLButtonElement>();
	let dropdownEl = $state<HTMLDivElement>();
	let dialogId = $derived(`${id}-dialog`);
	let errorId = $derived(`${id}-error`);
	// Parse the initial value or default to now
	const initialDate = value ? new SvelteDate(value) : new SvelteDate();
	const viewDate = initialDate;

	// Keep track of time separately to persist it when changing dates
	let selectedHour = $state(initialDate.getHours());
	let selectedMinute = $state(initialDate.getMinutes());

	let view = $state<View>('days');

	// Calendar logic
	const days = $derived.by(() => {
		const formatter = new Intl.DateTimeFormat(resolveLocale(), { weekday: 'short' });
		const base = new Date(Date.UTC(2023, 0, 1));
		return Array.from({ length: 7 }, (_, i) => formatter.format(addDays(base, i)));
	});
	const monthNames = $derived.by(() => {
		const formatter = new Intl.DateTimeFormat(resolveLocale(), { month: 'long' });
		return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(Date.UTC(2023, i, 1))));
	});

	let daysInMonth = $derived(
		new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
	);
	let firstDayOfMonth = $derived(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay());

	// Array of days to render
	let calendarDays = $derived.by(() => {
		const arr: Array<Date | null> = [];
		for (let i = 0; i < firstDayOfMonth; i++) arr.push(null);
		for (let i = 1; i <= daysInMonth; i++)
			arr.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
		return arr;
	});

	// Years logic (12 year window)
	let startYear = $derived(Math.floor(viewDate.getFullYear() / 12) * 12);
	let years = $derived(Array.from({ length: 12 }, (_, i) => startYear + i));

	let formattedValue = $derived(
		value
			? new Date(value).toLocaleString(resolveLocale(), {
					month: 'short',
					day: 'numeric',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					hour12: false
				})
			: ''
	);

	// Header Text
	let headerText = $derived.by(() => {
		if (view === 'days')
			return viewDate.toLocaleDateString(resolveLocale(), { month: 'long', year: 'numeric' });
		if (view === 'months') return viewDate.getFullYear().toString();
		return `${startYear} - ${startYear + 11}`;
	});

	function updateValue() {
		// Create a new date object from viewDate but with selected time
		const finalDate = new SvelteDate(viewDate);
		finalDate.setHours(selectedHour);
		finalDate.setMinutes(selectedMinute);
		value = finalDate.toISOString();
	}

	function selectDate(date: Date) {
		if (!date) return;
		// Update viewDate to the selected date
		viewDate.setTime(date.getTime());
		updateValue();
		// Don't close immediately, let user adjust time if needed
	}

	function selectTime() {
		updateValue();
	}

	function selectMonth(monthIndex: number) {
		viewDate.setDate(1);
		viewDate.setMonth(monthIndex);
		view = 'days';
	}

	function selectYear(year: number) {
		viewDate.setDate(1);
		viewDate.setFullYear(year);
		view = 'months';
	}

	function next() {
		if (view === 'days') {
			viewDate.setDate(1);
			viewDate.setMonth(viewDate.getMonth() + 1);
		} else if (view === 'months') {
			viewDate.setFullYear(viewDate.getFullYear() + 1);
		} else {
			viewDate.setFullYear(viewDate.getFullYear() + 12);
		}
	}

	function prev() {
		if (view === 'days') {
			viewDate.setDate(1);
			viewDate.setMonth(viewDate.getMonth() - 1);
		} else if (view === 'months') {
			viewDate.setFullYear(viewDate.getFullYear() - 1);
		} else {
			viewDate.setFullYear(viewDate.getFullYear() - 12);
		}
	}

	function toggleView() {
		if (view === 'days') view = 'months';
		else if (view === 'months') view = 'years';
		else view = 'days';
	}

	function toggle() {
		isOpen = !isOpen;
		if (!isOpen) view = 'days';
	}

	function manageRoot(node: HTMLDivElement) {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (!node.contains(target) && (!dropdownEl || !dropdownEl.contains(target))) {
				isOpen = false;
				view = 'days';
			}
		};
		document.addEventListener('click', handleClick);
		return () => {
			document.removeEventListener('click', handleClick);
		};
	}

	function captureTrigger(node: HTMLButtonElement) {
		triggerEl = node;
		return () => {
			if (triggerEl === node) triggerEl = undefined;
		};
	}

	function captureDropdown(node: HTMLDivElement) {
		dropdownEl = node;
		return () => {
			if (dropdownEl === node) dropdownEl = undefined;
		};
	}

	// Helper to check if a date is the currently selected date (ignoring time for calendar visual)
	function isSameDay(d1: Date, d2String?: string) {
		if (!d2String) return false;
		const d2 = new Date(d2String);
		return (
			d1.getDate() === d2.getDate() &&
			d1.getMonth() === d2.getMonth() &&
			d1.getFullYear() === d2.getFullYear()
		);
	}
</script>

<div class="space-y-2" {@attach manageRoot}>
	{#if label}
		<label for={id} class="ml-1 text-sm font-semibold text-text">
			{label}
		</label>
	{/if}

	<div class="relative">
		<button
			{id}
			{@attach captureTrigger}
			type="button"
			onclick={toggle}
			role="combobox"
			aria-haspopup="dialog"
			aria-controls={dialogId}
			aria-expanded={isOpen}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? errorId : undefined}
			class="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3.5 text-left text-text outline-hidden transition-all focus:ring-2 focus:ring-brand/20 {error
				? 'border-error'
				: ''}"
		>
			<CalendarIcon class="h-4 w-4 text-text-muted" />
			{#if formattedValue}
				<span class="font-medium">{formattedValue}</span>
			{:else}
				<span class="text-text-muted">{m.select_date_time_placeholder()}</span>
			{/if}
		</button>

		{#if isOpen && triggerEl}
			<div
				{@attach captureDropdown}
				use:portal
				use:floating={{ anchor: triggerEl }}
				id={dialogId}
				role="dialog"
				aria-label={label ?? m.select_date_time_placeholder()}
				class="z-[9999] mt-2 flex w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl ring-1 ring-black/5 sm:flex-row"
				transition:scale={{ start: 0.95, duration: 150 }}
			>
				<!-- Calendar Section -->
				<div class="w-full p-4 sm:w-72">
					<!-- Date Picker Header -->
					<div class="mb-4 flex items-center justify-between">
						<button
							type="button"
							onclick={prev}
							aria-label={previousLabel}
							class="rounded-lg p-1 text-text hover:bg-border/50"
						>
							<ChevronLeft class="h-5 w-5" />
						</button>
						<button
							type="button"
							onclick={toggleView}
							aria-label={changeViewLabel}
							class="font-semibold text-text transition-colors hover:text-brand"
						>
							{headerText}
						</button>
						<button
							type="button"
							onclick={next}
							aria-label={nextLabel}
							class="rounded-lg p-1 text-text hover:bg-border/50"
						>
							<ChevronRight class="h-5 w-5" />
						</button>
					</div>

					<div class="relative grid min-h-[240px] grid-cols-1 grid-rows-1">
						{#if view === 'days'}
							<div
								class="col-start-1 row-start-1 w-full"
								in:fly={{ y: 10, duration: 200, delay: 50 }}
								out:fade={{ duration: 150 }}
							>
								<div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-muted">
									{#each days as day, i (i)}
										<div class="py-1">{day}</div>
									{/each}
								</div>

								<div class="mt-2 grid grid-cols-7 gap-1">
									{#each calendarDays as date, i (i)}
										{#if date}
											<button
												type="button"
												onclick={() => selectDate(date)}
												aria-label={date.toLocaleDateString(resolveLocale(), {
													weekday: 'long',
													year: 'numeric',
													month: 'long',
													day: 'numeric'
												})}
												aria-pressed={isSameDay(date, value)}
												class="aspect-square rounded-lg text-sm font-medium text-text hover:bg-border/50
                                            {isSameDay(date, value)
													? 'bg-brand font-bold text-white hover:opacity-90'
													: ''}"
											>
												{date.getDate()}
											</button>
										{:else}
											<div></div>
										{/if}
									{/each}
								</div>
							</div>
						{:else if view === 'months'}
							<div
								class="col-start-1 row-start-1 w-full"
								in:fly={{ y: 10, duration: 200, delay: 50 }}
								out:fade={{ duration: 150 }}
							>
								<div class="grid grid-cols-3 gap-2">
									{#each monthNames as month, i (i)}
										<button
											type="button"
											onclick={() => selectMonth(i)}
											aria-label={month}
											aria-pressed={viewDate.getMonth() === i}
											class="rounded-lg py-3 text-sm font-medium text-text hover:bg-border/50
                                        {viewDate.getMonth() === i
												? 'bg-brand font-bold text-white hover:opacity-90'
												: ''}"
										>
											{month.slice(0, 3)}
										</button>
									{/each}
								</div>
							</div>
						{:else if view === 'years'}
							<div
								class="col-start-1 row-start-1 w-full"
								in:fly={{ y: 10, duration: 200, delay: 50 }}
								out:fade={{ duration: 150 }}
							>
								<div class="grid grid-cols-3 gap-2">
									{#each years as year (year)}
										<button
											type="button"
											onclick={() => selectYear(year)}
											aria-pressed={viewDate.getFullYear() === year}
											class="rounded-lg py-3 text-sm font-medium text-text hover:bg-border/50
                                        {viewDate.getFullYear() === year
												? 'bg-brand font-bold text-white hover:opacity-90'
												: ''}"
										>
											{year}
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Time Picker Section -->
				<div
					class="flex w-full flex-col border-t border-border p-4 sm:w-40 sm:border-t-0 sm:border-l"
				>
					<div class="mb-4 flex items-center gap-2">
						<Clock class="h-4 w-4 text-text-muted" />
						<span class="text-xs font-semibold text-text-muted">{m.time()}</span>
					</div>
					<div class="grid flex-1 grid-cols-2 gap-4 sm:flex sm:flex-col sm:justify-center">
						<div class="space-y-1.5">
							<label for="{id}-hour" class="text-xs font-medium text-text-muted">{m.hour()}</label>
							<select
								id="{id}-hour"
								bind:value={selectedHour}
								onchange={selectTime}
								class="w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-hidden focus:ring-2 focus:ring-brand/20"
							>
								{#each Array.from({ length: 24 }, (_, i) => i) as h (h)}
									<option value={h}>{h.toString().padStart(2, '0')}</option>
								{/each}
							</select>
						</div>
						<div class="space-y-1.5">
							<label for="{id}-minute" class="text-xs font-medium text-text-muted"
								>{m.minute()}</label
							>
							<select
								id="{id}-minute"
								bind:value={selectedMinute}
								onchange={selectTime}
								class="w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-hidden focus:ring-2 focus:ring-brand/20"
							>
								{#each Array.from({ length: 12 }, (_, i) => i * 5) as m (m)}
									<option value={m}>{m.toString().padStart(2, '0')}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	{#if error}
		<p id={errorId} class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
