'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  isActive: boolean;
  subscribedToNewsletter?: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  subscribeNewsletter?: boolean;
  language?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean | { mfaRequired: boolean; tempToken?: string } | { success: boolean; error?: string }>;
  verifyMfaLogin: (code: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<{ success: boolean; email?: string; verificationCode?: string; error?: string }>;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  resendCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updatedUser: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        if (typeof window !== 'undefined') {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            // Ensure firstName and lastName are set even if user was saved with name only
            if (parsedUser && !parsedUser.firstName && parsedUser.name) {
              const nameParts = (parsedUser.name || '').split(' ');
              parsedUser.firstName = nameParts[0] || '';
              parsedUser.lastName = nameParts.slice(1).join(' ') || '';
            }
            setUser(parsedUser);
          }
        }
      } catch (error) {
        // Error loading user - no sensitive data logged
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean | { mfaRequired: boolean; tempToken?: string } | { success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Add timeout for login request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Login timeout')), 15000); // 15 seconds
      });

      // CRITICAL SECURITY: Ensure we use HTTPS in production
      const apiUrl = '/api/auth/login';

      // In production, ensure we're using HTTPS
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        const isSecure = window.location.protocol === 'https:';
        if (!isSecure) {
          throw new Error('HTTPS required for login in production');
        }
      }

      const loginPromise = fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          email,
          password,
          rememberMe: rememberMe === true // Ensure boolean value
        }),
      });

      const response = await Promise.race([loginPromise, timeoutPromise]) as Response;
      const data = await response.json();

      if (response.ok && data.mfaRequired) {
        // MFA required - return tempToken
        if (typeof window !== 'undefined') {
          localStorage.setItem('mfa-temp-token', data.tempToken);
        }
        return { mfaRequired: true, tempToken: data.tempToken };
      } else if (response.ok && data.user) {
        // Convert backend user format (name) to frontend format (firstName, lastName)
        const nameParts = (data.user.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const frontendUser = {
          ...data.user,
          firstName: firstName || data.user.firstName || '',
          lastName: lastName || data.user.lastName || '',
          name: data.user.name || `${firstName} ${lastName}`.trim()
        };

        setUser(frontendUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(frontendUser));
          localStorage.setItem('token', data.token);
          localStorage.removeItem('mfa-temp-token');
        }
        return { success: true };
      } else {
        // Login failed - no sensitive data logged
        return { success: false, error: data.error };
      }
    } catch (error) {
      // Login error - no sensitive data logged
      return { success: false, error: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfaLogin = async (code: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const tempToken = typeof window !== 'undefined'
        ? localStorage.getItem('mfa-temp-token')
        : null;

      if (!tempToken) {
        return false;
      }

      const response = await fetch('/api/auth/mfa/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, tempToken }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        // Convert backend user format (name) to frontend format (firstName, lastName)
        const nameParts = (data.user.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const frontendUser = {
          ...data.user,
          firstName: firstName || data.user.firstName || '',
          lastName: lastName || data.user.lastName || '',
          name: data.user.name || `${firstName} ${lastName}`.trim()
        };

        setUser(frontendUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(frontendUser));
          localStorage.setItem('token', data.token);
          localStorage.removeItem('mfa-temp-token');
        }
        return true;
      } else {
        // MFA verification failed - no sensitive data logged
        return false;
      }
    } catch (error) {
      // MFA verification error - no sensitive data logged
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; email?: string; verificationCode?: string; error?: string }> => {
    try {
      setIsLoading(true);

      // Get current language from localStorage or default to 'en'
      const currentLanguage = typeof window !== 'undefined'
        ? (localStorage.getItem('language') || 'en')
        : 'en';

      // Prepare data without language field (backend doesn't need it)
      const { language, firstName, lastName, ...restData } = userData;

      // Combine firstName and lastName into name for backend
      const name = firstName && lastName
        ? `${firstName} ${lastName}`.trim()
        : firstName || lastName || '';

      // Prepare register data with name field
      const registerData = {
        ...restData,
        name: name || restData.name || '', // Use combined name or fallback to existing name
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': currentLanguage === 'ar' ? 'ar' : 'en',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Registration successful - but user must verify email first
        // No token or user data is returned until verification
        return {
          success: true,
          email: data.email || userData.email
        };
      } else {
        // Registration failed - return error message
        const errorMessage = data.error || data.message || 'Registration failed';
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error: any) {
      // Registration error - return generic error message
      return {
        success: false,
        error: 'An error occurred during registration. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (email: string, code: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Get current language from localStorage or default to 'en'
      const currentLanguage = typeof window !== 'undefined'
        ? (localStorage.getItem('language') || 'en')
        : 'en';

      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': currentLanguage === 'ar' ? 'ar' : 'en',
        },
        body: JSON.stringify({ email, code, language: currentLanguage }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        // Convert backend user format (name) to frontend format (firstName, lastName)
        const nameParts = (data.user.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const frontendUser = {
          ...data.user,
          firstName: firstName || data.user.firstName || '',
          lastName: lastName || data.user.lastName || '',
          name: data.user.name || `${firstName} ${lastName}`.trim()
        };

        setUser(frontendUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(frontendUser));
          localStorage.setItem('token', data.token);
        }
        return true;
      } else {
        // Verification failed - no sensitive data logged
        return false;
      }
    } catch (error) {
      // Verification error - no sensitive data logged
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Get current language from localStorage or default to 'en'
      const currentLanguage = typeof window !== 'undefined'
        ? (localStorage.getItem('language') || 'en')
        : 'en';

      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': currentLanguage === 'ar' ? 'ar' : 'en',
        },
        body: JSON.stringify({ email, language: currentLanguage }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true };
      } else {
        // Resend code failed - no sensitive data logged
        return {
          success: false,
          error: data.error || 'Failed to resend code'
        };
      }
    } catch (error) {
      // Resend code error - no sensitive data logged
      return {
        success: false,
        error: 'An error occurred while resending the code'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('mfa-temp-token');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    verifyMfaLogin,
    register,
    verifyCode,
    resendCode,
    updateUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
