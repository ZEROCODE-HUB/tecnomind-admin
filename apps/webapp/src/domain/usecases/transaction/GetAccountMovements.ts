// Use Case: Get Account Movements with Pagination
import { ITransactionRepository } from '../../repositories/ITransactionRepository';
import { AccountMovement } from '../../entities/Transaction';

export interface GetMovementsParams {
    accountId: string;
    limit?: number;
    offset?: number;
}

export class GetAccountMovements {
    constructor(private transactionRepository: ITransactionRepository) { }

    async execute(params: GetMovementsParams): Promise<AccountMovement[]> {
        const { accountId, limit = 50, offset = 0 } = params;
        return await this.transactionRepository.getAccountMovements(accountId, limit, offset);
    }
}
