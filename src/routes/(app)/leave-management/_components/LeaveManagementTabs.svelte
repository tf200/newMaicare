<script lang="ts">
	import {
		CalendarPlus,
		Stethoscope,
		Baby,
		AlarmClock,
		List,
		Users,
		Euro,
		FileText
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	type TabId =
		| 'requestLeave'
		| 'sickLeave'
		| 'maternityLeave'
		| 'lateArrival'
		| 'overview'
		| 'balances'
		| 'payouts'
		| 'contractChanges';

	type Props = {
		activeTab: TabId;
		pendingCount: number;
		onTabChange: (tab: TabId) => void;
	};

	let { activeTab, pendingCount, onTabChange }: Props = $props();

	const actionTabs = [
		{ id: 'requestLeave', icon: CalendarPlus, label: m.leave_tab_request() },
		{ id: 'sickLeave', icon: Stethoscope, label: m.leave_tab_sick() },
		{ id: 'maternityLeave', icon: Baby, label: m.leave_tab_pregnancy() },
		{ id: 'lateArrival', icon: AlarmClock, label: m.leave_tab_late() }
	] as const;

	const viewTabs = [
		{ id: 'overview', icon: List, label: m.leave_tab_overview() },
		{ id: 'balances', icon: Users, label: m.leave_tab_balance() },
		{ id: 'payouts', icon: Euro, label: m.leave_tab_payout() },
		{ id: 'contractChanges', icon: FileText, label: m.leave_tab_contract() }
	] as const;
</script>

<div
	class="w-full rounded-[1.75rem] border border-zinc-200 bg-white p-2.5 shadow-sm sm:p-3 dark:border-zinc-800 dark:bg-zinc-900"
>
	<div class="scrollbar-hide flex flex-nowrap items-center gap-1 overflow-x-auto">
		{#each actionTabs as tab}
			<button
				onclick={() => onTabChange(tab.id)}
				class="relative flex flex-shrink-0 items-center justify-center gap-2.5 rounded-[1.2rem] px-4 py-3 text-sm font-bold transition-all
					{activeTab === tab.id
					? 'bg-zinc-100 text-zinc-900 shadow-inner dark:bg-zinc-800 dark:text-white'
					: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white'}"
			>
				<tab.icon
					class="h-4 w-4 {activeTab === tab.id ? 'text-teal-600 dark:text-teal-400' : ''}"
				/>
				<span class="whitespace-nowrap">{tab.label}</span>
				{#if activeTab === tab.id}
					<div
						class="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-teal-500/40 blur-sm"
					></div>
				{/if}
			</button>
		{/each}

		<div class="mx-1 h-8 w-px flex-shrink-0 bg-zinc-200 dark:bg-zinc-800"></div>

		{#each viewTabs as tab}
			<button
				onclick={() => onTabChange(tab.id)}
				class="relative flex flex-shrink-0 items-center justify-center gap-2.5 rounded-[1.2rem] px-4 py-3 text-sm font-bold transition-all
					{activeTab === tab.id
					? 'bg-zinc-100 text-zinc-900 shadow-inner dark:bg-zinc-800 dark:text-white'
					: 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white'}"
			>
				<tab.icon
					class="h-4 w-4 {activeTab === tab.id ? 'text-teal-600 dark:text-teal-400' : ''}"
				/>
				<span class="whitespace-nowrap">{tab.label}</span>

				{#if tab.id === 'overview' && pendingCount > 0}
					<span
						class="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-white shadow-lg shadow-orange-500/30"
					>
						{pendingCount}
					</span>
				{/if}

				{#if activeTab === tab.id}
					<div
						class="absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-teal-500/40 blur-sm"
					></div>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
