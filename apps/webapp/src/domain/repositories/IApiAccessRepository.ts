// Domain Repository Interface: API Access
import { ApiAccess } from '../entities/ApiAccess';

export interface IApiAccessRepository {
    /**
     * Get user's API access configuration
     */
    getApiAccess(userId: string): Promise<ApiAccess | null>;

    /**
     * Enable API access for user
     */
    enableApiAccess(userId: string, username: string, password: string): Promise<ApiAccess>;

    /**
     * Disable API access
     */
    disableApiAccess(userId: string): Promise<void>;

    /**
     * Update allowed IPs
     */
    updateAllowedIps(userId: string, ips: string[]): Promise<void>;
}
