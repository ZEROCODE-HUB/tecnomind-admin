// Data Source: Device
import { supabase } from '../../../lib/supabase';
import { UserDevice } from '../../../domain/entities/Device';

export class DeviceDataSource {
    async getUserDevices(userId: string): Promise<UserDevice[]> {
        const { data, error } = await supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .order('last_seen_at', { ascending: false });

        if (error) throw error;

        return data || [];
    }

    async revokeDevice(deviceId: string): Promise<void> {
        const { error } = await supabase
            .from('user_devices')
            .delete()
            .eq('id', deviceId);

        if (error) throw error;
    }
}
