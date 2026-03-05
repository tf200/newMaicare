<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { createLocationShift, updateLocationShift } from '$lib/api/organizations';
	import type { OrganizationLocation } from '$lib/types/api';
	import { Plus, Trash2, Clock } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		open?: boolean;
		location?: OrganizationLocation | null;
		isFetching?: boolean;
		loadErrorMessage?: string;
		onUpdated?: () => void;
	}

	let {
		open = $bindable(false),
		location = null,
		isFetching = false,
		loadErrorMessage,
		onUpdated
	}: Props = $props();

	type ShiftModel = {
		id?: string;
		location_id?: string;
		shift: string;
		start_time: string;
		end_time: string;
	};

	type SavedShift = ShiftModel & { _localId: string };
	type DraftShift = {
		_localId: string;
		data: ShiftModel;
		isSaving: boolean;
		saveSuccess: boolean;
		error: string | null;
		isEditing: boolean;
	};

	let savedShifts = $state<SavedShift[]>([]);
	let draftShifts = $state<DraftShift[]>([]);
	let initializedLocationId = $state<string | null>(null);

	$effect(() => {
		if (location && location.id !== initializedLocationId) {
			initializedLocationId = location.id;
			const locationWithShifts = location as OrganizationLocation & { shifts?: ShiftModel[] };
			const initial = locationWithShifts.shifts ?? [];

			savedShifts = initial.map((s: ShiftModel) => ({
				...s,
				_localId: s.id || crypto.randomUUID()
			}));

			draftShifts = savedShifts.map((s) => ({
				_localId: s._localId,
				data: { ...s },
				isSaving: false,
				saveSuccess: false,
				error: null,
				isEditing: false
			}));
		}
	});

	const handleCancel = () => {
		open = false;
	};

	const toApiTime = (value: string) => (value.length === 5 ? `${value}:00` : value);

	const addShift = () => {
		if (draftShifts.length >= 4) return;

		const newShift: ShiftModel = {
			shift: '',
			start_time: '08:00',
			end_time: '16:00'
		};

		draftShifts = [
			...draftShifts,
			{
				_localId: crypto.randomUUID(),
				data: newShift,
				isSaving: false,
				saveSuccess: false,
				error: null,
				isEditing: true
			}
		];
	};

	const removeShift = (localId: string) => {
		draftShifts = draftShifts.filter((d) => d._localId !== localId);
		savedShifts = savedShifts.filter((s) => s._localId !== localId);
	};

	const saveShift = async (localId: string) => {
		const draft = draftShifts.find((d) => d._localId === localId);
		if (!draft) return;
		if (!location?.id) {
			draft.error = m.location_unavailable();
			return;
		}

		if (!draft.data.shift.trim() || !draft.data.start_time || !draft.data.end_time) {
			draft.error = m.fill_all_fields();
			return;
		}

		draft.error = null;
		draft.isSaving = true;
		draft.saveSuccess = false;

		const payload = {
			shift: draft.data.shift.trim(),
			start_time: toApiTime(draft.data.start_time),
			end_time: toApiTime(draft.data.end_time)
		};

		try {
			const response = draft.data.id
				? await updateLocationShift(location.id, draft.data.id, payload)
				: await createLocationShift(location.id, payload);

			const persistedShift = { ...response.data, _localId: localId };
			const newSavedShifts = [...savedShifts];
			const savedIndex = newSavedShifts.findIndex((s) => s._localId === localId);

			if (savedIndex >= 0) {
				newSavedShifts[savedIndex] = persistedShift;
			} else {
				newSavedShifts.push(persistedShift);
			}

			savedShifts = newSavedShifts;
			draft.data = { ...response.data };
			draft.isEditing = false;
			draft.saveSuccess = true;
			onUpdated?.();

			setTimeout(() => {
				draft.saveSuccess = false;
			}, 3000);
		} catch (error) {
			draft.error = error instanceof Error ? error.message : m.failed_save_shift();
		} finally {
			draft.isSaving = false;
		}
	};

	const cancelEdit = (localId: string) => {
		const draft = draftShifts.find((d) => d._localId === localId);
		if (!draft) return;

		const saved = savedShifts.find((s) => s._localId === localId);
		if (saved) {
			draft.data = { ...saved };
			draft.isEditing = false;
			draft.error = null;
		} else {
			removeShift(localId);
		}
	};

	const startEdit = (localId: string) => {
		const draft = draftShifts.find((d) => d._localId === localId);
		if (draft) draft.isEditing = true;
	};
</script>

<Modal
	bind:open
	title={m.manage_shifts()}
	description={m.manage_shifts_description({
		location: location?.name ?? m.this_location()
	})}
