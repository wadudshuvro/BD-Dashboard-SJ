import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'super_admin' | 'manager' | 'pm' | 'user';
  status: 'active' | 'inactive' | 'pending';
  title: string | null;
  department: string | null;
  is_marketing: boolean;
  created_at: string;
  updated_at: string;
  user_brands?: Array<{
    brand_id: string;
    brand_name: string;
    access_level: string;
    can_view_analytics: boolean;
    can_manage_content: boolean;
    can_manage_team: boolean;
    can_manage_settings: boolean;
  }>;
  permissions?: Array<{
    module_name: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }>;
}

export interface BrandAssignment {
  brand_id: string;
  access_level: 'owner' | 'member' | 'viewer';
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'manager' | 'pm' | 'user';
  status?: 'active' | 'inactive' | 'pending';
  title?: string | null;
  department?: string | null;
  isMarketing?: boolean;
  brandAssignments?: BrandAssignment[];
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: 'super_admin' | 'manager' | 'pm' | 'user';
  status?: 'active' | 'inactive' | 'pending';
  title?: string | null;
  department?: string | null;
  isMarketing?: boolean;
  brandAssignments?: BrandAssignment[];
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

  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  const fetchUsers = useCallback(async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    isMarketing?: boolean;
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
      if (typeof params.isMarketing === 'boolean') {
        searchParams.set('is_marketing', params.isMarketing ? 'true' : 'false');
      }

      const functionPath = searchParams.toString()
        ? `admin-users?${searchParams.toString()}`
        : 'admin-users';

      const { data, error } = await supabase.functions.invoke(functionPath, {
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
  }, [getAuthToken, toast]);

  const createUser = useCallback(async (userData: CreateUserData): Promise<AdminUser> => {
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
  }, [getAuthToken, toast]);

  const updateUser = useCallback(async (userId: string, userData: UpdateUserData): Promise<AdminUser> => {
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
  }, [getAuthToken, toast]);

  const deleteUser = useCallback(async (userId: string): Promise<void> => {
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
  }, [getAuthToken, toast]);

  const getUserById = useCallback(async (userId: string): Promise<AdminUser> => {
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
  }, [getAuthToken, toast]);

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