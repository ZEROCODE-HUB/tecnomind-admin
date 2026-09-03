// Account Repository Implementation
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { AccountWithType } from '../../domain/entities/Account';
import { AccountDataSource } from '../datasources/supabase/AccountDataSource';

export class AccountRepository implements IAccountRepository {
    constructor(private accountDataSource: AccountDataSource) { }

    async getPrimaryAccount(userId: string): Promise<AccountWithType | null> {
        return await this.accountDataSource.getPrimaryAccount(userId);
    }

    async getUserAccounts(userId: string): Promise<AccountWithType[]> {
        return await this.accountDataSource.getUserAccounts(userId);
    }

    async getAccountById(accountId: string): Promise<AccountWithType | null> {
        return await this.accountDataSource.getAccountById(accountId);
    }
}
