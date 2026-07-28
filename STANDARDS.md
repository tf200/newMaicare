# MaiCare Engineering And UI Standards

This document is the authoritative standard for new development and refactoring in the MaiCare application. It applies alongside `AGENTS.md`.

`src/routes/layout.css` is the authoritative visual-token source. Do not copy visual values from older documents or another application.

## 1. Runtime And Tooling

- MaiCare is a client-side rendered static SPA. `src/routes/+layout.ts` defines `ssr = false`, `prerender = false`, and `trailingSlash = 'always'`.
- Use Bun for dependency management and scripts. Do not update a second package-manager lockfile.
- Use TypeScript for all application code. Public component props, API payloads, load results, and state models must be explicitly typed.
- Run `bun run check` and `bun run lint` before considering a change complete. Document unrelated existing failures rather than hiding them.
- Use Prettier formatting. Do not introduce formatting-only churn outside the files being changed.

## 2. Architecture And File Placement

- `src/lib/api/`: typed API service modules and the centralized HTTP client.
- `src/lib/components/ui/`: reusable, presentational components. No API calls, route knowledge, or domain business logic.
- `src/lib/components/layout/`: shared application shell components.
- `src/lib/components/forms/`: reusable domain form components. Form orchestration is allowed here; endpoint paths remain in `src/lib/api/`.
- `src/lib/state/`: global context-backed rune state in `*.svelte.ts` files.
- `src/lib/schemas/`: first-party Valibot schemas.
- `src/lib/types/`: shared API, model, and UI types.
- `src/routes/**/_components/` or `src/routes/**/components/`: components used only by that route or route subtree.

Keep pages and layouts as data-connected containers. Keep UI components pure and reusable. Do not place route-specific components in `$lib/components` merely for convenience.

## 3. Routing, Navigation, And Localization

- Use route-local `+page.ts` and `+layout.ts` files for URL parsing, guards, and API loading. Do not put DOM work or component state in load functions.
- Keep the root authentication and two-factor redirect flow intact. Authentication is browser-based and is handled by the root layout plus the API client.
- Use Paraglide for user-visible strings: `import { m } from '$lib/paraglide/messages'`.
- Use SvelteKit path resolution for app-owned links and navigation. Prefer `resolve('/(app)/clients/[id]', { id })` for known dynamic routes.
- Do not add raw interpolated internal URLs when a route pattern can be resolved safely.
- When a shared navigation helper is introduced, all ordinary internal navigation must use it. Until then, keep `resolve`, localization, and `goto` use local and type-safe.
- Sidebar and other primary navigation links should use `data-sveltekit-preload-data="hover"` or `"tap"` where preloading is appropriate.

## 4. Data Loading And Responsive Navigation

- Use non-`async` `PageLoad`/`LayoutLoad` functions when returning synchronous URL state and unresolved API promises.
- Return synchronous `initial` URL state plus independent named promise fields for independently renderable sections.
- Each promise payload must be fully typed and resolve safely with its data, UI metadata, and `loadError: string | null`.
- Render independent sections with separate `{#await}` blocks. Use layout-matched skeletons while pending and inline errors for failed sections.
- A failing optional API must not blank unaffected content.
- Table filters, sort, and pagination belong in URL query parameters. Preserve `goto(..., { replaceState: true, keepFocus: true, noScroll: true })` behavior.
- API services called from load functions must receive the load event's `fetch` implementation where supported by that service.
- Do not use `invalidateAll()` for a retry of one section. Declare named dependencies with `depends('app:<route>:<section>')` and invalidate the specific list or stats section.
- Place URL-independent, stable aggregate requests in a route-local `+layout.ts` where feasible. This prevents table query changes from refetching them.
- Requests whose result genuinely depends on active filters must be query-dependent and may reload when those filters change.
- For page-triggered requests outside `load`, use `AbortController` or an equivalent latest-request guard so stale responses cannot overwrite newer results.

