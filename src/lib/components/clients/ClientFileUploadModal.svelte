<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { Upload, X, FileText, Image, AlertCircle, Loader2 } from 'lucide-svelte';
	import { AttachmentService } from '$lib/api/attachments';
	import { addClientDocuments } from '$lib/api/clients';

	interface FileItem {
		id: string;
		file: File;
		name: string;
		size: number;
		type: string;
		typeLabel: string;
		progress: number;
		status: 'uploading' | 'uploaded' | 'error';
		attachmentId: string | null;
		error: string | null;
	}

	let {
		open = $bindable(false),
		clientId
	}: {
		open: boolean;
		clientId: string;
	} = $props();

	let files = $state<FileItem[]>([]);
	let dragOver = $state(false);
	let isConfirming = $state(false);
	let uploadError = $state<string | null>(null);

	const fileTypeOptions = [
		{ label: 'Registration Form', value: 'registration_form' },
		{ label: 'Intake Form', value: 'intake_form' },
		{ label: 'Consent Form', value: 'consent_form' },
		{ label: 'Risk Assessment', value: 'risk_assessment' },
		{ label: 'Self-Reliance Matrix', value: 'self_reliance_matrix' },
		{ label: 'Force Inventory', value: 'force_inventory' },
		{ label: 'Care Plan', value: 'care_plan' },
		{ label: 'Signaling Plan', value: 'signaling_plan' },
		{ label: 'Cooperation Agreement', value: 'cooperation_agreement' },
		{ label: 'Other', value: 'other' }
	];

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const dropped = e.dataTransfer?.files;
		if (dropped) addFiles(Array.from(dropped));
	}

	function handleFileInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const selected = target.files;
		if (selected) {
			addFiles(Array.from(selected));
			target.value = '';
		}
	}

	function updateFile(id: string, updater: (file: FileItem) => FileItem) {
		files = files.map((file) => (file.id === id ? updater(file) : file));
	}

	async function uploadFile(item: FileItem) {
		try {
			const result = await AttachmentService.fullUploadFlow(item.file, (progress) => {
				updateFile(item.id, (file) => ({ ...file, progress }));
			});

			updateFile(item.id, (file) => ({
				...file,
				progress: 100,
				status: 'uploaded',
				attachmentId: result.file_id,
				error: null
			}));
		} catch (err) {
			updateFile(item.id, (file) => ({
				...file,
				status: 'error',
				error: err instanceof Error ? err.message : 'Upload failed'
			}));
		}
	}

	function addFiles(newFiles: File[]) {
		const newItems: FileItem[] = newFiles.map((f) => ({
			id: Math.random().toString(36).substring(2, 11),
			file: f,
			name: f.name,
			size: f.size,
			type: 'other',
			typeLabel: 'Other',
			progress: 0,
			status: 'uploading',
			attachmentId: null,
			error: null
		}));
		files = [...files, ...newItems];
		for (const item of newItems) {
			void uploadFile(item);
		}
	}

	function removeFile(id: string) {
		files = files.filter((f) => f.id !== id);
	}

	function updateFileType(id: string, type: string) {
		files = files.map((f) =>
			f.id === id
				? { ...f, type, typeLabel: fileTypeOptions.find((o) => o.value === type)?.label || 'Other' }
				: f
		);
	}

	function resetModalState() {
		files = [];
		uploadError = null;
	}

	async function handleConfirm() {
		if (!clientId || files.length === 0) return;

		const uploadedFiles = files.filter((file) => file.status === 'uploaded' && file.attachmentId);
		if (uploadedFiles.length === 0) return;

		isConfirming = true;
		uploadError = null;

		try {
			const documents = uploadedFiles.map((file) => ({
				attachment_id: file.attachmentId!,
				label: file.type
			}));

			await addClientDocuments(clientId, documents);

			resetModalState();
			open = false;
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			isConfirming = false;
		}
	}

	function handleClose() {
		if (!isConfirming && !files.some((file) => file.status === 'uploading')) {
			resetModalState();
			open = false;
		}
	}

	const uploadingCount = $derived(files.filter((file) => file.status === 'uploading').length);
	const uploadedCount = $derived(files.filter((file) => file.status === 'uploaded').length);
	const failedCount = $derived(files.filter((file) => file.status === 'error').length);
	const canConfirm = $derived(uploadedCount > 0 && uploadingCount === 0 && !isConfirming);

	$effect(() => {
		if (!open && uploadingCount > 0) {
			open = true;
			return;
		}

		if (!open && uploadingCount === 0 && !isConfirming && files.length > 0) {
			resetModalState();
		}
	});
