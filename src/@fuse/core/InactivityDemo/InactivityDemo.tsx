import React from 'react';
import InactivityProvider from '@fuse/core/InactivityProvider';

/**
 * Demo configuration for testing the inactivity detection feature
 *
 * This component provides pre-configured settings for different use cases:
 * - Development testing with short timeouts
 * - Production settings with standard timeouts
 * - Demo mode with custom messaging
 */

interface InactivityDemoProps {
	children: React.ReactNode;
	mode?: 'development' | 'production' | 'demo';
}

function InactivityDemo({ children, mode = 'production' }: InactivityDemoProps) {
	const configs = {
		development: {
			timeout: 30 * 1000, // 30 seconds for quick testing
			countdownTime: 10, // 10 seconds countdown
			enabled: true
		},
		production: {
			timeout: 30 * 60 * 1000, // 30 minutes standard
			countdownTime: 60, // 60 seconds countdown
			enabled: true
		},
		demo: {
			timeout: 60 * 1000, // 1 minute for demo
			countdownTime: 15, // 15 seconds countdown
			enabled: true
		}
	};

	return <InactivityProvider options={configs[mode]}>{children}</InactivityProvider>;
}

export default InactivityDemo;

// Usage examples:
//
// Development mode (quick testing):
// <InactivityDemo mode="development">
//   <YourApp />
// </InactivityDemo>
//
// Production mode (default):
// <InactivityDemo>
//   <YourApp />
// </InactivityDemo>
//
// Demo mode (for presentations):
// <InactivityDemo mode="demo">
//   <YourApp />
// </InactivityDemo>
