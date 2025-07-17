// Test component to verify auth persistence
'use client';

import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';

export function AuthTestComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshCount(prev => prev + 1);
    };

    // Listen for auth state changes
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isLoading) {
    return <div>Loading auth state...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Auth Status Debug</h3>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>User: {user?.username || 'None'}</p>
      <p>Refresh Count: {refreshCount}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Page Refresh
      </button>
    </div>
  );
}
