// Transaction Repository Implementation
import { ITransactionRepository, TransferValidation, TransferResult } from '../../domain/repositories/ITransactionRepository';
import { AccountMovement } from '../../domain/entities/Transaction';
import { TransactionDataSource } from '../datasources/supabase/TransactionDataSource';

export class TransactionRepository implements ITransactionRepository {
    constructor(private transactionDataSource: TransactionDataSource) { }

    async getAccountMovements(accountId: string, limit?: number, offset?: number): Promise<AccountMovement[]> {
        return await this.transactionDataSource.getAccountMovements(accountId, limit, offset);
    }

    async validateTransfer(
        fromAccountId: string,
        toIdentifier: string,
        amount: number,
        paymentMethod?: string
    ): Promise<TransferValidation> {
        return await this.transactionDataSource.validateTransfer(fromAccountId, toIdentifier, amount, paymentMethod);
    }

    async processTransfer(
        fromAccountId: string,
        toIdentifier: string,
        amount: number,
        concept?: string,
        paymentMethod?: string
    ): Promise<TransferResult> {
        return await this.transactionDataSource.processTransfer(fromAccountId, toIdentifier, amount, concept, paymentMethod);
    }

    async getAccountStatistics(
        accountId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        total_income: number;
        total_expense: number;
        net_balance: number;
        transaction_count: number;
        avg_transaction_amount: number;
    }> {
        return await this.transactionDataSource.getAccountStatistics(accountId, startDate, endDate);
    }

    async getBalanceTimeline(
        accountId: string,
        startDate: Date,
        endDate: Date,
        groupBy?: 'day' | 'week' | 'month'
    ): Promise<Array<{
        period_date: string;
        income: number;
        expense: number;
        net_balance: number;
        cumulative_balance: number;
    }>> {
        return await this.transactionDataSource.getBalanceTimeline(accountId, startDate, endDate, groupBy);
    }
}
