import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import RecipientInput from "@/components/transfer/RecipientInput";
import AmountInput from "@/components/transfer/AmountInput";
import ConceptInput from "@/components/transfer/ConceptInput";
import TransferButton from "@/components/transfer/TransferButton";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { parseAmount } from "@/lib/formatters";
import { TransactionDataSource, TransferValidationResult } from "@/data/datasources/supabase/TransactionDataSource";
import { TransactionRepository } from "@/data/repositories/TransactionRepository";
import { ValidateTransfer } from "@/domain/usecases/transaction/ValidateTransfer";
import { toast } from "sonner";


// Initialize dependencies
const transactionDataSource = new TransactionDataSource();
const transactionRepository = new TransactionRepository(transactionDataSource);
const validateTransferUseCase = new ValidateTransfer(transactionRepository);



const Transfer = () => {
  const navigate = useNavigate();
  const { user, account } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("0");
  const [concept, setConcept] = useState("");
  const [validating, setValidating] = useState(false);
  const [recipientData, setRecipientData] = useState<TransferValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate recipient with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = recipient.trim();
      if (trimmed.length >= 3) {
        setValidating(true);
        setValidationError(null);
        try {
          if (!account?.id) return;

          const result = await validateTransferUseCase.execute({
            fromAccountId: account.id,
            destinationCvu: trimmed,
            amount: 1, // Validation amount is arbitrary for getting holder name
          });

          if (result.valid) {
            setRecipientData(result as TransferValidationResult);
            setValidationError(null);
          } else {
            setRecipientData(null);
            setValidationError(result.error_message || "Cuenta no encontrada");
          }
        } catch (error: any) {
          console.error("Error validating recipient:", error);
          setRecipientData(null);
          setValidationError("Error al validar");
        } finally {
          setValidating(false);
        }
      } else {
        setRecipientData(null);
        setValidationError(null);
        setValidating(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [recipient, account?.id]);

  const fullName = user ? `${user.first_name} ${user.last_name}` : "Usuario";
  const isRecipientValid = !!recipientData;
  const numericAmount = parseAmount(amount);
  const isAmountValid = numericAmount > 0 && numericAmount <= (account?.balance || 0);
  const canTransfer = isRecipientValid && isAmountValid && !validating;


  const handleTransfer = async () => {
    if (!canTransfer || !account?.id || !recipientData) return;

    // We already have validated recipient data from the useEffect
    // Navigate to confirmation with validated data
    navigate("/confirm-pay", {
      state: {
        recipient,
        amount: numericAmount,
        concept,
        toAccountId: recipientData.to_account_id,
        recipientName: recipientData.to_holder_name || "Desconocido",
        isExternal: recipientData.is_external
      },
    });
  };


  return (
    <AppLayout>
      <GlobalHeader
        title="Transferir"
        showBackButton
        showAvatar
        userName={fullName}
      />

      <main className="flex-1 w-full max-w-md mx-auto flex flex-col px-4 pt-4 pb-8">
        <RecipientInput
          value={recipient}
          onChange={setRecipient}
          isValid={isRecipientValid}
          validating={validating}
          recipientName={recipientData?.to_holder_name}
          error={validationError}
        />


        <AmountInput
          value={amount}
          onChange={setAmount}
          availableBalance={account?.balance || 0}
        />

        <ConceptInput value={concept} onChange={setConcept} />
      </main>

      <TransferButton
        disabled={!canTransfer}
        onClick={handleTransfer}
      >
        {validating ? "Validando..." : "Continuar"}
      </TransferButton>
    </AppLayout>
  );
};

export default Transfer;
