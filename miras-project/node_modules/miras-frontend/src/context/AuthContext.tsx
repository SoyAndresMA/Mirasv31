// Ruta del fichero: /frontend/src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Por ahora, simulamos un usuario autenticado
          setUser({
            id: 1,
            username: 'admin',
            role: 'admin'
          });
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Por ahora, simulamos una autenticación exitosa
      const mockUser = {
        id: 1,
        username,
        role: 'admin'
      };

      localStorage.setItem('authToken', 'mock-token');
      setUser(mockUser);
      navigate('/projects');
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Error en la autenticación');
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('authToken');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Error en el cierre de sesión');
    }
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};