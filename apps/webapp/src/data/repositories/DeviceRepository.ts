// Repository Implementation: Device
import { IDeviceRepository } from '../../domain/repositories/IDeviceRepository';
import { UserDevice } from '../../domain/entities/Device';
import { DeviceDataSource } from '../datasources/supabase/DeviceDataSource';

export class DeviceRepository implements IDeviceRepository {
    constructor(private deviceDataSource: DeviceDataSource) { }

    async getUserDevices(userId: string): Promise<UserDevice[]> {
        return await this.deviceDataSource.getUserDevices(userId);
    }

    async revokeDevice(deviceId: string): Promise<void> {
        await this.deviceDataSource.revokeDevice(deviceId);
    }
}
