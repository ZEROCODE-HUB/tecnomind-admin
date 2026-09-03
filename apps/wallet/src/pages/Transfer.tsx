import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import RecipientInput from "@/components/transfer/RecipientInput";
import AmountInput from "@/components/transfer/AmountInput";
import ConceptInput from "@/components/transfer/ConceptInput";
import TransferButton from "@/components/transfer/TransferButton";
import { useAuth } from "@/contexts/AuthContext";
import { AVAILABLE_BALANCE } from "@/data/mockBalance";
import { parseAmount } from "@/lib/formatters";

const validateRecipient = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length >= 3;
};

const Transfer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("0");
  const [concept, setConcept] = useState("");

  const isRecipientValid = validateRecipient(recipient);
  const numericAmount = parseAmount(amount);
  const isAmountValid = numericAmount > 0 && numericAmount <= AVAILABLE_BALANCE;
  const canTransfer = isRecipientValid && isAmountValid;

  const handleTransfer = () => {
    if (!canTransfer) return;

    navigate("/confirm-pay", {
      state: {
        recipient,
        amount: numericAmount,
        concept,
      },
    });
  };

  return (
    <AppLayout>
      <GlobalHeader 
        title="Transferir" 
        showBackButton
        showAvatar
        userName={user?.name || "Usuario"}
      />

      <main className="flex-1 w-full max-w-md mx-auto flex flex-col px-4 pt-4 pb-8">
        <RecipientInput
          value={recipient}
          onChange={setRecipient}
          isValid={isRecipientValid}
        />

        <AmountInput
          value={amount}
          onChange={setAmount}
          availableBalance={AVAILABLE_BALANCE}
        />

        <ConceptInput value={concept} onChange={setConcept} />
      </main>

      <TransferButton disabled={!canTransfer} onClick={handleTransfer} />
    </AppLayout>
  );
};

export default Transfer;