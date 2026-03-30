<script lang="ts">
	import {
		AlarmClock,
		Baby,
		CalendarPlus,
		List,
		Stethoscope,
		Users
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	type TabId = 'aanvragen' | 'ziekmelding' | 'zwangerschap' | 'telaat' | 'overzicht' | 'saldo';

	type Props = {
		activeTab: TabId;
		onTabChange: (tab: TabId) => void;
	};

	type MobileTab = {
		id: TabId;
		icon: typeof CalendarPlus;
		label: string;
	};

	let { activeTab, onTabChange }: Props = $props();

	const mobileTabs: MobileTab[] = [
		{ id: 'aanvragen', icon: CalendarPlus, label: m.leave_tab_request() },
		{ id: 'ziekmelding', icon: Stethoscope, label: m.leave_tab_sick() },
		{ id: 'zwangerschap', icon: Baby, label: m.leave_tab_pregnancy() },
		{ id: 'telaat', icon: AlarmClock, label: m.leave_tab_late() },
		{ id: 'overzicht', icon: List, label: m.leave_tab_overview() },
		{ id: 'saldo', icon: Users, label: m.leave_tab_balance() }
	];
</script>

<nav class="shrink-0 border-b border-border/60 lg:w-60 lg:border-r lg:border-b-0">
	<div class="flex gap-1 overflow-x-auto p-2 lg:hidden">
		{#each mobileTabs as tab (tab.id)}
			<button
				onclick={() => onTabChange(tab.id)}
				class="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all
					{activeTab === tab.id
					? 'bg-brand/10 text-brand shadow-sm'
					: 'hover:bg-surface-subtle text-text-muted hover:text-text'}"
			>
				<tab.icon class="h-3.5 w-3.5" />
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="hidden lg:block">
		<div class="p-3">
			<p class="mb-2 px-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.actions()}
			</p>
			<div class="space-y-0.5">
				<button
					onclick={() => onTabChange('aanvragen')}
					class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all
						{activeTab === 'aanvragen'
						? 'bg-brand/8 text-brand shadow-sm'
						: 'hover:bg-surface-subtle text-text-muted hover:text-text'}"
				>
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {activeTab ===
						'aanvragen'
							? 'bg-brand/15 text-brand'
							: 'bg-surface-subtle text-text-muted group-hover:text-brand'} transition-colors"
					>
						<CalendarPlus class="h-4 w-4" />
					</div>
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">{m.leave_tab_request()}</p>
						<p class="truncate text-[10px] text-text-subtle">{m.leave_new_request_subtitle()}</p>
					</div>
				</button>

				<button
					onclick={() => onTabChange('ziekmelding')}
					class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all
						{activeTab === 'ziekmelding'
						? 'bg-error/8 text-error shadow-sm'
						: 'hover:bg-surface-subtle text-text-muted hover:text-text'}"
				>
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {activeTab ===
						'ziekmelding'
							? 'bg-error/15 text-error'
							: 'bg-surface-subtle text-text-muted group-hover:text-error'} transition-colors"
					>
						<Stethoscope class="h-4 w-4" />
					</div>
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">{m.leave_tab_sick()}</p>
						<p class="truncate text-[10px] text-text-subtle">{m.sick_report_subtitle()}</p>
					</div>
				</button>

				<button
					onclick={() => onTabChange('zwangerschap')}
					class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all
						{activeTab === 'zwangerschap'
						? 'bg-pink-500/8 text-pink-600 shadow-sm dark:text-pink-400'
						: 'hover:bg-surface-subtle text-text-muted hover:text-text'}"
				>
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {activeTab ===
						'zwangerschap'
							? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
							: 'bg-surface-subtle text-text-muted group-hover:text-pink-500'} transition-colors"
					>
						<Baby class="h-4 w-4" />
					</div>
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">{m.leave_tab_pregnancy()}</p>
						<p class="truncate text-[10px] text-text-subtle">{m.pregnancy_subtitle()}</p>
					</div>
				</button>

				<button
					onclick={() => onTabChange('telaat')}
					class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all
						{activeTab === 'telaat'
						? 'bg-warning/8 text-warning shadow-sm'
						: 'hover:bg-surface-subtle text-text-muted hover:text-text'}"
				>
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg {activeTab ===
						'telaat'
							? 'bg-warning/15 text-warning'
							: 'bg-surface-subtle text-text-muted group-hover:text-warning'} transition-colors"
					>
						<AlarmClock class="h-4 w-4" />
					</div>
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">{m.leave_tab_late()}</p>
						<p class="truncate text-[10px] text-text-subtle">{m.late_subtitle()}</p>
					</div>
				</button>
			</div>
		</div>

		<div class="mx-3 border-t border-border/50"></div>

		<div class="p-3">
			<p class="mb-2 px-3 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.leave_nav_overviews()}
			</p>
			<div class="space-y-0.5">
				<button
					onclick={() => onTabChange('overzicht')}
					class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all
						{activeTab === 'overzicht'
						? 'bg-brand/8 text-brand shadow-sm'
						: 'hover:bg-surface-subtle text-text-muted hover:text-text'}"
				>
					<List class="h-4 w-4 shrink-0" />
					<span class="truncate text-sm font-medium">{m.leave_tab_overview()}</span>
				</button>

				<button
					onclick={() => onTabChange('saldo')}
					class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all
						{activeTab === 'saldo'
						? 'bg-brand/8 text-brand shadow-sm'
						: 'hover:bg-surface-subtle text-text-muted hover:text-text'}"
				>
					<Users class="h-4 w-4 shrink-0" />
					<span class="truncate text-sm font-medium">{m.leave_tab_balance()}</span>
				</button>
			</div>
		</div>
	</div>
</nav>
