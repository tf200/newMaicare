<script lang="ts">
	import { fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import { getAuthState } from '$lib/state/auth.svelte';
	import type { AuthContext } from '$lib/state/auth.svelte';

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
			errorMessage = 'Enter the 6-digit code.';
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
	<title>Two-Factor Auth | Nexus</title>
</svelte:head>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 dark:bg-black"
>
	<!-- Background Orbs - Atmosphere & Depth -->
	<div
		class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-500/20 blur-[120px] dark:bg-teal-500/10"
	></div>
	<div
		class="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px] dark:bg-emerald-500/10"
	></div>

	<!-- Main Card -->
	<div class="relative w-full max-w-md">
		<div
			class="group relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/80 p-8 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-zinc-300 dark:border-zinc-800/50 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
			in:fly={transition}
		>
			<!-- Header Section -->
			<div class="mb-10 text-center" in:fly={{ ...transition, delay: 100 }}>
				<div
					class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 shadow-lg transition-transform duration-500 group-hover:scale-110 dark:bg-white"
				>
					<svg
						class="h-8 w-8 text-white dark:text-zinc-900"
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
				<h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
					Verify it's you
				</h1>
				<p class="mt-2 font-medium text-zinc-500 dark:text-zinc-400">
					Enter the 6-digit code sent to your device
				</p>
			</div>

			<!-- OTP Input Grid -->
			<div class="mb-10" in:fly={{ ...transition, delay: 200 }}>
				{#if errorMessage}
					<div
						class="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200"
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
								class="w-full rounded-2xl border border-zinc-200 bg-zinc-100/50 py-5 text-center text-3xl font-bold text-zinc-900 outline-hidden transition-all focus:ring-4 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-white"
							/>
						</div>
					{/each}
				</div>
			</div>

			<!-- Primary & Ghost Actions -->
			<form class="space-y-4" onsubmit={handleVerify} in:fly={{ ...transition, delay: 300 }}>
				<Button class="w-full py-7 text-lg shadow-teal-500/10" type="submit" {isLoading}>
					{isLoading ? 'Verifying...' : 'Verify Code'}
				</Button>

				<div class="flex flex-col items-center gap-2">
					<Button
						variant="ghost"
						type="button"
						class="text-xs font-semibold text-zinc-400 hover:text-teal-600"
					>
						Didn't receive a code? Resend
					</Button>
				</div>
			</form>

			<!-- Secondary Action -->
			<div
				class="mt-8 border-t border-zinc-100 pt-8 text-center dark:border-zinc-800"
				in:fly={{ ...transition, delay: 400 }}
			>
				<a
					href="/login"
					class="text-sm font-bold text-teal-600 transition-colors hover:text-teal-500 dark:text-teal-400"
				>
					Back to login
				</a>
			</div>
		</div>

		<!-- Footer Info -->
		<div
			class="mt-8 flex justify-center gap-6 text-xs font-semibold text-zinc-400"
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
				Secure Verification
			</span>
		</div>
	</div>
</div>
