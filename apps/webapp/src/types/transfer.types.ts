/**
 * Tipos relacionados con transferencias
 */

export interface TransferState {
  recipient: string;
  amount: number;
  concept?: string;
  toAccountId?: string | null;
  recipientName?: string;
  isExternal?: boolean;
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
