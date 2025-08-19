/**
 * Example service demonstrating how to use the authFetch middleware
 * This file shows common patterns for making authenticated API calls
 */

import { authGet, authPost, authPut, authDelete, FetchApiError } from '@/utils/apiFetch';

// Type for API error response
interface ApiErrorResponse {
	success: boolean;
	error: string;
}

// Example: User service using authFetch
export const userService = {
	// Get current user profile (requires authentication)
	async getCurrentUser() {
		try {
			const response = await authGet('/api/users/profile', { requireAuth: true });
			return await response.json();
		} catch (error) {
			if (error instanceof FetchApiError) {
				if (error.isAuthError) {
					// Handle authentication errors (401/403)
					console.error('Authentication error:', error.data);
					// Could redirect to login page here
					throw new Error('Authentication required');
				}

				// Handle other API errors
				const errorData = error.data as ApiErrorResponse;
				console.error('API error:', errorData);
				throw new Error(errorData?.error || 'Failed to fetch user profile');
			}

			throw error;
		}
	},

	// Update user profile (requires authentication)
	async updateProfile(userData: any) {
		try {
			const response = await authPut('/api/users/profile', userData, { requireAuth: true });
			return await response.json();
		} catch (error) {
			if (error instanceof FetchApiError) {
				const errorData = error.data as ApiErrorResponse;
				console.error('Failed to update profile:', errorData);
				throw new Error(errorData?.error || 'Failed to update profile');
			}

			throw error;
		}
	},

	// Get all users (admin only, requires authentication)
	async getAllUsers() {
		try {
			const response = await authGet('/api/users', { requireAuth: true });
			return await response.json();
		} catch (error) {
			if (error instanceof FetchApiError) {
				const errorData = error.data as ApiErrorResponse;
				console.error('Failed to fetch users:', errorData);
				throw new Error(errorData?.error || 'Failed to fetch users');
			}

			throw error;
		}
	},

	// Delete user (admin only, requires authentication)
	async deleteUser(userId: string) {
		try {
			const response = await authDelete(`/api/users/${userId}`, { requireAuth: true });
			return await response.json();
		} catch (error) {
			if (error instanceof FetchApiError) {
				const errorData = error.data as ApiErrorResponse;
				console.error('Failed to delete user:', errorData);
				throw new Error(errorData?.error || 'Failed to delete user');
			}

			throw error;
		}
	}
};

// Example: Public service for non-authenticated endpoints
export const publicService = {
	// Get public data (no authentication required)
	async getPublicData() {
		try {
			const response = await authGet('/api/public/data');
			return await response.json();
		} catch (error) {
			if (error instanceof FetchApiError) {
				const errorData = error.data as ApiErrorResponse;
				console.error('Failed to fetch public data:', errorData);
				throw new Error(errorData?.error || 'Failed to fetch public data');
			}

			throw error;
		}
	},

	// Contact form submission (no authentication required)
	async submitContactForm(formData: any) {
		try {
			const response = await authPost('/api/public/contact', formData);
			return await response.json();
		} catch (error) {
			if (error instanceof FetchApiError) {
				const errorData = error.data as ApiErrorResponse;
				console.error('Failed to submit contact form:', errorData);
				throw new Error(errorData?.error || 'Failed to submit contact form');
			}

			throw error;
		}
	}
};

// Example: Helper function for handling common API responses
export const handleApiResponse = async (responsePromise: Promise<Response>) => {
	try {
		const response = await responsePromise;
		const data = await response.json();

		if (data.success === false) {
			throw new Error(data.error || 'API request failed');
		}

		return data;
	} catch (error) {
		if (error instanceof FetchApiError) {
			if (error.isAuthError) {
				// Handle authentication errors globally
				console.error('Authentication error, redirecting to login...');
				// window.location.href = '/sign-in';
			}

			const errorData = error.data as ApiErrorResponse;
			throw new Error(errorData?.error || 'API request failed');
		}

		throw error;
	}
};
