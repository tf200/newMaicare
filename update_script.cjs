const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/components/forms/ManageShiftsForm.svelte');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update DraftShift type
content = content.replace(
	/type DraftShift = \{[\s\S]*?\};/,
	`type DraftShift = {
		_localId: string;
		data: ShiftModel;
		isSaving: boolean;
		saveSuccess: boolean;
		error: string | null;
		isEditing: boolean;
	};`
);

// 2. Update initialization in $effect
content = content.replace(
	/error: null\s*\}\)\);/g,
	`error: null,
				isEditing: false
			}));`
);

// 3. Update addShift
content = content.replace(
	/error: null\s*\}\s*\];/g,
	`error: null,
				isEditing: true
			}
		];`
);

// 4. Update saveShift to include draft.isEditing = false;
content = content.replace(
	/draft\.isSaving = false;\s*draft\.saveSuccess = true;/g,
	`draft.isSaving = false;
			draft.saveSuccess = true;
			draft.isEditing = false;`
);

// 5. Add cancelEdit and startEdit after saveShift
const cancelEditCode = `
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
`;
content = content.replace(/(const saveShift =[\s\S]*?\}, 220\);\s*\};)/, `$1\n${cancelEditCode}`);

// 6. Replace the {#each draftShifts... block
const newEachBlock = `{#each draftShifts as draft, i (draft._localId)}
							<div
								class="relative flex flex-col gap-6 rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10 hover:border-brand/30"
							>
								{#if !draft.isEditing}
									<div class="flex items-start justify-between gap-4">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-3">
												<h4 class="truncate text-2xl font-black tracking-tight text-text">
													{draft.data.shift || \`Shift \${i + 1}\`}
												</h4>
												{#if draft.data.id}
													<span
														class="inline-flex items-center rounded-md bg-brand/10 px-2 py-1 text-xs font-bold text-brand ring-1 ring-inset ring-brand/20"
													>
														ID: {draft.data.id.split('-')[0]}
													</span>
												{:else}
													<span
														class="inline-flex items-center rounded-md bg-brand/10 px-2 py-1 text-xs font-bold text-brand ring-1 ring-inset ring-brand/20"
													>
														Unsaved Draft
													</span>
												{/if}
											</div>
											<div class="mt-2 flex items-center gap-2 text-sm font-medium text-text-muted">
												<Clock class="h-4 w-4" />
												<span>{draft.data.start_time} &mdash; {draft.data.end_time}</span>
											</div>
										</div>

										<div class="flex shrink-0 items-center gap-2">
											<button
												type="button"
												class="flex h-11 px-4 items-center justify-center rounded-2xl bg-surface text-sm font-bold text-text-subtle shadow-sm ring-1 ring-border transition-all hover:bg-bg hover:text-text hover:ring-border-strong focus:ring-2 focus:ring-brand/50 focus:outline-none"
												onclick={() => startEdit(draft._localId)}
											>
												Edit
											</button>
											<button
												type="button"
												class="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-text-subtle shadow-sm ring-1 ring-border transition-all hover:bg-error hover:text-white hover:ring-error focus:ring-2 focus:ring-error/50 focus:outline-none"
												onclick={() => removeShift(draft._localId)}
												title="Remove shift"
											>
												<Trash2 class="h-4 w-4" />
											</button>
										</div>
									</div>
									{#if draft.saveSuccess}
										<div
											class="absolute -top-3 right-6 rounded-full bg-success px-3 py-1 text-xs font-bold text-white shadow-sm animate-in fade-in slide-in-from-top-2"
										>
											Saved locally
										</div>
									{/if}
								{:else}
									<div class="flex flex-col gap-5">
										<div class="grid gap-5 sm:grid-cols-2">
											<div class="sm:col-span-2">
												<Input
													placeholder="Shift Name (e.g. Ochtenddienst)"
													bind:value={draft.data.shift}
												/>
											</div>
											<div>
												<Input
													label="Start"
													type="time"
													value={draft.data.start_time.slice(0, 5)}
													oninput={(e) => (draft.data.start_time = e.currentTarget.value)}
												/>
											</div>
											<div>
												<Input
													label="End"
													type="time"
													value={draft.data.end_time.slice(0, 5)}
													oninput={(e) => (draft.data.end_time = e.currentTarget.value)}
												/>
											</div>
										</div>

										{#if draft.error}
											<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
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
												Cancel
											</Button>
											<Button
												type="button"
												variant="secondary"
												onclick={() => saveShift(draft._localId)}
												isLoading={draft.isSaving}
												class="w-full min-w-[140px] sm:w-auto"
											>
												Save shift
											</Button>
										</div>
									</div>
								{/if}
							</div>
						{/each}`;

content = content.replace(
	/{#each draftShifts as draft, i \(draft\._localId\)}[\s\S]*?{\/each}/,
	newEachBlock
);

fs.writeFileSync(filePath, content);
console.log('Updated ManageShiftsForm.svelte');
