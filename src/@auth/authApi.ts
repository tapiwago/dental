import { User } from '@auth/user';
import UserModel from '@auth/user/models/UserModel';
import { PartialDeep } from 'type-fest';
import apiFetch from '@/utils/apiFetch';

/**
 * Refreshes the access token
 */
export async function authRefreshToken(): Promise<Response> {
	return apiFetch('/api/users/refresh', { method: 'POST' });
}

/**
 * Sign in with token
 */
export async function authSignInWithToken(accessToken: string): Promise<Response> {
	return apiFetch('/api/users/signin-with-token', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
}

/**
 * Sign in
 */
export async function authSignIn(credentials: { firstName: string; password: string }): Promise<Response> {
	return apiFetch('/api/users/signin', {
		method: 'POST',
		body: JSON.stringify(credentials)
	});
}

/**
 * Sign up
 */
export async function authSignUp(data: {
	firstName: string;
	lastName: string;
	password: string;
	email?: string;
	role?: string;
}): Promise<Response> {
	return apiFetch('/api/users/register', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/**
 * Get user by id
 */
export async function authGetDbUser(userId: string): Promise<Response> {
	return apiFetch(`/api/users/${userId}`);
}

/**
 * Get user by email
 */
export async function authGetDbUserByEmail(email: string): Promise<Response> {
	return apiFetch(`/api/users/email/${email}`);
}

/**
 * Update user
 */
export function authUpdateDbUser(user: PartialDeep<User>) {
	return apiFetch(`/api/users/${user.id}`, {
		method: 'PUT',
		body: JSON.stringify(UserModel(user))
	});
}

/**
 * Create user
 */
export async function authCreateDbUser(user: PartialDeep<User>) {
	return apiFetch('/api/users/register', {
		method: 'POST',
		body: JSON.stringify(UserModel(user))
	});
}
