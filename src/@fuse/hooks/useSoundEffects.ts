import { useCallback } from 'react';

/**
 * Custom hook for playing sound effects
 * This can be extended to use actual audio files
 */
function useSoundEffects() {
	const playWarningSound = useCallback(() => {
		// For now, we'll use console logging but this can be extended with actual audio
		console.log('🔊 Inactivity warning sound played');

		// Optionally, you can add actual audio playback:
		// const audio = new Audio('/assets/sounds/warning.mp3');
		// audio.volume = 0.3;
		// audio.play().catch(console.error);
	}, []);

	const playCountdownBeep = useCallback(() => {
		console.log('🔊 Countdown beep');

		// Optionally, you can add actual audio playback:
		// const audio = new Audio('/assets/sounds/beep.mp3');
		// audio.volume = 0.2;
		// audio.play().catch(console.error);
	}, []);

	const playLogoutSound = useCallback(() => {
		console.log('🔊 Logout sound');

		// Optionally, you can add actual audio playback:
		// const audio = new Audio('/assets/sounds/logout.mp3');
		// audio.volume = 0.3;
		// audio.play().catch(console.error);
	}, []);

	return {
		playWarningSound,
		playCountdownBeep,
		playLogoutSound
	};
}

export default useSoundEffects;
