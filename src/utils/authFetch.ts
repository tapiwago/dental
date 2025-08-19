import { API_BASE_URL } from './apiFetch';

// Define the types for options and configuration
type AuthFetchOptions = RequestInit & {
	requireAuth?: boolean;
	skipGlobalHeaders?: boolean;
};

export class AuthFetchError extends Error {
	status: number;
	data: unknown;
	isAuthError: boolean;

	constructor(status: number, data: unknown) {
		super(`AuthFetchError: ${status}`);
		this.status = status;
		this.data = data;
		this.isAuthError = status === 401 || status === 403;
	}
}

// Global headers configuration for authentication
export const authHeaders: Record<string, string> = {};

// Function to set authentication token
export const setAuthToken = (token: string) => {
	authHeaders.Authorization = `Bearer ${token}`;
};

// Function to remove authentication token
export const removeAuthToken = () => {
	delete authHeaders.Authorization;
};

// Function to get current auth token from localStorage
export const getAuthToken = (): string | null => {
	// First check the authHeaders, then fall back to localStorage
	const headerToken = authHeaders.Authorization?.replace('Bearer ', '');

	if (headerToken) return headerToken;

	// Fall back to localStorage
	return localStorage.getItem('jwt_access_token');
};

// Function to update global auth headers
export const setAuthHeaders = (newHeaders: Record<string, string>) => {
	Object.assign(authHeaders, newHeaders);
};

export const removeAuthHeaders = (headerKeys: string[]) => {
	headerKeys.forEach((key) => {
		delete authHeaders[key];
	});
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
	return !!getAuthToken();
};

// Enhanced authFetch function with authentication middleware
const authFetch = async (endpoint: string, options: AuthFetchOptions = {}) => {
	const { headers, requireAuth = false, skipGlobalHeaders = false, ...restOptions } = options;

	const method = restOptions.method || 'GET';
	const fullUrl = `${API_BASE_URL}${endpoint}`;

	console.log(`AuthFetch: ${method} ${fullUrl}`);
	console.log('AuthFetch: API_BASE_URL is:', API_BASE_URL);

	// Check authentication requirement
	if (requireAuth && !isAuthenticated()) {
		console.error('AuthFetch: Authentication required but user is not authenticated');
		throw new AuthFetchError(401, {
			success: false,
			error: 'Authentication required'
		});
	}

	// Get the current auth token
	const currentToken = getAuthToken();
	const authHeadersToUse = currentToken ? { Authorization: `Bearer ${currentToken}` } : {};

	// Set default headers, including auth headers
	const config: RequestInit = {
		headers: {
			...(method !== 'GET' && { 'Content-Type': 'application/json' }),
			...(skipGlobalHeaders ? {} : { ...authHeaders, ...authHeadersToUse }),
			...headers
		},
		...restOptions
	};

	console.log('AuthFetch: Request config:', {
		url: fullUrl,
		method,
		headers: config.headers,
		hasBody: !!config.body
	});

	try {
		const response = await fetch(fullUrl, config);

		console.log(`AuthFetch: Response ${response.status} ${response.statusText}`);

		// Handle authentication errors specifically
		if (response.status === 401) {
			console.warn('AuthFetch: 401 Unauthorized - clearing auth token');
			// Clear auth token on 401
			removeAuthToken();
			// Also clear from localStorage
			localStorage.removeItem('jwt_access_token');
			// You might want to redirect to login here
			// window.location.href = '/sign-in';
		}

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
				console.error('AuthFetch: Error response data:', errorData);
			} catch {
				errorData = { success: false, error: 'Network error occurred' };
				console.error('AuthFetch: Failed to parse error response');
			}
			throw new AuthFetchError(response.status, errorData);
		}

		console.log('AuthFetch: Request successful');
		return response;
	} catch (error) {
		if (error instanceof AuthFetchError) {
			throw error;
		}

		console.error('AuthFetch: Network error:', error);
		throw new AuthFetchError(0, {
			success: false,
			error: 'Network error occurred'
		});
	}
};

