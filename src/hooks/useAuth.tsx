import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'super_admin' | 'manager' | 'pm' | 'user';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  brandAccess?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasMinimumRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demo
const mockUsers: Record<string, User> = {
  'admin@company.com': {
    id: '1',
    name: 'Super Admin',
    email: 'admin@company.com',
    role: 'super_admin'
  },
  'manager@company.com': {
    id: '2',
    name: 'Manager User',
    email: 'manager@company.com',
    role: 'manager',
    brandAccess: ['Brand A', 'Brand B', 'Brand C']
  },
  'pm@company.com': {
    id: '3',
    name: 'Project Manager',
    email: 'pm@company.com',
    role: 'pm',
    brandAccess: ['Brand A', 'Brand B']
  },
  'user@company.com': {
    id: '4',
    name: 'Regular User',
    email: 'user@company.com',
    role: 'user',
    brandAccess: ['Brand A']
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Role hierarchy for permission checking
  const roleHierarchy: Record<UserRole, number> = {
    'user': 1,
    'pm': 2,
    'manager': 3,
    'super_admin': 4
  };

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = mockUsers[credentials.email];
    if (mockUser && credentials.password === 'password') {
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } else {
      throw new Error('Invalid credentials');
    }
    
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasMinimumRole = (role: UserRole): boolean => {
    if (!user) return false;
    return roleHierarchy[user.role] >= roleHierarchy[role];
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      hasRole,
      hasMinimumRole
    }}>
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