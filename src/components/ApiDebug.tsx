import React from 'react';
import { API_BASE_URL } from '@/utils/apiFetch';

/**
 * Debug component to verify API configuration
 * Remove this component once everything is working
 */
function ApiDebug() {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      fontSize: '12px',
      zIndex: 9999 
    }}>
      <div><strong>API Debug Info:</strong></div>
      <div>Environment: {import.meta.env.MODE}</div>
      <div>VITE_API_BASE_URL: {import.meta.env.VITE_API_BASE_URL}</div>
      <div>Computed API_BASE_URL: {API_BASE_URL}</div>
    </div>
  );
}

export default ApiDebug;
