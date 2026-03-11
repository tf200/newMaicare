<script lang="ts">
	import { fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { m } from '$lib/paraglide/messages';

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);

	const auth = getAuthState();

	async function handleSubmit(e: Event) {
		e.preventDefault();
		errorMessage = null;
		isLoading = true;
		try {
			if (!auth) {
				throw new Error('Auth context unavailable');
			}
			const data = await auth.authenticate({ email, password });
			if (data.requires_2fa) {
				errorMessage = 'Two-factor verification required.';
				return;
			}
			await goto('/dashboard');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unable to sign in.';
		} finally {
			isLoading = false;
		}
	}

	const transition = {
		duration: 800,
		easing: backOut,
		y: 20
	};
</script>

<svelte:head>
	<title>{`${m.sign_in()} | Nexus`}</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-10">
	<!-- Background Orbs - Atmosphere & Depth -->
	<div
		class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-500/20 blur-[120px] dark:bg-teal-500/10"
	></div>
	<div
		class="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-[var(--color-secondary)]/10 blur-[120px]"
	></div>
	<div
		class="absolute inset-x-0 top-20 mx-auto h-64 w-[80vw] rounded-[48px] bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.12),_transparent_70%)]"
	></div>

	<div class="relative w-full max-w-5xl">
		<div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
			<!-- Brand Panel -->
			<section
				class="relative hidden overflow-hidden rounded-[32px] border border-border/40 bg-gradient-to-br from-surface via-bg to-bg p-10 shadow-xl lg:block"
				in:fly={{ ...transition, delay: 80 }}
			>
				<div class="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-500/15 blur-[80px]"></div>
				<div class="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-orange-500/10 blur-[100px]"></div>
				<div class="relative">
					<div class="flex items-center gap-4">
						<div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
							<img src="/logo.webp" alt="MaiCare" class="h-9 w-9 object-contain" />
						</div>
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.3em] text-text-subtle">
								MaiCare
							</p>
							<h2 class="text-2xl font-bold text-text">Care operations, unified.</h2>
						</div>
					</div>
					<p class="mt-6 text-sm leading-relaxed text-text-muted">
						Secure access to scheduling, client care, and intake workflows for modern care teams.
					</p>
					<div class="mt-8 grid gap-4">
						<div class="rounded-2xl border border-border/60 bg-surface/60 p-4">
							<p class="text-xs font-semibold uppercase tracking-wider text-text-subtle">
								Today
							</p>
							<p class="mt-1 text-lg font-bold text-text">Live intake updates</p>
							<p class="mt-1 text-xs text-text-muted">
								Stay synced with new client registrations and approvals.
							</p>
						</div>
						<div class="rounded-2xl border border-border/60 bg-surface/60 p-4">
							<p class="text-xs font-semibold uppercase tracking-wider text-text-subtle">
								Security
							</p>
							<p class="mt-1 text-lg font-bold text-text">Trusted access controls</p>
							<p class="mt-1 text-xs text-text-muted">
								Roles and permissions tailored to every care team.
							</p>
						</div>
					</div>
					<div class="mt-8 flex flex-wrap gap-3">
						<span class="rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-[11px] font-semibold text-text-subtle">
							ISO-aligned workflows
						</span>
						<span class="rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-[11px] font-semibold text-text-subtle">
							Realtime coordination
						</span>
					</div>
				</div>
			</section>

			<!-- Main Card -->
			<div class="relative">
				<div
					class="group relative overflow-hidden rounded-3xl border border-border/50 bg-glass-surface p-8 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-border"
					in:fly={transition}
				>
			<!-- Header Section -->
			<div class="mb-10 text-center" in:fly={{ ...transition, delay: 100 }}>
				<div
					class="mx-auto mb-4 flex h-20 w-20 items-center justify-center transition-transform duration-500 group-hover:scale-110"
				>
					<img src="/logo.webp" alt="MaiCare" class="h-16 w-16 object-contain" loading="eager" />
				</div>
				<h1 class="text-3xl font-bold tracking-tight text-text">
					{m.welcome_back()}
				</h1>
				<p class="mt-2 font-medium text-text-muted">
					{m.enter_credentials()}
				</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-6">
				{#if errorMessage}
					<div
						class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error"
						in:fly={{ ...transition, delay: 160 }}
					>
						{errorMessage}
					</div>
				{/if}
				<!-- Staggered Input Fields -->
				<div in:fly={{ ...transition, delay: 200 }}>
					<Input
						label={m.email_address()}
						type="email"
						id="email"
						bind:value={email}
						placeholder={m.login_email_placeholder()}
						required
					/>
				</div>

				<div class="relative" in:fly={{ ...transition, delay: 300 }}>
					<Input
						label={m.password()}
						type={showPassword ? 'text' : 'password'}
						id="password"
						bind:value={password}
						placeholder={m.login_password_placeholder()}
						required
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute top-[46px] right-3 p-1.5 text-text-subtle transition-colors hover:text-text"
					>
						{#if showPassword}
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								><path
									d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
								/><line x1="1" y1="1" x2="23" y2="23" /></svg
							>
						{:else}
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle
									cx="12"
									cy="12"
									r="3"
								/></svg
							>
						{/if}
					</button>
					<a
						href="/forgot-password"
						class="absolute top-0 right-1 text-xs font-bold text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
					>
						{m.forgot_password()}
					</a>
				</div>

				<!-- Form Action -->
				<div in:fly={{ ...transition, delay: 400 }}>
					<Button type="submit" class="w-full py-6 text-base" {isLoading}>
						{isLoading ? m.verifying() : m.sign_in()}
					</Button>
				</div>
			</form>

			<!-- Footer Links -->
			<div class="mt-8 text-center" in:fly={{ ...transition, delay: 500 }}>
				<p class="text-sm font-medium text-text-muted">
					{m.no_account()}
					<a
						href="/register"
						class="font-bold text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
					>
						{m.client_registration()}
					</a>
				</p>
			</div>
				</div>

				<div
					class="mt-8 flex justify-center gap-6 text-xs font-semibold text-text-subtle"
					in:fly={{ ...transition, delay: 600 }}
				>
					<a href="/privacy" class="transition-colors hover:text-text">
						{m.privacy_policy()}
					</a>
					<span>&bull;</span>
					<a href="/help" class="transition-colors hover:text-text">
						{m.help_center()}
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
