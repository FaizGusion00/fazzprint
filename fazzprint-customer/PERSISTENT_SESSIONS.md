# Persistent Session Management System

## Overview

The FazzPrint customer portal now includes a comprehensive persistent session management system that keeps users logged in for up to **2 days** without requiring them to sign in repeatedly, while maintaining security best practices.

## Key Features

### 🔐 **2-Day Maximum Session Duration**
- Sessions automatically last for 2 days from login time
- No need to repeatedly sign in during this period
- Sessions are automatically cleaned up after expiration

### 🔄 **Automatic Session Extension**
- Sessions extend automatically when users are active on the platform
- Activity detection includes clicks, keyboard inputs, scrolling, and mouse movements
- Smart throttling prevents excessive session updates

### 💾 **Secure Local Storage**
- Session data is stored securely in browser's localStorage
- Backward compatibility with existing token storage
- Automatic migration from old storage format

### ⚡ **Real-time Session Monitoring**
- Periodic session validation every 5 minutes
- Automatic logout when sessions expire
- User-friendly notifications about session status

### 🎯 **Smart Session Refresh**
- Automatic refresh when less than 4 hours remain
- Seamless background updates without user interruption
- Graceful fallback handling for network issues

## Implementation Details

### Session Data Structure
```typescript
interface SessionData {
  token: string           // Authentication token
  user: User             // User information
  expires_at: number     // Expiration timestamp
  created_at: number     // Creation timestamp
}
```

### Storage Locations
- **Primary**: `localStorage['fazzprint_session']` - Complete session data
- **Fallback**: `localStorage['auth_token']` & `localStorage['user']` - Backward compatibility

### Activity Monitoring
The system monitors these user activities to extend sessions:
- Mouse clicks
- Keyboard presses  
- Page scrolling
- Mouse movements

Activity is throttled to update sessions only once per second to prevent performance issues.

### Session Lifecycle

1. **Login**: Creates new session with 2-day expiration
2. **Activity**: Extends session when user is active (if >50% time has passed)
3. **Background Check**: Validates session every 5 minutes
4. **Auto-refresh**: Refreshes session when <4 hours remain
5. **Expiration**: Automatically logs out and clears data

## User Interface Components

### SessionStatus Component
A reusable component that displays session information:

- **Compact Mode**: Shows remaining time in header (hidden on mobile <768px)
- **Detailed Mode**: Full session details in Settings page

#### Usage:
```tsx
// Compact header display
<SessionStatus className="hidden md:flex" />

// Detailed settings display  
<SessionStatus showDetails={true} className="mb-4" />
```

### Session Management in Settings
New "Session" tab in Settings page provides:
- Current session status with countdown
- Manual session extension button
- Security best practices
- Educational information about how sessions work

## Security Features

### Automatic Cleanup
- Expired sessions are automatically detected and cleared
- Invalid tokens trigger immediate logout
- Server-side validation on each API request

### Activity-Based Extension  
- Sessions only extend when user is actually active
- Prevents indefinite sessions on abandoned browsers
- Smart timing prevents unnecessary server requests

### Secure Token Handling
- Tokens are included in all API requests via interceptors
- Automatic retry logic for expired tokens
- Graceful error handling for authentication failures

### User Notifications
- Toast notifications for session events:
  - Login success with 2-day notice
  - Session expiration warnings
  - Automatic logout notifications
  - Session refresh failures

## Technical Configuration

### Constants
```typescript
const SESSION_DURATION = 2 * 24 * 60 * 60 * 1000         // 2 days
const SESSION_REFRESH_THRESHOLD = 4 * 60 * 60 * 1000     // 4 hours  
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000             // 5 minutes
const SESSION_STORAGE_KEY = 'fazzprint_session'
```

### API Integration
- Authentication endpoints remain unchanged
- Session data syncs with user profile updates
- Logout API calls clean up server-side sessions

## Browser Compatibility

### Supported Browsers
- Chrome 70+
- Firefox 65+ 
- Safari 12+
- Edge 79+

### Storage Requirements
- localStorage support required
- ~2KB storage per session
- Automatic cleanup prevents storage bloat

## Migration & Backward Compatibility

### Existing Users
- Automatic migration from old token storage format
- No action required from existing users
- Seamless upgrade experience

### Legacy Support
- Maintains old `auth_token` and `user` storage keys
- Graceful fallback for older implementations
- Progressive enhancement approach

## User Experience Benefits

### Reduced Friction
- ✅ No repeated login prompts
- ✅ Seamless multi-tab browsing
- ✅ Maintains session across browser restarts
- ✅ Works offline (until session expires)

### Transparency
- ✅ Clear session status display
- ✅ Countdown timer in header
- ✅ Detailed session information available
- ✅ Educational content about how it works

### Security
- ✅ Automatic logout after 2 days maximum
- ✅ Activity-based session management
- ✅ Secure token handling
- ✅ Server-side validation

## Troubleshooting

### Common Issues

**Session expires immediately**
- Check browser localStorage support
- Verify system clock is correct
- Check for JavaScript errors in console

**Session not extending**
- Ensure user activity is being detected
- Check network connectivity for background refresh
- Verify API endpoints are responding

**Can't see session status**
- Component is hidden on mobile screens <768px
- Check if user is logged in
- Verify SessionStatus component is rendered

### Debug Information
The system includes comprehensive console logging:
- Session creation and extension events
- Activity detection debugging  
- API refresh attempts and results
- Error details for troubleshooting

## Future Enhancements

### Planned Features
- [ ] Multiple device session management
- [ ] Session activity history
- [ ] Customizable session duration preferences
- [ ] Remember device functionality
- [ ] Session security notifications

### Performance Optimizations
- [ ] Session data compression
- [ ] Background sync optimization
- [ ] Reduced API call frequency
- [ ] Improved activity detection

---

## Summary

The persistent session management system provides a secure, user-friendly experience that eliminates the need for repeated logins while maintaining strong security practices. Sessions last up to 2 days, extend automatically with user activity, and include comprehensive monitoring and cleanup mechanisms.

Users can track their session status in real-time and have full transparency about how the system works, creating a modern, professional experience that matches contemporary web application standards. 