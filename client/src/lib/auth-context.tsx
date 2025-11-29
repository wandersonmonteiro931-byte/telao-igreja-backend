import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  getStoredUser,
  getAccessToken,
  verifyToken,
  logout as apiLogout,
  clearAuth,
  getCurrentUser,
} from './api';

export interface SecurityQuestion {
  question: string;
  answer: string;
}

export interface UserSettings {
  churchName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'user';
  securityQuestions?: SecurityQuestion[];
  createdAt?: Date;
  lastLogin?: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  settings: UserSettings | null;
  setSettings: (settings: UserSettings | null) => void;
  refreshSettings: () => Promise<UserSettings | null>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const result = await getCurrentUser();
      if (result.success && result.data) {
        setUser(result.data);
        setSettings({
          email: result.data.email,
          displayName: result.data.username,
          phone: result.data.phone,
          role: result.data.role,
        });
      } else {
        clearAuth();
        setUser(null);
        setSettings(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      clearAuth();
      setUser(null);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSettings = useCallback(async (): Promise<UserSettings | null> => {
    if (!user) return null;

    try {
      const result = await getCurrentUser();
      if (result.success && result.data) {
        const newSettings: UserSettings = {
          email: result.data.email,
          displayName: result.data.username,
          phone: result.data.phone,
          role: result.data.role,
        };
        setSettings(newSettings);
        return newSettings;
      }
    } catch (error) {
      console.error('Error refreshing settings:', error);
    }
    return null;
  }, [user]);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!user) return false;
    setSettings(prev => prev ? { ...prev, ...newSettings } : null);
    return true;
  }, [user]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setSettings(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      
      if (!token) {
        setUser(null);
        setSettings(null);
        setLoading(false);
        return;
      }

      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setSettings({
          email: storedUser.email,
          displayName: storedUser.username,
          phone: storedUser.phone,
          role: storedUser.role,
        });
      }

      const isValid = await verifyToken();
      if (!isValid) {
        setUser(null);
        setSettings(null);
      } else {
        const currentUser = getStoredUser();
        if (currentUser) {
          setUser(currentUser);
          setSettings({
            email: currentUser.email,
            displayName: currentUser.username,
            phone: currentUser.phone,
            role: currentUser.role,
          });
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        settings,
        setSettings,
        refreshSettings,
        updateSettings,
        logout,
        refreshUser,
      }}
    >
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

// Legacy alias for compatibility
export const useFirebaseAuth = useAuth;
