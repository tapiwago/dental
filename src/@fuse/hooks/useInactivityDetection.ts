import { useCallback, useEffect, useRef, useState } from 'react';
import useEventListener from './useEventListener';

interface InactivityDetectionOptions {
	/**
	 * Inactivity timeout in milliseconds (default: 30 minutes)
	 */
	timeout?: number;
	/**
	 * Modal countdown time in seconds (default: 60 seconds)
	 */
	countdownTime?: number;
	/**
	 * Events to track for activity (default: common user interaction events)
	 */
	events?: string[];
	/**
	 * Whether the detection is enabled (default: true)
	 */
	enabled?: boolean;
}

interface InactivityDetectionState {
	/**
	 * Whether the user is currently inactive
	 */
	isInactive: boolean;
	/**
	 * Whether the warning modal should be shown
	 */
	showModal: boolean;
	/**
	 * Current countdown time remaining (in seconds)
	 */
	countdownTime: number;
	/**
	 * Reset the inactivity timer
	 */
	resetTimer: () => void;
	/**
	 * Confirm user presence and dismiss modal
	 */
	confirmPresence: () => void;
	/**
	 * Force logout immediately
	 */
	forceLogout: () => void;
}

const DEFAULT_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

/**
 * Hook for detecting user inactivity and managing warning modal
 */
function useInactivityDetection(
	onLogout: () => void,
	options: InactivityDetectionOptions = {}
): InactivityDetectionState {
	const {
		timeout = 30 * 60 * 1000, // 30 minutes
		countdownTime: initialCountdownTime = 60, // 60 seconds
		events: _events = DEFAULT_EVENTS, // Use underscore prefix for unused parameter
		enabled = true
	} = options;

	const [isInactive, setIsInactive] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [countdownTime, setCountdownTime] = useState(initialCountdownTime);

	const inactivityTimerRef = useRef<number | null>(null);
	const countdownTimerRef = useRef<number | null>(null);

	// Clear all timers
	const clearTimers = useCallback(() => {
		if (inactivityTimerRef.current) {
			window.clearTimeout(inactivityTimerRef.current);
			inactivityTimerRef.current = null;
		}

		if (countdownTimerRef.current) {
			window.clearInterval(countdownTimerRef.current);
			countdownTimerRef.current = null;
		}
	}, []);

	// Start the countdown timer for the modal
	const startCountdownTimer = useCallback(() => {
		setCountdownTime(initialCountdownTime);
		countdownTimerRef.current = window.setInterval(() => {
			setCountdownTime((prevTime) => {
				if (prevTime <= 1) {
					// Time's up - force logout
					clearTimers();
					setShowModal(false);
					setIsInactive(true);
					onLogout();
					return 0;
				}

				return prevTime - 1;
			});
		}, 1000);
	}, [initialCountdownTime, onLogout, clearTimers]);

	// Start the inactivity timer
	const startInactivityTimer = useCallback(() => {
		if (!enabled) return;

		clearTimers();
		inactivityTimerRef.current = window.setTimeout(() => {
			setIsInactive(true);
			setShowModal(true);
			startCountdownTimer();
		}, timeout);
	}, [enabled, timeout, startCountdownTimer, clearTimers]);

	// Reset the timer on user activity
	const resetTimer = useCallback(() => {
		if (!enabled) return;

		setIsInactive(false);
		setShowModal(false);
		startInactivityTimer();
	}, [enabled, startInactivityTimer]);

	// Confirm user presence
	const confirmPresence = useCallback(() => {
		clearTimers();
		setShowModal(false);
		setIsInactive(false);
		startInactivityTimer();
	}, [clearTimers, startInactivityTimer]);

	// Force logout
	const forceLogout = useCallback(() => {
		clearTimers();
		setShowModal(false);
		setIsInactive(true);
		onLogout();
	}, [clearTimers, onLogout]);

	// Handle user activity
	const handleActivity = useCallback(() => {
		if (showModal) return; // Don't reset if modal is already showing

		resetTimer();
	}, [resetTimer, showModal]);

	// Set up event listeners for user activity
	useEventListener('mousedown', handleActivity);
	useEventListener('mousemove', handleActivity);
	useEventListener('keypress', handleActivity);
	useEventListener('scroll', handleActivity);
	useEventListener('touchstart', handleActivity);
	useEventListener('click', handleActivity);

	// Initialize timer on mount
	useEffect(() => {
		if (enabled) {
			startInactivityTimer();
		}

		return () => {
			clearTimers();
		};
	}, [enabled, startInactivityTimer, clearTimers]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			clearTimers();
		};
	}, [clearTimers]);

	return {
		isInactive,
		showModal,
		countdownTime,
		resetTimer,
		confirmPresence,
		forceLogout
	};
}

export default useInactivityDetection;
export type { InactivityDetectionOptions, InactivityDetectionState };
