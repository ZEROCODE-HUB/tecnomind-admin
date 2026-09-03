// Domain Entity: Device
// Based on the mobile app's database types

export interface UserDevice {
    id: string;
    user_id: string;
    device_id: string;
    device_name: string | null;
    device_model: string | null;
    platform: DevicePlatform;
    os_version: string | null;
    app_version: string | null;
    push_token: string | null;
    status: DeviceStatus;
    is_primary: boolean;
    biometric_enabled: boolean;
    last_active_at: string;
    registered_at: string;
    revoked_at: string | null;
    revoke_reason: string | null;
}

export type DevicePlatform = 'ios' | 'android' | 'web';
export type DeviceStatus = 'active' | 'inactive' | 'revoked';
