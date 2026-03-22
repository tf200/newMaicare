<script lang="ts">
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import { m } from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getLocale } from '$lib/paraglide/runtime';
	import {
		Plus,
		Trash2,
		Save,
		ArrowLeft,
		Calculator,
		GripVertical,
		Receipt,
		Building2,
		User,
		CalendarIcon,
		Clock,
		Banknote,
		FileText,
		Globe,
		Code,
		Pencil,
		Check
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { listClientContracts, listClients } from '$lib/api/clients';
	import { createInvoice } from '$lib/api/invoices';
	import type { ListClientsResponse } from '$lib/types/api/clients';
	import type { ListClientContractsResponse } from '$lib/types/api/contracts';
	import type { CreateInvoiceRequest, InvoiceStatus, InvoiceType } from '$lib/types/api/invoices';

	const INVOICE_TYPES = $derived([
		{ value: 'standard', label: m.standard() },
		{ value: 'credit_note', label: m.credit_note() }
	]);

	const INVOICE_STATUSES = $derived([
		{ value: 'concept', label: m.concept() },
		{ value: 'outstanding', label: m.outstanding_status() },
		{ value: 'partially_paid', label: m.partially_paid() },
		{ value: 'paid', label: m.paid() },
		{ value: 'expired', label: m.expired() },
		{ value: 'overpaid', label: m.overpaid() },
		{ value: 'imported', label: m.imported_status() },
		{ value: 'canceled', label: m.canceled() }
	]);

	const LINE_TYPES = $derived([
		{ value: 'contract', label: m.contract_type_label() },
		{ value: 'manual', label: m.manual() },
		{ value: 'adjustment', label: m.adjustment() }
	]);

	const SERVICE_TYPES = $derived([
		{ value: 'ambulante', label: m.ambulante() },
		{ value: 'accommodation', label: m.accommodation() }
	]);

	const UNIT_OPTIONS = $derived([
		{ value: 'item', label: m.item() },
		{ value: 'hour', label: m.hour() },
		{ value: 'day', label: m.day() },
		{ value: 'minute', label: m.minute() }
	]);

	// Form State
	let clientId = $state<string>('');
	let clientDisplayValue = $state<string>('');
	let clientsLoadError = $state<string>('');
	let contractsLoadError = $state<string>('');
	let submitError = $state<string>('');
	let isSubmitting = $state(false);
	let invoiceType = $state<InvoiceType>('standard');
	let issueDate = $state<string>(new Date().toISOString().split('T')[0]);
	let dueDate = $state<string>(
		new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
	);
	const currency = 'EUR';
	let billingTimezone = $state<string>('Europe/Amsterdam');
	let status = $state<InvoiceStatus>('concept');
	let extraContent = $state<string>('');
	let clientContracts = $state<ListClientContractsResponse[]>([]);

	const breadcrumbs = getBreadcrumbsState();
	$effect(() => {
		breadcrumbs.items = [
			{ label: m.breadcrumb_home(), href: '/dashboard' },
			{ label: m.invoices(), href: '/finances/invoices' },
			{ label: m.breadcrumb_new_invoice() }
		];
		return () => { breadcrumbs.items = []; };
	});

	// Lines State
	interface DraftLine {
		id: string;
		line_type: 'contract' | 'manual' | 'adjustment';
		contract_id: string;
		service_type: 'ambulante' | 'accommodation';
		description: string;
		period_start: string;
		period_end: string;
		quantity: number;
		unit: string;
		unit_price: number;
		vat_rate: number;
		isSaved: boolean;
	}

	let lines = $state<DraftLine[]>([
		{
			id: crypto.randomUUID(),
			line_type: 'manual',
			contract_id: '',
			service_type: 'ambulante',
			description: '',
			period_start: '',
			period_end: '',
			quantity: 1,
			unit: 'hour',
			unit_price: 0,
			vat_rate: 21,
			isSaved: false
		}
	]);

	// Computed Totals
	const totals = $derived.by(() => {
		let net = 0;
		let vat = 0;
		let gross = 0;

		lines.forEach((line) => {
			const lineNet = line.quantity * line.unit_price;
			const lineVat = lineNet * (line.vat_rate / 100);
			const lineGross = lineNet + lineVat;

			net += lineNet;
			vat += lineVat;
			gross += lineGross;
		});

		return { net, vat, gross };
	});

	const canCreateInvoice = $derived.by(() => {
		if (!clientId || lines.length === 0 || isSubmitting) return false;

		for (const line of lines) {
			if (line.line_type === 'contract' && !line.contract_id) {
				return false;
			}
		}

		return true;
	});

	const lineValidationErrors = $derived.by(() => {
		const errors: Record<string, string> = {};

		for (const line of lines) {
			if (line.line_type === 'contract' && !line.contract_id) {
				errors[line.id] = m.select_contract_for_line();
			}
		}

		return errors;
	});

	const hasLineValidationErrors = $derived.by(() => Object.keys(lineValidationErrors).length > 0);

	let showLineValidationErrors = $state(false);

	// Handlers
	function addLine() {
		lines = [
			...lines,
			{
				id: crypto.randomUUID(),
				line_type: 'manual',
				contract_id: '',
				service_type: 'ambulante',
				description: '',
				period_start: '',
				period_end: '',
				quantity: 1,
				unit: 'hour',
				unit_price: 0,
				vat_rate: 21,
				isSaved: false
			}
		];
	}

	function removeLine(id: string) {
		lines = lines.filter((l) => l.id !== id);
	}

	function toggleLineSave(id: string) {
		lines = lines.map((l) => (l.id === id ? { ...l, isSaved: !l.isSaved } : l));
	}

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const formatCurrency = (amount: number, currencyCode: string = 'EUR') => {
		return new Intl.NumberFormat(resolveLocale(), {
			style: 'currency',
			currency: currencyCode
		}).format(amount);
	};

	const toRFC3339 = (dateStr: string) => {
		if (!dateStr) return '';
		return `${dateStr}T00:00:00Z`;
	};

	async function loadClientOptions(query: string) {
		clientsLoadError = '';
		try {
			const res = await listClients({ search: query, page: 1, pageSize: 50 });
			return res.data.results;
		} catch (error) {
			clientsLoadError = error instanceof Error ? error.message : m.failed_load_clients();
			return [];
		}
	}

	async function handleClientChange(selectedClientId: string) {
		clientId = selectedClientId;
		submitError = '';
		contractsLoadError = '';
		clientContracts = [];
		lines = lines.map((line) =>
			line.line_type === 'contract' ? { ...line, contract_id: '' } : line
		);

		if (!selectedClientId) return;

		try {
			const res = await listClientContracts(selectedClientId, 1, 100);
			clientContracts = res.data.results;
		} catch (error) {
			contractsLoadError =
				error instanceof Error ? error.message : m.failed_load_client_contracts();
		}
	}

	async function loadContractOptions(query: string) {
		if (!clientId) return [];
		const normalized = query.trim().toLowerCase();
		if (!normalized) return clientContracts;

		return clientContracts.filter(
			(contract) =>
				contract.care_name.toLowerCase().includes(normalized) ||
				contract.financing_act.toLowerCase().includes(normalized) ||
				contract.financing_option.toLowerCase().includes(normalized)
		);
	}

	async function handleCreateDraftInvoice() {
		submitError = '';
		showLineValidationErrors = true;

		if (hasLineValidationErrors) {
			submitError = m.fix_contract_line_fields();
			return;
		}

		if (!canCreateInvoice) return;

		isSubmitting = true;
		try {
			const payload: CreateInvoiceRequest = {
				client_id: clientId,
				invoice_type: invoiceType,
				issue_date: toRFC3339(issueDate),
				due_date: toRFC3339(dueDate),
				lines: lines.map((line) => ({
					line_type: line.line_type,
					contract_id: line.line_type === 'contract' ? line.contract_id || null : null,
					service_type: line.service_type,
					description: line.description,
					period_start: toRFC3339(line.period_start || issueDate),
					period_end: toRFC3339(line.period_end || dueDate),
					quantity: Number(line.quantity),
					unit: line.unit,
					unit_price: Number(line.unit_price),
					vat_rate: Number(line.vat_rate)
				})),
				extra_content: {}
			};

			const response = await createInvoice(payload);
			const createdInvoiceId = response.data.id;

			if (createdInvoiceId) {
				goto(resolve('/(app)/finances/invoices/[id]', { id: createdInvoiceId }));
				return;
			}

			goto(resolve('/(app)/finances/invoices'));
		} catch (error) {
			submitError = error instanceof Error ? error.message : m.failed_create_draft_invoice();
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{m.draft_new_invoice()} | MaiCare</title>
</svelte:head>

{#snippet clientItem(option: ListClientsResponse)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.first_name} {option.last_name}</span>
		<div class="flex items-center gap-2 text-xs text-text-muted">
			<span>{m.bsn()}: {option.bsn}</span>
			<span class="h-1 w-1 rounded-full bg-border"></span>
			<span>{m.fn_prefix()} {option.filenumber}</span>
		</div>
	</div>
{/snippet}

{#snippet contractItem(option: ListClientContractsResponse)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.care_name}</span>
		<div class="flex items-center gap-2 text-xs text-text-muted">
			<span>{option.financing_act}</span>
			<span class="h-1 w-1 rounded-full bg-border"></span>
			<span>{option.financing_option}</span>
			<span class="h-1 w-1 rounded-full bg-border"></span>
			<span>{new Date(option.start_date).toLocaleDateString(resolveLocale())}</span>
		</div>
	</div>
{/snippet}

<div class="space-y-6 pb-20">
	<!-- Header -->
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-linear-to-br from-brand/10 to-emerald-500/5 blur-2xl"
		></div>
		<div class="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-4">
				<div class="space-y-4">
					<div class="hidden"></div>
					<div>
						<h1 class="text-2xl font-bold tracking-tight text-text">{m.draft_new_invoice()}</h1>
						<p class="text-sm font-medium text-text-muted">{m.manually_construct_invoice()}</p>
					</div>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="ghost"
					class="h-10 gap-2 px-4 ring-1 ring-border transition-all hover:bg-rose-500/10 hover:text-rose-600 hover:ring-rose-500/20 active:scale-95"
					>{m.discard()}</Button
				>
				<Button
					class="h-10 gap-2 px-6 shadow-md shadow-brand/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/30 active:translate-y-0 active:scale-95"
					onclick={handleCreateDraftInvoice}
					isLoading={isSubmitting}
					disabled={!canCreateInvoice}
				>
					<Save class="h-4 w-4" />
					{m.save_draft()}
				</Button>
			</div>
		</div>
	</header>

	<div class="grid gap-6 lg:grid-cols-[1fr_350px]">
		<!-- Main Form Column -->
		<div class="space-y-6">
			<!-- Meta Info Section -->
			<section
				class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-all hover:shadow-md"
			>
				<div class="border-b border-brand/10 bg-linear-to-r from-brand/5 to-transparent px-6 py-4">
					<h2 class="flex items-center gap-2 text-sm font-bold tracking-wider text-brand uppercase">
						<Receipt class="h-4 w-4" />
						{m.invoice_metadata()}
					</h2>
				</div>
				<div class="p-6">
					{#if clientsLoadError}
						<p class="mb-4 text-xs font-medium text-rose-600">{clientsLoadError}</p>
					{/if}
					{#if contractsLoadError}
						<p class="mb-4 text-xs font-medium text-rose-600">{contractsLoadError}</p>
					{/if}
					<div class="grid gap-6 sm:grid-cols-2">
						<SearchSelect
							label="{m.client()} *"
							bind:value={clientId}
							bind:displayValue={clientDisplayValue}
							placeholder={m.choose_client()}
							searchPlaceholder={m.search_clients()}
							loadOptions={loadClientOptions}
							onchange={handleClientChange}
							item={clientItem}
							labelFn={(client: ListClientsResponse) => `${client.first_name} ${client.last_name}`}
							valueFn={(client: ListClientsResponse) => client.id}
						/>
						<Select label={m.invoice_type()} options={INVOICE_TYPES} bind:value={invoiceType} />
						<Select label={m.initial_status()} options={INVOICE_STATUSES} bind:value={status} />
						<Input
							label={m.billing_timezone()}
							bind:value={billingTimezone}
							placeholder={m.billing_timezone_placeholder()}
						/>
						<DatePicker label={m.issue_date()} bind:value={issueDate} />
						<DatePicker label={m.due_date_label()} bind:value={dueDate} />
					</div>
				</div>
			</section>

			<!-- Lines Section -->
			<section
				class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-all hover:shadow-md"
			>
				<div
					class="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/10 bg-linear-to-r from-amber-500/5 to-transparent px-6 py-4"
				>
					<h2
						class="flex items-center gap-2 text-sm font-bold tracking-wider text-amber-600 uppercase dark:text-amber-500"
					>
						<FileText class="h-4 w-4" />
						{m.invoice_lines()}
					</h2>
					<Button
						variant="ghost"
						class="h-8 gap-2 text-xs font-semibold text-brand transition-all hover:scale-105 hover:bg-brand/10"
						onclick={addLine}
					>
						<Plus class="h-3.5 w-3.5" />
						{m.add_line()}
					</Button>
				</div>

				<div class="p-6">
					{#if lines.length === 0}
						<div
							class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center"
						>
							<Calculator class="mb-3 h-8 w-8 text-text-subtle opacity-50" />
							<p class="text-sm font-medium text-text">{m.no_lines_added()}</p>
							<p class="mt-1 text-xs text-text-muted">{m.add_lines_to_calculate()}</p>
							<Button
								variant="ghost"
								class="mt-4 h-8 gap-2 text-xs ring-1 ring-border"
								onclick={addLine}
							>
								<Plus class="h-3 w-3" />
								{m.add_first_line()}
							</Button>
						</div>
					{:else}
						<div class="space-y-6">
							{#each lines as line, i (line.id)}
								<div
									class={[
										'group relative rounded-2xl border border-border bg-zinc-50/30 p-5 transition-all hover:border-border/80 hover:bg-zinc-50/50 hover:shadow-sm dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40',
										line.isSaved &&
											'border-brand/20 bg-linear-to-br from-surface to-brand/5 ring-1 ring-brand/20'
									]}
								>
									<div
										class="absolute top-1/2 -left-3 hidden -translate-y-1/2 cursor-move text-text-subtle opacity-0 transition-all group-hover:-left-4 group-hover:opacity-100 sm:block"
									>
										<GripVertical class="h-5 w-5" />
									</div>

									<div
										class="mb-4 flex items-center justify-between border-b border-border/50 pb-4"
									>
										<div class="flex items-center gap-3">
											<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
												>{m.line_number({ number: i + 1 })}</span
											>
											{#if line.isSaved}
												<span
													class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-500/20 ring-inset dark:text-emerald-400"
													>{m.saved_label()}</span
												>
											{/if}
										</div>
										<div class="flex items-center gap-2">
											{#if line.isSaved}
												<Button
													variant="ghost"
													class="h-7 gap-1.5 px-2 text-xs text-text-subtle transition-colors hover:bg-brand/10 hover:text-brand"
													onclick={() => toggleLineSave(line.id)}
												>
													<Pencil class="h-3.5 w-3.5" />
													{m.edit()}
												</Button>
											{/if}
											<button
												class="rounded-lg p-1 text-text-subtle transition-all hover:bg-rose-500/10 hover:text-rose-500"
												onclick={() => removeLine(line.id)}
												aria-label={m.remove_line_label()}
											>
												<Trash2 class="h-4 w-4" />
											</button>
										</div>
									</div>

									{#if line.isSaved}
										<!-- Saved View -->
										<div class="grid gap-4 sm:grid-cols-12">
											<div class="space-y-1 sm:col-span-8">
												<p class="text-sm font-medium text-text">
													{line.line_type === 'contract'
														? clientContracts.find((c) => c.id === line.contract_id)?.care_name ||
															m.selected_contract()
														: line.description || m.no_description()}
												</p>
												<div class="flex flex-wrap items-center gap-3 text-xs text-text-muted">
													<span class="flex items-center gap-1">
														<span
															class="rounded bg-zinc-200/50 px-1.5 py-0.5 font-medium text-text-subtle dark:bg-zinc-800/50"
															>{LINE_TYPES.find((t) => t.value === line.line_type)?.label}</span
														>
													</span>
													{#if line.line_type !== 'contract'}
														<span class="flex items-center gap-1">
															<span class="text-text-subtle">{m.service_label()}</span>
															{SERVICE_TYPES.find((t) => t.value === line.service_type)?.label}
														</span>
													{/if}
													<span class="flex items-center gap-1">
														<span class="text-text-subtle">{m.qty_label()}</span>
														{line.quantity}
														{line.unit}
													</span>
													<span class="flex items-center gap-1">
														<span class="text-text-subtle">{m.rate_label()}</span>
														{formatCurrency(line.unit_price, currency)}
													</span>
												</div>
												{#if line.period_start || line.period_end}
													<p class="mt-2 flex items-center gap-1.5 text-xs text-text-subtle">
														<CalendarIcon class="h-3.5 w-3.5" />
														{line.period_start || m.not_available_short()}
														{m.to()}
														{line.period_end || m.not_available_short()}
													</p>
												{/if}
											</div>
											<div
												class="flex flex-col justify-end space-y-1 border-t border-border/50 pt-3 text-right sm:col-span-4 sm:border-t-0 sm:pt-0"
											>
												<p class="text-sm font-bold text-text">
													{formatCurrency(
														line.quantity * line.unit_price * (1 + line.vat_rate / 100),
														currency
													)}
												</p>
												<p class="text-[10px] tracking-wider text-text-muted uppercase">
													{m.gross_total()} ({line.vat_rate}% VAT)
												</p>
											</div>
										</div>
									{:else}
										<!-- Edit View -->
										<div class="grid gap-4 sm:grid-cols-12">
											<div class="sm:col-span-3">
												<Select label={m.type()} options={LINE_TYPES} bind:value={line.line_type} />
											</div>
											{#if line.line_type === 'contract'}
												<div class="sm:col-span-9">
													<SearchSelect
														label={m.contract_type_label()}
														placeholder={clientId
															? m.select_contract_placeholder()
															: m.select_client_first_placeholder()}
														searchPlaceholder={m.search_contracts_placeholder()}
														disabled={!clientId}
														loadOptions={loadContractOptions}
														item={contractItem}
														labelFn={(contract: ListClientContractsResponse) => contract.care_name}
														valueFn={(contract: ListClientContractsResponse) => contract.id}
														bind:value={line.contract_id}
													/>
													{#if showLineValidationErrors && lineValidationErrors[line.id]}
														<p class="mt-1 text-xs font-medium text-rose-600">
															{lineValidationErrors[line.id]}
														</p>
													{/if}
													<p class="mt-1 text-[10px] text-text-muted">
														{m.service_type_determined_by_contract()}
													</p>
												</div>
											{:else}
												<div class="sm:col-span-3">
													<Select
														label={m.service_type_label()}
														options={SERVICE_TYPES}
														bind:value={line.service_type}
													/>
												</div>
												<div class="sm:col-span-6">
													<Input
														label={m.description()}
														bind:value={line.description}
														placeholder={m.placeholder_service_description()}
													/>
												</div>
											{/if}

											<div class="sm:col-span-3">
												<Input
													label={m.qty_col()}
													type="number"
													step="0.01"
													bind:value={line.quantity}
												/>
											</div>
											<div class="sm:col-span-3">
												<Select label={m.unit()} options={UNIT_OPTIONS} bind:value={line.unit} />
											</div>
											<div class="sm:col-span-3">
												<Input
													label={m.unit_price()}
													type="number"
													step="0.01"
													bind:value={line.unit_price}
												/>
											</div>
											<div class="sm:col-span-3">
												<Input
													label={m.vat_percent()}
													type="number"
													step="0.1"
													bind:value={line.vat_rate}
												/>
											</div>

											<div class="sm:col-span-6">
												<DatePicker
													label={m.period_start_optional()}
													bind:value={line.period_start}
												/>
											</div>
											<div class="sm:col-span-6">
												<DatePicker label={m.period_end_optional()} bind:value={line.period_end} />
											</div>
										</div>

										<div
											class="mt-4 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm"
										>
											<div class="flex items-center gap-6">
												<div class="text-left">
													<p
														class="text-[10px] font-bold tracking-wider text-text-subtle uppercase"
													>
														{m.net_amount_label()}
													</p>
													<p class="font-medium text-text">
														{formatCurrency(line.quantity * line.unit_price, currency)}
													</p>
												</div>
												<div class="text-left">
													<p
														class="text-[10px] font-bold tracking-wider text-text-subtle uppercase"
													>
														{m.vat_amount()}
													</p>
													<p class="font-medium text-text">
														{formatCurrency(
															line.quantity * line.unit_price * (line.vat_rate / 100),
															currency
														)}
													</p>
												</div>
												<div class="text-left">
													<p class="text-[10px] font-bold tracking-wider text-brand uppercase">
														{m.gross_total()}
													</p>
													<p class="font-bold text-text">
														{formatCurrency(
															line.quantity * line.unit_price * (1 + line.vat_rate / 100),
															currency
														)}
													</p>
												</div>
											</div>
											<Button
												variant="ghost"
												class="hover:text-brand-foreground ml-auto h-8 gap-2 bg-brand/10 text-xs font-semibold text-brand ring-1 ring-brand/20 transition-all hover:bg-brand hover:ring-brand"
												onclick={() => toggleLineSave(line.id)}
											>
												<Check class="h-3.5 w-3.5" />
												{m.save_line()}
											</Button>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</section>
		</div>

		<!-- Sidebar Column -->
		<aside class="space-y-6">
			<!-- Summary Card -->
			<section
				class="sticky top-6 rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md"
			>
				<h3
					class="mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-500"
				>
					<Banknote class="h-4 w-4" />
					{m.invoice_totals()}
				</h3>

				<div class="space-y-4">
					<div class="flex justify-between text-sm">
						<span class="text-text-muted">{m.subtotal_pre_vat()}</span>
						<span class="font-medium text-text">{formatCurrency(totals.net, currency)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-text-muted">{m.vat_total()}</span>
						<span class="font-medium text-text">{formatCurrency(totals.vat, currency)}</span>
					</div>

					<div class="my-2 h-px w-full bg-border/50"></div>

					<div
						class="-mx-3 flex items-center justify-between rounded-xl bg-linear-to-br from-emerald-500/10 to-emerald-500/5 p-4 shadow-xs ring-1 ring-emerald-500/20 ring-inset"
					>
						<span class="text-base font-bold text-text">{m.total_gross()}</span>
						<span class="text-xl font-bold text-emerald-600 dark:text-emerald-400"
							>{formatCurrency(totals.gross, currency)}</span
						>
					</div>
				</div>

				<div class="mt-6">
					<Button
						class="w-full shadow-md shadow-brand/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/40 active:translate-y-0 active:scale-[0.98]"
						disabled={!canCreateInvoice}
						onclick={handleCreateDraftInvoice}
						isLoading={isSubmitting}
					>
						{m.create_draft_invoice()}
					</Button>
					{#if !clientId}
						<p class="mt-2 text-center text-xs font-medium text-amber-600 dark:text-amber-500">
							{m.client_is_required()}
						</p>
					{/if}
					{#if submitError}
						<p class="mt-2 text-center text-xs font-medium text-rose-600">{submitError}</p>
					{/if}
				</div>

				<!-- Workflow Cues -->
				<div
					class="mt-6 rounded-xl border border-border/50 bg-zinc-50 p-4 transition-colors hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"
				>
					<h4
						class="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-text-subtle uppercase"
					>
						<FileText class="h-3.5 w-3.5" />
						{m.tips()}
					</h4>
					<ul class="list-disc space-y-2 pl-4 text-xs text-text-muted">
						<li>{m.save_each_line_tip()}</li>
						<li>{m.contract_lines_tip()}</li>
						<li>{m.eur_tip()}</li>
					</ul>
				</div>
			</section>
		</aside>
	</div>
</div>
