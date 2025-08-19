# Inactivity Detection Feature

## Overview

This feature implements an engaging and futuristic inactivity detection system that monitors user activity and automatically logs out inactive users after a configurable period.

## Features

- **⏰ Activity Monitoring**: Tracks mouse movement, keyboard input, clicks, touch, and scroll events
- **🚨 30-Minute Inactivity Timer**: Configurable timeout period (default: 30 minutes)
- **🤖 Futuristic Modal**: Sci-fi themed warning modal with neon effects and animations
- **⏱️ 60-Second Countdown**: Visual countdown timer with progress bar
- **🎮 Interactive Buttons**: Animated confirmation and logout buttons with microinteractions
- **🔊 Sound Effects**: Console notifications (can be extended with actual audio)
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **♿ Accessibility**: Proper ARIA labels and keyboard navigation support
- **🔄 Smart Reset**: Timer resets on any user activity (not just modal confirmation)

## Components

### 1. `useInactivityDetection` Hook
**Location**: `src/@fuse/hooks/useInactivityDetection.ts`

A custom React hook that handles all inactivity detection logic:

```tsx
const {
  isInactive,
  showModal,
  countdownTime,
  resetTimer,
  confirmPresence,
  forceLogout
} = useInactivityDetection(logoutHandler, options);
```

**Options**:
- `timeout`: Inactivity timeout in milliseconds (default: 30 minutes)
- `countdownTime`: Modal countdown in seconds (default: 60 seconds)
- `events`: Array of events to track (default: mouse, keyboard, touch, scroll)
- `enabled`: Whether detection is enabled (default: true)

### 2. `InactivityModal` Component
**Location**: `src/@fuse/core/InactivityModal/InactivityModal.tsx`

A visually stunning modal with:
- Animated circular countdown timer
- Neon glow effects and sci-fi styling
- Linear progress bar
- Motion animations using Framer Motion
- Responsive layout

### 3. `InactivityProvider` Component
**Location**: `src/@fuse/core/InactivityProvider/InactivityProvider.tsx`

A wrapper provider that combines the hook and modal with seamless auth integration.

## Integration

### Quick Setup

1. **Wrap your app** with `InactivityProvider`:

```tsx
import InactivityProvider from '@fuse/core/InactivityProvider';

function App() {
  return (
    <InactivityProvider>
      <YourAppComponents />
    </InactivityProvider>
  );
}
```

2. **Done!** The feature is now active with default settings.

### Advanced Configuration

```tsx
<InactivityProvider
  options={{
    timeout: 15 * 60 * 1000,    // 15 minutes
    countdownTime: 30,           // 30 seconds
    enabled: true
  }}
  logoutRedirectPath="/login"
  onLogout={customLogoutHandler}
>
  <YourApp />
</InactivityProvider>
```

### Testing Configuration (Short Timeouts)

For development and testing, use shorter timeouts:

```tsx
<InactivityProvider
  options={{
    timeout: 10 * 1000,         // 10 seconds (for testing)
    countdownTime: 5,           // 5 seconds countdown
  }}
>
  <YourApp />
</InactivityProvider>
```

## Customization

### Styling

The modal uses Material-UI's styled components system. You can customize:

- Colors by modifying the gradient values
- Animations by adjusting keyframe definitions
- Layout by updating the styled components

### Sound Effects

Currently uses console notifications. To add real sound effects:

1. Add audio files to `public/assets/sounds/`
2. Update the `InactivityModal` component:

```tsx
useEffect(() => {
  if (open) {
    const audio = new Audio('/assets/sounds/warning.mp3');
    audio.play().catch(console.error);
  }
}, [open]);
```

### Events Tracking

Customize which events trigger activity detection:

```tsx
const customEvents = ['mousedown', 'keypress', 'touchstart'];

<InactivityProvider
  options={{
    events: customEvents
  }}
>
```

## Browser Support

- ✅ Modern browsers with ES6+ support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Security Considerations

- **Token Cleanup**: The provider automatically calls the app's `signOut()` method
- **Secure Redirect**: Users are redirected to a secure logout page
- **No Data Persistence**: No sensitive data is stored during the warning period
- **Escape Prevention**: Modal cannot be closed with ESC key during countdown

## Performance

- **Lightweight**: Minimal impact on app performance
- **Event Debouncing**: Efficiently handles high-frequency events
- **Cleanup**: Proper timer and event listener cleanup
- **Memory Safe**: No memory leaks with proper useEffect cleanup

## Accessibility Features

- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard support for modal actions
- **High Contrast**: Readable colors and proper contrast ratios
- **Focus Management**: Automatic focus management in modal
- **Responsive Design**: Works with zoom levels up to 200%

## Troubleshooting

### Issue: Modal doesn't appear
- Check if `InactivityProvider` is properly wrapped around authenticated content
- Verify that the user is logged in (feature only works for authenticated users)
- Check browser console for any JavaScript errors

### Issue: Timer not resetting
- Ensure events are being properly tracked (check browser dev tools)
- Verify that event listeners are not being blocked by other components
- Check if the modal is in the correct state

### Issue: Build errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript configuration matches the project setup
- Verify import paths are correct for your project structure

## Contributing

When modifying this feature:

1. **Test thoroughly** with different timeout values
2. **Check mobile compatibility** on various devices
3. **Verify accessibility** with screen readers
4. **Test edge cases** like rapid activity, network issues, etc.
5. **Update documentation** if adding new features

---

**Need Help?** Check the component source code for detailed inline documentation and examples.