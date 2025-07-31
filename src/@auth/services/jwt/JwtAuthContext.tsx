import { FuseAuthProviderState } from '@fuse/core/FuseAuthProvider/types/FuseAuthTypes';
import { User } from '@auth/user';
import { createContext } from 'react';
import { JwtSignInPayload, JwtSignUpPayload } from '@auth/services/jwt/JwtAuthProvider';

export type JwtAuthContextType = FuseAuthProviderState<User> & {
	updateUser: (U: User) => Promise<Response>;
	signIn?: (credentials: JwtSignInPayload) => Promise<Response>;
	signUp?: (U: JwtSignUpPayload) => Promise<Response>;
	signOut?: () => void;
	refreshToken?: () => Promise<string | Response>;
};

const defaultAuthContext: JwtAuthContextType = {
	authStatus: 'configuring',
	isAuthenticated: false,
	user: null,
	updateUser: null,
	signIn: null,
	signUp: null,
	signOut: null,
	refreshToken: null
};

const JwtAuthContext = createContext<JwtAuthContextType>(defaultAuthContext);

export default JwtAuthContext;
