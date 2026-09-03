/**
 * Tipos relacionados con transferencias
 */

export interface TransferState {
  recipient: string;
  amount: number;
  concept?: string;
}

export interface TransferSuccessState extends TransferState {
  transactionId: string;
  date: Date;
}

export interface TransferErrorState {
  amount: string;
  recipient: string;
  errorCode: string;
}
