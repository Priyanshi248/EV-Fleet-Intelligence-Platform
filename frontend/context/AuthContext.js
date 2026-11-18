'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check localStorage for existing mock session
    try {
      const stored = localStorage.getItem('ev_fleet_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth guard route protection
  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/signin' || pathname === '/signup';

    if (!user && !isAuthRoute) {
      // Unauthenticated user trying to access protected page -> redirect to /signin
      router.replace('/signin');
    } else if (user && isAuthRoute) {
      // Authenticated user trying to access /signin or /signup -> redirect to dashboard
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  const login = (email, password, rememberMe = true) => {
    // Mock user login
    const name = email.toLowerCase().includes('priyanshi') 
      ? 'Priyanshi' 
      : email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase());

    const userData = {
      name,
      email,
      role: 'Fleet Operations Lead',
      depot: 'Delhi Central Hub',
      avatarInitials: name.substring(0, 2).toUpperCase(),
      joinedDate: 'October 2026',
      rememberMe
    };

    localStorage.setItem('ev_fleet_auth', JSON.stringify(userData));
    setUser(userData);
    router.replace('/');
    return { success: true };
  };

  const signup = (name, email, password) => {
    const userData = {
      name: name.trim(),
      email: email.trim(),
      role: 'Fleet Operations Lead',
      depot: 'Delhi Central Hub',
      avatarInitials: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PA',
      joinedDate: 'November 2026',
      rememberMe: true
    };

    localStorage.setItem('ev_fleet_auth', JSON.stringify(userData));
    setUser(userData);
    router.replace('/');
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('ev_fleet_auth');
    setUser(null);
    router.replace('/signin');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

