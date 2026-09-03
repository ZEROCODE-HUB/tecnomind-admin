// User Data Source
import { supabase } from '../../../lib/supabase';
import { User } from '../../../domain/entities/User';

export class UserDataSource {
    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return null;
        }

        return data as User;
    }

    /**
     * Get current authenticated user
     */
    async getCurrentUser(): Promise<User | null> {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return null;
        }

        return await this.getUserById(authUser.id);
    }

    /**
     * Update user profile
     */
    async updateUser(userId: string, data: Partial<User>): Promise<User> {
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(data)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }

        return updatedUser as User;
    }
}
