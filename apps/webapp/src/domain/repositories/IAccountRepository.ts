// Domain Repository Interface: Account
import { Account, AccountWithType } from '../entities/Account';

export interface IAccountRepository {
    /**
     * Get user's primary account
     */
    getPrimaryAccount(userId: string): Promise<AccountWithType | null>;

    /**
     * Get all user accounts
     */
    getUserAccounts(userId: string): Promise<AccountWithType[]>;

    /**
     * Get account by ID
     */
    getAccountById(accountId: string): Promise<AccountWithType | null>;
}
