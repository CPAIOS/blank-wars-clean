'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    // Clear all possible storage locations
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Call auth logout
    logout();
    
    // Force reload
    window.location.reload();
  };

  return (
    <button 
      onClick={handleLogout}
      className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
    >
      Force Logout
    </button>
  );
}