# Nexus Zinc Design System

## Philosophy
Swiss typography + Apple shapes + Bento grids. High whitespace, hyper-rounded corners (rounded-2xl/3xl), glassmorphism depth, zinc greys with teal/emerald accents.

## Colors (Tailwind)
**Neutrals:**
- BG: `bg-zinc-50` / `dark:bg-black`
- Surface: `bg-white` / `dark:bg-zinc-900`
- Border: `border-zinc-200` / `dark:border-zinc-800`
- Text: `text-zinc-900/500/400` / `dark:text-white/zinc-400/500`

**Brand:** `teal-600` (light) / `teal-400` (dark), gradients `from-teal-400 to-emerald-500`  
**Status:** Success=`emerald-500`, Error=`rose-500`, Warning=`amber-400`, Info=`indigo-500`

## Shapes & Type
**Radius:** Cards=`rounded-3xl`, Buttons/Inputs=`rounded-xl`, Badges=`rounded-lg/full`  
**Typography:** Inter/sans, Headings=`font-bold tracking-tight`, Body=`font-normal/medium`

## Components
**Header:** `sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50`

**Sidebar:** `bg-white dark:bg-zinc-900 border-r`, Items: `h-10 hover:bg-zinc-100 dark:hover:bg-zinc-800`, Active: `bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400`

**Buttons:**
- Primary: `bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 shadow-sm rounded-xl`
- Ghost: `bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl`
- Destructive: `bg-rose-50 text-rose-600 dark:bg-rose-900/20 rounded-xl`

**Inputs:** `bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-teal-500/20`

**Cards:** `bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md`

## Animation
`transition-all duration-300`, `active:scale-95` on clickables, `animate-pulse` for loading, entrance: `opacity-0 animate-in fade-in zoom-in-95`

## Stack
Svelte + Tailwind + lucide-svelte. Small modular components, always include `dark:` variants.
