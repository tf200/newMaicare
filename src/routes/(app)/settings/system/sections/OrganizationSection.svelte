<script lang="ts">
	import * as v from 'valibot';
	import { untrack } from 'svelte';
	import { Building2, CheckCircle2, Edit2, Mail, MapPin, Phone, Save, X } from 'lucide-svelte';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { m } from '$lib/paraglide/messages';
	import { formatFormError } from '$lib/utils/form-errors';
	import type { OrganizationProfile } from '../types';

	type MessageKey =
		| 'system_settings_organization_title'
		| 'system_settings_organization_description'
		| 'system_settings_organization_edit'
		| 'system_settings_organization_cancel'
		| 'system_settings_organization_save'
		| 'system_settings_organization_saved'
		| 'system_settings_organization_save_error_title'
		| 'system_settings_organization_save_error'
		| 'system_settings_organization_general_title'
		| 'system_settings_organization_general_description'
		| 'system_settings_organization_name'
		| 'system_settings_organization_timezone'
		| 'system_settings_organization_timezone_amsterdam'
		| 'system_settings_organization_timezone_london'
		| 'system_settings_organization_timezone_new_york'
		| 'system_settings_organization_contact_title'
		| 'system_settings_organization_contact_description'
		| 'system_settings_organization_email'
		| 'system_settings_organization_phone'
		| 'system_settings_organization_website'
		| 'system_settings_organization_address_title'
		| 'system_settings_organization_address_description'
		| 'system_settings_organization_street'
		| 'system_settings_organization_house_number'
		| 'system_settings_organization_house_number_addition'
		| 'system_settings_organization_postal_code'
		| 'system_settings_organization_city'
		| 'system_settings_organization_not_provided'
		| 'system_settings_organization_required_error'
		| 'system_settings_organization_email_error'
		| 'system_settings_organization_website_error';

	type MessageCatalog = Record<MessageKey, () => string>;
	const messages = m as unknown as MessageCatalog;

	interface Props {
		organization: OrganizationProfile;
		onSave: (profile: OrganizationProfile) => Promise<void>;
	}

	let { organization, onSave }: Props = $props();
	let isEditing = $state(false);
	let saveError = $state('');
	let saveSuccess = $state(false);

	const required = () => messages.system_settings_organization_required_error();
	const schema = v.object({
		name: v.pipe(v.string(), v.trim(), v.minLength(1, required)),
		timezone: v.pipe(v.string(), v.minLength(1, required)),
		address: v.object({
			street: v.pipe(v.string(), v.trim(), v.minLength(1, required)),
			houseNumber: v.pipe(v.string(), v.trim(), v.minLength(1, required)),
			houseNumberAddition: v.pipe(v.string(), v.trim()),
			postalCode: v.pipe(v.string(), v.trim(), v.minLength(1, required)),
			city: v.pipe(v.string(), v.trim(), v.minLength(1, required))
		}),
		contact: v.object({
			email: v.pipe(
				v.string(),
				v.trim(),
				v.email(() => messages.system_settings_organization_email_error())
			),
			phone: v.pipe(v.string(), v.trim(), v.minLength(1, required)),
			website: v.pipe(
				v.string(),
				v.trim(),
				v.url(() => messages.system_settings_organization_website_error())
			)
		})
	});

	const { form, errors, enhance, submitting, delayed, reset } = superForm(
		defaults(
			untrack(() => structuredClone(organization)),
			valibotClient(schema)
		),
		{
			validators: valibotClient(schema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form: result }) => {
				if (!result.valid) return;
				saveError = '';
				try {
					await onSave(structuredClone(result.data));
					isEditing = false;
					saveSuccess = true;
				} catch (error) {
					saveError =
						error instanceof Error
							? error.message
							: messages.system_settings_organization_save_error();
				}
			}
		}
	);
	const enhanceAttachment = (node: HTMLFormElement) => {
		const action = enhance(node);
		return () => action.destroy();
	};

	let timezones = $derived([
		{
			label: messages.system_settings_organization_timezone_amsterdam(),
			value: 'Europe/Amsterdam'
		},
		{ label: messages.system_settings_organization_timezone_london(), value: 'Europe/London' },
		{ label: messages.system_settings_organization_timezone_new_york(), value: 'America/New_York' }
	]);
	let timezoneLabel = $derived(
		timezones.find(({ value }) => value === organization.timezone)?.label ?? organization.timezone
	);

	function startEditing() {
		reset({ data: structuredClone(organization) });
		saveError = '';
		saveSuccess = false;
		isEditing = true;
	}

	function cancelEditing() {
		reset({ data: structuredClone(organization) });
		saveError = '';
		isEditing = false;
	}

	const cardClass = 'rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6';
	const labelClass = 'text-xs font-semibold uppercase tracking-wide text-text-muted';
	const valueClass = 'mt-1 break-words text-sm font-medium text-text sm:text-base';
