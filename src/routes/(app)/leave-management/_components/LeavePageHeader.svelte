<script lang="ts">
	import { Calendar, ChevronLeft, ChevronRight, FileDown, Mail } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { m } from '$lib/paraglide/messages';

	type Props = {
		currentMonthLabel: string;
		onPrevMonth: () => void;
		onNextMonth: () => void;
		onDownloadPdf: () => void;
		onOpenEmail: () => void;
	};

	let { currentMonthLabel, onPrevMonth, onNextMonth, onDownloadPdf, onOpenEmail }: Props = $props();
</script>

<header class="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm">
	<div class="flex flex-col gap-6">
		<div class="flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-2">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<Calendar class="h-5 w-5" />
					</span>
					<span>{m.leave_management_label()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.leave_page_heading()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.leave_page_subtitle()}
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<div class="flex items-center gap-1 rounded-2xl border border-border/60 bg-surface p-1">
					<button
						class="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-border/40 hover:text-text"
						onclick={onPrevMonth}
					>
						<ChevronLeft class="h-4 w-4" />
					</button>
					<span class="min-w-[140px] text-center text-sm font-semibold text-text capitalize">
						{currentMonthLabel}
					</span>
					<button
						class="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-border/40 hover:text-text"
						onclick={onNextMonth}
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
				<Button variant="ghost" class="rounded-xl" onclick={onDownloadPdf}>
					<FileDown class="h-4 w-4" />
					{m.export_pdf()}
				</Button>
				<Button variant="ghost" class="rounded-xl" onclick={onOpenEmail}>
					<Mail class="h-4 w-4" />
					{m.leave_email_action()}
				</Button>
			</div>
		</div>
	</div>
</header>