// Convenience methods for common HTTP operations
export const authGet = (endpoint: string, options: Omit<AuthFetchOptions, 'method'> = {}) => {
	return authFetch(endpoint, { ...options, method: 'GET' });
};

export const authPost = (endpoint: string, data?: unknown, options: Omit<AuthFetchOptions, 'method' | 'body'> = {}) => {
	return authFetch(endpoint, {
		...options,
		method: 'POST',
		body: data ? JSON.stringify(data) : undefined
	});
};

export const authPut = (endpoint: string, data?: unknown, options: Omit<AuthFetchOptions, 'method' | 'body'> = {}) => {
	return authFetch(endpoint, {
		...options,
		method: 'PUT',
		body: data ? JSON.stringify(data) : undefined
	});
};

export const authDelete = (endpoint: string, options: Omit<AuthFetchOptions, 'method'> = {}) => {
	return authFetch(endpoint, { ...options, method: 'DELETE' });
};

export const authPatch = (
	endpoint: string,
	data?: unknown,
	options: Omit<AuthFetchOptions, 'method' | 'body'> = {}
) => {
	return authFetch(endpoint, {
		...options,
		method: 'PATCH',
		body: data ? JSON.stringify(data) : undefined
	});
};

// API service utilities for common patterns
export const fetchJson = async (response: Response) => {
	try {
		return await response.json();
	} catch (error) {
		console.error('Failed to parse JSON response:', error);
		throw new AuthFetchError(response.status, { error: 'Invalid JSON response' });
	}
};

export const handleApiResponse = async (response: Response) => {
	const data = await fetchJson(response);

	if (!response.ok) {
		throw new AuthFetchError(response.status, data);
	}

	return data;
};

// Specific API endpoints for common operations
export const userApi = {
	getAll: () => authGet('/api/users', { requireAuth: true }),
	getById: (id: string) => authGet(`/api/users/${id}`, { requireAuth: true }),
	create: (userData: any) => authPost('/api/users/register', userData, { requireAuth: true }),
	update: (id: string, userData: any) => authPut(`/api/users/${id}`, userData, { requireAuth: true }),
	delete: (id: string) => authDelete(`/api/users/${id}`, { requireAuth: true })
};

export const clientApi = {
	getAll: () => authGet('/api/clients', { requireAuth: true }),
	getById: (id: string) => authGet(`/api/clients/${id}`, { requireAuth: true }),
	create: (clientData: any) => authPost('/api/clients', clientData, { requireAuth: true }),
	update: (id: string, clientData: any) => authPut(`/api/clients/${id}`, clientData, { requireAuth: true }),
	delete: (id: string) => authDelete(`/api/clients/${id}`, { requireAuth: true })
};

export const onboardingApi = {
	getAll: (params?: URLSearchParams) => {
		const endpoint = params ? `/api/onboarding-cases?${params.toString()}` : '/api/onboarding-cases';
		return authGet(endpoint, { requireAuth: true });
	},
	getById: (id: string) => authGet(`/api/onboarding-cases/${id}`, { requireAuth: true }),
	create: (caseData: any) => authPost('/api/onboarding-cases', caseData, { requireAuth: true }),
	update: (id: string, caseData: any) => authPut(`/api/onboarding-cases/${id}`, caseData, { requireAuth: true }),
	delete: (id: string) => authDelete(`/api/onboarding-cases/${id}`, { requireAuth: true }),
	updateStatus: (id: string, status: string) =>
		authPut(`/api/onboarding-cases/${id}/status`, { status }, { requireAuth: true }),
	getDashboard: () => authGet('/api/onboarding-cases/dashboard/summary', { requireAuth: true })
};

export const workflowTypeApi = {
	getAll: () => authGet('/api/workflow-types', { requireAuth: true }),
	getById: (id: string) => authGet(`/api/workflow-types/${id}`, { requireAuth: true }),
	create: (workflowTypeData: any) => authPost('/api/workflow-types', workflowTypeData, { requireAuth: true }),
	update: (id: string, workflowTypeData: any) =>
		authPut(`/api/workflow-types/${id}`, workflowTypeData, { requireAuth: true }),
	delete: (id: string) => authDelete(`/api/workflow-types/${id}`, { requireAuth: true }),
	setDefault: (id: string) => authPut(`/api/workflow-types/${id}/set-default`, {}, { requireAuth: true })
};

