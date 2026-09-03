// Use Case: Get Recent Transactions
import { ITransactionRepository } from '../../repositories/ITransactionRepository';
import { AccountMovement } from '../../entities/Transaction';

export class GetRecentTransactions {
    constructor(private transactionRepository: ITransactionRepository) { }

    async execute(accountId: string, limit: number = 10): Promise<AccountMovement[]> {
        return await this.transactionRepository.getAccountMovements(accountId, limit, 0);
    }
}
