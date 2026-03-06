<script lang="ts">
	import type { SecurityPolicy } from '../types';
	import {
		ShieldAlert,
		ShieldCheck,
		History,
		KeyRound,
		Clock,
		Edit2,
		Save,
		X,
		CheckCircle2
	} from 'lucide-svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { security = $bindable() }: { security: SecurityPolicy } = $props();

	let isEditing = $state(false);
	let isSaving = $state(false);
	let saveSuccess = $state(false);

	// Create a local copy for editing
	let editForm = $state<SecurityPolicy>(JSON.parse(JSON.stringify(security)));

	function startEditing() {
		editForm = JSON.parse(JSON.stringify(security));
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
	}

	async function handleSave() {
		isSaving = true;
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));
		security = JSON.parse(JSON.stringify(editForm));
		isSaving = false;
		saveSuccess = true;
		isEditing = false;
		setTimeout(() => (saveSuccess = false), 3000);
	}

	const cardClass =
		'group relative overflow-hidden rounded-3xl border border-border/50 bg-glass-surface p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-md hover:border-border';
	const bentoCardClass =
		'flex flex-col gap-4 rounded-3xl border border-border/40 bg-white/40 p-5 dark:bg-zinc-900/40';

	const labelClass = 'text-xs font-bold tracking-wider text-text-muted uppercase';
	const valueClass = 'text-base font-medium text-text mt-1';
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-text">Security & Privacy</h2>
			<p class="text-sm text-text-muted">
				Configure system-wide security policies and access controls.
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if saveSuccess}
				<div
					in:fade
					out:fade
					class="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600"
				>
					<CheckCircle2 class="h-3.5 w-3.5" />
					Security updated
				</div>
			{/if}

			{#if !isEditing}
				<div in:fade={{ duration: 200, delay: 200 }} out:fade={{ duration: 200 }}>
					<Button
						variant="ghost"
						onclick={startEditing}
						class="gap-2 rounded-xl border border-border/60 bg-surface/70 px-3 py-2 hover:border-brand/30 hover:bg-surface"
					>
						<Edit2 class="h-4 w-4" />
						Edit Policies
					</Button>
				</div>
			{:else}
				<div
					class="flex items-center gap-2"
					in:fade={{ duration: 200, delay: 200 }}
					out:fade={{ duration: 200 }}
				>
					<Button variant="ghost" onclick={cancelEditing} class="rounded-xl px-3 py-2">
						<X class="mr-2 h-4 w-4" />
						Cancel
					</Button>
					<Button onclick={handleSave} isLoading={isSaving} class="gap-2 rounded-xl px-6 py-2">
						<Save class="h-4 w-4" />
						Save Policies
					</Button>
				</div>
			{/if}
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<section class={cardClass}>
			<div class="mb-8 flex items-center gap-3">
				<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
					<ShieldCheck class="h-6 w-6" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-text">Access Control</h3>
					<p class="text-sm text-text-muted">Manage global security and access policies.</p>
				</div>
			</div>

			<div class="relative space-y-6">
				{#if isEditing}
					<div
						in:fly={{ y: 8, duration: 300, delay: 200, easing: cubicOut }}
						out:fade={{ duration: 200 }}
						class="space-y-6"
					>
						<div class="rounded-2xl border border-border/50 bg-surface/50 p-4">
							<Toggle
								label="Require 2FA"
								description="Force all users to enable two-factor authentication."
								bind:checked={editForm.requireTwoFactor}
							/>
						</div>

						<div class="space-y-4">
							<Input
								label="Session Timeout (minutes)"
								type="number"
								bind:value={editForm.sessionTimeoutMinutes}
							/>
							<Input
								label="Audit Log Retention (days)"
								type="number"
								bind:value={editForm.auditLogRetentionDays}
							/>
						</div>
					</div>
				{:else}
					<div
						in:fade={{ duration: 200, delay: 200 }}
						out:fade={{ duration: 200 }}
						class="space-y-6"
					>
						<div
							class="flex items-center justify-between rounded-2xl border border-border/50 bg-surface/30 p-4"
						>
							<div>
								<p class="font-bold text-text">Two-Factor Authentication</p>
								<p class="text-xs text-text-muted">Mandatory for all system users.</p>
							</div>
							<div class="flex items-center gap-2">
								<span
									class="text-xs font-bold uppercase {security.requireTwoFactor
										? 'text-emerald-600'
										: 'text-text-subtle'}"
								>
									{security.requireTwoFactor ? 'Enabled' : 'Disabled'}
								</span>
								<div
									class="h-2 w-2 rounded-full {security.requireTwoFactor
										? 'bg-emerald-500'
										: 'bg-text-subtle/30'}"
								></div>
							</div>
						</div>

						<div class="grid gap-6 sm:grid-cols-2">
							<div>
								<p class={labelClass}>Session Timeout</p>
								<p class={valueClass}>{security.sessionTimeoutMinutes} minutes</p>
							</div>
							<div>
								<p class={labelClass}>Audit Retention</p>
								<p class={valueClass}>{security.auditLogRetentionDays} days</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</section>

		<section class={cardClass}>
			<div class="mb-8 flex items-center gap-3">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600"
				>
					<KeyRound class="h-6 w-6" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-text">Password Policy</h3>
					<p class="text-sm text-text-muted">Define complexity requirements for user passwords.</p>
				</div>
			</div>

			<div class="relative space-y-6">
				{#if isEditing}
					<div
						in:fly={{ y: 8, duration: 300, delay: 200, easing: cubicOut }}
						out:fade={{ duration: 200 }}
						class="space-y-6"
					>
						<Input
							label="Minimum Length"
							type="number"
							bind:value={editForm.passwordComplexity.minLength}
						/>

						<div class="grid gap-4 sm:grid-cols-2">
							<div class={bentoCardClass}>
								<Toggle
									label="Numbers"
									description="Require at least one number."
									bind:checked={editForm.passwordComplexity.requireNumbers}
								/>
							</div>
							<div class={bentoCardClass}>
								<Toggle
									label="Symbols"
									description="Require at least one symbol."
									bind:checked={editForm.passwordComplexity.requireSymbols}
								/>
							</div>
							<div class={bentoCardClass}>
								<Toggle
									label="Uppercase"
									description="Require at least one uppercase letter."
									bind:checked={editForm.passwordComplexity.requireUppercase}
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
				{:else}
					<div
						in:fade={{ duration: 200, delay: 200 }}
						out:fade={{ duration: 200 }}
						class="space-y-6"
					>
						<div>
							<p class={labelClass}>Minimum Password Length</p>
							<p class={valueClass}>{security.passwordComplexity.minLength} characters</p>
						</div>

						<div class="grid gap-3 sm:grid-cols-2">
							{#each [{ label: 'Numbers', value: security.passwordComplexity.requireNumbers }, { label: 'Symbols', value: security.passwordComplexity.requireSymbols }, { label: 'Uppercase', value: security.passwordComplexity.requireUppercase }] as req (req.label)}
								<div
									class="flex items-center justify-between rounded-xl border border-border/50 bg-surface/30 p-3"
								>
									<span class="text-sm font-medium text-text">{req.label}</span>
									{#if req.value}
										<CheckCircle2 class="h-4 w-4 text-emerald-500" />
									{:else}
										<X class="h-4 w-4 text-text-subtle/30" />
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>
