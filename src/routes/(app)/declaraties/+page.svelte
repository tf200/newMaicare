<script lang="ts">
	import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Euro } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import DeclaratieStats from './_components/DeclaratieStats.svelte';
	import { listMockExpenses } from '$lib/api/declaraties.mock';
	import type { Expense, ExpenseCategory, ExpenseStatus } from '$lib/types/api/declaraties';
	import { m } from '$lib/paraglide/messages';

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);

	const categoryLabels: Record<ExpenseCategory, string> = {
		reiskosten: 'Reiskosten',
		verblijfkosten: 'Verblijfkosten',
		maaltijden: 'Maaltijden',
		telefoon: 'Telefoon',
		kantoorbenodigdheden: 'Kantoor',
		opleidingen: 'Opleidingen',
		representatie: 'Representatie',
		overig: 'Overig'
	};

	const statusConfig: Record<ExpenseStatus, { label: string; color: string; icon: any }> = {
		pending: { label: 'In behandeling', color: 'text-amber-600', icon: Clock },
		approved: { label: 'Goedgekeurd', color: 'text-emerald-600', icon: CheckCircle },
		rejected: { label: 'Afgewezen', color: 'text-rose-600', icon: XCircle },
		paid: { label: 'Uitbetaald', color: 'text-blue-600', icon: Euro }
	};

	const categoryColors: Record<ExpenseCategory, string> = {
		reiskosten: 'bg-blue-100 text-blue-800 border-blue-200',
		verblijfkosten: 'bg-purple-100 text-purple-800 border-purple-200',
		maaltijden: 'bg-orange-100 text-orange-800 border-orange-200',
		telefoon: 'bg-green-100 text-green-800 border-green-200',
		kantoorbenodigdheden: 'bg-slate-100 text-slate-800 border-slate-200',
		opleidingen: 'bg-indigo-100 text-indigo-800 border-indigo-200',
		representatie: 'bg-pink-100 text-pink-800 border-pink-200',
		overig: 'bg-gray-100 text-gray-800 border-gray-200'
	};

	let currentMonth = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
	let loading = $state(false);
	let rows = $state<Expense[]>([]);
	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;
	let searchQuery = $state('');
	let statusFilter = $state<string>('all');
	let isFormOpen = $state(false);
	let currentPage = $state(1);
	let pageSize = $state(10);
	let totalCount = $state(0);

	let newExpense = $state({
		employeeId: '',
		date: '',
		amount: '',
		category: 'reiskosten',
		description: ''
	});

	const columns: DataTableColumn[] = [
		{ key: 'date', label: 'Datum', sortable: true },
		{ key: 'employee', label: 'Medewerker' },
		{ key: 'category', label: 'Categorie' },
		{ key: 'description', label: 'Omschrijving' },
		{ key: 'amount', label: 'Bedrag', align: 'right', sortable: true },
		{ key: 'status', label: 'Status', align: 'center' },
		{ key: 'actions', label: '', align: 'right' }
	];

	const employeeOptions = [
		{ label: 'Sophie de Vries', value: 'emp-001' },
		{ label: 'Ahmed El Amrani', value: 'emp-002' },
		{ label: 'Lisa van den Berg', value: 'emp-003' },
		{ label: 'Mohammed Hassan', value: 'emp-004' },
		{ label: 'Emma Bakker', value: 'emp-005' },
		{ label: 'Fatima Zorgman', value: 'emp-007' },
		{ label: 'Julia Smit', value: 'emp-008' },
		{ label: 'Anna Jansen', value: 'emp-010' }
	];

	const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({
		label,
		value
	}));

	const statusOptions = [
		{ label: 'Alle statussen', value: 'all' },
		{ label: 'In behandeling', value: 'pending' },
		{ label: 'Goedgekeurd', value: 'approved' },
		{ label: 'Uitbetaald', value: 'paid' }
	];

	function formatMonth(date: Date) {
		return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(date);
	}

	function formatDate(dateText: string) {
		const date = new Date(dateText);
		return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(date);
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}

	function prevMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
	}

	function setToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
		toast = { message, type };
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			toast = null;
		}, 3500);
	}

	async function loadExpenses() {
		loading = true;
		try {
			const response = await listMockExpenses();
			rows = response.data;
			totalCount = response.data.length;
		} catch {
			rows = [];
		} finally {
			loading = false;
		}
	}

	const filteredRows = $derived.by(() => {
		const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
		const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

		return rows.filter((row) => {
			const rowDate = new Date(row.date);
			const inMonth = rowDate >= monthStart && rowDate <= monthEnd;
			const matchesSearch =
				!searchQuery ||
				row.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(row.description && row.description.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
			return inMonth && matchesSearch && matchesStatus;
		});
	});

	const stats = $derived.by(() => {
		const filtered = filteredRows;
		return {
			total: filtered.length,
			pending: filtered.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
			approved: filtered
				.filter((r) => r.status === 'approved')
				.reduce((sum, r) => sum + r.amount, 0),
			paid: filtered.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0)
		};
	});

	function handleApprove(id: string) {
		rows = rows.map((row) =>
			row.id === id ? { ...row, status: 'approved' as ExpenseStatus } : row
		);
		setToast('Declaratie goedgekeurd.', 'success');
	}

	function handleReject(id: string) {
		rows = rows.map((row) =>
			row.id === id ? { ...row, status: 'rejected' as ExpenseStatus } : row
		);
		setToast('Declaratie afgewezen.', 'warning');
	}

	$effect(() => {
		void loadExpenses();
	});
