// Use Case: Get Account Balance
import { IAccountRepository } from '../../repositories/IAccountRepository';

export class GetAccountBalance {
    constructor(private accountRepository: IAccountRepository) { }

    async execute(userId: string): Promise<number> {
        const account = await this.accountRepository.getPrimaryAccount(userId);
        return account?.balance || 0;
    }
}
