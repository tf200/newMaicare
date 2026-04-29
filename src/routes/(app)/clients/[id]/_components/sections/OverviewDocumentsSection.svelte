<script lang="ts">
	import { CheckCircle2, FileCheck } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import ClientFileUploadModal from '$lib/components/clients/ClientFileUploadModal.svelte';
	import type { ClientOverviewData } from '$lib/mock/client-overview';

	interface Props {
		documentsChecklist: ClientOverviewData['documentsChecklist'];
		clientId: string;
	}

	let { documentsChecklist, clientId }: Props = $props();
	let showUploadModal = $state(false);
</script>

<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center gap-2">
		<FileCheck class="h-4 w-4 text-text-subtle" />
		<h3 class="font-bold text-text">{m.required_documents()}</h3>
	</div>
	<div class="space-y-2">
		{#each documentsChecklist as doc, index (`${doc.label}-${index}`)}
			<div class="flex items-center justify-between rounded-xl border border-border/40 bg-white p-2.5 dark:bg-zinc-900/30">
				<span class="text-xs font-medium text-text-muted">{doc.label}</span>
				{#if doc.present}
					<CheckCircle2 class="h-4 w-4 text-emerald-500" />
				{:else}
					<div class="h-4 w-4 rounded-full border border-dashed border-border"></div>
				{/if}
			</div>
		{/each}
	</div>
	<button
		type="button"
		onclick={() => (showUploadModal = true)}
		class="mt-4 w-full rounded-xl bg-zinc-100 py-2 text-xs font-bold text-text transition hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
	>
		{m.upload_document()}
	</button>
</div>

<ClientFileUploadModal bind:open={showUploadModal} {clientId} />
