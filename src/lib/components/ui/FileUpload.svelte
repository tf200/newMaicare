<script lang="ts">
	import { uploadManager } from '$lib/state/upload.svelte';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		label?: string;
		error?: string;
		accept?: string;
		disabled?: boolean;
		fileId?: string | null;
		class?: string;
		helperText?: string;
		onUpload?: (fileId: string, fileName: string) => void;
		uploadFile?: (
			file: File,
			onProgress?: (progress: number) => void
		) => Promise<{ file_id: string }>;
	}

	let {
		label,
		error,
		accept,
		disabled = false,
		fileId = $bindable(null),
		class: className,
		helperText,
		onUpload,
		uploadFile
	}: Props = $props();

	const inputId = $props.id();
	let localUpload = $state<{
		progress: number;
		status: 'uploading' | 'completed' | 'error';
		error?: string;
	} | null>(null);
	let fileName = $state<string | null>(null);
	let inputResetKey = $state(0);

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const selected = target.files?.[0];
		if (!selected) return;

		fileName = selected.name;
		localUpload = uploadFile ? { progress: 0, status: 'uploading' } : null;

		try {
			const result = uploadFile
				? await uploadFile(selected, (progress) => {
						if (localUpload) localUpload.progress = progress;
					})
				: await uploadManager.uploadFile(selected);

			if (localUpload) {
				localUpload.status = 'completed';
				localUpload.progress = 100;
			}

			fileId = result.file_id;
			if (onUpload) onUpload(result.file_id, selected.name);
		} catch (err) {
			const message = err instanceof Error ? err.message : m.upload_failed();
			if (localUpload) {
				localUpload.status = 'error';
				localUpload.error = message;
			} else {
				localUpload = { progress: 0, status: 'error', error: message };
			}
		}
	}

	// Find the active upload in the manager to show progress
	let managedUpload = $derived(uploadManager.uploads.find((u) => u.file.name === fileName));
	let activeUpload = $derived(localUpload ?? managedUpload);

	function removeFile() {
		fileId = null;
		fileName = null;
		localUpload = null;
		inputResetKey += 1;
	}
</script>

<div class="space-y-2 {className}">
	{#if label}
		<span class="ml-1 text-sm font-semibold text-text-muted">
			{label}
		</span>
	{/if}

	<div
		class="relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-surface p-6 transition-all hover:border-brand/50"
	>
		{#key inputResetKey}
			<input
				id={inputId}
				type="file"
				class="hidden"
				{accept}
				{disabled}
				onchange={handleFileSelect}
			/>
		{/key}

		{#if !fileName}
			<label
				for={inputId}
				aria-disabled={disabled}
				class="flex cursor-pointer flex-col items-center gap-2 text-text-muted transition-colors hover:text-brand aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:text-text-muted"
			>
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="h-6 w-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
						/>
					</svg>
				</div>
				<span class="text-sm font-medium">{m.click_to_upload()}</span>
				<span class="text-xs">{helperText ?? m.max_size_10mb()}</span>
			</label>
		{:else}
			<div class="flex w-full flex-col gap-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3 overflow-hidden">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"
						>
							{#if activeUpload?.status === 'completed'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="2"
									stroke="currentColor"
									class="h-6 w-6 text-success"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="2"
									stroke="currentColor"
									class="h-5 w-5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
									/>
								</svg>
							{/if}
						</div>
						<div class="flex flex-col overflow-hidden">
							<span class="truncate text-sm font-medium text-text">{fileName}</span>
							{#if activeUpload}
								<span class="text-xs text-text-muted">
									{#if activeUpload.status === 'uploading'}
										{m.uploading()}... {activeUpload.progress}%
									{:else if activeUpload.status === 'completed'}
										{m.ready()}
									{:else if activeUpload.status === 'error'}
										<span class="text-error">{m.upload_failed()}</span>
									{/if}
								</span>
							{/if}
						</div>
					</div>
					<button
						type="button"
						onclick={removeFile}
						{disabled}
						aria-label={m.remove_file()}
						class="text-text-muted transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="h-5 w-5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if activeUpload && activeUpload.status === 'uploading'}
					<div class="h-1.5 w-full overflow-hidden rounded-full bg-border">
						<div
							class="h-full bg-brand transition-all duration-300"
							style="width: {activeUpload.progress}%"
						></div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if error || activeUpload?.error}
		<p class="ml-1 text-xs font-medium text-error">{error || activeUpload?.error}</p>
	{/if}
</div>
