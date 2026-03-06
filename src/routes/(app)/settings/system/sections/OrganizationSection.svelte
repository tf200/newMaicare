<script lang="ts">
	import type { OrganizationProfile } from '../types';
	import { Building2, Globe, Mail, MapPin, Phone } from 'lucide-svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';

	let { organization }: { organization: OrganizationProfile } = $props();

	const timezones = [
		{ label: 'Europe/Amsterdam (GMT+1)', value: 'Europe/Amsterdam' },
		{ label: 'Europe/London (GMT+0)', value: 'Europe/London' },
		{ label: 'America/New_York (GMT-5)', value: 'America/New_York' }
	];

	const cardClass =
		'group relative overflow-hidden rounded-3xl border border-border/50 bg-glass-surface p-6 shadow-sm backdrop-blur-xl transition-all duration-300';
</script>

<div class="space-y-8">
	<div class="grid gap-6 md:grid-cols-2">
		<section class={cardClass}>
			<div class="mb-6 flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
					<Building2 class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-text">General Info</h3>
					<p class="text-sm text-text-muted">Basic organization details.</p>
				</div>
			</div>

			<div class="space-y-4">
				<Input label="Organization Name" bind:value={organization.name} />
				<Select label="Default Timezone" options={timezones} bind:value={organization.timezone} />
			</div>
		</section>

		<section class={cardClass}>
			<div class="mb-6 flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600"
				>
					<Phone class="h-5 w-5" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-text">Contact Details</h3>
					<p class="text-sm text-text-muted">Primary contact information.</p>
				</div>
			</div>

			<div class="space-y-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<Input label="Email" type="email" bind:value={organization.contact.email} />
					<Input label="Phone" type="tel" bind:value={organization.contact.phone} />
				</div>
				<Input label="Website" type="url" bind:value={organization.contact.website} />
			</div>
		</section>
	</div>

	<section class={cardClass}>
		<div class="mb-6 flex items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600"
			>
				<MapPin class="h-5 w-5" />
			</div>
			<div>
				<h3 class="text-lg font-bold text-text">Headquarters Address</h3>
				<p class="text-sm text-text-muted">Official registered address.</p>
			</div>
		</div>

		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div class="lg:col-span-2">
				<Input label="Street" bind:value={organization.address.street} />
			</div>
			<Input label="Number" bind:value={organization.address.number} />
			<Input label="Postal Code" bind:value={organization.address.postalCode} />
			<Input label="City" bind:value={organization.address.city} />
			<Input label="Country" bind:value={organization.address.country} />
		</div>
	</section>
</div>
