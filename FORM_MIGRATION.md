# Form Validation Migration Plan

This document outlines the migration from manual Svelte 5 Rune-based validation to a schema-driven architecture using **SvelteKit Superforms** and **Valibot**.

## 1. Vision & Architecture

### Current State (Manual)
- **Logic:** Scattered inside `.svelte` components.
- **State Management:** Multiple `$state` runes for `formData`, `errors`, `isLoading`, and `errorMessage`.
- **Validation:** Manual `if/else` checks or regex inside a `validate()` function.
- **Maintenance:** High risk of drift between "Create" and "Edit" forms.

### Target State (Schema-Driven)
- **Logic:** Centralized in `src/lib/schemas/*.ts`.
- **State Management:** Unified `superForm` object.
- **Validation:** Declarative schemas using **Valibot** (High performance, tree-shakeable).
- **Maintenance:** Single source of truth for both types and validation rules.

---

## 2. New Directory Structure

```text
src/lib/
├── schemas/                # NEW: Domain schemas & validation logic
│   ├── client.ts
│   ├── contract.ts
│   ├── progress-report.ts
│   └── ...
├── components/
│   └── forms/             # UPDATED: Simplified UI-only components
└── types/
    └── api/               # UPDATED: Interfaces derived from schemas
```

---

## 3. The "Gold Standard" Pattern

### A. The Schema (`src/lib/schemas/progress-report.ts`)
```typescript
import * as v from 'valibot';

export const ProgressReportSchema = v.object({
    date: v.pipe(v.string(), v.isoDate('Invalid date format')),
    title: v.pipe(v.string(), v.minLength(1, 'Title is required')),
    report_text: v.pipe(v.string(), v.minLength(1, 'Report text is required')),
    type: v.picklist([
        'morning_report', 'evening_report', 'night_report', 
        'shift_report', 'one_to_one_report', 'process_report', 
        'contact_journal', 'other'
    ]),
    emotional_state: v.picklist([
        'normal', 'excited', 'happy', 'sad', 'angry', 'anxious', 'depressed'
    ])
});

export type ProgressReportInput = v.InferOutput<typeof ProgressReportSchema>;
```

### B. The Component (`src/lib/components/forms/CreateProgressReportModal.svelte`)
```html
<script lang="ts">
    import { superForm } from 'sveltekit-superforms';
    import { valibotClient } from 'sveltekit-superforms/adapters';
    import { ProgressReportSchema } from '$lib/schemas/progress-report';

    const { form, errors, enhance, delayed } = superForm(data, {
        validators: valibotClient(ProgressReportSchema),
        SPA: true,
        onUpdate: ({ form }) => {
            if (form.valid) {
                handleSave(form.data);
            }
        }
    });
</script>

<form use:enhance>
    <Input label="Title" bind:value={$form.title} error={$errors.title} />
    <!-- ... -->
    <Button loading={$delayed}>Save</Button>
</form>
```

---

## 4. Migration Progress Tracker

### Core Forms
- [x] `CreateContractForm.svelte`
- [x] `EditContractForm.svelte`
- [x] `CreateEmployeeForm.svelte`
- [x] `CreateOrganizationForm.svelte`
- [x] `EditOrganizationForm.svelte`
- [x] `CreateSenderForm.svelte` (Gold Standard)
- [x] `EditSenderForm.svelte`
- [x] `CreateLocationForm.svelte`
- [x] `EditLocationForm.svelte`
- [x] `CreateIncidentForm.svelte`
- [x] `CreateEvaluationForm.svelte`
- [x] `AppointmentForm.svelte`

### Client-Specific Forms
- [x] `PutClientInCareForm.svelte`
- [x] `PutClientOutOfCareForm.svelte`
- [x] `ProcessRegistrationForm.svelte`
- [x] `CreateDiagnosisModal.svelte`
- [x] `EditDiagnosisModal.svelte`
- [x] `CreateMedicationOrderModal.svelte`
- [x] `EditMedicationOrderModal.svelte`
- [x] `CreateProgressReportModal.svelte`

### Financial Forms
- [x] `AddInvoicePaymentSheet.svelte`
- [x] `EditInvoicePaymentSheet.svelte`

---

## 5. How to Migrate a Form (Step-by-Step)

1. **Analyze:** Look at the current `validate()` function and `interface` in `api.d.ts`.
2. **Schema:** Create a new file in `src/lib/schemas/` and define the Valibot object.
3. **Refactor Types:** Update the `Request` interface in `api.d.ts` to use `v.InferOutput<typeof Schema>`.
4. **Refactor Component:**
    - Import `superForm` and `valibotClient`.
    - Initialize `superForm` with the schema.
    - Replace local `$state` variables with `$form` bindings.
    - Replace local `errors` with `$errors`.
5. **Verify:** Ensure `required` props and error messages match the original implementation.
