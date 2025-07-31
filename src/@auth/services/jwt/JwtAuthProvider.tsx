import { useState, useEffect, useCallback, useMemo, useImperativeHandle } from 'react';
import { FuseAuthProviderComponentProps, FuseAuthProviderState } from '@fuse/core/FuseAuthProvider/types/FuseAuthTypes';
import useLocalStorage from '@fuse/hooks/useLocalStorage';
import { authRefreshToken, authSignIn, authSignInWithToken, authSignUp, authUpdateDbUser } from '@auth/authApi';
import { User } from '../../user';
import { setAuthToken, removeAuthToken } from '@/utils/authFetch';
import { isTokenValid } from './utils/jwtUtils';
import JwtAuthContext from '@auth/services/jwt/JwtAuthContext';
import { JwtAuthContextType } from '@auth/services/jwt/JwtAuthContext';

export type JwtSignInPayload = {
	firstName: string;
	password: string;
};

export type JwtSignUpPayload = {
	firstName: string;
	lastName: string;
	password: string;
	email?: string;
	role?: string;
};

function JwtAuthProvider(props: FuseAuthProviderComponentProps) {
	const { ref, children, onAuthStateChanged } = props;

	// Ensure JWT is set as the auth provider
	useEffect(() => {
		const currentProvider = localStorage.getItem('fuseReactAuthProvider');
		if (currentProvider !== 'jwt') {
			localStorage.setItem('fuseReactAuthProvider', 'jwt');
			console.log('JWT Auth Provider: Set auth provider to jwt');
		}
	}, []);

	const {
		value: tokenStorageValue,
		setValue: setTokenStorageValue,
		removeValue: removeTokenStorageValue
	} = useLocalStorage<string>('jwt_access_token');

	/**
	 * Fuse Auth Provider State
	 */
	const [authState, setAuthState] = useState<FuseAuthProviderState<User>>({
		authStatus: 'configuring',
		isAuthenticated: false,
		user: null
	});

	console.log('JWT Auth Provider: Current auth state:', authState);

	/**
	 * Watch for changes in the auth state
	 * and pass them to the FuseAuthProvider
	 */
	useEffect(() => {
		if (onAuthStateChanged) {
			onAuthStateChanged(authState);
		}
	}, [authState, onAuthStateChanged]);

	/**
	 * Attempt to auto login with the stored token
	 */
	useEffect(() => {
		const attemptAutoLogin = async () => {
			const accessToken = tokenStorageValue;
			console.log('JWT Auth Provider: Attempting auto-login with token:', !!accessToken);

			if (isTokenValid(accessToken)) {
				console.log('JWT Auth Provider: Token is valid, attempting sign-in with token');
				try {
					/**
					 * Sign in with the token
					 */
					const response = await authSignInWithToken(accessToken);

					if (!response.ok) {
						console.error('JWT Auth Provider: Sign-in with token failed:', response.status);
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					const userData = (await response.json()) as User;
					console.log('JWT Auth Provider: Auto-login successful for user:', userData.firstName);

					return userData;
				} catch (error) {
					console.error('JWT Auth Provider: Auto-login error:', error);
					return false;
				}
			} else {
				console.log('JWT Auth Provider: No valid token found for auto-login');
			}

			return false;
		};

		// Only run auto-login if we're in configuring state
		if (authState.authStatus === 'configuring') {
			console.log('JWT Auth Provider: Auth state is configuring, attempting auto-login');
			attemptAutoLogin().then((userData) => {
				if (userData) {
					// Create displayName from firstName and lastName
					const user = {
						...userData,
						displayName: userData.firstName + (userData.lastName ? ` ${userData.lastName}` : ''),
						// Ensure role is properly formatted
						role: userData.role
					};

					console.log('JWT Auth Provider: Setting auto-login authenticated state');
					setAuthState({
						authStatus: 'authenticated',
						isAuthenticated: true,
						user
					});
					// Set the auth token for subsequent requests
					if (tokenStorageValue) {
						setAuthToken(tokenStorageValue);
					}
				} else {
					console.log('JWT Auth Provider: Auto-login failed, setting unauthenticated state');
					removeTokenStorageValue();
					removeAuthToken();
					setAuthState({
						authStatus: 'unauthenticated',
						isAuthenticated: false,
						user: null
					});
				}
			});
		}
		// eslint-disable-next-line
	}, []);

	/**
	 * Sign in
	 */
	const signIn: JwtAuthContextType['signIn'] = useCallback(
		async (credentials) => {
			console.log('JWT Auth Provider: Signing in with credentials:', { firstName: credentials.firstName, password: '***' });
			
			const response = await authSignIn(credentials);

			console.log('JWT Auth Provider: Sign in response status:', response.status);

			if (!response.ok) {
				console.error('JWT Auth Provider: Sign in failed with status:', response.status);
				return response;
			}

			const session = (await response.json()) as { 
				success: boolean;
				user: User; 
				token: string;
			};

			console.log('JWT Auth Provider: Sign in response data:', { 
				success: session.success, 
				user: session.user?.firstName, 
				hasToken: !!session.token 
			});

			if (session && session.success) {
				// Create displayName from firstName and lastName
				const user = {
					...session.user,
					displayName: session.user.firstName + (session.user.lastName ? ` ${session.user.lastName}` : ''),
					// Ensure role is in the format expected by the frontend (can be string or array)
					role: session.user.role
				};

				console.log('JWT Auth Provider: Setting authenticated state for user:', user.displayName);
				console.log('JWT Auth Provider: User data:', user);

				setAuthState({
					authStatus: 'authenticated',
					isAuthenticated: true,
					user
				});
				setTokenStorageValue(session.token);
				setAuthToken(session.token);
				
				console.log('JWT Auth Provider: Auth state updated successfully');
			} else {
				console.error('JWT Auth Provider: Sign in failed - no success in session or session is null');
				console.error('JWT Auth Provider: Session data:', session);
				throw new Error('Authentication failed');
			}

			return response;
		},
		[setTokenStorageValue]
	);

	/**
	 * Sign up
	 */
	const signUp: JwtAuthContextType['signUp'] = useCallback(
		async (data) => {
			const response = await authSignUp(data);

			const session = (await response.json()) as { user: User; access_token: string };

			if (session) {
				setAuthState({
					authStatus: 'authenticated',
					isAuthenticated: true,
					user: session.user
				});
				setTokenStorageValue(session.access_token);
				setAuthToken(session.access_token);
			}

			return response;
		},
		[setTokenStorageValue]
	);

	/**
	 * Sign out
	 */
	const signOut: JwtAuthContextType['signOut'] = useCallback(() => {
		removeTokenStorageValue();
		removeAuthToken();
		setAuthState({
			authStatus: 'unauthenticated',
			isAuthenticated: false,
			user: null
		});
	}, [removeTokenStorageValue]);

	/**
	 * Update user
	 */
	const updateUser: JwtAuthContextType['updateUser'] = useCallback(async (_user) => {
		try {
			return await authUpdateDbUser(_user);
		} catch (error) {
			console.error('Error updating user:', error);
			return Promise.reject(error);
		}
	}, []);

	/**
	 * Refresh access token
	 */
	const refreshToken: JwtAuthContextType['refreshToken'] = useCallback(async () => {
		const response = await authRefreshToken();

		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

		return response;
	}, []);

	/**
	 * Auth Context Value
	 */
	const authContextValue = useMemo(
		() =>
			({
				...authState,
				signIn,
				signUp,
				signOut,
				updateUser,
				refreshToken
			}) as JwtAuthContextType,
		[authState, signIn, signUp, signOut, updateUser, refreshToken]
	);

	/**
	 * Expose methods to the FuseAuthProvider
	 */
	useImperativeHandle(ref, () => ({
		signOut,
		updateUser
	}));

	/**
	 * Intercept fetch requests to refresh the access token
	 */
	const interceptFetch = useCallback(() => {
		const { fetch: originalFetch } = window;

		window.fetch = async (...args) => {
			const [resource, config] = args;
			const response = await originalFetch(resource, config);
			const newAccessToken = response.headers.get('New-Access-Token');

			if (newAccessToken) {
				setAuthToken(newAccessToken);
				setTokenStorageValue(newAccessToken);
			}

			if (response.status === 401) {
				signOut();

				console.error('Unauthorized request. User was signed out.');
			}

			return response;
		};
	}, [setTokenStorageValue, signOut]);

	useEffect(() => {
		if (authState.isAuthenticated) {
			interceptFetch();
		}
	}, [authState.isAuthenticated, interceptFetch]);

	return <JwtAuthContext value={authContextValue}>{children}</JwtAuthContext>;
}

export default JwtAuthProvider;
