// AuthContext for stock-mobile-new, adapted from cheche_superapp-main
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  // Add other user fields as needed
}

interface AuthContextProps {
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Replace with your own API logic
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // TODO: Call your backend API for login
      // Example:
      // const response = await apiClient.post('/login', { email, password });
      // setUser(response.data.user);
      setUser({ id: '1', name: 'Demo User', email }); // Demo only
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      // TODO: Call your backend API for registration
      // Example:
      // const response = await apiClient.post('/register', { name, email, password });
      // setUser(response.data.user);
      setUser({ id: '1', name, email }); // Demo only
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext }; 