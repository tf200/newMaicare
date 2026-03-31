<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { GraduationCap, CheckCircle2, XCircle, AlertTriangle } from 'lucide-svelte';

	interface Props {
		total: number;
		completed: number;
		expired: number;
		expiringSoon: number;
	}

	let { total, completed, expired, expiringSoon }: Props = $props();
</script>

<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
	{#each [
		{ label: m.train_total(), value: String(total), color: 'from-indigo-500/12 to-indigo-500/3', valColor: 'text-indigo-700 dark:text-indigo-300', icon: GraduationCap },
		{ label: m.train_completed(), value: String(completed), color: 'from-emerald-500/12 to-emerald-500/3', valColor: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle2 },
		{ label: m.train_expired(), value: String(expired), color: 'from-rose-500/12 to-rose-500/3', valColor: 'text-rose-700 dark:text-rose-300', icon: XCircle },
		{ label: m.train_expiring_soon(), value: String(expiringSoon), color: 'from-amber-500/12 to-amber-500/3', valColor: 'text-amber-700 dark:text-amber-300', icon: AlertTriangle }
	] as stat, i}
		<div class="relative overflow-hidden rounded-2xl border border-border/80 bg-surface" style="animation: fade-in 400ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: {i * 80}ms">
			<div class="absolute inset-0 bg-gradient-to-br {stat.color}"></div>
			<div class="relative flex items-center gap-4 p-5">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl {stat.valColor} bg-surface/60 shadow-sm">
					<stat.icon class="h-4 w-4" />
				</div>
				<div>
					<div class="text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">{stat.label}</div>
					<div class="mt-0.5 text-[22px] leading-none font-extrabold tracking-tight tabular-nums {stat.valColor}">{stat.value}</div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
