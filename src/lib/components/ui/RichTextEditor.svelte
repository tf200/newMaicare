<script lang="ts">
	import {
		Bold,
		Italic,
		Underline,
		List,
		ListOrdered,
		Quote,
		Undo,
		Redo,
		AlignLeft,
		AlignCenter,
		AlignRight
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	let {
		value = $bindable(''),
		label = '',
		error = '',
		placeholder = m.start_typing_placeholder(),
		class: className = ''
	} = $props<{
		value?: string;
		label?: string;
		error?: string;
		placeholder?: string;
		class?: string;
	}>();

	let editorElement: HTMLDivElement | null = $state(null);
	const editorId = `rte-${Math.random().toString(36).slice(2)}`;

	const ALLOWED_TAGS = new Set([
		'B',
		'STRONG',
		'I',
		'EM',
		'U',
		'BR',
		'P',
		'DIV',
		'UL',
		'OL',
		'LI',
		'BLOCKQUOTE'
	]);

	const sanitizeStyle = (styleValue: string) => {
		const next: string[] = [];
		for (const part of styleValue.split(';')) {
			const [rawProp, rawVal] = part.split(':');
			const prop = rawProp?.trim().toLowerCase();
			const val = rawVal?.trim().toLowerCase();
			if (!prop || !val) continue;
			if (prop === 'text-align' && ['left', 'center', 'right', 'justify'].includes(val)) {
				next.push(`text-align:${val}`);
			}
		}
		return next.join(';');
	};

	const sanitizeRichHtml = (html: string) => {
		const doc = new DOMParser().parseFromString(`<div>${html ?? ''}</div>`, 'text/html');
		const root = doc.body.firstElementChild as HTMLElement | null;
		if (!root) return '';

		const walk = (node: Node) => {
			if (node.nodeType === Node.COMMENT_NODE) {
				node.parentNode?.removeChild(node);
				return;
			}

			if (node.nodeType !== Node.ELEMENT_NODE) return;

			const el = node as HTMLElement;
			const tag = el.tagName.toUpperCase();

			// Drop dangerous elements entirely.
			if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META'].includes(tag)) {
				el.remove();
				return;
			}

			// Unwrap unknown elements (keep their children).
			if (!ALLOWED_TAGS.has(tag)) {
				el.replaceWith(...Array.from(el.childNodes));
				return;
			}

			// Strip all attributes except safe text-align style on block-level nodes.
			for (const attr of Array.from(el.attributes)) {
				const name = attr.name.toLowerCase();
				if (name === 'style' && (tag === 'DIV' || tag === 'P' || tag === 'BLOCKQUOTE')) continue;
				el.removeAttribute(attr.name);
			}

			if (el.hasAttribute('style')) {
				const cleaned = sanitizeStyle(el.getAttribute('style') ?? '');
				if (cleaned) el.setAttribute('style', cleaned);
				else el.removeAttribute('style');
			}

			for (const child of Array.from(el.childNodes)) walk(child);
		};

		for (const child of Array.from(root.childNodes)) walk(child);
		return root.innerHTML;
	};

	const isRichTextEmpty = (html: string) => {
		const doc = new DOMParser().parseFromString(`<div>${html ?? ''}</div>`, 'text/html');
		const text = (doc.body.textContent ?? '')
			.replace(/\u00a0/g, ' ')
			.replace(/\u200b/g, '')
			.trim();
		return text.length === 0;
	};

	const isEmpty = $derived.by(() => isRichTextEmpty(value));

	value = sanitizeRichHtml(value || '');

	const updateValue = () => {
		if (editorElement) {
			value = sanitizeRichHtml(editorElement.innerHTML);
		}
	};

	const execCommand = (command: string, arg?: string) => {
		if (!editorElement) return;
		try {
			document.execCommand(command, false, arg);
		} finally {
			updateValue();
			editorElement.focus();
		}
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			setTimeout(updateValue, 0);
		}
	};

	const onPaste = (e: ClipboardEvent) => {
		if (!editorElement) return;
		e.preventDefault();

		const html = e.clipboardData?.getData('text/html') ?? '';
		const text = e.clipboardData?.getData('text/plain') ?? '';
		const toInsert = html ? sanitizeRichHtml(html) : sanitizeRichHtml(text.replace(/\n/g, '<br>'));

		// Keep using execCommand for consistent insertion with the rest of the toolbar.
		document.execCommand('insertHTML', false, toInsert);
		updateValue();
	};

	const onBlur = () => {
		updateValue();
	};

	const editorAttachment = (node: HTMLDivElement) => {
		editorElement = node;
		return () => {
			if (editorElement === node) editorElement = null;
		};
	};
