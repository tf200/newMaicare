<script lang="ts">
	import { fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import { getAuthState } from '$lib/state/auth.svelte';
	import type { AuthContext } from '$lib/state/auth.svelte';
	import { m } from '$lib/paraglide/messages';

	const otpSlots = Array.from({ length: 6 });
	let otp = $state(['', '', '', '', '', '']);
	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);

	const auth = getAuthState() as AuthContext;

	const transition = {
		duration: 800,
		easing: backOut,
		y: 20
	};

	function handleInput(e: Event, index: number) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '');
		otp[index] = value.slice(0, 1);

		if (value && index < otp.length - 1) {
			const parent = input.parentElement?.parentElement;
			const nextInput = parent?.children[index + 1]?.querySelector('input') as
				| HTMLInputElement
				| undefined;
			nextInput?.focus();
		}
	}

	function handleKeyDown(e: KeyboardEvent, index: number) {
		const input = e.target as HTMLInputElement;
		if (e.key === 'Backspace' && !input.value && index > 0) {
			const parent = input.parentElement?.parentElement;
			const prevInput = parent?.children[index - 1]?.querySelector('input') as
				| HTMLInputElement
				| undefined;
			prevInput?.focus();
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const paste = e.clipboardData?.getData('text') || '';
		const chars = paste.replace(/\D/g, '').slice(0, otp.length).split('');
		chars.forEach((char, i) => {
			otp[i] = char;
		});
	}

	async function handleVerify(e: Event) {
		e.preventDefault();
		errorMessage = null;
		const code = otp.join('');
		if (code.length !== otp.length) {
			errorMessage = m.twofa_enter_code();
			return;
		}
		isLoading = true;
		try {
			if (!auth) {
				throw new Error('Auth context unavailable');
			}
			await auth.verify2fa(code);
			await goto('/');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unable to verify code.';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{m.twofa_title()} | Nexus</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
	<!-- Background Orbs - Atmosphere & Depth -->
	<div
		class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-500/20 blur-[120px] dark:bg-teal-500/10"
	></div>
	<div
		class="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-orange-500/15 blur-[120px]"
	></div>

	<!-- Main Card -->
	<div class="relative w-full max-w-md">
		<div
			class="group relative overflow-hidden rounded-3xl border border-border/50 bg-glass-surface p-8 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-border"
			in:fly={transition}
		>
			<!-- Header Section -->
			<div class="mb-10 text-center" in:fly={{ ...transition, delay: 100 }}>
				<div
					class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-btn-primary-bg shadow-lg transition-transform duration-500 group-hover:scale-110"
				>
					<svg
						class="h-8 w-8 text-btn-primary-text"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
				</div>
				<h1 class="text-3xl font-bold tracking-tight text-text">{m.twofa_title()}</h1>
				<p class="mt-2 font-medium text-text-muted">{m.twofa_subtitle()}</p>
			</div>

			<!-- OTP Input Grid -->
			<div class="mb-10" in:fly={{ ...transition, delay: 200 }}>
				{#if errorMessage}
					<div
						class="mb-6 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error"
						in:fly={{ ...transition, delay: 160 }}
					>
						{errorMessage}
					</div>
				{/if}
				<div class="flex justify-between gap-3" onpaste={handlePaste}>
					{#each otpSlots as _, i (i)}
						<div class="flex-1">
							<input
								type="text"
								inputmode="numeric"
								maxlength="1"
								bind:value={otp[i]}
								oninput={(e) => handleInput(e, i)}
								onkeydown={(e) => handleKeyDown(e, i)}
								class="w-full rounded-2xl border border-border bg-surface py-5 text-center text-3xl font-bold text-text outline-hidden transition-all focus:ring-4 focus:ring-brand/20"
							/>
						</div>
					{/each}
				</div>
			</div>

			<!-- Primary & Ghost Actions -->
			<form class="space-y-4" onsubmit={handleVerify} in:fly={{ ...transition, delay: 300 }}>
				<Button class="w-full py-7 text-lg shadow-teal-500/10" type="submit" {isLoading}>
					{isLoading ? m.twofa_verifying() : m.twofa_verify()}
				</Button>

				<div class="flex flex-col items-center gap-2">
					<Button
						variant="ghost"
						type="button"
						class="text-xs font-semibold text-zinc-400 hover:text-teal-600"
					>
						{m.twofa_resend()}
					</Button>
				</div>
			</form>

			<!-- Secondary Action -->
			<div
				class="mt-8 border-t border-border pt-8 text-center"
				in:fly={{ ...transition, delay: 400 }}
			>
				<a href="/login" class="text-sm font-bold text-brand transition-colors hover:opacity-80">
					{m.twofa_back_to_login()}
				</a>
			</div>
		</div>

		<!-- Footer Info -->
		<div
			class="mt-8 flex justify-center gap-6 text-xs font-semibold text-text-subtle"
			in:fly={{ ...transition, delay: 500 }}
		>
			<span class="flex items-center gap-1.5">
				<svg
					class="h-3 w-3"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
				>
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				</svg>
				{m.twofa_secure_verification()}
			</span>
		</div>
	</div>
</div>