## 5. API Client And Error Handling

- Never hardcode API endpoint strings or call global `fetch` directly in pages or UI components.
- API services own endpoint paths, request construction, response typing, and payload mapping.
- Use `src/lib/api/client.ts` and its `api` instance. It owns authorization headers, token refresh, 401 handling, and login redirects.
- Preserve `ApiEnvelope`, `ApiClientError`, and domain API type conventions.
- Catch expected load failures per request and return a typed fallback payload. Show an `InlineErrorBanner` or the relevant component-level error treatment with a targeted retry.
- Mutations must invalidate only the resources they change. Invalidate both list and aggregate resources when the mutation affects both.

## 6. Svelte 5 State

- Use `$props()` for component inputs and callback props for component events.
- Use `$state` for local interactive state, modal state, and forms that are mutated field by field.
- Use `$state.raw` by default for large API datasets held in component state. Replace references rather than mutating nested records.
- Use `$derived` or `$derived.by` for values computed from reactive state.
- Do not write derived state inside `$effect`.
- Use `$effect` only for external side effects such as WebSockets, browser listeners, timers, analytics, and imperative libraries. Return cleanup for every listener, timer, subscription, or external instance.
- Shared runtime state belongs in a context-backed class under `src/lib/state/`. Do not add global mutable singleton stores.

## 7. Forms And Validation

- First-party persisted domain forms use Valibot schemas in `src/lib/schemas/` and Superforms in SPA mode.
- Do not introduce new Zod usage. Existing Zod dependencies are legacy until intentionally migrated.
- Search, filters, tabs, sorting, pagination, and other non-persistent controls may use typed local state and URL query parameters without Superforms.
- Disable duplicate submissions, show a pending state, and surface field errors through the shared input component's `error` prop.
- Display top-level API failures in a visible form error banner.
- Reset modal form state when a modal closes without saving, and reset/close it after a successful mutation.

## 8. Design System

### Source Of Truth

Use semantic Tailwind utilities backed by `src/routes/layout.css`:

- Background: `bg-bg`
- Surface: `bg-surface`
- Border: `border-border`
- Primary text: `text-text`
- Secondary text: `text-text-muted`
- Subtle text: `text-text-subtle`
- Brand: `bg-brand`, `text-brand`, `border-brand`
- Brand emphasis: `bg-brand-strong`, `text-brand-strong`
- Secondary accent: `bg-secondary`, `text-secondary`
- Status colors: `success`, `error`, `warning`, and `info`

Do not use arbitrary hex colors. Add a named token to `layout.css` when an intentional system color is missing. The root CSS already defines light and dark values; prefer semantic tokens so both modes work automatically.

### Shape, Depth, And Type

- Cards use `rounded-3xl`, `border-border`, `bg-surface`, and the card shadow token or established `shadow-sm` treatment.
- Inputs and buttons use `rounded-xl`.
- Compact badges use `rounded-lg` or `rounded-full`.
- The application font is Plus Jakarta Sans, configured by `layout.css`.
- Page titles use `text-2xl font-bold tracking-tight` unless an established page pattern requires a larger responsive title.
- Section headers use `text-lg font-semibold tracking-tight`.
- Body and controls use `text-sm`; captions use `text-xs text-text-muted`.
- Prefer `gap-2` for compact internals, `gap-4` for standard groups, `gap-6` for cards and page sections, and `gap-8` for major layout separation.

### Interaction, Accessibility, And Motion

- Every interactive element needs a visible hover, focus-visible, disabled, and destructive state when applicable.
- Maintain readable contrast in light and dark mode for text, icons, borders, loading skeletons, empty states, and error states.
- Use native controls where possible. Icon-only controls require an accessible name.
- Preserve the global reduced-motion behavior. Do not add motion that prevents understanding or blocks interaction.
- Build mobile-first layouts and verify narrow, desktop, light, and dark views.

