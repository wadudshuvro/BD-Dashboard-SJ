import { useState, useCallback } from 'react';
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
  email?: string;
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    isMarketing?: boolean;
  } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error: functionError } = await supabase.functions.invoke('admin-users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) throw functionError;
      if (!data) throw new Error('No data returned');

      setUsers(data.users || []);
      setTotal(data.total || 0);

      return data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      const errorMsg = error.message || "Failed to fetch users";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createUser = useCallback(async (userData: CreateUserData): Promise<AdminUser> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error: functionError } = await supabase.functions.invoke('admin-users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: userData,
      });

      if (functionError) throw functionError;
      if (!data?.user) throw new Error('No user returned');

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
  }, [toast]);

  const updateUser = useCallback(async (userId: string, userData: UpdateUserData): Promise<AdminUser> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error: functionError } = await supabase.functions.invoke(`admin-users?userId=${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: userData,
      });

      if (functionError) throw functionError;
      if (!data?.user) throw new Error('No user returned');

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
  }, [toast]);

  const deleteUser = useCallback(async (userId: string): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { error: functionError } = await supabase.functions.invoke(`admin-users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) throw functionError;

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
  }, [toast]);

  const getUserById = useCallback(async (userId: string): Promise<AdminUser> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error: functionError } = await supabase.functions.invoke(`admin-users?userId=${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) throw functionError;
      if (!data?.user) throw new Error('User not found');

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
  }, [toast]);

  return {
    users,
    loading,
    total,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
  };
}