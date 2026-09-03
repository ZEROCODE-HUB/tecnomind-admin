// Use Case: Get User Devices
import { IDeviceRepository } from '../../repositories/IDeviceRepository';
import { UserDevice } from '../../entities/Device';

export class GetUserDevices {
    constructor(private deviceRepository: IDeviceRepository) { }

    async execute(userId: string): Promise<UserDevice[]> {
        return await this.deviceRepository.getUserDevices(userId);
    }
}
