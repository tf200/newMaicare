<script lang="ts">
	import { Calendar } from 'lucide-svelte';
	import Select from './Select.svelte';
	import type { SelectSize } from './_sizes';

	type Props = {
		value?: string;
		onchange?: (year: number | null) => void;
		startYear?: number;
		count?: number;
		label?: string;
		placeholder?: string;
		className?: string;
		size?: SelectSize;
	};

	let {
		value = $bindable(''),
		onchange,
		startYear = new Date().getFullYear(),
		count = 11,
		label,
		placeholder = 'Year',
		className = '',
		size = 'sm'
	}: Props = $props();

	const yearOptions = Array.from({ length: count }, (_, i) => {
		const y = startYear - i;
		return { label: String(y), value: String(y) };
	});

	function handleChange(val: string) {
		value = val;
		if (!val) {
			onchange?.(null);
			return;
		}
		const parsed = Number(val);
		onchange?.(Number.isInteger(parsed) ? parsed : null);
	}
</script>

<Select
	options={yearOptions}
	bind:value
	onchange={handleChange}
	{label}
	{placeholder}
	{size}
	{className}
>
	{#snippet prefix()}
		<Calendar class="mr-2 h-4 w-4 shrink-0 text-text-subtle" />
	{/snippet}
</Select>