</script>

<div class="flex flex-col gap-1.5 {className}">
	{#if label}
		<label class="text-sm font-medium text-text" for={editorId}>
			{label}
		</label>
	{/if}

	<div
		class="overflow-hidden rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-brand/20
		{error
			? 'border-rose-300 bg-rose-50 focus-within:border-rose-500 focus-within:ring-rose-500/20 dark:border-rose-900/50 dark:bg-rose-900/10'
			: 'border-border bg-surface focus-within:border-brand'}"
	>
		<!-- Toolbar -->
		<div
			class="flex flex-wrap items-center gap-1 border-b border-border bg-zinc-50/50 p-2 dark:bg-zinc-800/50"
		>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('bold');
				}}
				title={m.bold()}
				aria-label={m.bold()}
			>
				<Bold class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('italic');
				}}
				title={m.italic()}
				aria-label={m.italic()}
			>
				<Italic class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('underline');
				}}
				title={m.underline()}
				aria-label={m.underline()}
			>
				<Underline class="h-4 w-4" />
			</button>

			<div class="mx-1 h-4 w-px bg-border"></div>

			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('justifyLeft');
				}}
				title={m.align_left()}
				aria-label={m.align_left()}
			>
				<AlignLeft class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('justifyCenter');
				}}
				title={m.align_center()}
				aria-label={m.align_center()}
			>
				<AlignCenter class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('justifyRight');
				}}
				title={m.align_right()}
				aria-label={m.align_right()}
			>
				<AlignRight class="h-4 w-4" />
			</button>

			<div class="mx-1 h-4 w-px bg-border"></div>

			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('insertUnorderedList');
				}}
				title={m.bullet_list()}
				aria-label={m.bullet_list()}
			>
				<List class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('insertOrderedList');
				}}
				title={m.numbered_list()}
				aria-label={m.numbered_list()}
			>
				<ListOrdered class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('formatBlock', 'BLOCKQUOTE');
				}}
				title={m.quote()}
				aria-label={m.quote()}
			>
				<Quote class="h-4 w-4" />
			</button>

			<div class="mx-1 h-4 w-px bg-border"></div>

			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('undo');
				}}
				title={m.undo()}
				aria-label={m.undo()}
			>
				<Undo class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-text"
				onmousedown={(e) => {
					e.preventDefault();
					execCommand('redo');
				}}
				title={m.redo()}
				aria-label={m.redo()}
			>
				<Redo class="h-4 w-4" />
			</button>
		</div>

		<!-- Editor Area -->
		<div class="relative">
			{#if isEmpty}
				<div class="pointer-events-none absolute top-0 left-0 p-4 text-sm text-text-subtle">
					{placeholder}
				</div>
			{/if}

			<div
				{@attach editorAttachment}
				id={editorId}
				contenteditable="true"
				class="min-h-[250px] p-4 text-sm text-text focus:outline-none [&>blockquote]:my-2 [&>blockquote]:border-l-4 [&>blockquote]:border-border [&>blockquote]:pl-4 [&>blockquote]:text-text-muted [&>blockquote]:italic [&>ol]:ml-4 [&>ol]:list-decimal [&>ul]:ml-4 [&>ul]:list-disc"
				bind:innerHTML={value}
				oninput={updateValue}
				onblur={onBlur}
				onkeydown={onKeyDown}
				onpaste={onPaste}
				role="textbox"
				aria-multiline="true"
				tabindex="0"
				spellcheck="true"
			></div>
		</div>
	</div>

	{#if error}
		<span class="text-xs font-medium text-rose-500 dark:text-rose-400">
			{error}
		</span>
	{/if}
</div>
