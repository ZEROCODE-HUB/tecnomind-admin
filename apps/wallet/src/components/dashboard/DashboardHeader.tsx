import { Fingerprint } from "lucide-react";
import Logo from "@/components/Logo";

interface DashboardHeaderProps {
  userName?: string;
}

const DashboardHeader = ({ userName = "Santiago" }: DashboardHeaderProps) => {
  return (
    <header className="flex flex-col px-6 pt-8 pb-4">
      {/* Top row: Logo + Avatar */}
      <div className="flex items-center justify-between mb-6 md:hidden">
        <Logo className="h-8" />
        <button className="group relative outline-none">
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-accent/20 cursor-pointer hover:border-accent transition-colors bg-muted" />
        </button>
      </div>

      {/* Greeting + Badge */}
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground">Hola, {userName}</h1>
        <div className="flex self-start items-center gap-2 rounded-full bg-accent/10 pl-2 pr-4 py-1 border border-accent/20">
          <Fingerprint className="size-4 text-accent" />
          <span className="text-accent text-xs font-medium uppercase tracking-wide">
            Acceso Protegido
          </span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
