// Auth Repository Implementation
import { IAuthRepository, AuthResult } from '../../domain/repositories/IAuthRepository';
import { AuthDataSource } from '../datasources/supabase/AuthDataSource';

export class AuthRepository implements IAuthRepository {
    constructor(private authDataSource: AuthDataSource) { }

    async loginWithWebPassword(email: string, password: string): Promise<AuthResult> {
        return await this.authDataSource.loginWithWebPassword(email, password);
    }

    async logout(): Promise<void> {
        await this.authDataSource.logout();
    }

    async getCurrentSession(): Promise<any> {
        return await this.authDataSource.getCurrentSession();
    }

    async isAuthenticated(): Promise<boolean> {
        return await this.authDataSource.isAuthenticated();
    }
}
