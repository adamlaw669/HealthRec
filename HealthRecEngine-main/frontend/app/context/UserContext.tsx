import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/api';

interface UserContextType {
  user: {
    name: string;
    email: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await authAPI.getProfile();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 