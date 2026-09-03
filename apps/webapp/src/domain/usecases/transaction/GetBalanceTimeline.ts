// Use Case: Get Balance Timeline
import { ITransactionRepository } from '../../repositories/ITransactionRepository';

export interface GetBalanceTimelineParams {
    accountId: string;
    startDate: Date;
    endDate: Date;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export class GetBalanceTimeline {
    constructor(private transactionRepository: ITransactionRepository) { }

    async execute(params: GetBalanceTimelineParams) {
        const { accountId, startDate, endDate, groupBy = 'day' } = params;
        return await this.transactionRepository.getBalanceTimeline(accountId, startDate, endDate, groupBy);
    }
}
