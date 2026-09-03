// Transaction Data Source
import { supabase } from '../../../lib/supabase';
import { AccountMovement } from '../../../domain/entities/Transaction';

export interface TransferValidationResult {
    valid: boolean;
    error_code: string | null;
    error_message: string | null;
    to_account_id: string | null;
    to_holder_name: string | null;
    is_external: boolean;
    commission_amount: number;
    net_amount: number;
}

export interface ProcessTransferResult {
    success: boolean;
    transaction_id: string;
    amount: number;
    new_balance: number;
    is_external: boolean;
    to_account_id: string | null;
    reference_number: string;
}

export class TransactionDataSource {
    /**
     * Get account movements (transactions)
     */
    async getAccountMovements(accountId: string, limit: number = 50, offset: number = 0): Promise<AccountMovement[]> {
        const { data, error } = await supabase
            .from('account_movements')
            .select('*')
            .eq('account_id', accountId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching movements:', error);
            return [];
        }

        return data as AccountMovement[];
    }

    /**
     * Get movements within a specific date range
     */
    async getMovementsInRange(accountId: string, start: Date, end: Date): Promise<AccountMovement[]> {
        const { data, error } = await supabase
            .from('account_movements')
            .select('*')
            .eq('account_id', accountId)
            .gte('completed_at', start.toISOString())
            .lte('completed_at', end.toISOString())
            .order('completed_at', { ascending: true });

        if (error) {
            console.error('Error fetching movements in range:', error);
            return [];
        }

        return data as AccountMovement[];
    }

    /**
     * Get single transaction details by ID directly from transactions table
     * This is useful to get extra fields not present in the view
     */
    async getTransactionById(transactionId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (error) {
            console.error('Error fetching transaction details:', error);
            return null;
        }

        return data;
    }

    /**
     * Validate a transfer before processing
     */
    async validateTransfer(
        fromAccountId: string,
        toIdentifier: string,
        amount: number,
        paymentMethod: string = 'alias'
    ): Promise<TransferValidationResult> {
        const { data, error } = await supabase
            .rpc('search_account_for_transfer', {
                p_identifier: toIdentifier,
            });

        if (error || !data || (data as any[]).length === 0) {
            console.error('Error validating transfer (lookup failed):', error);
            return {
                valid: false,
                error_code: 'NOT_FOUND',
                error_message: 'Cuenta no encontrada',
                to_account_id: null,
                to_holder_name: null,
                is_external: false,
                commission_amount: 0,
                net_amount: amount,
            };
        }

        const account = (data as any[])[0];

        return {
            valid: true,
            error_code: null,
            error_message: null,
            to_account_id: account.account_id,
            to_holder_name: account.holder_name,
            is_external: account.is_external,
            commission_amount: 0,
            net_amount: amount,
        };
    }

    /**
     * Process a transfer
     */
    async processTransfer(
        fromAccountId: string,
        toIdentifier: string,
        amount: number,
        concept?: string,
        paymentMethod: string = 'alias'
    ): Promise<ProcessTransferResult> {
        const { data, error } = await supabase
            .rpc('process_transfer', {
                p_from_account_id: fromAccountId,
                p_to_identifier: toIdentifier,
                p_amount: amount,
                p_concept: concept,
                p_payment_method: paymentMethod,
            });

        if (error) {
            throw new Error(`Error processing transfer: ${error.message}`);
        }

        return data as ProcessTransferResult;
    }

    /**
     * Get account statistics
     */
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
        const { data, error } = await supabase
            .rpc('get_account_statistics', {
                p_account_id: accountId,
                p_start_date: startDate.toISOString(),
                p_end_date: endDate.toISOString(),
            });

        if (error) {
            console.error('Error fetching account statistics:', error);
            return {
                total_income: 0,
                total_expense: 0,
                net_balance: 0,
                transaction_count: 0,
                avg_transaction_amount: 0,
            };
        }

        // RPC returns a list of rows, we want the first one
        const stats = Array.isArray(data) ? data[0] : data;

        return {
            total_income: Number(stats?.total_income || 0),
            total_expense: Number(stats?.total_expense || 0),
            net_balance: Number(stats?.net_balance || 0),
            transaction_count: Number(stats?.transaction_count || 0),
            avg_transaction_amount: Number(stats?.avg_transaction_amount || 0),
        };
    }

    /**
     * Get balance timeline for charts
     */
    async getBalanceTimeline(
        accountId: string,
        startDate: Date,
        endDate: Date,
        groupBy: 'hour' | 'day' | 'week' | 'month' = 'day'
    ): Promise<Array<{
        period_date: string;
        income: number;
        expense: number;
        net_balance: number;
        cumulative_balance: number;
    }>> {
        const { data, error } = await supabase
            .rpc('get_balance_timeline', {
                p_account_id: accountId,
                p_start_date: startDate.toISOString(),
                p_end_date: endDate.toISOString(),
                p_group_by: groupBy,
            });

        if (error) {
            console.error('Error fetching balance timeline:', error);
            return [];
        }

        return (data as any[]).map(item => ({
            period_date: item.period_date,
            income: Number(item.income || 0),
            expense: Number(item.expense || 0),
            net_balance: Number(item.net_balance || 0),
            cumulative_balance: Number(item.cumulative_balance || 0),
        }));
    }

    /**
     * Send OTP for transfer verification via email
     */
    async sendTransferOtp(
        userId: string,
        amount: number,
        recipientName: string
    ): Promise<{ success: boolean; otp?: string; error?: string }> {
        try {
            // Generar OTP de 6 dígitos
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // ✅ Función correcta: enqueue_notification (sin __)
            const { error } = await supabase.rpc('enqueue_notification', {
                p_user_id: userId,
                p_notification_type: 'transfer_otp',
                p_data: {
                    amount: amount,
                    amount_formatted: `$ ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    recipient_name: recipientName,
                    otp_code: otp,
                },
                p_related_transaction_id: null
            });

            if (error) {
                console.error('Error encolando OTP:', error);
                return { success: false, error: error.message };
            }

            return { success: true, otp };
        } catch (error: any) {
            console.error('Error enviando OTP:', error);
            return { success: false, error: error.message };
        }
    }
}