</script>

<svelte:head>
	<title>{m.decl_label()} | MaiCare</title>
</svelte:head>

<section class="space-y-6">
	<div
		class="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-8 shadow-sm"
	>
		<div
			class="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 opacity-100"
		></div>
		<div class="relative flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-white">{m.decl_label()}</h1>
				<p class="mt-1 text-sm font-medium text-white/80">
					{m.decl_subtitle()}
				</p>
			</div>
			<div class="flex items-center gap-4">
				<button
					class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30"
					onclick={prevMonth}
				>
					<ChevronLeft class="h-5 w-5" />
				</button>
				<span class="min-w-[140px] text-center text-lg font-semibold text-white">
					{formatMonth(currentMonth)}
				</span>
				<button
					class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30"
					onclick={nextMonth}
				>
					<ChevronRight class="h-5 w-5" />
				</button>
			</div>
		</div>
	</div>

	<DeclaratieStats
		total={stats.total}
		pending={stats.pending}
		approved={stats.approved}
		paid={stats.paid}
	/>

	<DataTable
		{columns}
		rows={filteredRows}
		{loading}
		rowKey="id"
		{currentPage}
		{pageSize}
		{totalCount}
		onPageChange={(page) => (currentPage = page)}
		surface="card"
		headerInline
		filters={tableFilters}
		cells={{
			date: dateCell,
			employee: employeeCell,
			category: categoryCell,
			description: descriptionCell,
			amount: amountCell,
			status: statusCell,
			actions: actionsCell
		}}
	/>
</section>

{#snippet tableFilters()}
	<div class="flex w-full flex-wrap items-center gap-3">
		<Input
			type="search"
			placeholder="Zoek op medewerker of omschrijving..."
			bind:value={searchQuery}
			className="w-full sm:w-64"
		/>
		<Select options={statusOptions} bind:value={statusFilter} className="w-full sm:w-40" />
	</div>
{/snippet}

{#snippet dateCell(row: Expense)}
	<span class="text-sm font-medium text-text">{formatDate(row.date)}</span>
{/snippet}

{#snippet employeeCell(row: Expense)}
	<span class="text-sm font-medium text-text">{row.employee_name}</span>
{/snippet}

{#snippet categoryCell(row: Expense)}
	{@const category = row.category as ExpenseCategory}
	<span
		class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold {categoryColors[
			category
		]}"
	>
		{categoryLabels[category]}
	</span>
{/snippet}

{#snippet descriptionCell(row: Expense)}
	<span class="text-sm text-text-muted">{row.description ?? '—'}</span>
{/snippet}

{#snippet amountCell(row: Expense)}
	<span class="text-sm font-semibold text-text">{formatCurrency(row.amount)}</span>
{/snippet}

{#snippet statusCell(row: Expense)}
	{@const statusMeta = statusConfig[row.status]}
	<span class="inline-flex items-center gap-1.5 text-xs font-semibold {statusMeta.color}">
		<statusMeta.icon class="h-4 w-4" />
		{statusMeta.label}
	</span>
{/snippet}

{#snippet actionsCell(row: Expense)}
	{#if row.status === 'pending'}
		<div class="flex items-center justify-end gap-1">
			<button
				class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-all hover:bg-emerald-200"
				onclick={() => handleApprove(row.id)}
			>
				<CheckCircle class="h-4 w-4" />
			</button>
			<button
				class="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700 transition-all hover:bg-rose-200"
				onclick={() => handleReject(row.id)}
			>
				<XCircle class="h-4 w-4" />
			</button>
		</div>
	{/if}
{/snippet}

{#if isFormOpen}
	<Modal open={true} title="Nieuwe declaratie" size="lg">
		<form class="space-y-4">
			<Select
				label="Medewerker"
				options={employeeOptions}
				bind:value={newExpense.employeeId}
				placeholder="Selecteer medewerker..."
			/>
			<Input label="Datum" type="date" bind:value={newExpense.date} />
			<Input
				label="Bedrag (€)"
				type="number"
				step="0.01"
				bind:value={newExpense.amount}
				placeholder="0.00"
			/>
			<Select label="Categorie" options={categoryOptions} bind:value={newExpense.category} />
			<div class="space-y-2">
				<label class="ml-1 text-sm font-semibold text-text-muted"> Omschrijving </label>
				<textarea
					class="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text placeholder:text-text-muted focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
					rows="3"
					bind:value={newExpense.description}
					placeholder="Beschrijf de uitgave..."
				></textarea>
			</div>
		</form>
		{#snippet footer()}
			<div class="flex justify-end gap-2">
				<Button variant="ghost" onclick={() => (isFormOpen = false)}>Annuleren</Button>
				<Button onclick={() => (isFormOpen = false)}>Declaratie indienen</Button>
			</div>
		{/snippet}
	</Modal>
{/if}

{#if toast}
	<Toast message={toast.message} type={toast.type} onClose={() => (toast = null)} />
{/if}
