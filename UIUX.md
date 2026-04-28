# Nexus Zinc Design System

## Philosophy

Swiss typography + Apple shapes + Bento grids. High whitespace, hyper-rounded corners (rounded-2xl/3xl), glassmorphism depth, zinc greys with indigo/emerald accents.

## Colors (Tailwind)

**Neutrals:**

- BG: `bg-zinc-50` / `dark:bg-black`
- Surface: `bg-white` / `dark:bg-zinc-900`
- Border: `border-zinc-200` / `dark:border-zinc-800`
- Text: `text-zinc-900/500/400` / `dark:text-white/zinc-400/500`

**Brand:** `indigo-500` (light: #6366f1) / `indigo-400` (dark: #818cf8), gradients `from-brand to-success`
**Secondary:** `secondary` (light: #ea580c) / `secondary` (dark: #f97316) - Used for accents, notifications, and calls to attention.
**Status:** Success=`emerald-500`, Error=`rose-500`, Warning=`amber-400`, Info=`cyan-600` (light) / `cyan-400` (dark)

## Shapes & Type

**Radius:** Cards=`rounded-3xl`, Buttons/Inputs=`rounded-xl`, Badges=`rounded-lg/full`
**Typography:** Plus Jakarta Sans/sans, Headings=`font-bold tracking-tight`, Body=`font-normal/medium`

## Components

**Header:** `sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50`

**Sidebar:** `bg-white dark:bg-zinc-900 border-r`, Items: `h-10 hover:bg-zinc-100 dark:hover:bg-zinc-800`, Active: `bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400`

**Buttons:**

- Primary: `bg-brand text-white hover:opacity-90 dark:bg-brand dark:text-black shadow-sm rounded-xl`
- Secondary: `bg-secondary text-white hover:opacity-90 shadow-sm rounded-xl`
- Ghost: `bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl`
- Destructive: `bg-rose-50 text-rose-600 dark:bg-rose-900/20 rounded-xl`

**Inputs:** `bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20`

**Cards:** `bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md`

## Reusable Components (`$lib/components/ui`)

### Button

Polished action trigger with loading states and variants.

- **Props:** `variant` (primary, ghost, destructive), `isLoading`, `disabled`, `class`.
- **Snippet:** `children` (default).

### Input

Form input with integrated label and error message handling.

- **Props:** `label`, `error`, `value` (bindable), standard HTML input attributes.

### Tooltip

Contextual info on hover/focus.

- **Props:** `content` (string), `position` (top, bottom, left, right), `delay` (ms), `disabled`.
- **Snippet:** `children` (trigger element).

### DataTable

Feature-rich table with pagination, snippets for cells, and header actions.

- **Props:** `columns` (array of configs), `rows` (data), `title`, `description`, `currentPage` (bindable), `pageSize`.
- **Snippets:** `actions` (top-right), `filters` (top-right), `cells` (record of snippets keyed by column).

### LanguageSwitcher

Paraglide-integrated locale selector dropdown.

- **Function:** Handles localized routing automatically using the `localizeHref` hook.

### Modal

Animated backdrop/card with flexible footer/body.

- **Props:** `open` (bindable), `title`, `description`, `children`, `footer`.
- **Features:** Keydown (Esc) close, click-outside close, unconstrained overflow (for popups).

### MultiSelect

Tag-based multiple selection with search.

- **Props:** `options` ({label, value}[]), `value` (bindable string[]), `label`, `placeholder`, `error`.
- **Features:** Pills UI, search filter, click-outside close.

### DatePicker

Interactive calendar with Day/Month/Year views.

- **Props:** `value` (bindable ISO string), `label`, `minDate`, `error`.
- **Features:** High-contrast logic, smart navigation, smooth fly/fade view transitions.

### Toggle

iOS-style switch for boolean states.

- **Props:** `checked` (bindable), `label`, `description`, `disabled`.

### Textarea

Auto-styled multiline input.

- **Props:** Same as Input.
