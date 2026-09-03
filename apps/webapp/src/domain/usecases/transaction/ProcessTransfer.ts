// Use Case: Process Transfer
import { ITransactionRepository } from '../../repositories/ITransactionRepository';

export interface ProcessTransferParams {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  concept: string;
}

export interface ProcessTransferResult {
  success: boolean;
  transaction_id?: string;
  error?: string;
}

export class ProcessTransfer {
  constructor(private transactionRepository: ITransactionRepository) {}

  async execute(params: ProcessTransferParams): Promise<ProcessTransferResult> {
    try {
      const transactionId = await this.transactionRepository.processTransfer(
        params.fromAccountId,
        params.toAccountId,
        params.amount,
        params.concept
      );
      
      return {
        success: true,
        transaction_id: transactionId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al procesar transferencia'
      };
    }
  }
}
