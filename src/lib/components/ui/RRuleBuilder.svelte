<script lang="ts">
	import Select from './Select.svelte';
	import Input from './Input.svelte';
	import Toggle from './Toggle.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

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

	const initialParsed = parseRRule(rrule);

	// RRULE state
	let isRecurring = $state(!!rrule);
	let freq = $state(initialParsed?.FREQ || 'WEEKLY');
	let interval = $state(parseInt(initialParsed?.INTERVAL || '1', 10));
	let byDay = $state(initialParsed?.BYDAY?.split(',') || ['MO']);
	let until = $state(initialParsed?.UNTIL || '');
	let count = $state(parseInt(initialParsed?.COUNT || '0', 10));
	let endType = $state(initialParsed?.UNTIL ? 'until' : initialParsed?.COUNT ? 'count' : 'never');

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');
	const addDays = (date: Date, amount: number) => {
		const next = new Date(date);
		next.setDate(next.getDate() + amount);
		return next;
	};

	const freqOptions = $derived.by(() => [
		{ label: m.daily(), value: 'DAILY' },
		{ label: m.weekly(), value: 'WEEKLY' },
		{ label: m.monthly(), value: 'MONTHLY' }
	]);

	const dayOptions = $derived.by(() => {
		const formatter = new Intl.DateTimeFormat(resolveLocale(), { weekday: 'short' });
		const base = new Date(Date.UTC(2023, 0, 2));
		const values = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
		return values.map((value, index) => ({
			label: formatter.format(addDays(base, index)),
			value
		}));
	});

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
			<h3 class="font-semibold text-text">{m.recurring_event()}</h3>
			<p class="text-sm text-text-muted">{m.repeating_schedule_description()}</p>
		</div>
		<Toggle bind:checked={isRecurring} label="" description="" />
	</div>

	{#if isRecurring}
		<div class="space-y-4 border-t border-border pt-4">
			<div class="grid grid-cols-2 gap-4">
				<Select label={m.frequency()} options={freqOptions} bind:value={freq} />
				<Input
					label={m.repeat_every()}
					type="number"
					min={1}
					bind:value={interval}
					placeholder="1"
				/>
			</div>

			{#if freq === 'WEEKLY'}
				<div>
					<p class="mb-2 block text-sm font-semibold text-text-muted">{m.repeat_on()}</p>
					<div class="flex flex-wrap gap-2">
						{#each dayOptions as day (day.value)}
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
				<p class="mb-2 block text-sm font-semibold text-text-muted">{m.end()}</p>
				<div class="flex flex-col gap-3">
					<label class="flex items-center gap-2">
						<input
							type="radio"
							name="endType"
							value="never"
							bind:group={endType}
							class="h-4 w-4 accent-brand"
						/>
						<span class="text-sm text-text">{m.never()}</span>
					</label>
					<label class="flex items-center gap-2">
						<input
							type="radio"
							name="endType"
							value="until"
							bind:group={endType}
							class="h-4 w-4 accent-brand"
						/>
						<span class="text-sm text-text">{m.on_date()}</span>
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
						<span class="text-sm text-text">{m.after()}</span>
						{#if endType === 'count'}
							<Input type="number" min={1} bind:value={count} class="ml-2 w-20" />
						{/if}
						<span class="text-sm text-text">{m.occurrences()}</span>
					</label>
				</div>
			</div>
		</div>
	{/if}
</div>