</script>

<div class="space-y-6">
	<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="min-w-0">
			<h2 class="text-2xl font-bold tracking-tight text-text">
				{messages.system_settings_organization_title()}
			</h2>
			<p class="mt-1 text-sm text-text-muted">
				{messages.system_settings_organization_description()}
			</p>
		</div>
		{#if !isEditing}
			<PermissionGuard permission={PERMISSIONS.SETTINGS.ORGANIZATION_PROFILE.UPDATE}>
				<Button variant="ghost" class="w-full gap-2 sm:w-auto" onclick={startEditing}>
					<Edit2 class="h-4 w-4" aria-hidden="true" />
					{messages.system_settings_organization_edit()}
				</Button>
			</PermissionGuard>
		{/if}
	</header>

	{#if saveError}
		<InlineErrorBanner
			title={messages.system_settings_organization_save_error_title()}
			message={saveError}
		/>
	{/if}
	{#if saveSuccess}
		<p class="flex items-center gap-2 text-sm font-medium text-success" role="status">
			<CheckCircle2 class="h-4 w-4" aria-hidden="true" />
			{messages.system_settings_organization_saved()}
		</p>
	{/if}

	<form {@attach enhanceAttachment} class="space-y-6" aria-busy={$submitting}>
		<div class="grid gap-6 lg:grid-cols-2">
			<section class={cardClass} aria-labelledby="organization-general-heading">
				<div class="mb-6 flex items-start gap-3">
					<div class="rounded-2xl bg-brand/10 p-3 text-brand">
						<Building2 class="h-5 w-5" aria-hidden="true" />
					</div>
					<div>
						<h3 id="organization-general-heading" class="font-bold text-text">
							{messages.system_settings_organization_general_title()}
						</h3>
						<p class="text-sm text-text-muted">
							{messages.system_settings_organization_general_description()}
						</p>
					</div>
				</div>
				{#if isEditing}
					<div class="space-y-4">
						<Input
							name="name"
							label={messages.system_settings_organization_name()}
							bind:value={$form.name}
							error={formatFormError($errors.name)}
							required
						/>
						<Select
							label={messages.system_settings_organization_timezone()}
							options={timezones}
							bind:value={$form.timezone}
							error={formatFormError($errors.timezone)}
						/>
					</div>
				{:else}
					<dl class="grid gap-5">
						<div>
							<dt class={labelClass}>{messages.system_settings_organization_name()}</dt>
							<dd class={valueClass}>{organization.name}</dd>
						</div>
						<div>
							<dt class={labelClass}>{messages.system_settings_organization_timezone()}</dt>
							<dd class={valueClass}>{timezoneLabel}</dd>
						</div>
					</dl>
				{/if}
			</section>

			<section class={cardClass} aria-labelledby="organization-contact-heading">
				<div class="mb-6 flex items-start gap-3">
					<div class="rounded-2xl bg-brand/10 p-3 text-brand">
						<Phone class="h-5 w-5" aria-hidden="true" />
					</div>
					<div>
						<h3 id="organization-contact-heading" class="font-bold text-text">
							{messages.system_settings_organization_contact_title()}
						</h3>
						<p class="text-sm text-text-muted">
							{messages.system_settings_organization_contact_description()}
						</p>
					</div>
				</div>
				{#if isEditing}
					<div class="grid gap-4 sm:grid-cols-2">
						<Input
							name="contact.email"
							type="email"
							label={messages.system_settings_organization_email()}
							bind:value={$form.contact.email}
							error={formatFormError($errors.contact?.email)}
							required
						/>
						<Input
							name="contact.phone"
							type="tel"
							label={messages.system_settings_organization_phone()}
							bind:value={$form.contact.phone}
							error={formatFormError($errors.contact?.phone)}
							required
						/>
						<div class="sm:col-span-2">
							<Input
								name="contact.website"
								type="url"
								label={messages.system_settings_organization_website()}
								bind:value={$form.contact.website}
								error={formatFormError($errors.contact?.website)}
								required
							/>
						</div>
					</div>
				{:else}
					<dl class="grid gap-5 sm:grid-cols-2">
						<div>
							<dt class={labelClass}>{messages.system_settings_organization_email()}</dt>
							<dd class="{valueClass} flex items-center gap-2">
								<Mail class="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />{organization
									.contact.email}
							</dd>
						</div>
						<div>
							<dt class={labelClass}>{messages.system_settings_organization_phone()}</dt>
							<dd class={valueClass}>{organization.contact.phone}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class={labelClass}>{messages.system_settings_organization_website()}</dt>
							<dd class={valueClass}>
								<!-- eslint-disable svelte/no-navigation-without-resolve -->
								<a
									class="text-brand underline-offset-4 hover:underline"
									href={organization.contact.website}
									target="_blank"
									rel="noreferrer">{organization.contact.website}</a
								>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							</dd>
						</div>
					</dl>
				{/if}
			</section>
		</div>

		<section class={cardClass} aria-labelledby="organization-address-heading">
			<div class="mb-6 flex items-start gap-3">
				<div class="rounded-2xl bg-brand/10 p-3 text-brand">
					<MapPin class="h-5 w-5" aria-hidden="true" />
				</div>
				<div>
					<h3 id="organization-address-heading" class="font-bold text-text">
						{messages.system_settings_organization_address_title()}
					</h3>
					<p class="text-sm text-text-muted">
						{messages.system_settings_organization_address_description()}
					</p>
				</div>
			</div>
			{#if isEditing}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
					<div class="lg:col-span-3">
						<Input
							name="address.street"
							label={messages.system_settings_organization_street()}
							bind:value={$form.address.street}
							error={formatFormError($errors.address?.street)}
							required
						/>
					</div>
					<div class="lg:col-span-1">
						<Input
							name="address.houseNumber"
							label={messages.system_settings_organization_house_number()}
							bind:value={$form.address.houseNumber}
							error={formatFormError($errors.address?.houseNumber)}
							required
						/>
					</div>
					<div class="lg:col-span-2">
						<Input
							name="address.houseNumberAddition"
							label={messages.system_settings_organization_house_number_addition()}
							bind:value={$form.address.houseNumberAddition}
							error={formatFormError($errors.address?.houseNumberAddition)}
						/>
					</div>
					<div class="lg:col-span-2">
						<Input
							name="address.postalCode"
							label={messages.system_settings_organization_postal_code()}
							bind:value={$form.address.postalCode}
							error={formatFormError($errors.address?.postalCode)}
							required
						/>
					</div>
					<div class="sm:col-span-1 lg:col-span-4">
						<Input
							name="address.city"
							label={messages.system_settings_organization_city()}
							bind:value={$form.address.city}
							error={formatFormError($errors.address?.city)}
							required
						/>
					</div>
				</div>
			{:else}
				<dl class="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
					<div class="lg:col-span-2">
						<dt class={labelClass}>{messages.system_settings_organization_street()}</dt>
						<dd class={valueClass}>{organization.address.street}</dd>
					</div>
					<div>
						<dt class={labelClass}>{messages.system_settings_organization_house_number()}</dt>
						<dd class={valueClass}>{organization.address.houseNumber}</dd>
					</div>
					<div>
						<dt class={labelClass}>
							{messages.system_settings_organization_house_number_addition()}
						</dt>
						<dd class={valueClass}>
							{organization.address.houseNumberAddition ||
								messages.system_settings_organization_not_provided()}
						</dd>
					</div>
					<div>
						<dt class={labelClass}>{messages.system_settings_organization_postal_code()}</dt>
						<dd class={valueClass}>{organization.address.postalCode}</dd>
					</div>
					<div class="lg:col-span-2">
						<dt class={labelClass}>{messages.system_settings_organization_city()}</dt>
						<dd class={valueClass}>{organization.address.city}</dd>
					</div>
				</dl>
			{/if}
		</section>

		{#if isEditing}
			<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<Button type="button" variant="ghost" onclick={cancelEditing} disabled={$submitting}
					><X
						class="h-4 w-4"
						aria-hidden="true"
					/>{messages.system_settings_organization_cancel()}</Button
				>
				<Button type="submit" isLoading={$delayed} disabled={$submitting}
					><Save
						class="h-4 w-4"
						aria-hidden="true"
					/>{messages.system_settings_organization_save()}</Button
				>
			</div>
		{/if}
	</form>
</div>
