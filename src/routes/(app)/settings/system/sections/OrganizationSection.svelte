<script lang="ts">
	import type { OrganizationProfile } from '../types';
	import {
		Building2,
		Globe,
		Mail,
		MapPin,
		Phone,
		Edit2,
		Save,
		X,
		CheckCircle2,
		ExternalLink
	} from 'lucide-svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let {
		organization = $bindable(),
		onSave
	}: {
		organization: OrganizationProfile;
		onSave?: (profile: OrganizationProfile) => Promise<OrganizationProfile>;
	} = $props();

	let isEditing = $state(false);
	let isSaving = $state(false);
	let saveSuccess = $state(false);
	let saveError = $state('');

	// Create a local copy for editing
	let editForm = $state<OrganizationProfile>(JSON.parse(JSON.stringify(organization)));

	const timezones = [
		{ label: 'Europe/Amsterdam (GMT+1)', value: 'Europe/Amsterdam' },
		{ label: 'Europe/London (GMT+0)', value: 'Europe/London' },
		{ label: 'America/New_York (GMT-5)', value: 'America/New_York' }
	];

	function startEditing() {
		editForm = JSON.parse(JSON.stringify(organization));
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
	}

	async function handleSave() {
		isSaving = true;
		saveError = '';
		try {
			if (onSave) {
				organization = await onSave(JSON.parse(JSON.stringify(editForm)));
			} else {
				organization = JSON.parse(JSON.stringify(editForm));
			}
			saveSuccess = true;
			isEditing = false;
			setTimeout(() => (saveSuccess = false), 3000);
		} catch (error) {
			saveError = error instanceof Error ? error.message : 'Failed to save changes';
		}
		isSaving = false;
	}

	const cardClass =
		'group relative overflow-hidden rounded-3xl border border-border/50 bg-glass-surface p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-md hover:border-border';

	const labelClass = 'text-xs font-bold tracking-wider text-text-muted uppercase';
	const valueClass = 'text-base font-medium text-text mt-1';
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-text">Organization Profile</h2>
			<p class="text-sm text-text-muted">
				Manage your organization's public identity and contact info.
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if saveSuccess}
				<div
					in:fade
					out:fade
					class="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600"
				>
					<CheckCircle2 class="h-3.5 w-3.5" />
					Changes saved
				</div>
			{/if}

			{#if saveError}
				<div
					in:fade
					out:fade
					class="flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600"
				>
					<X class="h-3.5 w-3.5" />
					{saveError}
				</div>
			{/if}

			{#if !isEditing}
				<div in:fade={{ duration: 200, delay: 200 }} out:fade={{ duration: 200 }}>
					<Button
						variant="ghost"
						onclick={startEditing}
						class="gap-2 rounded-xl border border-border/60 bg-surface/70 px-3 py-2 hover:border-brand/30 hover:bg-surface"
					>
						<Edit2 class="h-4 w-4" />
						Edit Section
					</Button>
				</div>
			{:else}
				<div
					class="flex items-center gap-2"
					in:fade={{ duration: 200, delay: 200 }}
					out:fade={{ duration: 200 }}
				>
					<Button variant="ghost" onclick={cancelEditing} class="rounded-xl px-3 py-2">
						<X class="mr-2 h-4 w-4" />
						Cancel
					</Button>
					<Button onclick={handleSave} isLoading={isSaving} class="gap-2 rounded-xl px-6 py-2">
						<Save class="h-4 w-4" />
						Save Changes
					</Button>
				</div>
			{/if}
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<section class={cardClass}>
			<div class="mb-8 flex items-center gap-3">
				<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
					<Building2 class="h-6 w-6" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-text">General Info</h3>
					<p class="text-sm text-text-muted">Core identification details.</p>
				</div>
			</div>

			<div class="relative space-y-6">
				{#if isEditing}
					<div
						in:fly={{ y: 8, duration: 300, delay: 200, easing: cubicOut }}
						out:fade={{ duration: 200 }}
					>
						<div class="space-y-4">
							<Input label="Organization Name" bind:value={editForm.name} />
							<Select label="Default Timezone" options={timezones} bind:value={editForm.timezone} />
						</div>
					</div>
				{:else}
					<div in:fade={{ duration: 200, delay: 200 }} out:fade={{ duration: 200 }}>
						<div class="grid gap-6">
							<div>
								<p class={labelClass}>Organization Name</p>
								<p class={valueClass}>{organization.name}</p>
							</div>
							<div>
								<p class={labelClass}>Default Timezone</p>
								<p class={valueClass}>
									{timezones.find((t) => t.value === organization.timezone)?.label ||
										organization.timezone}
								</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</section>

		<section class={cardClass}>
			<div class="mb-8 flex items-center gap-3">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600"
				>
					<Phone class="h-6 w-6" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-text">Contact Details</h3>
					<p class="text-sm text-text-muted">How people can reach you.</p>
				</div>
			</div>

			<div class="relative space-y-6">
				{#if isEditing}
					<div
						in:fly={{ y: 8, duration: 300, delay: 200, easing: cubicOut }}
						out:fade={{ duration: 200 }}
					>
						<div class="space-y-4">
							<div class="grid gap-4 sm:grid-cols-2">
								<Input label="Email" type="email" bind:value={editForm.contact.email} />
								<Input label="Phone" type="tel" bind:value={editForm.contact.phone} />
							</div>
							<Input label="Website" type="url" bind:value={editForm.contact.website} />
						</div>
					</div>
				{:else}
					<div in:fade={{ duration: 200, delay: 200 }} out:fade={{ duration: 200 }}>
						<div class="grid gap-6">
							<div class="grid gap-6 sm:grid-cols-2">
								<div>
									<p class={labelClass}>Email Address</p>
									<div class="flex items-center gap-2">
										<p class={valueClass}>{organization.contact.email}</p>
										<Mail class="h-3.5 w-3.5 text-text-muted" />
									</div>
								</div>
								<div>
									<p class={labelClass}>Phone Number</p>
									<p class={valueClass}>{organization.contact.phone}</p>
								</div>
							</div>
							<div>
								<p class={labelClass}>Website</p>
								<a
									href={organization.contact.website}
									target="_blank"
									rel="noopener noreferrer"
									class="group/link mt-1 flex items-center gap-2 font-medium text-brand hover:underline"
								>
									{organization.contact.website}
									<ExternalLink
										class="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
									/>
								</a>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</section>
	</div>

	<section class={cardClass}>
		<div class="mb-8 flex items-center gap-3">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600"
			>
				<MapPin class="h-6 w-6" />
			</div>
			<div>
				<h3 class="text-lg font-bold text-text">Headquarters Address</h3>
				<p class="text-sm text-text-muted">Official registered business location.</p>
			</div>
		</div>

		<div class="relative space-y-6">
			{#if isEditing}
				<div
					in:fly={{ y: 8, duration: 300, delay: 200, easing: cubicOut }}
					out:fade={{ duration: 200 }}
				>
					<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						<div class="lg:col-span-2">
							<Input label="Street" bind:value={editForm.address.street} />
						</div>
						<Input label="Number" bind:value={editForm.address.number} />
						<Input label="Postal Code" bind:value={editForm.address.postalCode} />
						<Input label="City" bind:value={editForm.address.city} />
						<Input label="Country" bind:value={editForm.address.country} />
					</div>
				</div>
			{:else}
				<div in:fade={{ duration: 200, delay: 200 }} out:fade={{ duration: 200 }}>
					<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						<div class="lg:col-span-2">
							<p class={labelClass}>Street</p>
							<p class={valueClass}>{organization.address.street}</p>
						</div>
						<div>
							<p class={labelClass}>Number</p>
							<p class={valueClass}>{organization.address.number}</p>
						</div>
						<div>
							<p class={labelClass}>Postal Code</p>
							<p class={valueClass}>{organization.address.postalCode}</p>
						</div>
						<div>
							<p class={labelClass}>City</p>
							<p class={valueClass}>{organization.address.city}</p>
						</div>
						<div>
							<p class={labelClass}>Country</p>
							<p class={valueClass}>{organization.address.country}</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</section>
</div>
