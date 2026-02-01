import { getContext, setContext } from 'svelte';
import type { AuthTokenData, AuthRequest, EmployeeProfile } from '$lib/types/api';
import { requestAuthToken, requestEmployeeProfile, requestVerify2fa } from '$lib/api/auth';

const AUTH_KEY = Symbol('AUTH');

export interface AuthStorageSnapshot {
	accessToken: string | null;
	refreshToken: string | null;
	tempToken: string | null;
	requires2fa: boolean;
	user: EmployeeProfile | null;
}

export function readAuthStorage(): AuthStorageSnapshot {
	if (typeof localStorage === 'undefined') {
		return {
			accessToken: null,
			refreshToken: null,
			tempToken: null,
			requires2fa: false,
			user: null
		};
	}

	const accessToken = localStorage.getItem('access_token');
	const refreshToken = localStorage.getItem('refresh_token');
	const tempToken = localStorage.getItem('temp_token');
	const requires2fa = localStorage.getItem('requires_2fa') === 'true';
	const userStr = localStorage.getItem('user');
	let user: EmployeeProfile | null = null;

	if (userStr) {
		try {
			user = JSON.parse(userStr);
		} catch (error) {
			console.error('Failed to parse user from local storage', error);
		}
	}

	return {
		accessToken,
		refreshToken,
		tempToken,
		requires2fa,
		user
	};
}

export interface AuthContext {
	user: EmployeeProfile | null;
	accessToken: string | null;
	refreshToken: string | null;
	tempToken: string | null;
	requires2fa: boolean;
	isAuthenticated: boolean;
	authenticate: (payload: AuthRequest) => Promise<AuthTokenData>;
	verify2fa: (validationCode: string, tempTokenOverride?: string) => Promise<AuthTokenData>;
	loadProfile: () => Promise<EmployeeProfile | null>;
	hasPermission: (permission: string) => boolean;
	hasAnyPermission: (permissions: string[]) => boolean;
	hasAllPermissions: (permissions: string[]) => boolean;
	logout: () => void;
}

export class AuthState {
	user = $state<EmployeeProfile | null>(null);
	accessToken = $state<string | null>(null);
	refreshToken = $state<string | null>(null);
	tempToken = $state<string | null>(null);
	requires2fa = $state(false);
	isAuthenticated = $derived(!!this.accessToken && !this.requires2fa);

	constructor() {
		// Initialize from localStorage if available
		this.init();
	}

	init() {
		const snapshot = readAuthStorage();
		if (snapshot.accessToken) this.accessToken = snapshot.accessToken;
		if (snapshot.refreshToken) this.refreshToken = snapshot.refreshToken;
		if (snapshot.tempToken) this.tempToken = snapshot.tempToken;
		this.requires2fa = snapshot.requires2fa;
		this.user = snapshot.user;
		if (this.accessToken) {
			void this.loadProfile();
		}
	}

	setUser = (user: EmployeeProfile | null) => {
		this.user = user;
		if (typeof localStorage !== 'undefined') {
			if (user) {
				localStorage.setItem('user', JSON.stringify(user));
			} else {
				localStorage.removeItem('user');
			}
		}
	};

	setTokens = (data: AuthTokenData) => {
		this.requires2fa = data.requires_2fa;
		this.tempToken = data.temp_token || null;
		if (data.requires_2fa) {
			this.accessToken = null;
			this.refreshToken = null;
			this.setUser(null);
		} else {
			this.accessToken = data.access;
			this.refreshToken = data.refresh;
		}

		if (typeof localStorage !== 'undefined') {
			if (data.requires_2fa) {
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
			} else {
				localStorage.setItem('access_token', data.access);
				localStorage.setItem('refresh_token', data.refresh);
			}
			if (data.temp_token) {
				localStorage.setItem('temp_token', data.temp_token);
			} else {
				localStorage.removeItem('temp_token');
			}
			localStorage.setItem('requires_2fa', String(data.requires_2fa));
		}
	};

	authenticate = async (payload: AuthRequest) => {
		const response = await requestAuthToken(payload);
		if (!response.success) {
			throw new Error(response.message || 'Authentication failed');
		}
		this.setTokens(response.data);
		if (!this.requires2fa) {
			await this.loadProfile();
		}
		return response.data;
	};

	verify2fa = async (validationCode: string, tempTokenOverride?: string) => {
		const tempToken = tempTokenOverride || this.tempToken;
		if (!tempToken) {
			throw new Error('Missing temporary token. Please sign in again.');
		}
		const response = await requestVerify2fa({
			temp_token: tempToken,
			validation_code: validationCode
		});
		if (!response.success) {
			throw new Error(response.message || 'Verification failed');
		}
		this.setTokens(response.data);
		await this.loadProfile();
		return response.data;
	};

	loadProfile = async () => {
		if (!this.accessToken) {
			this.setUser(null);
			return null;
		}
		try {
			const response = await requestEmployeeProfile();
			if (!response.success) {
				throw new Error(response.message || 'Failed to load profile');
			}
			this.setUser(response.data);
			return response.data;
		} catch (error) {
			console.error('Failed to load employee profile', error);
			this.setUser(null);
			return null;
		}
	};

	hasPermission = (permission: string) => {
		return this.user?.permissions?.some((item) => item.name === permission) ?? false;
	};

	hasAnyPermission = (permissions: string[]) => {
		return permissions.some((permission) => this.hasPermission(permission));
	};

	hasAllPermissions = (permissions: string[]) => {
		return permissions.every((permission) => this.hasPermission(permission));
	};

	logout() {
		this.user = null;
		this.accessToken = null;
		this.refreshToken = null;
		this.tempToken = null;
		this.requires2fa = false;
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			localStorage.removeItem('temp_token');
			localStorage.removeItem('requires_2fa');
			localStorage.removeItem('user');
		}
	}
}

export function setAuthState(): AuthContext {
	const auth = new AuthState();
	setContext(AUTH_KEY, auth);
	return auth;
}

export function getAuthState(): AuthContext {
	return getContext<AuthContext>(AUTH_KEY);
}
