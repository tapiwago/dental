import { ReactNode, useCallback } from 'react';
import useInactivityDetection, { InactivityDetectionOptions } from '@fuse/hooks/useInactivityDetection';
import InactivityModal from '../InactivityModal';
import useUser from '@auth/useUser';
import { useNavigate } from 'react-router';

interface InactivityProviderProps {
	children: ReactNode;
	/**
	 * Configuration options for inactivity detection
	 */
	options?: InactivityDetectionOptions;
	/**
	 * Custom logout handler (optional)
	 */
	onLogout?: () => void;
	/**
	 * Path to redirect to after logout (default: '/sign-out')
	 */
	logoutRedirectPath?: string;
}

/**
 * InactivityProvider - A provider component that wraps your app with inactivity detection
 *
 * Features:
 * - Detects user inactivity after 30 minutes (configurable)
 * - Shows a futuristic warning modal with 60-second countdown (configurable)
 * - Automatically logs out user and redirects if no response
 * - Resets timer on any user activity (mouse, keyboard, touch, scroll)
 * - Fully responsive and accessible
 * - Integrates seamlessly with existing auth system
 *
 * Usage:
 * ```tsx
 * <InactivityProvider options={{ timeout: 1800000 }}>
 *   <YourApp />
 * </InactivityProvider>
 * ```
 *
 * Integration Instructions:
 * 1. Wrap your main app component with InactivityProvider
 * 2. Optionally configure timeout and countdown duration
 * 3. Optionally provide custom logout handler
 * 4. The provider will automatically use the app's auth system
 *
 * Configuration Options:
 * - timeout: Inactivity timeout in milliseconds (default: 30 minutes)
 * - countdownTime: Modal countdown in seconds (default: 60 seconds)
 * - events: Array of events to track for activity (default: mouse, keyboard, touch, scroll)
 * - enabled: Whether detection is enabled (default: true)
 */
function InactivityProvider(props: InactivityProviderProps) {
	const { children, options, onLogout: customOnLogout, logoutRedirectPath = '/sign-out' } = props;

	const { signOut } = useUser();
	const navigate = useNavigate();

	const handleLogout = useCallback(async () => {
		try {
			if (customOnLogout) {
				customOnLogout();
			} else {
				await signOut();
				navigate(logoutRedirectPath);
			}
		} catch (error) {
			console.error('Error during inactivity logout:', error);
			// Fallback - redirect to login even if signout fails
			navigate('/sign-in');
		}
	}, [signOut, navigate, customOnLogout, logoutRedirectPath]);

	const { showModal, countdownTime, confirmPresence, forceLogout } = useInactivityDetection(handleLogout, options);

	return (
		<>
			{children}
			<InactivityModal
				open={showModal}
				countdownTime={countdownTime}
				onConfirm={confirmPresence}
				onLogout={forceLogout}
			/>
		</>
	);
}

export default InactivityProvider;
export type { InactivityProviderProps };