export const templateApi = {
	getAll: (params?: URLSearchParams) => {
		const endpoint = params ? `/api/templates?${params.toString()}` : '/api/templates';
		return authGet(endpoint, { requireAuth: true });
	},
	getById: (id: string) => authGet(`/api/templates/${id}`, { requireAuth: true }),
	create: (templateData: any) => authPost('/api/templates', templateData, { requireAuth: true }),
	update: (id: string, templateData: any) => authPut(`/api/templates/${id}`, templateData, { requireAuth: true }),
	delete: (id: string) => authDelete(`/api/templates/${id}`, { requireAuth: true }),
	clone: (id: string, cloneData: any) => authPost(`/api/templates/${id}/clone`, cloneData, { requireAuth: true }),
	publish: (id: string) => authPut(`/api/templates/${id}/publish`, {}, { requireAuth: true }),
	setDefault: (id: string) => authPut(`/api/templates/${id}/set-default`, {}, { requireAuth: true }),
	getRecommendations: () => authGet('/api/templates/recommendations', { requireAuth: true }),
	updateUsage: (id: string) => authPut(`/api/templates/${id}/usage`, {}, { requireAuth: true })
};

export const stageApi = {
	getAll: (params?: URLSearchParams) => {
		const endpoint = params ? `/api/stages?${params.toString()}` : '/api/stages';
		return authGet(endpoint, { requireAuth: true });
	},
	getById: (id: string) => authGet(`/api/stages/${id}`, { requireAuth: true }),
	create: (stageData: any) => authPost('/api/stages', stageData, { requireAuth: true }),
	createMultiple: (data: { stages: any[]; onboardingCase: string }) =>
		authPost('/api/stages/multiple', data, { requireAuth: true }),
	createWithTasks: (data: { stages: any[]; onboardingCase: string }) =>
		authPost('/api/stages/with-tasks', data, { requireAuth: true }),
	update: (id: string, stageData: any) => authPut(`/api/stages/${id}`, stageData, { requireAuth: true }),
	delete: (id: string) => authDelete(`/api/stages/${id}`, { requireAuth: true })
};

export const taskApi = {
	getAll: (params?: URLSearchParams) => {
		const endpoint = params ? `/api/tasks?${params.toString()}` : '/api/tasks';
		return authGet(endpoint, { requireAuth: true });
	},
	getById: (id: string) => authGet(`/api/tasks/${id}`, { requireAuth: true }),
	create: (taskData: any) => authPost('/api/tasks', taskData, { requireAuth: true }),
	createMultiple: (data: { tasks: any[]; stage: string; onboardingCase: string }) =>
		authPost('/api/tasks/multiple', data, { requireAuth: true }),
	addMultipleToStage: (stageId: string, data: { tasks: any[]; createdBy?: string }) =>
		authPost(`/api/tasks/stage/${stageId}/add-multiple`, data, { requireAuth: true }),
	update: (id: string, taskData: any) => authPut(`/api/tasks/${id}`, taskData, { requireAuth: true }),
	delete: (id: string) => authDelete(`/api/tasks/${id}`, { requireAuth: true }),
	updateStatus: (id: string, status: string) => authPut(`/api/tasks/${id}/status`, { status }, { requireAuth: true }),
	assign: (id: string, assignData: any) => authPost(`/api/tasks/${id}/assign`, assignData, { requireAuth: true }),
	addComment: (id: string, comment: any) => authPost(`/api/tasks/${id}/comments`, comment, { requireAuth: true })
};

export const authApi = {
	signin: (credentials: { firstName: string; password: string }) => authPost('/api/users/signin', credentials),
	signinWithToken: () => authGet('/api/users/signin-with-token', { requireAuth: true }),
	register: (userData: any) => authPost('/api/users/register', userData)
};

export default authFetch;
