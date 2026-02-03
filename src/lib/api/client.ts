import { PUBLIC_API_URL } from '$env/static/public';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { resolve } from '$app/paths';
import type { ApiEnvelope, RefreshTokenData } from '$lib/types/api';

type FetchOptions = RequestInit & {
	requiresAuth?: boolean;
};

class ApiClient {
	private baseUrl: string;
	private refreshPromise: Promise<void> | null = null;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private getHeaders(requiresAuth = true): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json'
		};

		if (requiresAuth && browser) {
			const token = localStorage.getItem('access_token');
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
		}

		return headers;
	}

	private clearAuth() {
		if (browser) {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			localStorage.removeItem('temp_token');
			localStorage.removeItem('requires_2fa');
			localStorage.removeItem('user');
		}
	}

	private async refreshAccessToken(): Promise<void> {
		const refreshToken = localStorage.getItem('refresh_token');
		if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
			throw new Error('No refresh token available');
		}

		try {
			const response = await this.post<ApiEnvelope<RefreshTokenData>>(
				'/auth/refresh',
				{ token: refreshToken },
				{ requiresAuth: false }
			);

			if (response.success) {
				localStorage.setItem('access_token', response.data.access);
				if (response.data.refresh) {
					localStorage.setItem('refresh_token', response.data.refresh);
				}
				// Dispatch event to notify other parts of the app (like AuthState)
				window.dispatchEvent(new CustomEvent('auth:refresh'));
			} else {
				throw new Error('Refresh failed');
			}
		} catch (error) {
			this.clearAuth();
			throw error;
		}
	}

	async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
		const { requiresAuth = true, ...fetchOptions } = options;
		const url = `${this.baseUrl}${endpoint}`;

		try {
			const response = await fetch(url, {
				...fetchOptions,
				headers: {
					...this.getHeaders(requiresAuth),
					...fetchOptions.headers
				}
			});

			const contentType = response.headers.get('content-type') ?? '';
			const isJson = contentType.includes('application/json');
			const payload = isJson ? await response.json().catch(() => null) : null;

			if (response.status === 401 && requiresAuth) {
				if (browser) {
					const refreshToken = localStorage.getItem('refresh_token');

					if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
						if (!this.refreshPromise) {
							this.refreshPromise = this.refreshAccessToken().finally(() => {
								this.refreshPromise = null;
							});
						}

						try {
							await this.refreshPromise;
							return this.request<T>(endpoint, options);
						} catch (error) {
							this.clearAuth();
							await goto(resolve('/login'));
							throw new Error('Unauthorized');
						}
					}

					this.clearAuth();
					await goto(resolve('/login'));
				}
				throw new Error('Unauthorized');
			}

			if (!response.ok) {
				const errorMessage =
					(payload && typeof payload === 'object' && 'message' in payload && payload.message) ||
					`API Error: ${response.statusText}`;
				throw new Error(String(errorMessage));
			}

			// Handle 204 No Content
			if (response.status === 204) {
				return {} as T;
			}

			if (
				payload &&
				typeof payload === 'object' &&
				'success' in payload &&
				payload.success === false
			) {
				const errorMessage = ('message' in payload && payload.message) || 'Request failed';
				throw new Error(String(errorMessage));
			}

			return (payload ?? {}) as T;
		} catch (error) {
			console.error('API Request Failed:', error);
			throw error;
		}
	}

	get<T>(endpoint: string, options?: FetchOptions) {
		return this.request<T>(endpoint, { ...options, method: 'GET' });
	}

	post<T>(endpoint: string, body: unknown, options?: FetchOptions) {
		return this.request<T>(endpoint, {
			...options,
			method: 'POST',
			body: JSON.stringify(body)
		});
	}

	put<T>(endpoint: string, body: unknown, options?: FetchOptions) {
		return this.request<T>(endpoint, {
			...options,
			method: 'PUT',
			body: JSON.stringify(body)
		});
	}

	patch<T>(endpoint: string, body: unknown, options?: FetchOptions) {
		return this.request<T>(endpoint, {
			...options,
			method: 'PATCH',
			body: JSON.stringify(body)
		});
	}

	delete<T>(endpoint: string, options?: FetchOptions) {
		return this.request<T>(endpoint, { ...options, method: 'DELETE' });
	}
}

// Export a singleton instance
export const api = new ApiClient(PUBLIC_API_URL);
