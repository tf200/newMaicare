<script lang="ts">
	import { BookOpen, Plus } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type Props = {
		onAssign: () => void;
	};

	let { onAssign }: Props = $props();
</script>

<header class="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm">
	<div class="flex flex-wrap items-start justify-between gap-6">
		<div class="space-y-2">
			<div class="flex items-center gap-3 text-sm font-semibold text-brand">
				<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
					<BookOpen class="h-5 w-5" />
				</span>
				<span>Workforce Operations</span>
			</div>
			<h1 class="text-3xl font-bold tracking-tighter text-text">Employee Handbooks</h1>
			<p class="max-w-2xl text-sm font-medium text-text-muted">
				Manage handbook assignments and monitor employee progress across the organization.
			</p>
		</div>
		<div class="flex items-center gap-3">
			<Button variant="secondary" class="gap-2" onclick={onAssign}>
				<Plus class="h-4 w-4" />
				Assign Handbook
			</Button>
		</div>
	</div>
</header>
