<script lang="ts">
	import type { SecurityPolicy } from '../types';
	import { ShieldAlert, ShieldCheck, History, KeyRound, Clock } from 'lucide-svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { security }: { security: SecurityPolicy } = $props();

	const cardClass =
		'group relative overflow-hidden rounded-3xl border border-border/50 bg-glass-surface p-6 shadow-sm backdrop-blur-xl transition-all duration-300';
	const bentoCardClass =
		'flex flex-col gap-4 rounded-3xl border border-border/40 bg-white/40 p-5 dark:bg-zinc-900/40';
</script>

<div class="space-y-8">
	<div class="grid gap-6 md:grid-cols-2">
		<section class={cardClass}>
			<div class="mb-6 flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
					<ShieldCheck class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-text">Access Control</h3>
					<p class="text-sm text-text-muted">Manage global security and access policies.</p>
				</div>
			</div>

			<div class="space-y-6">
				<div class="rounded-2xl border border-border/50 bg-surface/50 p-4">
					<Toggle
						label="Require 2FA"
						description="Force all users to enable two-factor authentication."
						bind:checked={security.requireTwoFactor}
					/>
				</div>

				<div class="space-y-4">
					<Input
						label="Session Timeout (minutes)"
						type="number"
						bind:value={security.sessionTimeoutMinutes}
					/>
					<Input
						label="Audit Log Retention (days)"
						type="number"
						bind:value={security.auditLogRetentionDays}
					/>
				</div>
			</div>
		</section>

		<section class={cardClass}>
			<div class="mb-6 flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600"
				>
					<KeyRound class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-text">Password Policy</h3>
					<p class="text-sm text-text-muted">Define complexity requirements for user passwords.</p>
				</div>
			</div>

			<div class="space-y-6">
				<Input
					label="Minimum Length"
					type="number"
					bind:value={security.passwordComplexity.minLength}
				/>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class={bentoCardClass}>
						<Toggle
							label="Numbers"
							description="Require at least one number."
							bind:checked={security.passwordComplexity.requireNumbers}
						/>
					</div>
					<div class={bentoCardClass}>
						<Toggle
							label="Symbols"
							description="Require at least one symbol."
							bind:checked={security.passwordComplexity.requireSymbols}
						/>
					</div>
					<div class={bentoCardClass}>
						<Toggle
							label="Uppercase"
							description="Require at least one uppercase letter."
							bind:checked={security.passwordComplexity.requireUppercase}
						/>
					</div>
					<div class={bentoCardClass}>
						<div class="flex items-center gap-2 text-amber-600">
							<ShieldAlert class="h-4 w-4" />
							<span class="text-xs font-bold">Recommended</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
