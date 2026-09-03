// Domain Entity: API Access
// Based on the mobile app's database types

export interface ApiAccess {
    id: string;
    user_id: string;
    is_enabled: boolean;
    api_username: string;
    api_password_hash: string;
    allowed_ips: string[];
    last_access_at: string | null;
    created_at: string;
    updated_at: string;
}
