import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'manager' | 'pm' | 'user';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
  user_brands?: Array<{
    brand_id: string;
    brand_name: string;
    access_level: string;
  }>;
  permissions?: Array<{
    module_name: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }>;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'manager' | 'pm' | 'user';
  status?: 'active' | 'inactive' | 'pending';
}

export interface UpdateUserData {
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'manager' | 'pm' | 'user';
  status: 'active' | 'inactive' | 'pending';
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchUsers = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}) => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.role) searchParams.set('role', params.role);
      if (params.status) searchParams.set('status', params.status);

      const { data, error } = await supabase.functions.invoke('admin-users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) throw error;

      const response: UsersResponse = data;
      setUsers(response.users);
      setTotal(response.total);

      return response;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData): Promise<AdminUser> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: userData,
      });

      if (error) throw error;

      const newUser: AdminUser = data.user;
      setUsers(prev => [newUser, ...prev]);
      setTotal(prev => prev + 1);

      toast({
        title: "Success",
        description: "User created successfully",
      });

      return newUser;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserData): Promise<AdminUser> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const { data, error } = await supabase.functions.invoke(`admin-users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: userData,
      });

      if (error) throw error;

      const updatedUser: AdminUser = data.user;
      setUsers(prev => prev.map(user => 
        user.id === userId ? updatedUser : user
      ));

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      return updatedUser;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const { error } = await supabase.functions.invoke(`admin-users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) throw error;

      setUsers(prev => prev.filter(user => user.id !== userId));
      setTotal(prev => prev - 1);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getUserById = async (userId: string): Promise<AdminUser> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const { data, error } = await supabase.functions.invoke(`admin-users/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) throw error;

      return data.user;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch user",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    users,
    loading,
    total,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
  };
}