<script lang="ts">
	import { CheckCircle, Zap } from 'lucide-svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import EmployeeSearch from '$lib/components/forms/EmployeeSearch.svelte';
	import ScheduleCalendar from '$lib/components/forms/ScheduleCalendar.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { EmployeeListItem } from '$lib/api/employees';
	import type { CreateLeaveFormState, LeaveTypeOption } from './form-types';

	type Props = {
		form?: CreateLeaveFormState;
		selectedEmployee?: EmployeeListItem | null;
		leaveTypeOptions: LeaveTypeOption[];
		calculateDays: (startDate: string, endDate: string) => number;
		onSubmit: (event: Event) => void | Promise<void>;
	};

	let {
		form = $bindable<CreateLeaveFormState>(),
		selectedEmployee = $bindable<EmployeeListItem | null>(),
		leaveTypeOptions,
		calculateDays,
		onSubmit
	}: Props = $props();

	const totalDays = $derived.by(() => calculateDays(form.startDate, form.endDate));
</script>

<form
	class="grid gap-6 {selectedEmployee ? 'lg:grid-cols-[1.5fr_1fr]' : 'lg:grid-cols-[2fr_1fr]'}"
	onsubmit={onSubmit}
>
	<div class="space-y-5 border-b border-brand/10 pb-5">
		<EmployeeSearch
			labelText={m.leave_employee_select_label()}
			placeholder={m.leave_employee_search_placeholder()}
			bind:selectedId={form.employeeId}
			onSelect={(employee) => {
				selectedEmployee = employee;
			}}
		/>

		{#if selectedEmployee}
			<Select label={m.leave_type_label()} options={leaveTypeOptions} bind:value={form.type} />

			<div class="space-y-2">
				<div class="ml-1 text-xs font-semibold text-text-muted">
					{m.leave_date_range_label()}
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
					<DatePicker label={m.leave_date_from()} bind:value={form.startDate} compact />
					<DatePicker label={m.leave_date_to()} bind:value={form.endDate} compact />
				</div>
			</div>

			<Textarea
				label={m.leave_reason_label()}
				bind:value={form.reason}
				placeholder={m.leave_reason_placeholder()}
			/>

			<div
				class="flex items-center justify-between rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand"
			>
				<div class="flex items-center gap-2">
					<Zap class="h-4 w-4" />
					<span>{totalDays}{totalDays === 1 ? m.leave_day_singular() : m.leave_day_plural()}</span>
				</div>
				<span>{totalDays * 8}{m.leave_hours_short()}</span>
			</div>

			<Button type="submit" class="w-full gap-2 py-3">
				<CheckCircle class="h-4 w-4" />
				{m.leave_submit_request()}
			</Button>
		{:else}
			<div
				class="bg-surface-subtle/30 rounded-2xl border border-dashed border-border/50 px-4 py-8 text-center text-sm text-text-muted"
			>
				{m.leave_select_employee_prompt()}
			</div>
		{/if}
	</div>

	{#if selectedEmployee}
		<ScheduleCalendar
			{selectedEmployee}
			bind:selectedStartDate={form.startDate}
			bind:selectedEndDate={form.endDate}
			onDateRangeSelect={(startDate, endDate) => {
				form.startDate = startDate;
				form.endDate = endDate;
			}}
		/>
	{:else}
		<div class="space-y-4">
			<h3 class="text-sm font-semibold text-text">{m.leave_guidelines_title()}</h3>
			<ul class="space-y-3 text-sm text-text-muted">
				<li class="flex gap-2">
					<span class="font-bold text-brand">•</span>
					<span>{m.leave_guideline_1()}</span>
				</li>
				<li class="flex gap-2">
					<span class="font-bold text-brand">•</span>
					<span>{m.leave_guideline_2()}</span>
				</li>
				<li class="flex gap-2">
					<span class="font-bold text-brand">•</span>
					<span>{m.leave_guideline_3()}</span>
				</li>
			</ul>
		</div>
	{/if}
</form>
