// Use the environment variable directly, with fallback to localhost:5000
export const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL as string) || 'http://localhost:5000';

// Define the types for options and configuration
type FetchOptions = RequestInit & {
  requireAuth?: boolean;
  skipGlobalHeaders?: boolean;
};

export class FetchApiError extends Error {
	status: number;
	data: unknown;
	isAuthError: boolean;

	constructor(status: number, data: unknown) {
		super(`FetchApiError: ${status}`);
		this.status = status;
		this.data = data;
		this.isAuthError = status === 401 || status === 403;
	}
}

// Global headers configuration
export const globalHeaders: Record<string, string> = {};

// Function to update global headers
export const setGlobalHeaders = (newHeaders: Record<string, string>) => {
	Object.assign(globalHeaders, newHeaders);
};

export const removeGlobalHeaders = (headerKeys: string[]) => {
	headerKeys.forEach((key) => {
		delete globalHeaders[key];
	});
};

// Authentication utilities
export const setAuthToken = (token: string) => {
	globalHeaders.Authorization = `Bearer ${token}`;
};

export const removeAuthToken = () => {
	delete globalHeaders.Authorization;
};

export const getAuthToken = (): string | null => {
	// First check global headers, then fall back to localStorage
	const headerToken = globalHeaders.Authorization?.replace('Bearer ', '');
	if (headerToken) return headerToken;
	
	// Fall back to localStorage
	return localStorage.getItem('jwt_access_token');
};

export const isAuthenticated = (): boolean => {
	return !!getAuthToken();
};

// Main apiFetch function with interceptors and type safety
const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
	const { 
		headers, 
		requireAuth = false, 
		skipGlobalHeaders = false,
		...restOptions 
	} = options;
	const method = restOptions.method || 'GET';
	const fullUrl = `${API_BASE_URL}${endpoint}`;
	
	console.log(`ApiFetch ->>>>>: ${method} ${fullUrl}`);
	
	// Check authentication requirement
	if (requireAuth && !isAuthenticated()) {
		console.error('ApiFetch: Authentication required but user is not authenticated');
		throw new FetchApiError(401, { 
			success: false, 
			error: 'Authentication required' 
		});
	}
	
	// Get the current auth token
	const currentToken = getAuthToken();
	const authHeadersToUse = currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
	
	// Set default headers, including global headers and auth
	const config: RequestInit = {
		headers: {
			...(method !== 'GET' && { 'Content-Type': 'application/json' }),
			...(skipGlobalHeaders ? {} : { ...globalHeaders, ...authHeadersToUse }),
			...headers
		},
		...restOptions
	};

	console.log('ApiFetch: Request config:', {
		url: fullUrl,
		method,
		headers: config.headers,
		hasBody: !!config.body
	});

	try {
		const response = await fetch(fullUrl, config);

		console.log(`ApiFetch: Response ${response.status} ${response.statusText}`);

		// Handle authentication errors specifically
		if (response.status === 401) {
			console.warn('ApiFetch: 401 Unauthorized - clearing auth tokens');
			// Clear auth tokens on 401
			removeAuthToken();
			localStorage.removeItem('jwt_access_token');
			// You might want to redirect to login here
			// window.location.href = '/sign-in';
		}

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
				console.error('ApiFetch: Error response data:', errorData);
			} catch {
				errorData = { success: false, error: 'Network error occurred' };
				console.error('ApiFetch: Failed to parse error response');
			}
			throw new FetchApiError(response.status, errorData);
		}

		console.log('ApiFetch: Request successful');
		return response;
	} catch (error) {
		if (error instanceof FetchApiError) {
			throw error;
		}
		
		console.error('ApiFetch: Network error:', error);
		throw new FetchApiError(0, { 
			success: false, 
			error: 'Network error occurred' 
		});
	}
};

// Convenience methods for common HTTP operations
export const apiGet = (endpoint: string, options: Omit<FetchOptions, 'method'> = {}) => {
	return apiFetch(endpoint, { ...options, method: 'GET' });
};

export const apiPost = (endpoint: string, data?: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}) => {
	return apiFetch(endpoint, {
		...options,
		method: 'POST',
		body: data ? JSON.stringify(data) : undefined
	});
};

export const apiPut = (endpoint: string, data?: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}) => {
	return apiFetch(endpoint, {
		...options,
		method: 'PUT',
		body: data ? JSON.stringify(data) : undefined
	});
};

export const apiDelete = (endpoint: string, options: Omit<FetchOptions, 'method'> = {}) => {
	return apiFetch(endpoint, { ...options, method: 'DELETE' });
};

export const apiPatch = (endpoint: string, data?: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}) => {
	return apiFetch(endpoint, {
		...options,
		method: 'PATCH',
		body: data ? JSON.stringify(data) : undefined
	});
};

// Authenticated convenience methods
export const authGet = (endpoint: string, options: Omit<FetchOptions, 'method'> = {}) => {
	return apiGet(endpoint, { ...options, requireAuth: true });
};

export const authPost = (endpoint: string, data?: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}) => {
	return apiPost(endpoint, data, { ...options, requireAuth: true });
};

export const authPut = (endpoint: string, data?: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}) => {
	return apiPut(endpoint, data, { ...options, requireAuth: true });
};

export const authDelete = (endpoint: string, options: Omit<FetchOptions, 'method'> = {}) => {
	return apiDelete(endpoint, { ...options, requireAuth: true });
};

export const authPatch = (endpoint: string, data?: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}) => {
	return apiPatch(endpoint, data, { ...options, requireAuth: true });
};

// API service utilities for common patterns
export const fetchJson = async (response: Response) => {
	try {
		return await response.json();
	} catch (error) {
		console.error('Failed to parse JSON response:', error);
		throw new FetchApiError(response.status, { error: 'Invalid JSON response' });
	}
};

export const handleApiResponse = async (response: Response) => {
	const data = await fetchJson(response);
	if (!response.ok) {
		throw new FetchApiError(response.status, data);
	}
	return data;
};

// Specific API endpoints for common operations
export const userApi = {
	getAll: () => authGet('/api/users'),
	getById: (id: string) => authGet(`/api/users/${id}`),
	create: (userData: any) => authPost('/api/users/register', userData),
	update: (id: string, userData: any) => authPut(`/api/users/${id}`, userData),
	delete: (id: string) => authDelete(`/api/users/${id}`)
};

export const clientApi = {
	getAll: () => authGet('/api/clients'),
	getById: (id: string) => authGet(`/api/clients/${id}`),
	create: (clientData: any) => authPost('/api/clients', clientData),
	update: (id: string, clientData: any) => authPut(`/api/clients/${id}`, clientData),
	delete: (id: string) => authDelete(`/api/clients/${id}`)
};

export const onboardingApi = {
	getAll: () => authGet('/api/onboarding-cases'),
	getById: (id: string) => authGet(`/api/onboarding-cases/${id}`),
	create: (caseData: any) => authPost('/api/onboarding-cases', caseData),
	update: (id: string, caseData: any) => authPut(`/api/onboarding-cases/${id}`, caseData),
	delete: (id: string) => authDelete(`/api/onboarding-cases/${id}`),
	updateStatus: (id: string, status: string) => authPut(`/api/onboarding-cases/${id}/status`, { status }),
	getDashboard: () => authGet('/api/onboarding-cases/dashboard/summary')
};

export const authApi = {
	signin: (credentials: { firstName: string; password: string }) => 
		apiPost('/api/users/signin', credentials),
	signinWithToken: () => authGet('/api/users/signin-with-token'),
	register: (userData: any) => apiPost('/api/users/register', userData)
};

export default apiFetch;