## 9. Reusable UI Contracts

### StatCard

- `src/lib/components/ui/StatCard.svelte` is the standard KPI card.
- Use it for summary metrics rather than reproducing card markup in route pages.
- A metric must clearly identify its scope: global, active-filter aggregate, or current-page value.
- Do not label a current-page calculation as a global total.
- Stable global metrics must not reload merely because a table page, sort, or unrelated filter changes.

### DataTable

- `src/lib/components/ui/DataTable.svelte` is the standard listing table.
- Use explicit `pagination={{ mode: 'server', ... }}` for server-paginated listings and `pagination={false}` for local/detail panels without pagination.
- Prefer `toolbar` for new table controls. Legacy `filters` and `actions` props remain only during migration.
- Supply typed empty-state actions and inline error/retry treatment where needed.
- Row actions and controls must not trigger row navigation; use the table's built-in click protection or `data-table-stop-row-click` for custom controls.

## 10. Tailwind And CSS

- Use Tailwind v4 utilities and the semantic theme tokens defined in `layout.css`.
- Prefer existing spacing, sizing, and color utilities over arbitrary values.
- Add named tokens intentionally when the system needs a new reusable value.
- Keep component-scoped CSS small and purposeful. Use it only for layout primitives, necessary browser workarounds, or non-utility animations.
- Do not create page-local visual systems that compete with shared UI components and tokens.

## 11. Permission Gating & Authorization Standard

All permission checking must use the centralized `PERMISSIONS` object constant defined in `src/lib/config/permissions.ts`. Never use raw string literals (e.g. `'CLIENT.VIEW'`) for permission checks.

### Single Source Of Truth
- Import `PERMISSIONS` from `$lib/config/permissions`.
- Use domain-scoped values such as `PERMISSIONS.CLIENT.VIEW`, `PERMISSIONS.INVOICE.CREATE`, `PERMISSIONS.REGISTRATION_FORM.UPDATE`.

### Two-Tier Gating Pattern

#### 1. Page & Route Protection (`+page.ts` Load Function)
- Page routes must enforce permission validation at the top of their browser `+page.ts` `load()` function before executing API calls.
- If the user lacks permission, throw `error(403, 'You do not have permission to view this resource.')`. SvelteKit will automatically intercept the 403 error and render the shared `+error.svelte` layout containing the `<AccessDenied />` UI.
- Example:
  ```ts
  export const load: PageLoad = ({ url, fetch, depends }) => {
  	const auth = getAuthState();
  	if (!auth.hasAnyPermission([PERMISSIONS.REGISTRATION_FORM.VIEW, PERMISSIONS.CARE_COORDINATION.VIEW])) {
  		error(403, 'You do not have permission to view registrations.');
  	}
  	// ... Proceed with API data loading ...
  };
  ```

#### 2. Feature & Action Protection (`<PermissionGuard>` Template Wrapper)
- Inside page components, use `<PermissionGuard permission={PERMISSIONS...}>` to gate action controls, buttons, forms, and tabs.
- Do not wrap entire page layouts in `<PermissionGuard>` HOCs when route gating is already handled in `+page.ts`.
- Action buttons hide silently when permission is missing (default `<PermissionGuard>` behavior).
- Example:
  ```svelte
  <PermissionGuard permission={PERMISSIONS.REGISTRATION_FORM.UPDATE}>
  	<button onclick={processForm}>Process Application</button>
  </PermissionGuard>
  ```

## 12. Completion Checklist

- Types are explicit and `bun run check` is clean, or unrelated existing failures are recorded.
- `bun run lint` passes for the changed scope.
- Data loads independently, errors are recoverable, and retries are targeted.
- Mutations invalidate only affected data resources.
- UI uses semantic theme tokens and works in light/dark and mobile/desktop layouts.
- User-visible copy is localized through Paraglide.
- Reusable UI was used or intentionally extended instead of duplicated.
