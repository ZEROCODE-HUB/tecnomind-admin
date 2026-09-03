import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoIcon from "@/components/LogoIcon";

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col justify-center items-center bg-background overflow-hidden">
      {/* Logo container with subtle animation */}
      <div className="relative z-10 animate-fade-in">
        <LogoIcon className="w-32 h-32 md:w-40 md:h-40" />
      </div>

      {/* Brand name */}
      <h1 className="relative z-10 mt-8 text-foreground text-2xl md:text-3xl font-bold uppercase tracking-[0.3em] animate-fade-in opacity-90">
        Magnate
      </h1>

      {/* Subtle loading indicator */}
      <div className="absolute bottom-16 flex gap-1.5">
        <span className="w-2 h-2 bg-accent/40 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-accent/40 rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
        <span className="w-2 h-2 bg-accent/40 rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  );
};

export default SplashScreen;
