<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import {
		Building2,
		ShieldCheck,
		Share2,
		Lock,
		Users,
		Settings2,
		CheckCircle2,
		ChevronLeft
	} from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import OrganizationSection from './sections/OrganizationSection.svelte';
	import RolesSection from './sections/RolesSection.svelte';
	import DepartmentsSection from './sections/DepartmentsSection.svelte';
	import SecuritySection from './sections/SecuritySection.svelte';
	import IntegrationsSection from './sections/IntegrationsSection.svelte';

	let { data }: { data: PageData } = $props();

	const tabs = [
		{ id: 'organization', label: 'Organization', icon: Building2 },
		{ id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
		{ id: 'departments', label: 'Departments', icon: Users },
		{ id: 'security', label: 'Security', icon: Lock },
		{ id: 'integrations', label: 'Integrations', icon: Share2 }
	] as const;

	type TabId = (typeof tabs)[number]['id'];
	let activeTab = $state<TabId>('organization');

	let isSaving = $state(false);
	let saveSuccess = $state(false);

	const handleSave = async () => {
		isSaving = true;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		isSaving = false;
		saveSuccess = true;
		setTimeout(() => (saveSuccess = false), 3000);
	};

	const { systemSettings } = $derived(data);
</script>

<div class="mx-auto max-w-6xl space-y-8 pb-20">
	<header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div class="space-y-2">
			<button
				type="button"
				onclick={() => goto('/dashboard')}
				class="flex items-center gap-2 text-xs font-bold tracking-widest text-text-muted uppercase transition hover:text-brand"
			>
				<ChevronLeft class="h-3 w-3" />
				Back to Dashboard
			</button>
			<div class="flex items-center gap-4">
				<h1 class="text-4xl font-bold tracking-tight text-text">System Settings</h1>
			</div>
			<p class="mt-2 text-text-muted">
				Manage global application configuration and infrastructure.
			</p>
		</div>

		<div class="flex gap-3">
			<Button variant="ghost" class="gap-2">
				<Settings2 class="h-4 w-4" />
				Audit Logs
			</Button>
			<Button onclick={handleSave} isLoading={isSaving} class="min-w-[140px]">
				{#if saveSuccess}
					<CheckCircle2 class="mr-2 h-4 w-4" />
					Saved
				{:else}
					Save Changes
				{/if}
			</Button>
		</div>
	</header>

	<nav class="no-scrollbar flex overflow-x-auto border-b border-border/50 pb-px">
		<div class="flex min-w-full gap-1">
			{#each tabs as tab (tab.id)}
				<button
					onclick={() => (activeTab = tab.id)}
					class="relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all
					{activeTab === tab.id ? 'text-brand' : 'text-text-muted hover:bg-surface/50 hover:text-text'}"
				>
					<tab.icon class="h-4 w-4" />
					{tab.label}
					{#if activeTab === tab.id}
						<div
							class="absolute right-0 bottom-0 left-0 h-0.5 bg-brand"
							in:fade={{ duration: 200 }}
						></div>
					{/if}
				</button>
			{/each}
		</div>
	</nav>

	<main class="min-h-[600px]">
		{#if activeTab === 'organization'}
			<div in:fade={{ duration: 300 }}>
				<OrganizationSection organization={systemSettings.organization} />
			</div>
		{:else if activeTab === 'roles'}
			<div in:fade={{ duration: 300 }}>
				<RolesSection roles={systemSettings.roles} />
			</div>
		{:else if activeTab === 'departments'}
			<div in:fade={{ duration: 300 }}>
				<DepartmentsSection departments={systemSettings.departments} />
			</div>
		{:else if activeTab === 'security'}
			<div in:fade={{ duration: 300 }}>
				<SecuritySection security={systemSettings.security} />
			</div>
		{:else if activeTab === 'integrations'}
			<div in:fade={{ duration: 300 }}>
				<IntegrationsSection integrations={systemSettings.integrations} />
			</div>
		{/if}
	</main>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
