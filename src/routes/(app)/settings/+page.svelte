<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages';
	import { requestEnable2fa, requestSetup2fa } from '$lib/api/auth';
	import { getAuthState } from '$lib/state/auth.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import {
		User,
		ShieldCheck,
		Bell,
		Monitor,
		Smartphone,
		Globe,
		KeyRound,
		ChevronRight,
		CheckCircle2,
		Mail,
		Phone,
		MapPin,
		Briefcase,
		Building2,
		GraduationCap,
		Award,
		History,
		BadgeCheck,
		Clock,
		CreditCard,
		Copy,
		Check,
		QrCode
	} from 'lucide-svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import type { ActiveSessionDetail } from '$lib/types/api';
	import { createInitialSettingsProfile } from './+page';
	import type { SettingsProfileLoadResult, SettingsProfilePageData } from './+page';

	const auth = getAuthState();
	let { data }: { data: SettingsProfilePageData } = $props();

	const initial = $derived(data.initial);
	const profileDataPromise = $derived(data.profileData);

	let profileState = $state<SettingsProfileLoadResult>(createInitialSettingsProfile());
	let profilePending = $state(true);
	let profileRequestToken = 0;

	$effect(() => {
		const nextInitial = initial;
		const promise = profileDataPromise;
		const requestToken = ++profileRequestToken;

		profileState = nextInitial;
		profilePending = true;

		void promise
			.then((result) => {
				if (requestToken !== profileRequestToken) return;
				profileState = result;
			})
			.catch((error) => {
				if (requestToken !== profileRequestToken) return;
				profileState = {
					profile: null,
					loadError: error instanceof Error ? error.message : 'Failed to load profile details.'
				};
			})
			.finally(() => {
				if (requestToken === profileRequestToken) {
					profilePending = false;
				}
			});
	});

	const roleNames = $derived(profileState.profile?.roles.map((role) => role.name) ?? []);
	const isAdmin = $derived(roleNames.some((role) => role.toLowerCase().includes('admin')));

	const tabs = $derived([
		{ id: 'personal', label: m.personal_info(), icon: User },
		{ id: 'security', label: m.security(), icon: ShieldCheck },
		{ id: 'preferences', label: m.preferences(), icon: Bell },
		{ id: 'appearance', label: m.appearance(), icon: Monitor }
	] as const);

	type TabId = 'personal' | 'security' | 'preferences' | 'appearance';
	let activeTab = $state<TabId>('personal');

	const profile = $derived(profileState.profile);
	const fullName = $derived(
		profile
			? `${profile.first_name} ${profile.last_name}`.trim()
			: `${auth.user?.first_name ?? ''} ${auth.user?.last_name ?? ''}`.trim()
	);
	const initials = $derived(
		(fullName || 'U')
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('') || 'U'
	);
	const primaryRole = $derived(roleNames[0] ?? 'Employee');
	const accountStatus = $derived(
		!profile
			? m.active()
			: profile.is_archived
				? m.inactive()
				: profile.out_of_service
					? 'Out of service'
					: m.active()
	);

	const buildAddress = () => {
		if (!profile) return '—';
		const numberWithAddition =
			`${profile.house_number}${profile.house_number_addition ?? ''}`.trim();
		return `${profile.street} ${numberWithAddition}, ${profile.postal_code} ${profile.city}`;
	};

	const isUnsetDate = (value: string) => value.startsWith('0001-01-01');

	const formatDate = (value: string | null) => {
		if (!value) return '—';
		if (isUnsetDate(value)) return '—';
		const date = new Date(value);
		if (Number.isNaN(date.getTime()) || date.getUTCFullYear() <= 1) return '—';
		return date.toLocaleDateString();
	};

	const formatDateTime = (value: string | null) => {
		if (!value) return '—';
		if (isUnsetDate(value)) return '—';
		const date = new Date(value);
		if (Number.isNaN(date.getTime()) || date.getUTCFullYear() <= 1) return '—';
		return date.toLocaleString();
	};

	const contractTypeLabel = (value: string | null | undefined) => {
		if (value === 'loondienst') return 'Loondienst';
		if (value === 'ZZP') return 'ZZP';
		if (value === 'none') return 'None';
		return '—';
	};

	const parseSessionDevice = (session: ActiveSessionDetail) => {
		const ua = session.user_agent.toLowerCase();
		if (ua.includes('iphone') || ua.includes('android') || ua.includes('mobile')) {
			return 'Mobile Device';
		}
		return 'Desktop Device';
	};

	const parseSessionBrowser = (session: ActiveSessionDetail) => {
		const ua = session.user_agent.toLowerCase();
		if (ua.includes('edg/')) return 'Edge';
		if (ua.includes('chrome/')) return 'Chrome';
		if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
		if (ua.includes('firefox/')) return 'Firefox';
		return 'Browser';
	};

	const isCurrentSession = (session: ActiveSessionDetail, index: number) => {
		if (!browser) return index === 0;
		return session.user_agent === window.navigator.userAgent;
	};

	const getSetup2faPayload = (response: unknown) => {
		if (response && typeof response === 'object' && 'data' in response) {
			return (response as { data: { qr_code_base64: string; secret: string } }).data;
		}

		return response as { qr_code_base64: string; secret: string };
	};

	const getEnable2faPayload = (response: unknown) => {
		if (response && typeof response === 'object' && 'data' in response) {
			return (response as { data: { recovery_codes: string[] } }).data;
		}

		return response as { recovery_codes: string[] };
	};

	let twoFactorEnabled = $state(auth.user?.two_factor_enabled ?? false);
	let language = $state('en');
	let timezone = $state('Europe/Amsterdam');
	let emailNotifications = $state(true);
	let pushNotifications = $state(false);
	let theme = $state('system');

	$effect(() => {
		if (profile) {
			twoFactorEnabled = profile.two_factor_enabled;
		}
	});

	$effect(() => {
		if (typeof document === 'undefined') return;
		const root = document.documentElement;
		const isDark =
			theme === 'dark' ||
			(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		root.classList.toggle('dark', isDark);
		root.style.colorScheme = isDark ? 'dark' : 'light';
		window.localStorage.theme = theme;
	});

	let isSaving = $state(false);
	let saveSuccess = $state(false);

	// 2FA Flow State
	let showPasswordModal = $state(false);
	let showSetupModal = $state(false);
	let confirmPassword = $state('');
	let isVerifyingPassword = $state(false);
	let isEnabling2fa = $state(false);
	let setupData = $state<{ qr_code_base64: string; secret: string } | null>(null);
	let recoveryCodes = $state<string[]>([]);
	let showRecoveryCodesModal = $state(false);
	let recoveryCodesSaved = $state(false);
	let is2faActivationFlow = $state(false);
	let copyFeedback = $state<string | null>(null);
	let flowError = $state<string | null>(null);
	let previousTwoFactorEnabled = $state(auth.user?.two_factor_enabled ?? false);
	let otpCode = $state('');
	let otpError = $state<string | null>(null);

	$effect(() => {
		if (profile) {
			twoFactorEnabled = profile.two_factor_enabled;
			previousTwoFactorEnabled = profile.two_factor_enabled;
		}
	});

	$effect(() => {
		if (twoFactorEnabled === previousTwoFactorEnabled) return;

		const wasEnabled = previousTwoFactorEnabled;
		previousTwoFactorEnabled = twoFactorEnabled;

		if (!wasEnabled && twoFactorEnabled) {
			is2faActivationFlow = true;
			showPasswordModal = true;
			confirmPassword = '';
			flowError = null;
			otpError = null;
			return;
		}

		if (wasEnabled && !twoFactorEnabled) {
			twoFactorEnabled = true;
			previousTwoFactorEnabled = true;
		}
	});

	$effect(() => {
		if (is2faActivationFlow && !showPasswordModal && !showSetupModal && !showRecoveryCodesModal) {
			handleCancelSetup();
		}
	});

	const handlePasswordConfirm = async () => {
		if (!confirmPassword) return;
		flowError = null;
		isVerifyingPassword = true;

		try {
			const response = await requestSetup2fa({
				current_password: confirmPassword
			});
			const setupPayload = getSetup2faPayload(response);

			setupData = setupPayload;
			showPasswordModal = false;
			showSetupModal = true;
		} catch (error) {
			flowError = error instanceof Error ? error.message : m.two_factor_setup_failed();
		} finally {
			isVerifyingPassword = false;
		}
	};

	const handleCancelSetup = () => {
		showSetupModal = false;
		showPasswordModal = false;
		showRecoveryCodesModal = false;
		twoFactorEnabled = profile?.two_factor_enabled ?? auth.user?.two_factor_enabled ?? false;
		previousTwoFactorEnabled = twoFactorEnabled;
		setupData = null;
		recoveryCodes = [];
		recoveryCodesSaved = false;
		is2faActivationFlow = false;
		confirmPassword = '';
		otpCode = '';
		otpError = null;
		flowError = null;
	};

	const handleCompleteSetup = async () => {
		const normalizedOtp = otpCode.trim();
		if (!/^\d{6}$/.test(normalizedOtp)) {
			otpError = m.invalid_otp();
			return;
		}

		otpError = null;
		isEnabling2fa = true;

		try {
			const response = await requestEnable2fa({
				validation_code: normalizedOtp
			});
			const enablePayload = getEnable2faPayload(response);

			recoveryCodes = enablePayload.recovery_codes;
			showSetupModal = false;
			showRecoveryCodesModal = true;
			twoFactorEnabled = true;
			previousTwoFactorEnabled = true;
			setupData = null;
			confirmPassword = '';
			otpCode = '';
			flowError = null;
			await auth.loadProfile();
		} catch (error) {
			otpError = error instanceof Error ? error.message : m.two_factor_enable_failed();
		} finally {
			isEnabling2fa = false;
		}
	};

	const handleCompleteRecoveryStep = () => {
		showRecoveryCodesModal = false;
		recoveryCodes = [];
		recoveryCodesSaved = false;
		is2faActivationFlow = false;
	};

	const copyToClipboard = async (text: string, id: string) => {
		try {
			await navigator.clipboard.writeText(text);
			copyFeedback = id;
			setTimeout(() => {
				if (copyFeedback === id) copyFeedback = null;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy: ', err);
		}
	};

	$effect(() => {
		if (otpError && otpCode.trim()) otpError = null;
	});

	const handleSave = async () => {
		isSaving = true;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		isSaving = false;
		saveSuccess = true;
		setTimeout(() => (saveSuccess = false), 3000);
	};

	const languages = [
		{ label: 'English', value: 'en' },
		{ label: 'Nederlands', value: 'nl' }
	];

	const timezones = [
		{ label: 'Europe/Amsterdam (GMT+1)', value: 'Europe/Amsterdam' },
		{ label: 'Europe/London (GMT+0)', value: 'Europe/London' },
		{ label: 'America/New_York (GMT-5)', value: 'America/New_York' }
	];

	const themes = [
		{ label: m.light(), value: 'light' },
		{ label: m.dark(), value: 'dark' },
		{ label: m.system(), value: 'system' }
	];

	const cardClass =
		'group relative overflow-hidden rounded-3xl border border-border/50 bg-glass-surface p-6 shadow-sm backdrop-blur-xl transition-all duration-300';
	const bentoCardClass =
		'flex flex-col gap-4 rounded-3xl border border-border/40 bg-white/40 p-5 dark:bg-zinc-900/40';
	const labelClass = 'text-[10px] font-bold tracking-widest text-text-muted uppercase';
	const valueClass = 'text-sm font-medium text-text';
</script>

<div class="mx-auto max-w-6xl space-y-8 pb-20">
	<header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div>
			<h1 class="text-4xl font-bold tracking-tight text-text">{m.settings()}</h1>
			<p class="mt-2 text-text-muted">Manage your account, security, and preferences.</p>
		</div>
		<div class="hidden md:block">
			<div
				class="flex items-center gap-2 rounded-2xl bg-brand/5 px-4 py-2 ring-1 ring-brand/10 transition-all hover:bg-brand/10"
			>
				<div class="h-2 w-2 animate-pulse rounded-full bg-brand"></div>
				<span class="text-xs font-bold text-brand uppercase">{accountStatus}</span>
			</div>
		</div>
	</header>

	{#if profileState.loadError}
		<div
			class="rounded-2xl border border-amber-400/30 bg-amber-50/80 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
		>
			{profileState.loadError}
		</div>
	{/if}

	{#if profilePending}
		<div
			class="rounded-2xl border border-brand/15 bg-brand/5 px-4 py-3 text-xs font-semibold tracking-wide text-brand uppercase"
		>
			Loading profile details...
		</div>
	{/if}

	<nav class="no-scrollbar flex overflow-x-auto border-b border-border/50 pb-px">
		<div class="flex min-w-full gap-1">
			{#each tabs as tab (tab.id)}
				<button
					onclick={() => (activeTab = tab.id as TabId)}
					class="relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all
                    {activeTab === tab.id
						? 'text-brand'
						: 'text-text-muted hover:bg-surface/50 hover:text-text'}"
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
		{#if activeTab === 'personal'}
			<div in:fade={{ duration: 300 }} class="space-y-8">
				<div class="grid gap-6 md:grid-cols-3">
					<div
						class="{cardClass} col-span-full flex flex-col items-center gap-8 md:col-span-2 md:flex-row md:items-start"
					>
						<div class="group relative">
							<div
								class="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border-2 border-brand/20 bg-linear-to-br from-brand/20 to-emerald-500/20 shadow-inner"
							>
								<span class="text-3xl font-bold tracking-tight text-brand">{initials}</span>
							</div>
							<div
								class="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-brand text-white shadow-lg ring-4 ring-white dark:ring-zinc-950"
							>
								<BadgeCheck class="h-4 w-4" />
							</div>
						</div>

						<div class="flex-1 space-y-4 text-center md:text-left">
							<div>
								<h2 class="text-3xl font-bold text-text">{fullName || '—'}</h2>
								<p class="font-medium text-brand">{primaryRole}</p>
							</div>

							<div class="flex flex-wrap justify-center gap-3 md:justify-start">
								<div
									class="flex items-center gap-2 rounded-xl bg-surface/80 px-3 py-1.5 ring-1 ring-border/50"
								>
									<Mail class="h-3.5 w-3.5 text-text-muted" />
									<span class="text-xs">{profile?.email ?? auth.user?.email ?? '—'}</span>
								</div>
								<div
									class="flex items-center gap-2 rounded-xl bg-surface/80 px-3 py-1.5 ring-1 ring-border/50"
								>
									<Clock class="h-3.5 w-3.5 text-text-muted" />
									<span class="text-xs"
										>{m.last_login()}: {formatDateTime(profile?.last_login ?? null)}</span
									>
								</div>
							</div>
						</div>
					</div>

					<div class={cardClass}>
						<h3 class={labelClass}>{m.account_status()}</h3>
						<div class="mt-4 flex items-center gap-4">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600"
							>
								<CheckCircle2 class="h-6 w-6" />
							</div>
							<div>
								<p class="text-sm font-bold tracking-tight text-text uppercase">{accountStatus}</p>
								<p class="text-xs text-text-muted">
									{m.last_login()}: {formatDate(profile?.last_login ?? null)}
								</p>
							</div>
						</div>
						<div class="mt-6 space-y-2">
							<div class="flex items-center justify-between text-xs">
								<span class="text-text-muted">Security Level</span>
								<span class="font-bold text-brand">{twoFactorEnabled ? 'High' : 'Medium'}</span>
							</div>
							<div class="h-1.5 w-full overflow-hidden rounded-full bg-border/30">
								<div
									class="h-full rounded-full bg-brand"
									style={`width: ${twoFactorEnabled ? 85 : 60}%`}
								></div>
							</div>
						</div>
					</div>
				</div>

				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<div class={cardClass}>
						<div class="mb-6 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand"
							>
								<Phone class="h-5 w-5" />
							</div>
							<h3 class="font-bold text-text">{m.contact_personal()}</h3>
						</div>
						<div class="space-y-4">
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.private_phone()}</span><span class={valueClass}
									>{profile?.private_phone_number ?? '—'}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.private_email()}</span><span class={valueClass}
									>{profile?.private_email_address ?? '—'}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.date_of_birth()}</span><span class={valueClass}
									>{formatDate(profile?.date_of_birth ?? null)}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.gender()}</span><span class={valueClass}
									>{profile?.gender ?? '—'}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.address()}</span><span class={valueClass}
									>{buildAddress()}</span
								>
							</div>
						</div>
					</div>

					<div class={cardClass}>
						<div class="mb-6 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600"
							>
								<Briefcase class="h-5 w-5" />
							</div>
							<h3 class="font-bold text-text">{m.work_context()}</h3>
						</div>
						<div class="space-y-4">
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.position()}</span><span class={valueClass}
									>{profile?.position ?? '—'}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.department()}</span><span class={valueClass}
									>{profile?.department ?? '—'}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.employee_number()}</span><span class={valueClass}
									>{profile?.employee_number ?? '—'}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.employment_number()}</span><span class={valueClass}
									>{profile?.employment_number ?? '—'}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.assigned_location()}</span>
								<div class="flex items-center gap-2">
									<MapPin class="h-3.5 w-3.5 text-brand" /><span class={valueClass}
										>{profile?.location_name ?? '—'}</span
									>
								</div>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.organization_name()}</span><span class={valueClass}
									>{profile?.organisation_name ?? '—'}</span
								>
							</div>
						</div>
					</div>

					<div class={cardClass}>
						<div class="mb-6 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600"
							>
								<Building2 class="h-5 w-5" />
							</div>
							<h3 class="font-bold text-text">{m.employment()}</h3>
						</div>
						<div class="space-y-4">
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.contract_type()}</span><span class={valueClass}
									>{contractTypeLabel(profile?.contract_type)}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.contract_hours()}</span><span class={valueClass}
									>{profile?.contract_hours != null
										? `${profile.contract_hours}h / week`
										: '—'}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.contract_start()}</span><span class={valueClass}
									>{formatDate(profile?.contract_start_date ?? null)}</span
								>
							</div>
							<div class="flex flex-col gap-1">
								<span class={labelClass}>{m.contract_end()}</span><span class={valueClass}
									>{formatDate(profile?.contract_end_date ?? null)}</span
								>
							</div>
							{#if isAdmin}
								<div class="flex flex-col gap-1">
									<span class={labelClass}>{m.hourly_rate()}</span>
									<div class="flex items-center gap-2 font-mono text-brand">
										<CreditCard class="h-3.5 w-3.5" /><span class="text-sm font-bold"
											>{profile?.contract_rate != null
												? `€${profile.contract_rate.toFixed(2)}`
												: '—'}</span
										>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<div class={cardClass}>
					<div class="mb-8 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600"
							>
								<GraduationCap class="h-5 w-5" />
							</div>
							<h3 class="font-bold text-text">{m.qualifications()}</h3>
						</div>
					</div>

					<div class="grid gap-6 md:grid-cols-3">
						<div class={bentoCardClass}>
							<span class={labelClass}>{m.education()}</span>
							{#if profile?.education.length}
								{#each profile.education.slice(0, 2) as edu (`${edu.institution_name}-${edu.degree}-${edu.start_date ?? 'na'}`)}
									<p class="text-sm leading-tight font-bold">{edu.degree} • {edu.field_of_study}</p>
									<p class="text-xs text-text-muted">
										{edu.institution_name} ({formatDate(edu.start_date)} - {formatDate(
											edu.end_date
										)})
									</p>
								{/each}
							{:else}
								<p class="text-sm text-text-muted">—</p>
							{/if}
						</div>
						<div class={bentoCardClass}>
							<span class={labelClass}>{m.certifications()}</span>
							<div class="flex flex-wrap gap-2">
								<div
									class="flex items-center gap-1.5 rounded-lg bg-brand/5 px-2 py-1 text-[10px] font-medium text-brand ring-1 ring-brand/20"
								>
									<Award class="h-3 w-3" />Provided by certification endpoint
								</div>
							</div>
						</div>
						<div class={bentoCardClass}>
							<span class={labelClass}>{m.experience()}</span>
							<div class="space-y-2">
								{#if profile?.work_experience.length}
									{#each profile.work_experience.slice(0, 2) as exp (`${exp.company_name}-${exp.job_title}-${exp.start_date ?? 'na'}`)}
										<p class="text-sm leading-tight font-bold">{exp.job_title}</p>
										<p class="text-xs text-text-muted">
											{exp.company_name} ({formatDate(exp.start_date)} - {formatDate(exp.end_date)})
										</p>
									{/each}
								{:else}
									<p class="text-sm text-text-muted">—</p>
								{/if}
							</div>
							<div
								class="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase"
							>
								<History class="h-3 w-3" />Verified
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if activeTab === 'security'}
			<div in:fade={{ duration: 300 }} class="space-y-8">
				<div class="grid gap-8 md:grid-cols-2">
					<section class={cardClass}>
						<div class="mb-6 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand"
							>
								<ShieldCheck class="h-5 w-5" />
							</div>
							<div>
								<h3 class="text-lg font-bold text-text">{m.security()}</h3>
								<p class="text-sm text-text-muted">Manage your password and 2FA.</p>
							</div>
						</div>

						<div class="space-y-6">
							<button
								class="group/item flex w-full items-center justify-between rounded-2xl border border-border/50 bg-surface/50 p-4 transition-all hover:border-brand/20 hover:bg-surface"
							>
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
									>
										<KeyRound class="h-5 w-5" />
									</div>
									<div class="text-left">
										<p class="text-sm font-bold text-text">{m.change_password()}</p>
										<p class="text-xs text-text-muted">Last changed recently</p>
									</div>
								</div>
								<ChevronRight
									class="h-4 w-4 text-text-subtle transition-transform group-hover/item:translate-x-1"
								/>
							</button>

							<div class="rounded-2xl border border-border/50 bg-surface/50 p-4">
								<Toggle
									label={m.two_factor_authentication()}
									description={m.two_factor_description()}
									bind:checked={twoFactorEnabled}
								/>
								{#if twoFactorEnabled}
									<div
										class="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-[10px] font-bold text-emerald-600 uppercase dark:text-emerald-400"
										transition:slide
									>
										<CheckCircle2 class="h-3 w-3" />
										{m.two_factor_enabled()}
									</div>
								{/if}
							</div>
						</div>
					</section>

					<section class={cardClass}>
						<div class="mb-6 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand"
							>
								<Smartphone class="h-5 w-5" />
							</div>
							<div>
								<h3 class="text-lg font-bold text-text">{m.active_sessions()}</h3>
								<p class="text-sm text-text-muted">{m.active_sessions_description()}</p>
							</div>
						</div>

						<div class="space-y-4">
							{#if profile?.active_sessions.length}
								{#each profile.active_sessions as session, index (session.id)}
									<div
										class="flex items-center justify-between gap-4 rounded-2xl border border-border/40 p-4 transition-colors hover:bg-surface/50"
									>
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
											>
												{#if parseSessionDevice(session).includes('Mobile')}
													<Smartphone class="h-5 w-5" />
												{:else}
													<Monitor class="h-5 w-5" />
												{/if}
											</div>
											<div>
												<div class="flex items-center gap-2">
													<p class="text-sm font-bold text-text">{parseSessionDevice(session)}</p>
													{#if isCurrentSession(session, index)}
														<span
															class="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand uppercase"
															>Current</span
														>
													{/if}
												</div>
												<p class="text-xs text-text-muted">
													{parseSessionBrowser(session)} • {session.client_ip}
												</p>
												<p class="text-xs text-text-muted">
													Started: {formatDateTime(session.created_at)} • Expires: {formatDateTime(
														session.expires_at
													)}
												</p>
											</div>
										</div>
									</div>
								{/each}
							{:else}
								<div class="rounded-2xl border border-border/40 p-4 text-sm text-text-muted">
									No active sessions found.
								</div>
							{/if}
						</div>
					</section>
				</div>
			</div>
		{:else if activeTab === 'preferences'}
			<div in:fade={{ duration: 300 }} class="space-y-8">
				<section class={cardClass}>
					<div class="mb-6 flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand"
						>
							<Bell class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-lg font-bold text-text">{m.preferences()}</h3>
							<p class="text-sm text-text-muted">Manage your language and notifications.</p>
						</div>
					</div>

					<div class="space-y-8">
						<div class="grid gap-6 sm:grid-cols-2">
							<Select label={m.language()} options={languages} bind:value={language} />
							<Select label={m.timezone()} options={timezones} bind:value={timezone} />
						</div>

						<div class="space-y-4 rounded-2xl border border-border/50 bg-surface/50 p-6">
							<p class="text-xs font-bold tracking-widest text-text-muted uppercase">
								{m.notifications_settings()}
							</p>
							<div class="space-y-6">
								<Toggle
									label={m.email_notifications()}
									description={m.email_notifications_description()}
									bind:checked={emailNotifications}
								/>
								<div class="h-px bg-border/50"></div>
								<Toggle
									label={m.push_notifications()}
									description={m.push_notifications_description()}
									bind:checked={pushNotifications}
								/>
							</div>
						</div>

						<div class="flex justify-end">
							<Button onclick={handleSave} isLoading={isSaving} class="min-w-[140px]">
								{#if saveSuccess}
									<CheckCircle2 class="mr-2 h-4 w-4" />
									Done
								{:else}
									{m.save_changes()}
								{/if}
							</Button>
						</div>
					</div>
				</section>
			</div>
		{:else if activeTab === 'appearance'}
			<div in:fade={{ duration: 300 }} class="space-y-8">
				<section class={cardClass}>
					<div class="mb-6 flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand"
						>
							<Monitor class="h-5 w-5" />
						</div>
						<div>
							<h3 class="text-lg font-bold text-text">{m.appearance()}</h3>
							<p class="text-sm text-text-muted">Customize how MaiCare looks for you.</p>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{#each themes as t (t.value)}
							<button
								onclick={() => (theme = t.value)}
								class="group/theme relative flex flex-col items-center gap-4 rounded-3xl border p-6 transition-all duration-300
                                {theme === t.value
									? 'border-brand bg-brand/5 shadow-sm ring-1 ring-brand'
									: 'border-border/50 bg-surface/50 hover:border-brand/30 hover:bg-surface'}"
							>
								<div
									class="flex h-20 w-full items-center justify-center rounded-2xl bg-zinc-100 transition-colors group-hover/theme:bg-white dark:bg-zinc-800 dark:group-hover/theme:bg-zinc-700"
								>
									{#if t.value === 'light'}
										<Monitor class="h-8 w-8 text-zinc-400" />
									{:else if t.value === 'dark'}
										<Monitor class="h-8 w-8 text-zinc-900 dark:text-white" />
									{:else}
										<div
											class="relative h-8 w-8 overflow-hidden rounded-full border border-zinc-300"
										>
											<div class="absolute inset-0 bg-white"></div>
											<div class="absolute inset-0 left-1/2 bg-zinc-900"></div>
										</div>
									{/if}
								</div>
								<span
									class="text-sm font-bold {theme === t.value ? 'text-brand' : 'text-text-muted'}"
									>{t.label}</span
								>
								{#if theme === t.value}
									<div class="absolute top-4 right-4" in:scale>
										<CheckCircle2 class="h-4 w-4 text-brand" />
									</div>
								{/if}
							</button>
						{/each}
					</div>

					<div class="mt-8 flex gap-4 rounded-3xl bg-orange-500/5 p-6 ring-1 ring-orange-500/10">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600"
						>
							<Globe class="h-5 w-5" />
						</div>
						<div>
							<p
								class="text-sm font-bold tracking-tight text-orange-600 uppercase dark:text-orange-400"
							>
								Beta Features
							</p>
							<p class="mt-1 text-sm leading-relaxed text-text-muted">
								New experimental themes and layout options are coming soon. Stay tuned for more
								customization possibilities.
							</p>
						</div>
					</div>
				</section>
			</div>
		{/if}
	</main>
</div>

<!-- 2FA Password Confirmation Modal -->
<Modal
	bind:open={showPasswordModal}
	title={m.confirm_password()}
	description={m.confirm_password_description()}
	size="sm"
>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			void handlePasswordConfirm();
		}}
		class="space-y-6"
	>
		<Input
			type="password"
			label={m.password()}
			placeholder="••••••••"
			bind:value={confirmPassword}
			required
		/>
		{#if flowError}
			<p class="text-xs font-medium text-rose-600 dark:text-rose-400">{flowError}</p>
		{/if}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancelSetup}>{m.cancel()}</Button>
			<Button type="submit" isLoading={isVerifyingPassword} disabled={!confirmPassword}>
				{m.continue()}
			</Button>
		</div>
	</form>
</Modal>

<!-- 2FA Setup Modal -->
<Modal
	bind:open={showSetupModal}
	title={m.setup_2fa()}
	description={m.setup_2fa_description()}
	size="md"
>
	{#if setupData}
		<div class="space-y-6">
			<div
				class="flex flex-col items-center justify-center gap-4 rounded-3xl bg-surface/50 p-8 ring-1 ring-border/50"
			>
				<div
					class="relative overflow-hidden rounded-2xl border-8 border-white bg-white shadow-lg dark:border-zinc-800"
				>
					<img
						src={`data:image/png;base64,${setupData.qr_code_base64}`}
						alt={m.qr_code()}
						class="h-48 w-48"
					/>
				</div>
				<p class="text-xs font-medium tracking-widest text-text-muted uppercase">{m.qr_code()}</p>
			</div>

			<div class="space-y-2">
				<label for="secret-key" class="ml-1 text-sm font-semibold text-text-muted"
					>{m.secret_key()}</label
				>
				<div class="relative flex items-center gap-2">
					<code
						id="secret-key"
						class="flex-1 rounded-xl border border-border bg-surface/80 px-4 py-3 font-mono text-sm font-bold tracking-wider text-brand"
					>
						{setupData.secret}
					</code>
					<Tooltip content={copyFeedback === 'secret' ? m.copied() : m.copy_secret()}>
						{#snippet children()}
							<Button
								variant="ghost"
								class="h-11 w-11 shrink-0 rounded-xl border border-border bg-surface hover:bg-surface/80"
								onclick={() => copyToClipboard(setupData!.secret, 'secret')}
							>
								{#if copyFeedback === 'secret'}
									<Check class="h-4 w-4 text-emerald-500" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</Button>
						{/snippet}
					</Tooltip>
				</div>
			</div>

			<div class="rounded-2xl bg-brand/5 p-4 ring-1 ring-brand/10">
				<div class="flex gap-3">
					<div
						class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white"
					>
						1
					</div>
					<p class="text-xs leading-relaxed text-text-muted">
						Install an authenticator app like <span class="font-bold text-text"
							>Google Authenticator</span
						>
						or <span class="font-bold text-text">Authy</span>.
					</p>
				</div>
				<div class="mt-3 flex gap-3">
					<div
						class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white"
					>
						2
					</div>
					<p class="text-xs leading-relaxed text-text-muted">
						Scan the QR code or enter the secret key manually to add your account.
					</p>
				</div>
			</div>

			<div class="space-y-2 rounded-2xl border border-border/50 bg-surface/40 p-4">
				<Input
					type="text"
					label={m.otp_code()}
					placeholder={m.otp_placeholder()}
					bind:value={otpCode}
					inputmode="numeric"
					autocomplete="one-time-code"
					maxlength={6}
				/>
				{#if otpError}
					<p class="text-xs font-medium text-rose-600 dark:text-rose-400">{otpError}</p>
				{/if}
			</div>

			{#if flowError}
				<p class="text-xs font-medium text-rose-600 dark:text-rose-400">{flowError}</p>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancelSetup}>{m.cancel()}</Button>
			<Button
				onclick={() => void handleCompleteSetup()}
				isLoading={isEnabling2fa}
				disabled={otpCode.trim().length === 0 || isEnabling2fa}
			>
				{m.verify_and_enable()}
			</Button>
		</div>
	{/snippet}
</Modal>

<Modal
	bind:open={showRecoveryCodesModal}
	title={m.recovery_codes_title()}
	description={m.recovery_codes_description()}
	size="md"
>
	<div class="space-y-6">
		<div
			class="rounded-2xl border border-amber-400/30 bg-amber-50/80 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
		>
			{m.recovery_codes_warning()}
		</div>

		<div class="grid gap-2 sm:grid-cols-2">
			{#each recoveryCodes as code (code)}
				<code
					class="rounded-xl border border-border bg-surface/80 px-4 py-3 font-mono text-sm font-bold tracking-wide text-text"
				>
					{code}
				</code>
			{/each}
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="ghost"
				onclick={() => copyToClipboard(recoveryCodes.join('\n'), 'recovery-codes')}
			>
				{copyFeedback === 'recovery-codes' ? m.copied() : m.copy_recovery_codes()}
			</Button>
		</div>

		<label class="flex items-center gap-3 rounded-2xl border border-border/50 bg-surface/40 p-4">
			<input
				type="checkbox"
				bind:checked={recoveryCodesSaved}
				class="h-4 w-4 rounded border-border"
			/>
			<span class="text-sm text-text-muted">{m.recovery_codes_saved_ack()}</span>
		</label>
	</div>

	{#snippet footer()}
		<div class="flex justify-end">
			<Button onclick={handleCompleteRecoveryStep} disabled={!recoveryCodesSaved}>
				{m.done()}
			</Button>
		</div>
	{/snippet}
</Modal>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
