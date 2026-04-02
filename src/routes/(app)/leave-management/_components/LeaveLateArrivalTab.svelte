<script lang="ts">
	import { AlarmClock, CheckCircle } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import EmployeeSearch from '$lib/components/forms/EmployeeSearch.svelte';
	import ScheduleCalendar from '$lib/components/forms/ScheduleCalendar.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { EmployeeListItem } from '$lib/api/employees';
	import type { LateArrivalFormState, LocalLateArrivalItem } from './form-types';

	type Props = {
		form?: LateArrivalFormState;
		selectedEmployee?: EmployeeListItem | null;
		calendarStart?: string | null;
		calendarEnd?: string | null;
		lateArrivals: LocalLateArrivalItem[];
		formatDate: (dateText: string) => string;
		isSubmitting?: boolean;
		onSubmit: (event: Event) => void | Promise<void>;
	};

	let {
		form = $bindable<LateArrivalFormState>(),
		selectedEmployee = $bindable<EmployeeListItem | null>(),
		calendarStart = $bindable<string | null>(),
		calendarEnd = $bindable<string | null>(),
		lateArrivals,
		formatDate,
		isSubmitting = false,
		onSubmit
	}: Props = $props();
</script>

<div class="animate-in fade-in slide-in-from-bottom-2 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
	<form class="space-y-5 border-b border-warning/10 pb-5" onsubmit={onSubmit}>
		<div class="grid gap-4 sm:grid-cols-2">
			<EmployeeSearch
				labelText={m.employee()}
				placeholder={m.leave_employee_search_placeholder()}
				bind:selectedId={form.employeeId}
				onSelect={(employee) => {
					selectedEmployee = employee;
					form.employeeId = employee?.id ?? '';
				}}
			/>
			<DatePicker label={m.sick_date_label()} bind:value={form.date} />
		</div>

		<p class="text-xs font-semibold text-text-muted">{m.late_arrival_time_label()}</p>
		<Input label={m.late_arrival_time_label()} type="time" bind:value={form.time} />

		{#if form.time}
			<div
				class="flex items-center gap-2 rounded-xl border border-warning/15 bg-warning/5 px-3 py-2 text-xs font-semibold text-warning"
			>
				<AlarmClock class="h-3.5 w-3.5" />
				<span>{m.late_arrival_summary({ time: form.time })}</span>
			</div>
		{/if}

		<Textarea
			label={m.late_reason_label()}
			bind:value={form.reason}
			placeholder={m.late_reason_placeholder()}
		/>

		<Button
			type="submit"
			isLoading={isSubmitting}
			class="w-full gap-2 bg-warning py-3 text-white hover:bg-warning/90"
		>
			<CheckCircle class="h-4 w-4" />
			{m.late_add()}
		</Button>
	</form>

	{#if selectedEmployee}
		<div class="animate-in fade-in slide-in-from-top-2">
			<ScheduleCalendar
				{selectedEmployee}
				bind:selectedStartDate={calendarStart}
				bind:selectedEndDate={calendarEnd}
				onDateRangeSelect={(startDate) => {
					form.date = startDate;
					calendarStart = startDate;
					calendarEnd = startDate;
				}}
			/>
		</div>
	{:else}
		<div class="animate-in fade-in slide-in-from-top-2 space-y-4">
			<p class="text-sm font-semibold text-text">{m.late_recent_title()}</p>
			<div class="space-y-2">
				{#each lateArrivals as item (item.id)}
					<div
						class="bg-surface-subtle/40 flex items-start justify-between gap-3 rounded-2xl border border-border/50 px-4 py-3 text-sm"
					>
						<div>
							<p class="font-semibold text-text">{item.employeeName}</p>
							{#if item.reason}
								<p class="mt-0.5 text-xs text-text-muted">{item.reason}</p>
							{/if}
						</div>
						<span
							class="shrink-0 rounded-lg border border-warning/20 bg-warning/5 px-2 py-0.5 text-[10px] font-semibold text-warning"
						>
							{formatDate(item.date)}
							{item.time}
						</span>
					</div>
				{/each}
				{#if lateArrivals.length === 0}
					<div
						class="bg-surface-subtle/30 rounded-2xl border border-dashed border-border/40 p-4 text-center text-xs text-text-muted"
					>
						{m.late_empty()}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
