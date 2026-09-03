// Domain Repository Interface: Transaction
import { AccountMovement } from '../entities/Transaction';

export interface TransferValidation {
    valid: boolean;
    error_code: string | null;
    error_message: string | null;
    to_account_id: string | null;
    to_holder_name: string | null;
    is_external: boolean;
    commission_amount: number;
    net_amount: number;
}

export interface TransferResult {
    success: boolean;
    transaction_id: string;
    amount: number;
    new_balance: number;
    is_external: boolean;
    to_account_id: string | null;
    reference_number: string;
}

export interface ITransactionRepository {
    /**
     * Get account movements (transactions)
     */
    getAccountMovements(accountId: string, limit?: number, offset?: number): Promise<AccountMovement[]>;

    /**
     * Validate a transfer before processing
     */
    validateTransfer(
        fromAccountId: string,
        toIdentifier: string,
        amount: number,
        paymentMethod?: string
    ): Promise<TransferValidation>;

    /**
     * Process a transfer
     */
    processTransfer(
        fromAccountId: string,
        toIdentifier: string,
        amount: number,
    ): Promise<TransferResult>;

    /**
     * Get account statistics
     */
    getAccountStatistics(
        accountId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        total_income: number;
        total_expense: number;
        net_balance: number;
        transaction_count: number;
        avg_transaction_amount: number;
    }>;

    /**
     * Get balance timeline for charts
     */
    getBalanceTimeline(
        accountId: string,
        startDate: Date,
        endDate: Date,
        groupBy?: 'hour' | 'day' | 'week' | 'month'
    ): Promise<Array<{
        period_date: string;
        income: number;
        expense: number;
        net_balance: number;
        cumulative_balance: number;
    }>>;
}
