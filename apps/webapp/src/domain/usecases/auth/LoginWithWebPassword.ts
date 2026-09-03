// Use Case: Login with Web Password
import { IAuthRepository, AuthResult } from '../../repositories/IAuthRepository';

export class LoginWithWebPassword {
    constructor(private authRepository: IAuthRepository) { }

    async execute(email: string, password: string): Promise<AuthResult> {
        if (!email || !password) {
            return {
                success: false,
                error: 'Email y contraseña son requeridos',
            };
        }

        return await this.authRepository.loginWithWebPassword(email, password);
    }
}
