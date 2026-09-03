// Domain Entity: Transaction
// Based on the mobile app's database types

export interface Transaction {
    id: string;
    transaction_type_id: string;
    from_account_id: string | null;
    to_account_id: string | null;
    external_cvu: string | null;
    external_cbu: string | null;
    external_alias: string | null;
    external_holder_name: string | null;
    amount: number;
    currency: string;
    concept: string | null;
    payment_method: PaymentMethod;
    payment_reference: string;
    status: TransactionStatus;
    commission_amount: number;
    net_amount: number;
    processed_by: string;
    failure_reason: string | null;
    reference_number: string;
    metadata: any | null;
    initiated_from_device_id: string | null;
    initiated_from_ip: string | null;
    created_at: string;
    processing_at: string | null;
    completed_at: string | null;
    failed_at: string | null;
}

export interface TransactionType {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: TransactionCategory;
    is_active: boolean;
    requires_destination: boolean;
    commission_rate: number;
    min_commission: number;
    max_commission: number | null;
    created_at: string;
}

export interface AccountMovement {
    account_id: string;
    user_id: string;
    transaction_id: string;
    created_at: string;
    completed_at: string | null;
    amount: number;
    concept: string | null;
    payment_method: PaymentMethod;
    reference_number: string;
    category: TransactionCategory;
    transaction_type_name: string;
    movement_type: 'income' | 'expense' | 'other';
    income_amount: number;
    expense_amount: number;
    status: TransactionStatus;
    counterpart_name: string | null;
    payment_reference?: string;
    metadata?: any;
}

export type PaymentMethod = 'alias' | 'cvu' | 'cbu' | 'qr';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reversed' | 'cancelled';
export type TransactionCategory = 'income' | 'expense' | 'internal';
