// Export the main authFetch function and utilities
export { default as authFetch } from './authFetch';
export {
	authGet,
	authPost,
	authPut,
	authDelete,
	authPatch,
	setAuthToken,
	removeAuthToken,
	getAuthToken,
	setAuthHeaders,
	removeAuthHeaders,
	isAuthenticated,
	AuthFetchError
} from './authFetch';

// Export the original apiFetch for backward compatibility if needed
export { default as apiFetch, API_BASE_URL } from './apiFetch';
