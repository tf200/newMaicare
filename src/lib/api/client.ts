import { PUBLIC_API_URL } from '$env/static/public';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { resolve } from '$app/paths';

type FetchOptions = RequestInit & {
	requiresAuth?: boolean;
};

class ApiClient {
	private baseUrl: string;

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
					localStorage.removeItem('access_token');
					localStorage.removeItem('refresh_token');
					localStorage.removeItem('temp_token');
					localStorage.removeItem('requires_2fa');
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

	delete<T>(endpoint: string, options?: FetchOptions) {
		return this.request<T>(endpoint, { ...options, method: 'DELETE' });
	}
}

// Export a singleton instance
export const api = new ApiClient(PUBLIC_API_URL);
