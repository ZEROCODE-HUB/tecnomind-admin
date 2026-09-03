// Use Case: Get Account Statistics
import { ITransactionRepository } from '../../repositories/ITransactionRepository';

export interface GetAccountStatisticsParams {
    accountId: string;
    startDate: Date;
    endDate: Date;
}

export class GetAccountStatistics {
    constructor(private transactionRepository: ITransactionRepository) { }

    async execute(params: GetAccountStatisticsParams) {
        const { accountId, startDate, endDate } = params;
        return await this.transactionRepository.getAccountStatistics(accountId, startDate, endDate);
    }
}
