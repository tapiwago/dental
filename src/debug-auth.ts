// Debug authentication state
console.log('=== AUTH DEBUG ===');
console.log('Auth provider in localStorage:', localStorage.getItem('fuseReactAuthProvider'));
console.log('JWT token in localStorage:', localStorage.getItem('jwt_access_token'));
console.log('All localStorage keys:', Object.keys(localStorage));

// Clear any stored auth provider to force fresh selection
localStorage.removeItem('fuseReactAuthProvider');
console.log('Cleared auth provider from localStorage');

export {};
