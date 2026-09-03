import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TransferHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-transparent">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center size-10 rounded-full hover:bg-foreground/5 transition-colors active:scale-95 text-foreground md:hidden"
      >
        <ArrowLeft className="size-5" />
      </button>
      <h2 className="text-lg font-bold tracking-tight text-foreground">Transferir</h2>
      <div className="w-10 md:hidden" />
    </header>
  );
};

export default TransferHeader;
