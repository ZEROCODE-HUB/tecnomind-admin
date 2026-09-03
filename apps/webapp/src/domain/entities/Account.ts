// Domain Entity: Account
// Based on the mobile app's database types

export interface Account {
    id: string;
    user_id: string;
    account_type_id: string;
    cbu: string;
    cvu: string;
    alias: string;
    balance: number;
    status: AccountStatus;
    status_reason: string | null;
    is_primary: boolean;
    account_number: number;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
}

export interface AccountType {
    id: string;
    code: string;
    name: string;
    currency: string;
    description: string | null;
    is_active: boolean;
    allows_overdraft: boolean;
    overdraft_limit: number;
    created_at: string;
}

export interface AccountWithType extends Account {
    account_types: AccountType;
}

export type AccountStatus = 'active' | 'blocked' | 'suspended' | 'closed';
