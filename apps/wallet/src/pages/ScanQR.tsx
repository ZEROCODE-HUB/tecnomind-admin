import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flashlight, FlashlightOff, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ScanQR = () => {
  const navigate = useNavigate();
  const [flashOn, setFlashOn] = useState(false);

  const handleSimulateSuccess = () => {
    navigate("/confirm-pay");
  };

  return (
    <div className="relative h-screen w-full bg-[#0A2540] overflow-hidden">
      {/* Simulated Camera Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A2540] via-[#1a3a5c] to-[#0A2540]">
        {/* Subtle camera noise effect */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
      </div>

      {/* Dark Overlay with Transparent Center */}
      <div className="absolute inset-0">
        {/* Top overlay */}
        <div className="absolute top-0 left-0 right-0 h-[calc(50%-120px)] bg-black/70" />
        
        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-[calc(50%-120px)] bg-black/70" />
        
        {/* Left overlay */}
        <div className="absolute top-[calc(50%-120px)] left-0 w-[calc(50%-120px)] h-[240px] bg-black/70" />
        
        {/* Right overlay */}
        <div className="absolute top-[calc(50%-120px)] right-0 w-[calc(50%-120px)] h-[240px] bg-black/70" />
      </div>

      {/* Scanner Frame */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px]">
        {/* Corner borders */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#2F80ED] rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#2F80ED] rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#2F80ED] rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#2F80ED] rounded-br-2xl" />
        
        {/* Glow effect */}
        <div className="absolute -inset-1 rounded-2xl bg-[#2F80ED]/20 blur-md -z-10" />
        
        {/* Scanning laser line */}
        <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#2F80ED] to-transparent animate-scan-line shadow-[0_0_10px_#2F80ED,0_0_20px_#2F80ED]" />
      </div>

      {/* Top Bar - Floating */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-12">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 rounded-full w-11 h-11"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-[#2F80ED]" />
            <h1 className="text-lg font-semibold text-white drop-shadow-lg">
              Escanear QR
            </h1>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFlashOn(!flashOn)}
            className={cn(
              "rounded-full w-11 h-11 transition-colors",
              flashOn 
                ? "text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30" 
                : "text-white hover:bg-white/10"
            )}
          >
            {flashOn ? (
              <Flashlight className="w-6 h-6" />
            ) : (
              <FlashlightOff className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Bottom Bar - Floating */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-28">
        <div className="text-center space-y-4">
          <p className="text-white/90 text-sm font-medium drop-shadow-lg">
            Colocá el código QR dentro del recuadro
          </p>
          
          {/* Simulate Success Button (for testing) */}
          <Button
            onClick={handleSimulateSuccess}
            className="bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white px-6 py-2 rounded-full text-sm"
          >
            Simular éxito
          </Button>
        </div>
      </div>

      {/* Bottom Navigation - Glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 z-20 md:hidden">
        <div className="backdrop-blur-xl bg-white/10 border-t border-white/20">
          <div className="flex justify-around items-center h-20 px-4">
            <NavButton icon="home" label="Inicio" onClick={() => navigate("/dashboard")} />
            <NavButton icon="movements" label="Movimientos" onClick={() => navigate("/movements")} />
            <NavButton icon="qr" label="QR" active />
            <NavButton icon="transfer" label="Transferir" onClick={() => navigate("/transfer")} />
            <NavButton icon="profile" label="Perfil" onClick={() => navigate("/profile")} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface NavButtonProps {
  icon: "home" | "movements" | "qr" | "transfer" | "profile";
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavButton = ({ icon, label, active, onClick }: NavButtonProps) => {
  const icons = {
    home: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    movements: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    qr: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    transfer: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    profile: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 min-w-[60px] py-2 transition-colors",
        active ? "text-[#2F80ED]" : "text-white/70 hover:text-white"
      )}
    >
      {icons[icon]}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

export default ScanQR;
