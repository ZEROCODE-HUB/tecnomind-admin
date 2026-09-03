// User Repository Implementation
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserDataSource } from '../datasources/supabase/UserDataSource';

export class UserRepository implements IUserRepository {
    constructor(private userDataSource: UserDataSource) { }

    async getUserById(userId: string): Promise<User | null> {
        return await this.userDataSource.getUserById(userId);
    }

    async getCurrentUser(): Promise<User | null> {
        return await this.userDataSource.getCurrentUser();
    }

    async updateUser(userId: string, data: Partial<User>): Promise<User> {
        return await this.userDataSource.updateUser(userId, data);
    }
}
