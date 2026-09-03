// Domain Repository Interface: Device
import { UserDevice } from '../entities/Device';

export interface IDeviceRepository {
    /**
     * Get all user devices
     */
    getUserDevices(userId: string): Promise<UserDevice[]>;

    /**
     * Revoke a device
     */
    revokeDevice(deviceId: string, reason?: string): Promise<void>;

    /**
     * Register current web session as a device
     */
    registerWebDevice(userId: string, deviceInfo: Partial<UserDevice>): Promise<UserDevice>;
}
