// Use Case: Validate Transfer
import { ITransactionRepository, TransferValidation } from '../../repositories/ITransactionRepository';

export interface ValidateTransferParams {
  fromAccountId: string;
  destinationCvu: string;
  amount: number;
}

export class ValidateTransfer {
  constructor(private transactionRepository: ITransactionRepository) {}

  async execute(params: ValidateTransferParams): Promise<TransferValidation> {
    return await this.transactionRepository.validateTransfer(
      params.fromAccountId,
      params.destinationCvu,
      params.amount
    );
  }
}
