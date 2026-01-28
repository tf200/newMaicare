<script lang="ts">
	import { Bell, ChevronRight, PanelLeft, Plus, Search } from 'lucide-svelte';

	interface Props {
		title?: string;
		section?: string;
		collapsed?: boolean;
		onOpenSidebar?: () => void;
	}

	let {
		title = 'Dashboard',
		section = 'Overview',
		collapsed = false,
		onOpenSidebar
	}: Props = $props();

	const headerBase =
		'fixed top-0 right-0 left-0 z-30 flex h-16 items-center border-b border-zinc-200/50 bg-white/80 px-4 backdrop-blur-xl transition-[left,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none lg:px-8 dark:border-zinc-800/50 dark:bg-black/80';
	const headerOffset = () => (collapsed ? 'lg:left-20' : 'lg:left-72');
</script>

<header class="{headerBase} {headerOffset()}">
	<div class="flex w-full items-center justify-between">
		<div class="flex min-w-0 items-center gap-3">
			<button
				onclick={() => onOpenSidebar?.()}
				class="inline-flex items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/80 p-2 text-zinc-700 shadow-sm backdrop-blur-xl transition hover:bg-white focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-reduce:transition-none dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:text-zinc-200 dark:focus-visible:ring-offset-zinc-900"
				aria-label="Toggle navigation"
			>
				<PanelLeft class="h-4 w-4" />
			</button>
			<div
				class="hidden min-w-0 items-center gap-2 text-sm font-medium text-zinc-500 sm:flex dark:text-zinc-400"
				class:lg:hidden={collapsed}
			>
				<span class="truncate">{section}</span>
				<ChevronRight class="h-4 w-4 shrink-0 opacity-50" />
				<span class="truncate font-semibold text-zinc-900 dark:text-white">{title}</span>
			</div>
			<div
				class="hidden min-w-0 items-center text-sm font-semibold text-zinc-900 dark:text-white"
				class:lg:flex={collapsed}
			>
				<span class="truncate">{title}</span>
			</div>
			<h1 class="truncate text-lg font-bold tracking-tight text-zinc-900 sm:hidden dark:text-white">
				{title}
			</h1>
		</div>

		<div class="flex shrink-0 items-center gap-2 sm:gap-4">
			<div class="relative hidden max-w-lg md:block">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
				<input
					type="text"
					placeholder="Search everything..."
					class="h-10 w-64 rounded-xl border border-zinc-200/60 bg-zinc-50/50 pl-10 text-sm text-zinc-900 outline-hidden transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-zinc-400 focus:border-teal-500/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 motion-reduce:transition-none dark:border-zinc-800/60 dark:bg-zinc-900/50 dark:text-zinc-200 dark:focus:border-teal-500/50 dark:focus:bg-zinc-900"
				/>
			</div>

			<button
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm transition hover:bg-zinc-800 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none active:scale-95 motion-reduce:transition-none sm:h-auto sm:w-auto sm:px-4 sm:py-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus-visible:ring-offset-zinc-900"
				aria-label="New Action"
			>
				<Plus class="h-5 w-5 sm:mr-2" />
				<span class="hidden text-sm font-bold sm:inline">New Action</span>
			</button>

			<div class="mx-1 h-6 w-px bg-zinc-200/50 sm:mx-0 dark:bg-zinc-800/50"></div>

			<div class="flex items-center gap-1.5 sm:gap-3">
				<button
					class="relative rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-reduce:transition-none dark:text-zinc-400 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-900"
					aria-label="Notifications"
				>
					<Bell class="h-5 w-5" />
					<span
						class="absolute top-2.5 right-2.5 flex h-2 w-2 animate-pulse rounded-full border-2 border-white bg-teal-500 motion-reduce:animate-none dark:border-black"
					></span>
				</button>

				<button
					class="group flex items-center gap-2 rounded-full p-0.5 transition-[box-shadow,transform] duration-300 hover:ring-4 hover:ring-zinc-100 focus-visible:ring-4 focus-visible:ring-teal-500/15 focus-visible:outline-none active:scale-95 motion-reduce:transition-none dark:hover:ring-zinc-800/50"
					aria-label="Profile"
				>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-emerald-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900"
					>
						JD
					</div>
					<div class="hidden flex-col items-start text-left sm:flex">
						<span class="text-xs leading-none font-bold text-zinc-900 dark:text-white"
							>John Doe</span
						>
						<span class="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Admin</span>
					</div>
				</button>
			</div>
		</div>
	</div>
</header>
