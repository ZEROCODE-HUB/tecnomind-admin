// Use Case: Logout
import { IAuthRepository } from '../../repositories/IAuthRepository';

export class Logout {
    constructor(private authRepository: IAuthRepository) { }

    async execute(): Promise<void> {
        await this.authRepository.logout();
    }
}
