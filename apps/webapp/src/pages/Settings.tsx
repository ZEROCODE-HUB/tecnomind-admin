import { useState, useEffect } from "react";
import { Palette, Mail, Sun, Moon, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";

interface SettingRowProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingRow = ({ icon: Icon, label, description, children }: SettingRowProps) => (
  <div className="flex items-center justify-between gap-4 p-4 min-h-[56px]">
    <div className="flex items-center gap-4 flex-1">
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
        <Icon className="size-5 text-accent" />
      </div>
      <div className="flex-1">
        <p className="text-foreground font-medium">{label}</p>
        {description && (
          <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
        )}
      </div>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);

  // Check initial theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    // Si no hay tema guardado, queremos oscuro, por tanto isDarkMode = true
    if (savedTheme === "light") {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Toggle theme
  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <AppLayout>
      <GlobalHeader
        title="Configuración"
        showBackButton
        showAvatar={false}
      />

      <div className="flex flex-col flex-1 p-4 gap-4">
        {/* Apariencia */}
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Apariencia
            </h2>
          </div>

          <SettingRow
            icon={Palette}
            label="Modo Oscuro"
            description="Cambia entre tema claro y oscuro"
          >
            <div className="flex items-center gap-2">
              <Sun className={`size-4 transition-colors ${!isDarkMode ? 'text-accent' : 'text-muted-foreground'}`} />
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
                className="data-[state=checked]:bg-accent"
              />
              <Moon className={`size-4 transition-colors ${isDarkMode ? 'text-accent' : 'text-muted-foreground'}`} />
            </div>
          </SettingRow>
        </section>

        {/* Notificaciones */}
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Notificaciones
            </h2>
          </div>


          <SettingRow
            icon={Mail}
            label="Alertas por Email"
            description="Recibe un resumen de tus movimientos en tu bandeja de entrada"
          >
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              className="data-[state=checked]:bg-accent"
            />
          </SettingRow>
        </section>

        {/* Version Info */}
        <div className="mt-auto pt-8 pb-4">
          <p className="text-center text-xs text-muted-foreground font-mono">
            Magnate v2.4.0 (Build 892) • Enterprise Grade Security
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
