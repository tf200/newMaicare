<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { resetEmployeePassword } from '$lib/api/employees';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		open?: boolean;
		employeeId: string;
		employeeName: string;
	}

	let { open = $bindable(false), employeeId, employeeName }: Props = $props();

	let newPassword = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let isCopied = $state(false);

	$effect(() => {
		if (open) {
			newPassword = '';
			errorMessage = '';
			successMessage = '';
			isCopied = false;
		}
	});

	function generatePassword() {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
		let password = '';
		for (let i = 0; i < 16; i++) {
			password += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		newPassword = password;
		errorMessage = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!newPassword.trim()) {
			errorMessage = m.password_required();
			return;
		}
		if (newPassword.length < 8) {
			errorMessage = m.password_min_length();
			return;
		}

		isSubmitting = true;
		errorMessage = '';
		successMessage = '';

		try {
			const res = await resetEmployeePassword(employeeId, { new_password: newPassword });
			if (res.success) {
				successMessage = m.password_reset_success();
			} else {
				errorMessage = res.message || 'Failed to reset password.';
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'An error occurred while resetting the password.';
		} finally {
			isSubmitting = false;
		}
	}

	async function copyPassword() {
		try {
			await navigator.clipboard.writeText(newPassword);
			isCopied = true;
			setTimeout(() => {
				isCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	}
</script>

<Modal bind:open title={m.reset_password()} description={m.reset_password_description({ name: employeeName })} size="md">
	{#if successMessage}
		<div class="space-y-4">
			<div class="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
				{successMessage}
			</div>
			
			<p class="text-sm text-text-muted">
				{m.password_reset_success_desc()}
			</p>

			<div class="flex items-end gap-2">
				<div class="flex-1">
					<Input
						label={m.new_password()}
						value={newPassword}
						readonly
						class="font-mono bg-bg select-all text-sm font-semibold text-text"
					/>
				</div>
				<Button variant="secondary" onclick={copyPassword}>
					{isCopied ? m.copied() : m.copy()}
				</Button>
			</div>
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-4">
			{#if errorMessage}

				<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
					{errorMessage}
				</div>
			{/if}

			<div class="flex items-end gap-2">
				<div class="flex-1">
					<Input
						label={m.new_password()}
						bind:value={newPassword}
						placeholder="••••••••"
						required
						minlength={8}
					/>
				</div>
				<Button type="button" variant="secondary" onclick={generatePassword}>
					{m.generate()}
				</Button>
			</div>

			<div class="flex justify-end gap-2 pt-4 border-t border-border mt-6">
				<Button type="button" variant="secondary" onclick={() => (open = false)} disabled={isSubmitting}>
					{m.cancel()}
				</Button>
				<Button type="submit" variant="primary" disabled={isSubmitting || !newPassword}>
					{isSubmitting ? m.resetting() : m.reset_password()}
				</Button>
			</div>
		</form>
	{/if}
</Modal>
