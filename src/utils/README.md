# AuthFetch Middleware

The `authFetch` middleware provides a comprehensive solution for making authenticated API calls to your backend at `http://localhost:5000`. It automatically handles authentication tokens, error handling, and provides convenient methods for common HTTP operations.

## Features

- 🔐 **Automatic token management** - Handles Bearer token authentication
- 🚨 **Error handling** - Custom error class with authentication detection
- 🔄 **Token validation** - Checks authentication requirements before requests
- 📡 **HTTP methods** - Convenient methods for GET, POST, PUT, DELETE, PATCH
- ⚙️ **Configurable** - Flexible options for different use cases

## Quick Start

### Basic Usage

```typescript
import { authFetch, authGet, authPost } from '@/utils/authFetch';

// Simple GET request
const response = await authGet('/api/users/profile');
const userData = await response.json();

// POST with data
const response = await authPost('/api/users', { 
  firstName: 'John', 
  lastName: 'Doe' 
});
```

### Authentication Required

```typescript
import { authGet } from '@/utils/authFetch';

// This will throw an error if user is not authenticated
const response = await authGet('/api/users/profile', { 
  requireAuth: true 
});
```

### Error Handling

```typescript
import { authGet, AuthFetchError } from '@/utils/authFetch';

try {
  const response = await authGet('/api/users/profile', { requireAuth: true });
  const data = await response.json();
  return data;
} catch (error) {
  if (error instanceof AuthFetchError) {
    if (error.isAuthError) {
      // Handle 401/403 errors - redirect to login
      console.error('Authentication required');
      // redirect to login page
    } else {
      // Handle other API errors
      console.error('API Error:', error.data);
    }
  }
  throw error;
}
```

## API Reference

### Core Functions

#### `authFetch(endpoint, options)`
The main fetch function with authentication support.

**Parameters:**
- `endpoint` (string): API endpoint relative to base URL
- `options` (AuthFetchOptions): Request configuration

**Options:**
- `requireAuth` (boolean): Throw error if not authenticated
- `skipGlobalHeaders` (boolean): Skip adding auth headers
- `...RequestInit`: Standard fetch options

#### HTTP Method Helpers

```typescript
// GET request
authGet(endpoint, options)

// POST request
authPost(endpoint, data, options)

// PUT request  
authPut(endpoint, data, options)

// DELETE request
authDelete(endpoint, options)

// PATCH request
authPatch(endpoint, data, options)
```

### Token Management

```typescript
import { 
  setAuthToken, 
  removeAuthToken, 
  getAuthToken, 
  isAuthenticated 
} from '@/utils/authFetch';

// Set authentication token
setAuthToken('your-jwt-token');

// Remove token
removeAuthToken();

// Get current token
const token = getAuthToken();

// Check if authenticated
if (isAuthenticated()) {
  // User is authenticated
}
```

### Error Handling

```typescript
import { AuthFetchError } from '@/utils/authFetch';

// AuthFetchError properties:
error.status      // HTTP status code
error.data        // Response data from server
error.isAuthError // true for 401/403 errors
```

## Service Layer Example

Create service files that encapsulate your API calls:

```typescript
// services/userService.ts
import { authGet, authPost, authPut, AuthFetchError } from '@/utils/authFetch';

export const userService = {
  async getCurrentUser() {
    try {
      const response = await authGet('/api/users/profile', { 
        requireAuth: true 
      });
      return await response.json();
    } catch (error) {
      if (error instanceof AuthFetchError) {
        throw new Error(error.data?.error || 'Failed to fetch user');
      }
      throw error;
    }
  },

  async updateProfile(userData: any) {
    const response = await authPut('/api/users/profile', userData, { 
      requireAuth: true 
    });
    return await response.json();
  }
};
```

## Configuration

### Environment Variables

Update your `.env` file:

```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:5000
```

### Base URL

The middleware automatically uses your backend URL (`http://localhost:5000`) configured in the environment variables.

## Integration with Authentication

The `authFetch` middleware is automatically integrated with the JWT authentication system:

1. **Login**: When user signs in, the token is automatically set
2. **Logout**: When user signs out, the token is automatically removed  
3. **Auto-login**: On app startup, stored tokens are automatically restored
4. **Token refresh**: New tokens are automatically updated

## Best Practices

1. **Use requireAuth for protected endpoints**
   ```typescript
   const response = await authGet('/api/admin/users', { requireAuth: true });
   ```

2. **Handle errors appropriately**
   ```typescript
   try {
     const data = await authGet('/api/data');
   } catch (error) {
     if (error instanceof AuthFetchError && error.isAuthError) {
       // Redirect to login
     }
   }
   ```

3. **Use service layer pattern**
   - Create dedicated service files
   - Encapsulate error handling
   - Provide clean API for components

4. **Type your responses**
   ```typescript
   interface User {
     id: string;
     firstName: string;
     lastName: string;
   }

   const user: User = await authGet('/api/users/profile').then(r => r.json());
   ```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check if token is set and valid
2. **Network errors**: Verify backend is running on port 5000
3. **CORS issues**: Ensure backend has proper CORS configuration

### Debug Mode

Enable debug logging:

```typescript
// The middleware automatically logs errors to console
// Check browser developer tools for detailed error information
```

## Migration from apiFetch

If you're migrating from the old `apiFetch`:

1. Replace import: `import apiFetch from '@/utils/apiFetch'` → `import { authFetch } from '@/utils/authFetch'`
2. Add error handling for `AuthFetchError`
3. Use `requireAuth` option for protected endpoints
4. Token management is now automatic
