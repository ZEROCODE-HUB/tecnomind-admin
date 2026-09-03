// Domain Entity: User
// Based on the mobile app's database types

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    dni: string;
    cuit_cuil: string;
    web_access_enabled: boolean;
    web_password_hash: string | null;
    web_access_enabled_at: string | null;
    verification_status: VerificationStatus;
    photo_url: string | null;
    created_at: string;
    updated_at: string;
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
