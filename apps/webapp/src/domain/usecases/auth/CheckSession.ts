// Use Case: Check Session
import { IAuthRepository } from '../../repositories/IAuthRepository';

export class CheckSession {
    constructor(private authRepository: IAuthRepository) { }

    async execute(): Promise<boolean> {
        return await this.authRepository.isAuthenticated();
    }
}
