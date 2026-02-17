<script lang="ts">
	import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-svelte';
	import { scale, fade, fly } from 'svelte/transition';
	import { portal } from '$lib/actions/portal';
	import { floating } from '$lib/actions/floating';

	let {
		label = undefined,
		value = $bindable(),
		error = undefined,
		id = `datetime-${Math.random().toString(36).substr(2, 9)}`
	} = $props();

	type View = 'days' | 'months' | 'years';

	let isOpen = $state(false);
	let triggerEl = $state<HTMLElement>();
	let dropdownEl = $state<HTMLElement>();
	// Parse the initial value or default to now
	let viewDate = $state(value ? new Date(value) : new Date());

	// Keep track of time separately to persist it when changing dates
	let selectedHour = $state(viewDate.getHours());
	let selectedMinute = $state(viewDate.getMinutes());

	let view = $state<View>('days');

	// Calendar logic
	const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	let daysInMonth = $derived(
		new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
	);
	let firstDayOfMonth = $derived(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay());

	// Array of days to render
	let calendarDays = $derived.by(() => {
		let arr = [];
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
			? new Date(value).toLocaleString('en-GB', {
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
			return viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
		if (view === 'months') return viewDate.getFullYear().toString();
		return `${startYear} - ${startYear + 11}`;
	});

	function updateValue() {
		// Create a new date object from viewDate but with selected time
		const finalDate = new Date(viewDate);
		finalDate.setHours(selectedHour);
		finalDate.setMinutes(selectedMinute);
		value = finalDate.toISOString();
	}

	function selectDate(date: Date) {
		if (!date) return;
		// Update viewDate to the selected date
		viewDate = new Date(date);
		updateValue();
		// Don't close immediately, let user adjust time if needed
	}

	function selectTime() {
		updateValue();
	}

	function selectMonth(monthIndex: number) {
		viewDate = new Date(viewDate.getFullYear(), monthIndex, 1);
		view = 'days';
	}

	function selectYear(year: number) {
		viewDate = new Date(year, viewDate.getMonth(), 1);
		view = 'months';
	}

	function next() {
		if (view === 'days') {
			viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
		} else if (view === 'months') {
			viewDate = new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1);
		} else {
			viewDate = new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1);
		}
	}

	function prev() {
		if (view === 'days') {
			viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
		} else if (view === 'months') {
			viewDate = new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1);
		} else {
			viewDate = new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1);
		}
	}

	function toggleView() {
		if (view === 'days') view = 'months';
		else if (view === 'months') view = 'years';
		else view = 'days';
	}

	function handleOutsideClick(node: HTMLElement) {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (!node.contains(target) && (!dropdownEl || !dropdownEl.contains(target))) {
				isOpen = false;
				view = 'days';
			}
		};
		document.addEventListener('click', handleClick);
		return {
			destroy() {
				document.removeEventListener('click', handleClick);
			}
		};
	}

	// Helper to check if a date is the currently selected date (ignoring time for calendar visual)
	function isSameDay(d1: Date, d2String: string) {
		if (!d2String) return false;
		const d2 = new Date(d2String);
		return (
			d1.getDate() === d2.getDate() &&
			d1.getMonth() === d2.getMonth() &&
			d1.getFullYear() === d2.getFullYear()
		);
	}
</script>

<div class="space-y-2" use:handleOutsideClick>
	{#if label}
		<label for={id} class="ml-1 text-sm font-semibold text-text">
			{label}
		</label>
	{/if}

	<div class="relative">
		<button
			{id}
			bind:this={triggerEl}
			type="button"
			onclick={() => (isOpen = !isOpen)}
			class="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3.5 text-left text-text outline-hidden transition-all focus:ring-2 focus:ring-brand/20"
		>
			<CalendarIcon class="h-4 w-4 text-text-muted" />
			{#if formattedValue}
				<span class="font-medium">{formattedValue}</span>
			{:else}
				<span class="text-text-muted">Select date & time...</span>
			{/if}
		</button>

		{#if isOpen && triggerEl}
			<div
				bind:this={dropdownEl}
				use:portal
				use:floating={{ anchor: triggerEl }}
				class="z-[9999] mt-2 flex w-auto overflow-hidden rounded-2xl border border-border bg-surface shadow-xl ring-1 ring-black/5"
				transition:scale={{ start: 0.95, duration: 150 }}
			>
				<!-- Calendar Section -->
				<div class="w-72 p-4">
					<!-- Date Picker Header -->
					<div class="mb-4 flex items-center justify-between">
						<button
							type="button"
							onclick={prev}
							class="rounded-lg p-1 text-text hover:bg-border/50"
						>
							<ChevronLeft class="h-5 w-5" />
						</button>
						<button
							type="button"
							onclick={toggleView}
							class="font-semibold text-text transition-colors hover:text-brand"
						>
							{headerText}
						</button>
						<button
							type="button"
							onclick={next}
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
				<div class="flex w-40 flex-col border-l border-border p-4">
					<div class="mb-4 flex items-center gap-2">
						<Clock class="h-4 w-4 text-text-muted" />
						<span class="text-xs font-semibold text-text-muted">Time</span>
					</div>
					<div class="flex flex-1 flex-col justify-center gap-4">
						<div class="space-y-1.5">
							<label for="{id}-hour" class="text-xs font-medium text-text-muted">Hour</label>
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
							<label for="{id}-minute" class="text-xs font-medium text-text-muted">Minute</label>
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
		<p class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
