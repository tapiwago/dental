# AuthFetch Migration Guide

## Overview
This guide shows how to migrate from direct fetch calls or other API patterns to use the centralized `authFetch` system for consistent authentication and error handling.

## Before and After Examples

### 1. Fetching Data (GET requests)

**❌ Before (Direct fetch):**
```typescript
// Old way - direct fetch with hardcoded URL
const fetchClients = async () => {
  try {
    setLoading(true);
    const response = await fetch('http://localhost:5000/api/clients');
    const data = await response.json();
    setClients(data);
  } catch (error) {
    console.error('Error fetching clients:', error);
  } finally {
    setLoading(false);
  }
};
```

**✅ After (Using authFetch with API helpers):**
```typescript
import { clientApi, fetchJson } from '@/utils/authFetch';

const fetchClients = async () => {
  try {
    setLoading(true);
    const response = await clientApi.getAll();
    const data = await fetchJson(response);
    setClients(data);
  } catch (error) {
    console.error('Error fetching clients:', error);
  } finally {
    setLoading(false);
  }
};
```

### 2. Creating Data (POST requests)

**❌ Before (Direct fetch):**
```typescript
// Old way - manual headers and JSON stringification
const createClient = async (clientData) => {
  const response = await fetch('http://localhost:5000/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clientData)
  });
  
  if (response.ok) {
    return await response.json();
  }
  throw new Error('Failed to create client');
};
```

**✅ After (Using authFetch with API helpers):**
```typescript
import { clientApi, fetchJson } from '@/utils/authFetch';

const createClient = async (clientData: any) => {
  try {
    const response = await clientApi.create(clientData);
    return await fetchJson(response);
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};
```

### 3. User Management Examples

**✅ Using userApi for consistent patterns:**
```typescript
import { userApi, fetchJson, AuthFetchError } from '@/utils/authFetch';

// Get all users
const fetchUsers = async () => {
  try {
    const response = await userApi.getAll();
    return await fetchJson(response);
  } catch (error) {
    if (error instanceof AuthFetchError) {
      console.error('API Error:', error.data);
    }
    throw error;
  }
};

// Delete user
const deleteUser = async (userId: string) => {
  try {
    await userApi.delete(userId);
    console.log('User deleted successfully');
  } catch (error) {
    if (error instanceof AuthFetchError) {
      console.error('Delete failed:', error.data);
    }
    throw error;
  }
};

// Create new user
const createUser = async (userData: any) => {
  try {
    const response = await userApi.create(userData);
    return await fetchJson(response);
  } catch (error) {
    if (error instanceof AuthFetchError) {
      console.error('User creation failed:', error.data);
    }
    throw error;
  }
};
```

## Available API Helpers

The `authFetch` system provides these pre-configured API helpers:

### User API
```typescript
userApi.getAll()                    // GET /api/users
userApi.getById(id)                 // GET /api/users/:id
userApi.create(userData)            // POST /api/users/register
userApi.update(id, userData)        // PUT /api/users/:id
userApi.delete(id)                  // DELETE /api/users/:id
```

### Client API
```typescript
clientApi.getAll()                  // GET /api/clients
clientApi.getById(id)               // GET /api/clients/:id
clientApi.create(clientData)        // POST /api/clients
clientApi.update(id, clientData)    // PUT /api/clients/:id
clientApi.delete(id)                // DELETE /api/clients/:id
```

### Onboarding API
```typescript
onboardingApi.getAll()              // GET /api/onboarding-cases
onboardingApi.getById(id)           // GET /api/onboarding-cases/:id
onboardingApi.create(caseData)      // POST /api/onboarding-cases
onboardingApi.update(id, caseData)  // PUT /api/onboarding-cases/:id
onboardingApi.delete(id)            // DELETE /api/onboarding-cases/:id
onboardingApi.updateStatus(id, status) // PUT /api/onboarding-cases/:id/status
onboardingApi.getDashboard()        // GET /api/onboarding-cases/dashboard/summary
```

### Auth API
```typescript
authApi.signin(credentials)         // POST /api/users/signin
authApi.signinWithToken()          // GET /api/users/signin-with-token
authApi.register(userData)         // POST /api/users/register
```

## Key Benefits

1. **Automatic Authentication**: All API calls automatically include JWT tokens
2. **Consistent Error Handling**: Standardized error handling with `AuthFetchError`
3. **Automatic Port Configuration**: Uses environment variables for API base URL
4. **Request Logging**: Automatic logging for debugging
5. **Type Safety**: Better TypeScript support
6. **Centralized Configuration**: Easy to modify headers, timeouts, etc.

## Common Patterns

### Error Handling
```typescript
import { AuthFetchError } from '@/utils/authFetch';

try {
  const response = await userApi.getAll();
  const data = await fetchJson(response);
  setUsers(data);
} catch (error) {
  if (error instanceof AuthFetchError) {
    if (error.isAuthError) {
      // Handle authentication errors (401, 403)
      console.log('User needs to log in again');
    } else {
      // Handle other API errors
      console.error('API Error:', error.data);
    }
  } else {
    // Handle network or other errors
    console.error('Network error:', error);
  }
}
```

### Loading States
```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  try {
    setLoading(true);
    const response = await clientApi.getAll();
    const data = await fetchJson(response);
    setClients(data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
```

## Migration Checklist

- [ ] Replace direct `fetch()` calls with appropriate API helpers
- [ ] Add `import { [apiName], fetchJson } from '@/utils/authFetch'`
- [ ] Update error handling to use `AuthFetchError`
- [ ] Remove hardcoded URLs (port 3000 or 5000)
- [ ] Remove manual header setting for authentication
- [ ] Test that authentication is working correctly
- [ ] Verify that port configuration is automatically handled

## Port Configuration Note

The `authFetch` system automatically uses:
- **Frontend (Vite dev server)**: Port 3000
- **Backend API**: Port 5000 (via environment variable or fallback)

You no longer need to worry about port configuration in your components!
