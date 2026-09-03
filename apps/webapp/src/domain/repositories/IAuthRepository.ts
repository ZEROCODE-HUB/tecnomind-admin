// Domain Repository Interface: Authentication
import { User } from '../entities/User';

export interface AuthResult {
    success: boolean;
    error?: string;
    user?: User;
}

export interface IAuthRepository {
    /**
     * Login with email and web password
     * Only works if user has web_access_enabled = true
     */
    loginWithWebPassword(email: string, password: string): Promise<AuthResult>;

    /**
     * Logout current user
     */
    logout(): Promise<void>;

    /**
     * Get current session
     */
    getCurrentSession(): Promise<any>;

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): Promise<boolean>;
}
