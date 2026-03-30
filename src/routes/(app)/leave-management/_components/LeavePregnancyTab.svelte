<script lang="ts">
	import { Baby, CheckCircle } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import EmployeeSearch from '$lib/components/forms/EmployeeSearch.svelte';
	import ScheduleCalendar from '$lib/components/forms/ScheduleCalendar.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { EmployeeListItem } from '$lib/api/employees';
	import type { DateRangeRequestFormState } from './form-types';

	type Props = {
		form?: DateRangeRequestFormState;
		selectedEmployee?: EmployeeListItem | null;
		calculateDays: (startDate: string, endDate: string) => number;
		onSubmit: (event: Event) => void | Promise<void>;
	};

	let {
		form = $bindable<DateRangeRequestFormState>(),
		selectedEmployee = $bindable<EmployeeListItem | null>(),
		calculateDays,
		onSubmit
	}: Props = $props();

	const totalDays = $derived.by(() => calculateDays(form.startDate, form.endDate));
</script>

<form
	class="animate-in fade-in slide-in-from-bottom-2 grid gap-6 lg:grid-cols-[1.5fr_1fr]"
	onsubmit={onSubmit}
>
	<div class="space-y-5 border-b border-pink-200/40 pb-5">
		<EmployeeSearch
			labelText={m.employee()}
			placeholder={m.leave_employee_search_placeholder()}
			bind:selectedId={form.employeeId}
			onSelect={(employee) => {
				selectedEmployee = employee;
				form.employeeId = employee?.id ?? '';
			}}
		/>
		<p class="text-xs font-semibold text-text-muted">{m.leave_date_range_label()}</p>
		<div class="grid gap-3 sm:grid-cols-2">
			<DatePicker label={m.pregnancy_start_label()} bind:value={form.startDate} compact />
			<DatePicker label={m.pregnancy_end_label()} bind:value={form.endDate} compact />
		</div>
		{#if form.startDate && form.endDate}
			<div
				class="flex items-center justify-between rounded-xl border border-pink-200/60 bg-pink-50/60 px-3 py-2 text-xs font-semibold text-pink-700 dark:border-pink-900/20 dark:bg-pink-900/10 dark:text-pink-400"
			>
				<span class="flex items-center gap-1.5">
					<Baby class="h-3.5 w-3.5" />
					{m.leave_date_range_label()}
				</span>
				<span>{totalDays}{totalDays === 1 ? m.leave_day_singular() : m.leave_day_plural()}</span>
			</div>
		{/if}
		<Textarea
			label={m.pregnancy_notes_label()}
			bind:value={form.reason}
			placeholder={m.pregnancy_notes_placeholder()}
		/>
		<Button type="submit" class="w-full gap-2 bg-pink-600 py-3 text-white hover:bg-pink-600/90">
			<CheckCircle class="h-4 w-4" />
			{m.pregnancy_save()}
		</Button>
	</div>

	{#if selectedEmployee}
		<div class="animate-in fade-in slide-in-from-top-2">
			<ScheduleCalendar
				{selectedEmployee}
				bind:selectedStartDate={form.startDate}
				bind:selectedEndDate={form.endDate}
				onDateRangeSelect={(startDate, endDate) => {
					form.startDate = startDate;
					form.endDate = endDate;
				}}
			/>
		</div>
	{:else}
		<div class="animate-in fade-in slide-in-from-top-2 space-y-4">
			<p class="text-sm font-semibold text-text">{m.pregnancy_tip_title()}</p>
			<p class="text-sm text-text-muted">{m.pregnancy_tip_body()}</p>
			<div
				class="rounded-xl border border-pink-200/60 bg-pink-50/60 p-4 dark:border-pink-900/20 dark:bg-pink-900/10"
			>
				<p class="text-xs font-semibold text-pink-700 dark:text-pink-300">
					{m.pregnancy_law_title()}
				</p>
				<p class="mt-1 text-xs text-text-muted">{m.pregnancy_law_body()}</p>
			</div>
		</div>
	{/if}
</form>
