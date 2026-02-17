<script lang="ts">
	import Select from './Select.svelte';
	import Input from './Input.svelte';
	import Toggle from './Toggle.svelte';

	interface Props {
		rrule: string | undefined;
		onChange: (rrule: string | undefined) => void;
	}

	let { rrule = $bindable(undefined), onChange }: Props = $props();

	// Parse existing RRULE or use defaults
	function parseRRule(rule: string | undefined) {
		if (!rule) return null;
		const parts: Record<string, string> = {};
		rule.split(';').forEach((part) => {
			const [key, value] = part.split('=');
			if (key && value) parts[key] = value;
		});
		return parts;
	}

	let parsed = $derived(parseRRule(rrule));

	// RRULE state
	let isRecurring = $state(!!rrule);
	let freq = $state(parsed?.FREQ || 'WEEKLY');
	let interval = $state(parseInt(parsed?.INTERVAL || '1', 10));
	let byDay = $state(parsed?.BYDAY?.split(',') || ['MO']);
	let until = $state(parsed?.UNTIL || '');
	let count = $state(parseInt(parsed?.COUNT || '0', 10));
	let endType = $state(parsed?.UNTIL ? 'until' : parsed?.COUNT ? 'count' : 'never');

	const freqOptions = [
		{ label: 'Daily', value: 'DAILY' },
		{ label: 'Weekly', value: 'WEEKLY' },
		{ label: 'Monthly', value: 'MONTHLY' }
	];

	const dayOptions = [
		{ label: 'Mon', value: 'MO' },
		{ label: 'Tue', value: 'TU' },
		{ label: 'Wed', value: 'WE' },
		{ label: 'Thu', value: 'TH' },
		{ label: 'Fri', value: 'FR' },
		{ label: 'Sat', value: 'SA' },
		{ label: 'Sun', value: 'SU' }
	];

	function buildRRule(): string | undefined {
		if (!isRecurring) return undefined;

		const parts: string[] = [`FREQ=${freq}`];

		if (interval > 1) {
			parts.push(`INTERVAL=${interval}`);
		}

		if (freq === 'WEEKLY' && byDay.length > 0) {
			parts.push(`BYDAY=${byDay.join(',')}`);
		}

		if (endType === 'until' && until) {
			// Convert to RFC5545 format (YYYYMMDDTHHMMSSZ)
			const date = new Date(until);
			const formatted = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
			parts.push(`UNTIL=${formatted}`);
		} else if (endType === 'count' && count > 0) {
			parts.push(`COUNT=${count}`);
		}

		return parts.join(';');
	}

	function toggleDay(day: string) {
		if (byDay.includes(day)) {
			byDay = byDay.filter((d) => d !== day);
		} else {
			byDay = [...byDay, day];
		}
	}

	// Update rrule when any state changes
	$effect(() => {
		const newRRule = buildRRule();
		if (newRRule !== rrule) {
			rrule = newRRule;
			onChange(newRRule);
		}
	});
</script>

<div class="space-y-4 rounded-xl border border-border bg-surface p-4">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="font-semibold text-text">Recurring Event</h3>
			<p class="text-sm text-text-muted">Set up a repeating schedule</p>
		</div>
		<Toggle bind:checked={isRecurring} label="" description="" />
	</div>

	{#if isRecurring}
		<div class="space-y-4 border-t border-border pt-4">
			<div class="grid grid-cols-2 gap-4">
				<Select label="Frequency" options={freqOptions} bind:value={freq} />
				<Input label="Repeat every" type="number" min={1} bind:value={interval} placeholder="1" />
			</div>

			{#if freq === 'WEEKLY'}
				<div>
					<label class="mb-2 block text-sm font-semibold text-text-muted">Repeat on</label>
					<div class="flex flex-wrap gap-2">
						{#each dayOptions as day}
							<button
								type="button"
								onclick={() => toggleDay(day.value)}
								class="h-10 w-10 rounded-lg text-sm font-semibold transition-colors {byDay.includes(
									day.value
								)
									? 'bg-brand text-white'
									: 'border border-border bg-surface text-text-muted hover:bg-border/30'}"
							>
								{day.label}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<div>
				<label class="mb-2 block text-sm font-semibold text-text-muted">End</label>
				<div class="flex flex-col gap-3">
					<label class="flex items-center gap-2">
						<input
							type="radio"
							name="endType"
							value="never"
							bind:group={endType}
							class="h-4 w-4 accent-brand"
						/>
						<span class="text-sm text-text">Never</span>
					</label>
					<label class="flex items-center gap-2">
						<input
							type="radio"
							name="endType"
							value="until"
							bind:group={endType}
							class="h-4 w-4 accent-brand"
						/>
						<span class="text-sm text-text">On date</span>
					</label>
					{#if endType === 'until'}
						<Input type="datetime-local" bind:value={until} class="ml-6" />
					{/if}
					<label class="flex items-center gap-2">
						<input
							type="radio"
							name="endType"
							value="count"
							bind:group={endType}
							class="h-4 w-4 accent-brand"
						/>
						<span class="text-sm text-text">After</span>
						{#if endType === 'count'}
							<Input type="number" min={1} bind:value={count} class="ml-2 w-20" />
						{/if}
						<span class="text-sm text-text">occurrences</span>
					</label>
				</div>
			</div>
		</div>
	{/if}
</div>
