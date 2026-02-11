## Runtime & Package Manager

- **Package manager:** Bun. Prefer `bun`/`bunx` over `npm`/`npx` for installs, scripts, and one-off CLIs.

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## UI/UX Guidelines:

Make sure to read UIUX.md for tips on how to make the UI/UX

## Architecture & Code Standards

### Core Principles

- **CSR Only:** `ssr` is disabled globally. All logic runs in the browser.
- **Svelte 5 Runes:** Use `$state`, `$derived`, `$effect` for reactivity. Avoid legacy stores (`writable`/`readable`) unless interfacing with external libraries.
- **Strict Typing:** All components and API calls must be strictly typed using TypeScript interfaces/types.
- **Separation of Concerns:** UI components are "dumb" (pure presentation), Pages/Layouts are "smart" (data fetching/state connection).

### Folder Structure Rules

- `src/lib/api`: HTTP client, endpoints, and WebSocket managers.
- `src/lib/components/ui`: Reusable, atomic UI components (Buttons, Inputs, Cards). No side effects or API calls.
- `src/lib/components/layout`: Structural components (Sidebar, Navbar).
- `src/lib/config`: App-wide constants and configuration.
- `src/lib/state`: Global state management using Context + Runes (`*.svelte.ts`).
- `src/lib/types`: TypeScript definitions (`api.d.ts`, `models.d.ts`).
- `src/routes/(app)`: Protected dashboard routes (requires authentication).
- `src/routes/(auth)`: Public authentication routes (Login/Register).

### Data Fetching & API

- **Route Data:** Use `+page.ts` `load` functions for initial data fetching (runs in browser).
- **Client:** Use `src/lib/api/client.ts` wrapper for `fetch`. It handles Authorization headers and 401 redirects.
- **WebSockets:** Use `src/lib/api/ws.svelte.ts` for real-time connections.

### Streaming Pattern for Listing/Detail Pages

- **Default for table pages:** Prefer SvelteKit streaming over blocking `await Promise.all(...)` in `+page.ts`.
- **Load contract:** Return synchronous `initial` URL state (page/pageSize/filters/sort) and one or more promise fields (for example `clientsData`, `locationsData`, `countsData`).
- **Promise payload shape:** Each streamed payload should be fully typed and include:
  - resolved data (rows/cards/detail objects)
  - UI metadata (pagination/sort when relevant)
  - `loadError: string | null`
- **Error handling:** Catch per request and resolve safe fallback data instead of throwing; this keeps unaffected sections rendering.
- **Component consumption:** In `+page.svelte`, use independent `{#await ...}` blocks per section (header/cards/table), so slow endpoints do not block the full page.
- **Table loading UX:** Use `DataTable` with `loading` prop during pending states (`rows={[]}` + `loading`) to show skeleton rows and preserve layout.
- **Pagination/filter stability:** Build query params from `initial` state and keep existing `goto(..., { replaceState: true, keepFocus: true, noScroll: true })` behavior.
- **Stats/KPIs:** Compute KPIs from resolved streamed data in the `{#await ... :then}` branch, or stream a dedicated `stats` promise when needed.
- **Resilience rule:** One failing API must not blank the whole page; render partial content + inline error banner for failed section.
- **Type exports:** Export `*LoadResult` interfaces from route `+page.ts` when they are consumed by `+page.svelte`.

### Component Logic

- **Props:** Use `$props()` for input.
- **Events:** Pass callbacks as props (e.g., `onSave`, `onCancel`) or use standard events.
- **State:** Use local `$state` for UI interactions (open/close) and global state for shared data.

### i18n (Internationalization)

- **Tool:** Paraglide-JS (Compiler-based).
- **Locales:** `en` (base), `nl`.
- **Source:** `messages/*.json`.
- **Runtime:** `$lib/paraglide`.
- **Usage:** `import { m } from '$lib/paraglide/messages'`. Call as functions: `{m.key()}`.
- **Routing:** Handled via `localizeHref` and `reroute` hook.
