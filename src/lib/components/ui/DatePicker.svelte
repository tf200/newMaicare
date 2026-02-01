<script lang="ts">
	import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { scale, fade, fly } from 'svelte/transition';

	let {
		label,
		value = $bindable(),
		error = undefined,
		minDate = undefined,
		id = `date-${Math.random().toString(36).substr(2, 9)}`
	} = $props();

	type View = 'days' | 'months' | 'years';

	let isOpen = $state(false);
	let viewDate = $state(value ? new Date(value) : new Date());
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
			? new Date(value).toLocaleDateString('en-US', {
					month: 'long',
					day: 'numeric',
					year: 'numeric'
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

	function selectDate(date: Date) {
		if (!date) return;
		value = date.toISOString().split('T')[0];
		isOpen = false;
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
			if (!node.contains(e.target as Node)) {
				isOpen = false;
				view = 'days'; // Reset view on close
			}
		};
		document.addEventListener('click', handleClick);
		return {
			destroy() {
				document.removeEventListener('click', handleClick);
			}
		};
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
			type="button"
			onclick={() => (isOpen = !isOpen)}
			class="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3.5 text-left text-text outline-hidden transition-all focus:ring-2 focus:ring-brand/20"
		>
			<CalendarIcon class="h-4 w-4 text-text-muted" />
			{#if formattedValue}
				<span class="font-medium">{formattedValue}</span>
			{:else}
				<span class="text-text-muted">Select date...</span>
			{/if}
		</button>

		{#if isOpen}
			<div
				class="absolute z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-xl ring-1 ring-black/5"
				transition:scale={{ start: 0.95, duration: 150 }}
			>
				<div class="mb-4 flex items-center justify-between">
					<button type="button" onclick={prev} class="rounded-lg p-1 text-text hover:bg-border/50">
						<ChevronLeft class="h-5 w-5" />
					</button>
					<button
						type="button"
						onclick={toggleView}
						class="font-semibold text-text transition-colors hover:text-brand"
					>
						{headerText}
					</button>
					<button type="button" onclick={next} class="rounded-lg p-1 text-text hover:bg-border/50">
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
                                            {value === date.toISOString().split('T')[0]
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
		{/if}
	</div>
	{#if error}
		<p class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