</script>

<Modal bind:open title="Upload Client Files" description="Add files for this client" size="lg">
	<div class="space-y-6">
		{#if uploadError}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3">
				<p class="text-sm font-medium text-error">{uploadError}</p>
			</div>
		{/if}

		<div
			class="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-zinc-50/50 p-8 transition-all
			{dragOver ? 'border-brand bg-brand/5' : 'hover:border-brand/50'}"
			ondragover={(e) => {
				e.preventDefault();
				dragOver = true;
			}}
			ondragleave={() => (dragOver = false)}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
		>
			<input
				type="file"
				class="absolute inset-0 cursor-pointer opacity-0"
				multiple
				accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
				onchange={handleFileInput}
				disabled={isConfirming}
			/>
			<div
				class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand transition-transform {dragOver
					? 'scale-110'
					: ''}"
			>
				<Upload class="h-7 w-7" />
			</div>
			<div class="mt-4 text-center">
				<p class="text-sm font-semibold text-text">
					{dragOver ? 'Drop files here' : 'Drag & drop files here'}
				</p>
				<p class="mt-1 text-xs text-text-muted">or click to browse</p>
			</div>
			<p class="mt-3 text-xs text-text-subtle">PDF, Word, Excel, Images up to 10MB each</p>
		</div>

		{#if files.length > 0}
			<div class="space-y-3">
				<p class="text-xs font-semibold tracking-wider text-text-muted uppercase">
					{files.length} file{files.length > 1 ? 's' : ''} selected
				</p>
				<div class="max-h-[240px] space-y-2 overflow-y-auto">
					{#each files as file (file.id)}
						<div
							class="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-all hover:border-brand/30"
						>
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-border/50 text-text-muted"
							>
								{#if file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)}
									<Image class="h-5 w-5" />
								{:else}
									<FileText class="h-5 w-5" />
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-text">{file.name}</p>
								<div class="space-y-1">
									<p class="text-xs text-text-muted">{formatFileSize(file.size)}</p>
									{#if file.status === 'uploading'}
										<p class="text-xs font-medium text-brand">Uploading to bucket... {file.progress}%</p>
										<div class="h-1.5 w-full overflow-hidden rounded-full bg-border">
											<div
												class="h-full bg-brand transition-all duration-300"
												style="width: {file.progress}%"
											></div>
										</div>
									{:else if file.status === 'uploaded'}
										<p class="text-xs font-medium text-emerald-600">Uploaded. Ready to confirm.</p>
									{:else if file.error}
										<p class="text-xs font-medium text-error">{file.error}</p>
									{/if}
								</div>
							</div>
							<div class="w-40">
								<Select
									value={file.type}
									options={fileTypeOptions}
									size="sm"
									onchange={(val) => updateFileType(file.id, val)}
								/>
							</div>
							<button
								type="button"
								onclick={() => removeFile(file.id)}
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-subtle transition-colors hover:bg-error/10 hover:text-error"
								aria-label="Remove file"
								disabled={isConfirming}
							>
								<X class="h-4 w-4" />
							</button>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div
				class="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-8"
			>
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-border/50">
					<AlertCircle class="h-6 w-6 text-text-subtle" />
				</div>
				<p class="mt-3 text-sm font-medium text-text-muted">No files added yet</p>
				<p class="text-xs text-text-subtle">Upload files using the drop zone above</p>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-between">
			<p class="text-xs text-text-muted">
				{#if files.length === 0}
					No files selected
				{:else if uploadingCount > 0}
					{uploadingCount} file{uploadingCount > 1 ? 's are' : ' is'} still uploading
				{:else if failedCount > 0 && uploadedCount === 0}
					No uploaded files ready to confirm
				{:else}
					{uploadedCount} file{uploadedCount > 1 ? 's' : ''} ready to confirm
				{/if}
			</p>
			<div class="flex gap-3">
				<Button variant="ghost" onclick={handleClose} disabled={isConfirming || uploadingCount > 0}
					>Cancel</Button
				>
				<Button
					disabled={!canConfirm}
					isLoading={isConfirming}
					onclick={handleConfirm}
				>
					{#if isConfirming}
						<Loader2 class="h-4 w-4 animate-spin" />
					{:else}
						<Upload class="h-4 w-4" />
					{/if}
					{isConfirming
						? 'Confirming...'
						: `Confirm Upload${uploadedCount > 0 ? ` (${uploadedCount})` : ''}`}
				</Button>
			</div>
		</div>
	{/snippet}
</Modal>