>
	<div class="space-y-6">
		{#if isFetching}
			<div class="rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text-muted">
				{m.loading_location_details()}
			</div>
		{/if}
		{#if loadErrorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{loadErrorMessage}
			</div>
		{/if}
		<div class="rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-text-muted">
			{m.shift_save_persisted_notice()}
		</div>

		{#if location && !isFetching}
			<div class="space-y-6">
				{#if draftShifts.length === 0}
					<div
						class="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-surface px-4 py-16 text-center"
					>
						<div
							class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-inner"
						>
							<Clock class="h-8 w-8" />
						</div>
						<div>
							<h3 class="text-lg font-bold tracking-tight text-text">{m.no_shifts_defined()}</h3>
							<p class="mt-1 text-sm font-medium text-text-muted">
								{m.add_first_shift_help()}
							</p>
						</div>
					</div>
				{:else}
					<div class="space-y-5">
						{#each draftShifts as draft, i (draft._localId)}
							<div
								class="relative flex flex-col gap-6 rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10 hover:border-brand/30"
							>
								{#if !draft.isEditing}
									<div class="flex items-start justify-between gap-4">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-3">
												<h4 class="truncate text-2xl font-black tracking-tight text-text">
													{draft.data.shift || m.shift_number({ number: i + 1 })}
												</h4>
											</div>
											<div class="mt-2 flex items-center gap-2 text-sm font-medium text-text-muted">
												<Clock class="h-4 w-4" />
												<span
													>{draft.data.start_time.slice(0, 5)} &mdash; {draft.data.end_time.slice(
														0,
														5
													)}</span
												>
											</div>
										</div>

										<div class="flex shrink-0 items-center gap-2">
											<button
												type="button"
												class="hover:ring-border-strong flex h-11 items-center justify-center rounded-2xl bg-surface px-4 text-sm font-bold text-text-subtle shadow-sm ring-1 ring-border transition-all hover:bg-bg hover:text-text focus:ring-2 focus:ring-brand/50 focus:outline-none"
												onclick={() => startEdit(draft._localId)}
											>
												{m.edit()}
											</button>
											<button
												type="button"
												class="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-text-subtle shadow-sm ring-1 ring-border transition-all hover:bg-error hover:text-white hover:ring-error focus:ring-2 focus:ring-error/50 focus:outline-none"
												onclick={() => removeShift(draft._localId)}
												title={m.remove_shift()}
											>
												<Trash2 class="h-4 w-4" />
											</button>
										</div>
									</div>
									{#if draft.saveSuccess}
										<div
											class="animate-in fade-in slide-in-from-top-2 absolute -top-3 right-6 rounded-full bg-success px-3 py-1 text-xs font-bold text-white shadow-sm"
										>
											{m.saved_label()}
										</div>
									{/if}
								{:else}
									<div class="flex flex-col gap-5">
										<div class="grid gap-5 sm:grid-cols-2">
											<div class="sm:col-span-2">
												<Input
													placeholder={m.placeholder_shift_name()}
													bind:value={draft.data.shift}
												/>
											</div>
											<div>
												<Input
													label={m.start()}
													type="time"
													value={draft.data.start_time.slice(0, 5)}
													oninput={(e) => (draft.data.start_time = e.currentTarget.value)}
												/>
											</div>
											<div>
												<Input
													label={m.end()}
													type="time"
													value={draft.data.end_time.slice(0, 5)}
													oninput={(e) => (draft.data.end_time = e.currentTarget.value)}
												/>
											</div>
										</div>

										{#if draft.error}
											<div
												class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
											>
												{draft.error}
											</div>
										{/if}

										<div class="flex items-center justify-end gap-3 pt-2">
											<Button
												type="button"
												variant="ghost"
												onclick={() => cancelEdit(draft._localId)}
												class="w-full sm:w-auto"
											>
												{m.cancel()}
											</Button>
											<Button
												type="button"
												variant="secondary"
												onclick={() => saveShift(draft._localId)}
												isLoading={draft.isSaving}
												class="w-full min-w-[140px] sm:w-auto"
											>
												{m.save_shift()}
											</Button>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				<Button
					type="button"
					variant="ghost"
					class="w-full gap-3 rounded-3xl border-2 border-dashed border-border py-8 text-text-muted transition-all hover:border-brand hover:bg-brand/5 hover:text-brand"
					onclick={addShift}
					disabled={draftShifts.length >= 4}
				>
					<Plus class="h-6 w-6" />
					<span class="text-base font-bold tracking-tight">
						{m.add_shift()}
						{draftShifts.length >= 4 ? m.max_shifts_reached() : ''}
					</span>
				</Button>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex justify-end">
			<Button variant="ghost" onclick={handleCancel} class="w-full sm:w-auto">{m.close()}</Button>
		</div>
	{/snippet}
</Modal>
