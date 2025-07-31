# Centralized API Fetch Documentation

## Overview

The centralized API fetch utility (`@/utils/apiFetch`) provides a unified way to make HTTP requests to the backend API with built-in authentication, error handling, and convenience methods.

## Features

- **Automatic Authentication**: Automatically includes JWT tokens from localStorage
- **Centralized Configuration**: Single place to configure API base URL and headers
- **Error Handling**: Consistent error handling with typed error responses
- **Convenience Methods**: Pre-configured methods for common operations
- **Request Logging**: Built-in logging for debugging
- **Auto Token Cleanup**: Automatically clears tokens on 401 errors

## Basic Usage

### Import the utilities
```typescript
import { apiGet, apiPost, authGet, authPost, userApi, clientApi } from '@/utils/apiFetch';
```

### Making authenticated requests
```typescript
// Using convenience methods
const response = await authGet('/api/users');
const data = await fetchJson(response);

// Using the userApi helper
const response = await userApi.getAll();
const data = await fetchJson(response);
```

### Error handling
```typescript
try {
  const response = await userApi.create(userData);
  const result = await fetchJson(response);
} catch (err: FetchApiError) {
  console.error('API Error:', err.data?.error || err.message);
}
```

## API Reference

### Core Functions

#### `apiFetch(endpoint, options)`
Main fetch function with authentication and error handling.

#### `apiGet(endpoint, options)`
GET request convenience method.

#### `apiPost(endpoint, data, options)`
POST request with JSON body.

#### `apiPut(endpoint, data, options)`
PUT request with JSON body.

#### `apiDelete(endpoint, options)`
DELETE request.

#### `authGet/authPost/authPut/authDelete`
Same as above but with `requireAuth: true` automatically set.

### Pre-configured API Helpers

#### User API
```typescript
userApi.getAll()           // GET /api/users
userApi.getById(id)        // GET /api/users/:id
userApi.create(userData)   // POST /api/users/register
userApi.update(id, data)   // PUT /api/users/:id
userApi.delete(id)         // DELETE /api/users/:id
```

#### Client API
```typescript
clientApi.getAll()         // GET /api/clients
clientApi.getById(id)      // GET /api/clients/:id
clientApi.create(data)     // POST /api/clients
clientApi.update(id, data) // PUT /api/clients/:id
clientApi.delete(id)       // DELETE /api/clients/:id
```

#### Onboarding API
```typescript
onboardingApi.getAll()              // GET /api/onboarding-cases
onboardingApi.getById(id)           // GET /api/onboarding-cases/:id
onboardingApi.create(data)          // POST /api/onboarding-cases
onboardingApi.update(id, data)      // PUT /api/onboarding-cases/:id
onboardingApi.delete(id)            // DELETE /api/onboarding-cases/:id
onboardingApi.updateStatus(id, status) // PUT /api/onboarding-cases/:id/status
onboardingApi.getDashboard()        // GET /api/onboarding-cases/dashboard/summary
```

#### Auth API
```typescript
authApi.signin(credentials)    // POST /api/users/signin
authApi.signinWithToken()      // GET /api/users/signin-with-token
authApi.register(userData)     // POST /api/users/register
```

### Utility Functions

#### `fetchJson(response)`
Safely parse JSON from response with error handling.

#### `handleApiResponse(response)`
Parse JSON and throw error if response is not ok.

#### `setAuthToken(token)`
Set global auth token.

#### `removeAuthToken()`
Remove global auth token.

#### `getAuthToken()`
Get current auth token (checks global headers then localStorage).

#### `isAuthenticated()`
Check if user is authenticated.

## Configuration

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Global Headers
```typescript
import { setGlobalHeaders } from '@/utils/apiFetch';

setGlobalHeaders({
  'X-Custom-Header': 'value'
});
```

## Migration from old fetch utilities

### Before (using authFetch)
```typescript
import { authGet, authPost } from '@/utils/authFetch';

const response = await authGet('/api/users', { requireAuth: true });
const data = await response.json();
```

### After (using centralized apiFetch)
```typescript
import { userApi, fetchJson } from '@/utils/apiFetch';

const response = await userApi.getAll();
const data = await fetchJson(response);
```

## Error Types

### FetchApiError
```typescript
class FetchApiError extends Error {
  status: number;        // HTTP status code
  data: unknown;         // Response data
  isAuthError: boolean;  // true for 401/403 errors
}
```

### Common Error Handling Pattern
```typescript
try {
  const response = await userApi.getAll();
  const data = await fetchJson(response);
  return data.users;
} catch (err: any) {
  if (err instanceof FetchApiError) {
    if (err.isAuthError) {
      // Handle authentication errors
      console.log('User needs to log in');
    } else {
      // Handle other API errors
      console.error('API Error:', err.data?.error);
    }
  } else {
    // Handle network errors
    console.error('Network Error:', err.message);
  }
  throw err;
}
```

## Best Practices

1. **Use API helpers**: Prefer `userApi.getAll()` over manual endpoint construction
2. **Handle errors consistently**: Use the FetchApiError type for proper error handling
3. **Use fetchJson()**: Always use the utility to parse JSON responses safely
4. **Set auth tokens**: Use `setAuthToken()` when user logs in
5. **Log requests**: The utility automatically logs requests for debugging

## Examples

### Complete User Management Example
```typescript
import { userApi, fetchJson, FetchApiError } from '@/utils/apiFetch';

// Fetch all users
const loadUsers = async () => {
  try {
    const response = await userApi.getAll();
    const data = await fetchJson(response);
    return data.users;
  } catch (err: FetchApiError) {
    console.error('Failed to load users:', err.data?.error);
    throw err;
  }
};

// Create new user
const createUser = async (userData) => {
  try {
    const response = await userApi.create(userData);
    const result = await fetchJson(response);
    console.log('User created:', result.user);
    return result.user;
  } catch (err: FetchApiError) {
    console.error('Failed to create user:', err.data?.error);
    throw err;
  }
};

// Delete user
const deleteUser = async (userId) => {
  try {
    await userApi.delete(userId);
    console.log('User deleted successfully');
  } catch (err: FetchApiError) {
    console.error('Failed to delete user:', err.data?.error);
    throw err;
  }
};
```
