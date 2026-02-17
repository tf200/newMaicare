<script lang="ts">
	import { ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';
	import Button from './Button.svelte';
	import type { Appointment } from '$lib/types/appointments';

	type CalendarView = 'month' | 'week' | 'day' | 'agenda';

	interface Props {
		appointments: Appointment[];
		onAddAppointment?: (date: Date) => void;
		onEditAppointment?: (appointment: Appointment) => void;
		onRangeChange?: (range: { start: Date; end: Date; view: CalendarView }) => void;
		selectedDate?: Date;
		initialView?: CalendarView;
		loading?: boolean;
	}

	let {
		appointments = [],
		onAddAppointment,
		onEditAppointment,
		onRangeChange,
		selectedDate = new Date(),
		initialView = 'month',
		loading = false
	}: Props = $props();

	let view = $state<CalendarView>('month');
	let viewDate = $state(new Date());
	let weekScrollEl = $state<HTMLDivElement>();
	let dayScrollEl = $state<HTMLDivElement>();
	let lastAutoScrollKey = $state('');

	$effect(() => {
		view = initialView;
	});

	$effect(() => {
		viewDate = new Date(selectedDate);
	});

	$effect(() => {
		if (view !== 'week' && view !== 'day') return;
		const today = new Date();
		const key = `${view}-${view === 'week' ? weekStart.toISOString() : startOfDay(viewDate).toISOString()}`;
		if (lastAutoScrollKey === key) return;

		const targetEl = view === 'week' ? weekScrollEl : dayScrollEl;
		if (!targetEl) return;

		// Auto-scroll to current time when looking at today
		const isViewingToday =
			view === 'day'
				? isSameDay(viewDate, today)
				: today >= weekStart && today < addDays(weekStart, 7);

		if (!isViewingToday) {
			lastAutoScrollKey = key;
			return;
		}

		const minutes = today.getHours() * 60 + today.getMinutes();
		const slotHeight = view === 'week' ? WEEK_SLOT_HEIGHT_PX : DAY_SLOT_HEIGHT_PX;
		const y = (minutes / SLOT_MINUTES) * slotHeight;
		targetEl.scrollTop = Math.max(0, y - 160);
		lastAutoScrollKey = key;
	});

	const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const months = [
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

	const startOfDay = (date: Date) => {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		return d;
	};

	const addDays = (date: Date, amount: number) => {
		const d = new Date(date);
		d.setDate(d.getDate() + amount);
		return d;
	};

	const isSameDay = (a: Date, b: Date) =>
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate();

	const isToday = (date: Date) => isSameDay(date, new Date());

	const currentMonth = $derived(viewDate.getMonth());
	const currentYear = $derived(viewDate.getFullYear());

	const monthCells = $derived.by(() => {
		const firstOfMonth = new Date(currentYear, currentMonth, 1);
		const firstDay = firstOfMonth.getDay();
		const gridStart = new Date(currentYear, currentMonth, 1 - firstDay);
		const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];
		for (let i = 0; i < 42; i++) {
			const date = addDays(gridStart, i);
			cells.push({ date, isCurrentMonth: date.getMonth() === currentMonth });
		}
		return cells;
	});

	const weekStart = $derived.by(() => {
		const d = startOfDay(viewDate);
		return addDays(d, -d.getDay());
	});

	const weekDays = $derived.by(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)));

	const agendaRangeStart = $derived.by(() => (view === 'agenda' ? weekStart : weekStart));
	const agendaRangeEnd = $derived.by(() => addDays(agendaRangeStart, 7));

	// Compute current view date range for API calls
	const viewRange = $derived.by(() => {
		let start: Date;
		let end: Date;

		if (view === 'month') {
			// Get all days shown in month view (42 cells)
			start = monthCells[0]?.date || new Date();
			end = monthCells[monthCells.length - 1]?.date || new Date();
			end.setHours(23, 59, 59, 999);
		} else if (view === 'week') {
			start = weekStart;
			end = addDays(weekStart, 6);
			end.setHours(23, 59, 59, 999);
		} else if (view === 'day') {
			start = startOfDay(viewDate);
			end = new Date(start);
			end.setHours(23, 59, 59, 999);
		} else {
			// agenda
			start = agendaRangeStart;
			end = agendaRangeEnd;
		}

		return { start, end, view };
	});

	// Emit range changes to parent
	$effect(() => {
		onRangeChange?.(viewRange);
	});

	const parseApp = (app: Appointment) => ({
		app,
		start: new Date(app.start),
		end: new Date(app.end)
	});

	const inRange = (start: Date, end: Date, rangeStart: Date, rangeEnd: Date) =>
		start < rangeEnd && end > rangeStart;

	const getAppointmentsForDate = (date: Date) => {
		return appointments
			.map(parseApp)
			.filter(({ start }) => isSameDay(start, date))
			.sort((a, b) => a.start.getTime() - b.start.getTime())
			.map(({ app }) => app);
	};

	const weekAppointments = $derived.by(() => {
		const start = weekStart;
		const end = addDays(weekStart, 7);
		return appointments
			.map(parseApp)
			.filter(({ start: s, end: e }) => inRange(s, e, start, end))
			.sort((a, b) => a.start.getTime() - b.start.getTime())
			.map(({ app }) => app);
	});

	const dayAppointments = $derived.by(() => {
		const start = startOfDay(viewDate);
		const end = addDays(start, 1);
		return appointments
			.map(parseApp)
			.filter(({ start: s, end: e }) => inRange(s, e, start, end))
			.sort((a, b) => a.start.getTime() - b.start.getTime())
			.map(({ app }) => app);
	});

	const agendaAppointments = $derived.by(() => {
		const start = agendaRangeStart;
		const end = agendaRangeEnd;
		return appointments
			.map(parseApp)
			.filter(({ start: s, end: e }) => inRange(s, e, start, end))
			.sort((a, b) => a.start.getTime() - b.start.getTime())
			.map(({ app }) => app);
	});

	const DAY_START_HOUR = 0;
	const DAY_END_HOUR = 24;
	const SLOT_MINUTES = 30;
	const WEEK_SLOT_HEIGHT_PX = 40;
	const DAY_SLOT_HEIGHT_PX = 48;
	const slots = $derived.by(() => {
		const out: Array<{ index: number; minutesFromStart: number; label: string; time: string }> = [];
		const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
		const totalSlots = Math.ceil(totalMinutes / SLOT_MINUTES);
		for (let i = 0; i < totalSlots; i++) {
			const minutesFromStart = i * SLOT_MINUTES;
			const hour = DAY_START_HOUR + Math.floor(minutesFromStart / 60);
			const minute = minutesFromStart % 60;
			const label = minute === 0 ? `${hour.toString().padStart(2, '0')}:00` : '';
			const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
			out.push({ index: i, minutesFromStart, label, time });
		}
		return out;
	});

	const slotDateTime = (day: Date, minutesFromStart: number) => {
		const d = startOfDay(day);
		d.setHours(DAY_START_HOUR, 0, 0, 0);
		d.setMinutes(d.getMinutes() + minutesFromStart);
		return d;
	};

	const dayBounds = (day: Date) => {
		const start = startOfDay(day);
		const end = addDays(start, 1);
		return { start, end };
	};

	const clampRangeToDay = (start: Date, end: Date, day: Date) => {
		const { start: dayStart, end: dayEnd } = dayBounds(day);
		const s = start < dayStart ? dayStart : start;
		const e = end > dayEnd ? dayEnd : end;
		return { start: s, end: e };
	};

	const minutesSinceDayStart = (d: Date, day: Date) => {
		const { start: dayStart } = dayBounds(day);
		return Math.max(0, Math.min(24 * 60, Math.floor((d.getTime() - dayStart.getTime()) / 60000)));
	};

	const blockPosition = (start: Date, end: Date, day: Date, slotHeightPx: number) => {
		const clamped = clampRangeToDay(start, end, day);
		const startMin = minutesSinceDayStart(clamped.start, day);
		const endMin = minutesSinceDayStart(clamped.end, day);
		const top = (startMin / SLOT_MINUTES) * slotHeightPx;
		const height = Math.max(slotHeightPx, ((endMin - startMin) / SLOT_MINUTES) * slotHeightPx);
		return { top, height };
	};

	type DayLayoutItem = {
		app: Appointment;
		start: Date;
		end: Date;
		col: number;
		cols: number;
	};

	const buildDayLayout = (day: Date, apps: Appointment[]): DayLayoutItem[] => {
		const { start: dayStart, end: dayEnd } = dayBounds(day);
		const segments = apps
			.map((app) => {
				const start = new Date(app.start);
				const end = new Date(app.end);
				if (end <= dayStart || start >= dayEnd) return null;
				const clamped = clampRangeToDay(start, end, day);
				if (clamped.end <= clamped.start) return null;
				return { app, start: clamped.start, end: clamped.end };
			})
			.filter((x): x is { app: Appointment; start: Date; end: Date } => x !== null)
			.sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());

		const clusters: Array<Array<{ app: Appointment; start: Date; end: Date }>> = [];
		let cluster: Array<{ app: Appointment; start: Date; end: Date }> = [];
		let clusterEnd = -Infinity;

		for (const ev of segments) {
			const s = ev.start.getTime();
			if (cluster.length === 0 || s < clusterEnd) {
				cluster.push(ev);
				clusterEnd = Math.max(clusterEnd, ev.end.getTime());
			} else {
				clusters.push(cluster);
				cluster = [ev];
				clusterEnd = ev.end.getTime();
			}
		}
		if (cluster.length) clusters.push(cluster);

		const out: DayLayoutItem[] = [];
		for (const group of clusters) {
			const active: Array<{ end: number; col: number }> = [];
			let maxCols = 1;
			const items: DayLayoutItem[] = [];

			for (const ev of group) {
				const startMs = ev.start.getTime();
				for (let i = active.length - 1; i >= 0; i--) {
					if (active[i].end <= startMs) active.splice(i, 1);
				}

				let col = 0;
				while (active.some((a) => a.col === col)) col++;

				active.push({ end: ev.end.getTime(), col });
				maxCols = Math.max(maxCols, col + 1);
				items.push({ app: ev.app, start: ev.start, end: ev.end, col, cols: 1 });
			}

			for (const item of items) item.cols = maxCols;
			out.push(...items);
		}

		return out;
	};

	const weekDayLayouts = $derived.by(() => {
		const map = new Map<string, DayLayoutItem[]>();
		for (const day of weekDays) {
			map.set(day.toISOString(), buildDayLayout(day, weekAppointments));
		}
		return map;
	});

	const dayLayout = $derived.by(() => buildDayLayout(viewDate, dayAppointments));

	const headerTitle = $derived.by(() => {
		if (view === 'month') return `${months[currentMonth]} ${currentYear}`;
		if (view === 'day') {
			return viewDate.toLocaleDateString(undefined, {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			});
		}
		const start = view === 'week' ? weekStart : agendaRangeStart;
		const end = addDays(start, 6);
		const sameYear = start.getFullYear() === end.getFullYear();
		const startStr = start.toLocaleDateString(
			undefined,
			sameYear
				? { month: 'short', day: 'numeric' }
				: { month: 'short', day: 'numeric', year: 'numeric' }
		);
		const endStr = end.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
		return `${startStr} – ${endStr}`;
	});

	const next = () => {
		if (view === 'month') viewDate = new Date(currentYear, currentMonth + 1, 1);
		else if (view === 'week') viewDate = addDays(viewDate, 7);
		else if (view === 'day') viewDate = addDays(viewDate, 1);
		else viewDate = addDays(viewDate, 7);
	};

	const prev = () => {
		if (view === 'month') viewDate = new Date(currentYear, currentMonth - 1, 1);
		else if (view === 'week') viewDate = addDays(viewDate, -7);
		else if (view === 'day') viewDate = addDays(viewDate, -1);
		else viewDate = addDays(viewDate, -7);
	};

	const goToday = () => {
		viewDate = new Date();
	};

	const getTypeColor = (type: Appointment['type']) => {
		switch (type) {
			case 'consultation':
				return 'bg-blue-500/10 text-blue-700 border-blue-200';
			case 'intake':
				return 'bg-teal-500/10 text-teal-700 border-teal-200';
			case 'evaluation':
				return 'bg-orange-500/10 text-orange-700 border-orange-200';
			case 'treatment':
				return 'bg-purple-500/10 text-purple-700 border-purple-200';
			default:
				return 'bg-gray-500/10 text-gray-700 border-gray-200';
		}
	};

	const formatTime = (value: string | Date) => {
		const d = typeof value === 'string' ? new Date(value) : value;
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
	};
