// Domain Repository Interface: User
import { User } from '../entities/User';

export interface IUserRepository {
    /**
     * Get user by ID
     */
    getUserById(userId: string): Promise<User | null>;

    /**
     * Get current authenticated user
     */
    getCurrentUser(): Promise<User | null>;

    /**
     * Update user profile
     */
    updateUser(userId: string, data: Partial<User>): Promise<User>;
}
