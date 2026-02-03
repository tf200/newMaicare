<script lang="ts">
	import { uploadManager } from '$lib/state/upload.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		label?: string;
		error?: string;
		accept?: string;
		fileId?: string | null;
		class?: string;
		onUpload?: (fileId: string) => void;
	}

	let {
		label,
		error,
		accept,
		fileId = $bindable(null),
		class: className,
		onUpload
	}: Props = $props();

	let inputElement: HTMLInputElement;
	let currentUpload = $state<{ progress: number; status: string; error?: string } | null>(null);
	let fileName = $state<string | null>(null);

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const selected = target.files?.[0];
		if (!selected) return;

		fileName = selected.name;

		try {
			// Create a tracking object for this local component instance
			// We could also search uploadManager.uploads by file name/size if we wanted more global sync
			const result = await uploadManager.uploadFile(selected);
			fileId = result.file_id;
			if (onUpload) onUpload(result.file_id);
		} catch (err) {
			console.error('Upload failed:', err);
		}
	}

	// Find the active upload in the manager to show progress
	let activeUpload = $derived(uploadManager.uploads.find((u) => u.file.name === fileName));

	function triggerSelect() {
		inputElement.click();
	}

	function removeFile() {
		fileId = null;
		fileName = null;
		if (inputElement) inputElement.value = '';
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
		<input
			type="file"
			bind:this={inputElement}
			class="hidden"
			{accept}
			onchange={handleFileSelect}
		/>

		{#if !fileName}
			<button
				type="button"
				onclick={triggerSelect}
				class="flex cursor-pointer flex-col items-center gap-2 text-text-muted transition-colors hover:text-brand"
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
				<span class="text-sm font-medium">Click to upload</span>
				<span class="text-xs">Max size 10MB</span>
			</button>
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
										Uploading... {activeUpload.progress}%
									{:else if activeUpload.status === 'completed'}
										Ready
									{:else if activeUpload.status === 'error'}
										<span class="text-error">Upload failed</span>
									{/if}
								</span>
							{/if}
						</div>
					</div>
					<button
						type="button"
						onclick={removeFile}
						class="text-text-muted transition-colors hover:text-error"
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
