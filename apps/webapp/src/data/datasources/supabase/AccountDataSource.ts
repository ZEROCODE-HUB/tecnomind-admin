// Account Data Source
import { supabase } from '../../../lib/supabase';
import { Account, AccountWithType } from '@/domain/entities/Account';

export class AccountDataSource {
    /**
     * Get user's primary account
     */
    async getPrimaryAccount(userId: string): Promise<AccountWithType | null> {
        const { data, error } = await supabase
            .from('accounts')
            .select('*, account_types(*)')
            .eq('user_id', userId)
            .eq('is_primary', true)
            .single();

        if (error) {
            console.error('Error fetching primary account:', error);
            return null;
        }

        return data as AccountWithType;
    }

    /**
     * Get all user accounts
     */
    async getUserAccounts(userId: string): Promise<AccountWithType[]> {
        const { data, error } = await supabase
            .from('accounts')
            .select('*, account_types(*)')
            .eq('user_id', userId)
            .order('is_primary', { ascending: false });

        if (error) {
            console.error('Error fetching user accounts:', error);
            return [];
        }

        return data as AccountWithType[];
    }

    /**
     * Get account by ID
     */
    async getAccountById(accountId: string): Promise<AccountWithType | null> {
        const { data, error } = await supabase
            .from('accounts')
            .select('*, account_types(*)')
            .eq('id', accountId)
            .single();

        if (error) {
            console.error('Error fetching account:', error);
            return null;
        }

        return data as AccountWithType;
    }
}
