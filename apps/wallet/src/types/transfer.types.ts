/**
 * Tipos relacionados con transferencias
 */

export interface TransferState {
  /** Lo que escribió el usuario: alias, CBU o CVU. */
  recipient: string;
  /** Titular resuelto con search_account_for_transfer, para poder mostrarlo. */
  recipientName?: string;
  isExternal?: boolean;
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