</script>

<div class="flex flex-col gap-6">
	<!-- Calendar Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<h2 class="text-3xl font-bold tracking-tighter text-text">{headerTitle}</h2>
			<div class="flex items-center rounded-xl border border-border bg-surface p-1 shadow-sm">
				<button onclick={prev} class="rounded-lg p-2 transition-colors hover:bg-border/20">
					<ChevronLeft class="h-5 w-5" />
				</button>
				<button
					onclick={goToday}
					class="rounded-lg px-3 py-1 text-sm font-semibold transition-colors hover:bg-border/20"
				>
					Today
				</button>
				<button onclick={next} class="rounded-lg p-2 transition-colors hover:bg-border/20">
					<ChevronRight class="h-5 w-5" />
				</button>
			</div>

			<div class="sm:hidden">
				<label class="sr-only" for="calendar-view">View</label>
				<select
					id="calendar-view"
					bind:value={view}
					class="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-bold text-text outline-hidden transition-all focus:ring-2 focus:ring-brand/20"
				>
					<option value="month">Month</option>
					<option value="week">Week</option>
					<option value="day">Day</option>
					<option value="agenda">Agenda</option>
				</select>
			</div>

			<div
				class="hidden items-center rounded-xl border border-border bg-surface p-1 shadow-sm sm:flex"
			>
				<button
					onclick={() => (view = 'month')}
					class="rounded-lg px-3 py-1.5 text-sm font-bold transition-colors hover:bg-border/20 {view ===
					'month'
						? 'bg-border/30 text-text'
						: 'text-text-muted'}"
				>
					Month
				</button>
				<button
					onclick={() => (view = 'week')}
					class="rounded-lg px-3 py-1.5 text-sm font-bold transition-colors hover:bg-border/20 {view ===
					'week'
						? 'bg-border/30 text-text'
						: 'text-text-muted'}"
				>
					Week
				</button>
				<button
					onclick={() => (view = 'day')}
					class="rounded-lg px-3 py-1.5 text-sm font-bold transition-colors hover:bg-border/20 {view ===
					'day'
						? 'bg-border/30 text-text'
						: 'text-text-muted'}"
				>
					Day
				</button>
				<button
					onclick={() => (view = 'agenda')}
					class="rounded-lg px-3 py-1.5 text-sm font-bold transition-colors hover:bg-border/20 {view ===
					'agenda'
						? 'bg-border/30 text-text'
						: 'text-text-muted'}"
				>
					Agenda
				</button>
			</div>
		</div>

		<Button variant="primary" onclick={() => onAddAppointment?.(new Date())}>
			<Plus class="mr-2 h-4 w-4" />
			Add Appointment
		</Button>
	</div>

	{#if view === 'month'}
		<!-- Month View -->
		<div class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
			<div class="grid grid-cols-7 border-b border-border bg-zinc-50/50">
				{#each daysOfWeek as day}
					<div
						class="px-4 py-3 text-center text-[10px] font-bold tracking-widest text-text-subtle uppercase"
					>
						{day}
					</div>
				{/each}
			</div>

			<div class="grid h-[700px] grid-cols-7 grid-rows-6">
				{#each monthCells as { date, isCurrentMonth } (date.toISOString())}
					{@const dayApps = getAppointmentsForDate(date)}
					<div
						class="group relative border-r border-b border-border/50 p-2 transition-colors last:border-r-0 hover:bg-zinc-50/30
							{!isCurrentMonth ? 'bg-zinc-50/50 text-text-subtle/50' : 'text-text'}"
					>
						<div class="mb-1 flex items-start justify-between">
							<button
								type="button"
								onclick={() => {
									viewDate = new Date(date);
								}}
								class="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors hover:bg-border/30
									{isToday(date) ? 'bg-teal-500 text-white hover:opacity-90' : ''}"
							>
								{date.getDate()}
							</button>

							<button
								onclick={() => onAddAppointment?.(new Date(date))}
								class="rounded-lg p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-border/40"
								aria-label={`Add appointment ${date.toDateString()}`}
							>
								<Plus class="h-4 w-4 text-text-muted" />
							</button>
						</div>

						<div class="flex flex-col gap-1">
							{#if dayApps.length > 0}
								{@const first = dayApps[0]}
								<button
									onclick={() => onEditAppointment?.(first)}
									class="flex flex-col items-start rounded-lg border px-2 py-1.5 text-left text-[10px] leading-tight transition-all hover:shadow-sm {getTypeColor(
										first.type
									)}"
								>
									<span class="w-full truncate font-bold">{first.title}</span>
									<span class="opacity-80">{formatTime(first.start)}</span>
								</button>
							{/if}

							{#if dayApps.length > 1}
								<button
									type="button"
									onclick={() => {
										viewDate = new Date(date);
										view = 'day';
									}}
									class="rounded-lg px-2 py-1 text-left text-[10px] font-bold text-text-muted hover:bg-border/30"
								>
									+{dayApps.length - 1} more
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if view === 'week'}
		<!-- Week View -->
		<div class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
			<div class="grid grid-cols-[96px_repeat(7,1fr)] border-b border-border bg-zinc-50/50">
				<div class="px-4 py-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					Time
				</div>
				{#each weekDays as d (d.toISOString())}
					<div class="px-4 py-3">
						<div class="flex items-baseline justify-between">
							<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
								{d.toLocaleDateString(undefined, { weekday: 'short' })}
							</div>
							<div class="text-sm font-bold text-text {isToday(d) ? 'text-teal-700' : ''}">
								{d.getDate()}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="max-h-[720px] overflow-y-auto" bind:this={weekScrollEl}>
				<div class="grid grid-cols-[96px_repeat(7,1fr)]">
					<!-- Time labels -->
					<div class="border-r border-border/50 bg-zinc-50/30">
						{#each slots as s (s.index)}
							<div
								class="h-10 border-b border-border/50 px-4 py-2 text-xs font-semibold text-text-muted"
							>
								{s.label}
							</div>
						{/each}
					</div>

					<!-- Day columns -->
					{#each weekDays as day (day.toISOString())}
						{@const items = weekDayLayouts.get(day.toISOString()) ?? []}
						<div class="relative border-r border-border/50 last:border-r-0">
							<!-- Clickable slots -->
							{#each slots as s (s.index)}
								<button
									type="button"
									onclick={() => onAddAppointment?.(slotDateTime(day, s.minutesFromStart))}
									class="group block h-10 w-full border-b border-border/50 text-left transition-colors hover:bg-zinc-50/30"
									aria-label={`Add appointment ${day.toDateString()} ${s.time}`}
								></button>
							{/each}

							<!-- Appointment blocks (overlap-aware) -->
							<div class="pointer-events-none absolute inset-0">
								{#each items as item (item.app.id + '-' + item.start.toISOString())}
									{@const pos = blockPosition(item.start, item.end, day, WEEK_SLOT_HEIGHT_PX)}
									{@const left = (item.col / item.cols) * 100}
									{@const width = 100 / item.cols}
									<button
										type="button"
										onclick={() => onEditAppointment?.(item.app)}
										class="pointer-events-auto absolute rounded-xl border px-2 py-1 text-left text-[11px] leading-tight shadow-sm backdrop-blur-sm transition hover:shadow-md {getTypeColor(
											item.app.type
										)}"
										style={`top:${pos.top + 2}px;height:${pos.height - 4}px;left:calc(${left}% + 4px);width:calc(${width}% - 8px);`}
									>
										<div class="min-w-0">
											<div class="truncate font-bold">{item.app.title}</div>
											{#if pos.height >= 52}
												<div class="mt-0.5 truncate text-[10px] font-semibold opacity-80">
													{formatTime(item.start)}–{formatTime(item.end)}
												</div>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else if view === 'day'}
		<!-- Day View -->
		<div class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
			<div class="grid grid-cols-[96px_1fr] border-b border-border bg-zinc-50/50">
				<div class="px-4 py-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					Time
				</div>
				<div class="px-4 py-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{viewDate.toLocaleDateString(undefined, {
						weekday: 'long',
						month: 'short',
						day: 'numeric'
					})}
				</div>
			</div>
			<div class="max-h-[720px] overflow-y-auto" bind:this={dayScrollEl}>
				<div class="grid grid-cols-[96px_1fr]">
					<div class="border-r border-border/50 bg-zinc-50/30">
						{#each slots as s (s.index)}
							<div
								class="h-12 border-b border-border/50 px-4 py-3 text-xs font-semibold text-text-muted"
							>
								{s.label}
							</div>
						{/each}
					</div>
					<div class="relative">
						{#each slots as s (s.index)}
							<button
								type="button"
								onclick={() => onAddAppointment?.(slotDateTime(viewDate, s.minutesFromStart))}
								class="block h-12 w-full border-b border-border/50 text-left transition-colors hover:bg-zinc-50/30"
								aria-label={`Add appointment ${viewDate.toDateString()} ${s.time}`}
							></button>
						{/each}

						<div class="pointer-events-none absolute inset-0">
							{#each dayLayout as item (item.app.id + '-' + item.start.toISOString())}
								{@const pos = blockPosition(item.start, item.end, viewDate, DAY_SLOT_HEIGHT_PX)}
								{@const left = (item.col / item.cols) * 100}
								{@const width = 100 / item.cols}
								<button
									type="button"
									onclick={() => onEditAppointment?.(item.app)}
									class="pointer-events-auto absolute rounded-2xl border px-3 py-2 text-left text-sm leading-tight shadow-sm transition hover:shadow-md {getTypeColor(
										item.app.type
									)}"
									style={`top:${pos.top + 6}px;height:${pos.height - 12}px;left:calc(${left}% + 8px);width:calc(${width}% - 16px);`}
								>
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<div class="truncate font-bold">{item.app.title}</div>
											<div class="mt-0.5 text-xs font-semibold opacity-80">
												{formatTime(item.start)}–{formatTime(item.end)}
											</div>
										</div>
										<div
											class="shrink-0 rounded-full bg-white/60 px-2 py-1 text-[10px] font-bold tracking-widest text-text uppercase"
										>
											{item.app.type}
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Agenda View -->
		<div class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
			<div class="border-b border-border bg-zinc-50/50 px-5 py-4">
				<div class="flex flex-col gap-1">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						Next 7 days
					</div>
					<div class="text-sm font-semibold text-text-muted">
						Showing {agendaAppointments.length} appointment{agendaAppointments.length === 1
							? ''
							: 's'}
					</div>
				</div>
			</div>

			<div class="divide-y divide-border">
				{#each weekDays as d (d.toISOString())}
					{@const dayApps = agendaAppointments.filter((a) => isSameDay(new Date(a.start), d))}
					<div class="px-5 py-4">
						<div class="mb-3 flex items-center justify-between">
							<div class="text-sm font-bold text-text">
								{d.toLocaleDateString(undefined, {
									weekday: 'long',
									month: 'short',
									day: 'numeric'
								})}
								{#if isToday(d)}
									<span
										class="ml-2 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-teal-700 uppercase"
									>
										Today
									</span>
								{/if}
							</div>
							<button
								type="button"
								onclick={() => onAddAppointment?.(new Date(d))}
								class="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text-muted transition hover:bg-border/30"
							>
								Add
							</button>
						</div>

						{#if dayApps.length === 0}
							<div class="text-sm text-text-muted">No appointments.</div>
						{:else}
							<div class="grid gap-2 md:grid-cols-2">
								{#each dayApps as app (app.id)}
									<button
										type="button"
										onclick={() => onEditAppointment?.(app)}
										class="flex items-start justify-between gap-3 rounded-2xl border p-3 text-left transition hover:shadow-sm {getTypeColor(
											app.type
										)}"
									>
										<div class="min-w-0">
											<div class="truncate font-bold text-text">{app.title}</div>
											<div class="mt-1 text-xs font-semibold text-text-muted">
												{formatTime(app.start)}
												–
												{formatTime(app.end)}
											</div>
										</div>
										<div
											class="shrink-0 rounded-full bg-white/60 px-2 py-1 text-[10px] font-bold tracking-widest text-text uppercase"
										>
											{app.type}
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.05);
		border-radius: 10px;
	}
	.custom-scrollbar:hover::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.1);
	}
</style>
