<script module lang="ts">
	let bodyLockCount = 0;
	let previousBodyOverflow = '';

	function lockBody() {
		if (bodyLockCount === 0) {
			previousBodyOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
		}
		bodyLockCount += 1;

		return () => {
			bodyLockCount = Math.max(0, bodyLockCount - 1);
			if (bodyLockCount === 0) document.body.style.overflow = previousBodyOverflow;
		};
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { X } from 'lucide-svelte';

	type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		children?: Snippet;
		header?: Snippet;
		footer?: Snippet;
		size?: ModalSize;
		closeLabel?: string;
		ariaLabel?: string;
		dismissible?: boolean;
		onClose?: () => void;
		initialFocus?: HTMLElement | null | (() => HTMLElement | null);
		class?: string;
	}

	const instanceId = $props.id();
	let {
		open = $bindable(false),
		title,
		description,
		children,
		header = undefined,
		footer = undefined,
		size = 'md' as ModalSize,
		closeLabel = 'Close',
		ariaLabel = title ?? 'Dialog',
		dismissible = true,
		onClose = undefined,
		initialFocus = undefined,
		class: className = ''
	}: Props = $props();

	const titleId = `${instanceId}-title`;
	const descriptionId = `${instanceId}-description`;
	const focusableSelector = [
		'button:not([disabled])',
		'[href]',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])'
	].join(',');

	function close() {
		if (!dismissible) return;
		open = false;
		onClose?.();
	}

	function isTopmost(dialog: HTMLDivElement) {
		const dialogs = document.querySelectorAll<HTMLElement>('[data-modal-dialog]');
		return dialogs.item(dialogs.length - 1) === dialog;
	}

	function handleKeydown(event: KeyboardEvent, dialog: HTMLDivElement) {
		if (!isTopmost(dialog)) return;
		if (event.key === 'Escape' && dismissible) {
			event.preventDefault();
			event.stopImmediatePropagation();
			close();
			return;
		}
		if (event.key !== 'Tab') return;

		const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
			(element) => !element.hidden && element.getClientRects().length > 0
		);
		if (focusable.length === 0) {
			event.preventDefault();
			dialog.focus();
			return;
		}

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function manageDialog(dialog: HTMLDivElement) {
		const previouslyFocused =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const unlockBody = lockBody();
		const onKeydown = (event: KeyboardEvent) => handleKeydown(event, dialog);
		document.addEventListener('keydown', onKeydown);

		queueMicrotask(() => {
			const requested = typeof initialFocus === 'function' ? initialFocus() : initialFocus;
			const target = requested ?? dialog.querySelector<HTMLElement>(focusableSelector) ?? dialog;
			target?.focus();
		});

		return () => {
			document.removeEventListener('keydown', onKeydown);
			unlockBody();
			if (previouslyFocused?.isConnected) previouslyFocused.focus();
		};
	}

	const maxWidths: Record<ModalSize, string> = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		'2xl': 'max-w-5xl',
		'4xl': 'max-w-7xl',
		full: 'max-w-[95vw]'
	};
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
		{#if dismissible}
			<button
				type="button"
				tabindex="-1"
				aria-label={closeLabel}
				class="fixed inset-0 bg-text/40 backdrop-blur-sm transition-all"
				transition:fade={{ duration: 200 }}
				onclick={close}
			></button>
		{:else}
			<div
				class="fixed inset-0 bg-text/40 backdrop-blur-sm"
				transition:fade={{ duration: 200 }}
			></div>
		{/if}

		<div
			{@attach manageDialog}
			data-modal-dialog
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? titleId : undefined}
			aria-label={title ? undefined : ariaLabel}
			aria-describedby={description ? descriptionId : undefined}
			tabindex="-1"
			class="relative flex max-h-[90vh] w-full flex-col rounded-3xl bg-surface shadow-2xl ring-1 ring-border {maxWidths[
				size
			]} {className}"
			transition:scale={{ start: 0.95, duration: 200 }}
		>
			<div class="flex items-center justify-between rounded-t-3xl border-b border-border px-6 py-3">
				{#if header}
					{#if title}<h2 id={titleId} class="sr-only">{title}</h2>{/if}
					{#if description}<p id={descriptionId} class="sr-only">{description}</p>{/if}
					{@render header()}
				{:else}
					<div>
						{#if title}<h2 id={titleId} class="text-lg font-bold text-text">{title}</h2>{/if}
						{#if description}
							<p id={descriptionId} class="text-xs text-text-muted">{description}</p>
						{/if}
					</div>
				{/if}
				{#if dismissible}
					<button
						type="button"
						onclick={close}
						aria-label={closeLabel}
						class="rounded-full p-2 text-text-subtle transition-colors hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
					>
						<X class="h-5 w-5" />
					</button>
				{/if}
			</div>

			<div class="flex-1 overflow-y-auto p-6">
				{@render children?.()}
			</div>

			{#if footer}
				<div class="rounded-b-3xl border-t border-border bg-bg/50 px-6 py-3">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
