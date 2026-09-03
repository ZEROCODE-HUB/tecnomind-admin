import { useState } from "react";
import { Smartphone, Laptop, Monitor, MapPin, Clock, LogOut, Shield, Trash2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";

interface Device {
  id: string;
  name: string;
  type: "smartphone" | "laptop" | "desktop";
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const initialDevices: Device[] = [
  {
    id: "1",
    name: "iPhone 13",
    type: "smartphone",
    location: "Buenos Aires, Argentina",
    lastActive: "Activo ahora",
    isCurrent: true,
  },
  {
    id: "2",
    name: "Chrome en Windows",
    type: "laptop",
    location: "Buenos Aires, Argentina",
    lastActive: "Hace 2 horas",
    isCurrent: false,
  },
  {
    id: "3",
    name: "Samsung S21",
    type: "smartphone",
    location: "Córdoba, Argentina",
    lastActive: "Hace 3 días",
    isCurrent: false,
  },
  {
    id: "4",
    name: "MacBook Pro",
    type: "desktop",
    location: "Buenos Aires, Argentina",
    lastActive: "Hace 1 semana",
    isCurrent: false,
  },
];

const getDeviceIcon = (type: Device["type"]) => {
  switch (type) {
    case "smartphone":
      return Smartphone;
    case "laptop":
      return Laptop;
    case "desktop":
      return Monitor;
    default:
      return Smartphone;
  }
};

const LinkedDevices = () => {
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  const handleRemoveDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((device) => device.id !== deviceId));
    toast.success("Dispositivo desvinculado con éxito", {
      description: "La sesión ha sido cerrada en ese dispositivo.",
    });
  };

  return (
    <AppLayout>
      <GlobalHeader title="Dispositivos vinculados" showBackButton backPath="/profile" showAvatar={false} />

      <div className="flex-1 p-4 space-y-6">
        {/* Security Notice */}
        <Card className="p-4 bg-primary/5 border-primary/20 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground">Seguridad de tu cuenta</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Estos son los dispositivos que tienen acceso a tu cuenta. Si no reconoces alguno, cierra su sesión inmediatamente.
              </p>
            </div>
          </div>
        </Card>

        {/* Devices List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            {devices.length} dispositivo{devices.length !== 1 ? "s" : ""} vinculado{devices.length !== 1 ? "s" : ""}
          </h2>

          {devices.map((device) => {
            const IconComponent = getDeviceIcon(device.type);
            
            return (
              <Card
                key={device.id}
                className={`p-4 rounded-2xl transition-all ${
                  device.isCurrent 
                    ? "bg-card border-2 border-[#27AE60]/30 shadow-md" 
                    : "bg-card border border-border hover:border-border/80"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Device Icon */}
                  <div className={`p-3 rounded-xl ${
                    device.isCurrent 
                      ? "bg-[#27AE60]/10" 
                      : "bg-muted"
                  }`}>
                    <IconComponent className={`size-6 ${
                      device.isCurrent 
                        ? "text-[#27AE60]" 
                        : "text-muted-foreground"
                    }`} />
                  </div>

                  {/* Device Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">
                        {device.name}
                      </h3>
                      {device.isCurrent && (
                        <Badge 
                          variant="outline" 
                          className="bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/30 text-xs font-medium"
                        >
                          Este dispositivo
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" />
                        <span>{device.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span>{device.lastActive}</span>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button (only for non-current devices) */}
                  {!device.isCurrent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDevice(device.id)}
                      className="shrink-0 size-11 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label="Eliminar dispositivo"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Close All Sessions Button */}
        {devices.filter((d) => !d.isCurrent).length > 0 && (
          <div className="pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDevices((prev) => prev.filter((device) => device.isCurrent));
                toast.success("Todas las sesiones han sido cerradas", {
                  description: "Solo este dispositivo mantiene acceso a tu cuenta.",
                });
              }}
              className="w-full py-6 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive font-semibold"
            >
              <LogOut className="size-5 mr-2" />
              Cerrar todas las demás sesiones
            </Button>
          </div>
        )}

        {/* Empty State - No devices at all */}
        {devices.length === 0 && (
          <EmptyState
            icon={WifiOff}
            title="Sin dispositivos"
            description="No hay dispositivos vinculados a tu cuenta"
          />
        )}

        {/* Safe State - Only current device */}
        {devices.filter((d) => !d.isCurrent).length === 0 && devices.length === 1 && (
          <Card className="p-6 rounded-2xl text-center bg-muted/30 border-dashed">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-[#27AE60]/10">
                <Shield className="size-6 text-[#27AE60]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Todo seguro</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Solo este dispositivo tiene acceso a tu cuenta.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default LinkedDevices;
