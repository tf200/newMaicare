<script lang="ts">
	import { CheckCircle2, FileCheck } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import ClientFileUploadModal from '$lib/components/clients/ClientFileUploadModal.svelte';
	import { invalidate } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import type { ClientOverviewData } from '../../overview.shared';

	interface Props {
		documentsChecklist: ClientOverviewData['documentsChecklist'];
		clientId: string;
	}

	let { documentsChecklist, clientId }: Props = $props();
	let showUploadModal = $state(false);
</script>

<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center gap-2">
		<FileCheck class="h-4 w-4 text-text-muted" aria-hidden="true" />
		<h2 class="text-lg font-semibold tracking-tight text-text">{m.required_documents()}</h2>
	</div>
	{#if documentsChecklist.length > 0}
		<div class="space-y-2">
			{#each documentsChecklist as doc (doc.id)}
				<div class="flex items-center justify-between rounded-xl border border-border bg-bg p-2.5">
					<span class="text-xs font-medium text-text-muted">{doc.label}</span>
					{#if doc.present}
						<span class="inline-flex text-success-strong">
							<CheckCircle2 class="h-4 w-4" aria-hidden="true" />
							<span class="sr-only">{m.document_present()}</span>
						</span>
					{:else}
						<span class="inline-flex">
							<span
								class="h-4 w-4 rounded-full border border-dashed border-text-muted"
								aria-hidden="true"
							></span>
							<span class="sr-only">{m.document_missing()}</span>
						</span>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-text-muted">{m.no_required_documents()}</p>
	{/if}
	<Button
		variant="ghost"
		onclick={() => (showUploadModal = true)}
		class="mt-4 w-full bg-bg text-xs"
	>
		{m.upload_document()}
	</Button>
</section>

<ClientFileUploadModal
	bind:open={showUploadModal}
	{clientId}
	onUploaded={() => invalidate(`app:client:${clientId}:detail`)}
/>
