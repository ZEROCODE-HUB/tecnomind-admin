import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import RecipientInput from "@/components/transfer/RecipientInput";
import AmountInput from "@/components/transfer/AmountInput";
import ConceptInput from "@/components/transfer/ConceptInput";
import TransferButton from "@/components/transfer/TransferButton";
import { useAuth } from "@/contexts/AuthContext";
import { parseAmount, formatCurrencyARS } from "@/lib/formatters";
import { useSaldo, useLimites } from "@/hooks/useAccount";
import { buscarDestinatario } from "@/hooks/useTransfer";
import { useToast } from "@/hooks/use-toast";

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
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const { saldo } = useSaldo();
  const { data: limites } = useLimites();

  const disponible = saldo.available;
  const isRecipientValid = validateRecipient(recipient);
  const numericAmount = parseAmount(amount);
  const isAmountValid = numericAmount > 0 && numericAmount <= disponible;
  const canTransfer = isRecipientValid && isAmountValid && !isChecking;

  // El destinatario se resuelve ANTES de confirmar: la pantalla siguiente
  // muestra a quién se le está por transferir, y equivocarse de alias sin
  // ver el nombre es la forma más fácil de mandar plata a un desconocido.
  const handleTransfer = async () => {
    if (!canTransfer) return;

    if (limites && numericAmount > limites.porOperacion && limites.porOperacion > 0) {
      toast({
        variant: "destructive",
        title: "Supera tu límite por operación",
        description: `El máximo por transferencia es ${formatCurrencyARS(limites.porOperacion)}.`,
      });
      return;
    }

    setIsChecking(true);
    try {
      const destino = await buscarDestinatario(recipient);
      if (!destino) {
        toast({
          variant: "destructive",
          title: "No encontramos esa cuenta",
          description: "Revisá el alias, CBU o CVU e intentá de nuevo.",
        });
        return;
      }

      navigate("/confirm-pay", {
        state: {
          recipient,
          recipientName: destino.nombre,
          isExternal: destino.esExterna,
          amount: numericAmount,
          concept,
        },
      });
    } catch {
      toast({
        variant: "destructive",
        title: "No pudimos validar la cuenta",
        description: "Intentá de nuevo en unos segundos.",
      });
    } finally {
      setIsChecking(false);
    }
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
          availableBalance={disponible}
        />

        <ConceptInput value={concept} onChange={setConcept} />
      </main>

      <TransferButton disabled={!canTransfer} onClick={handleTransfer} />
    </AppLayout>
  );
};

export default Transfer;