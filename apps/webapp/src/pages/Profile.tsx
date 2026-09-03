import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, LogOut, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import ProfileMenuSection from "@/components/profile/ProfileMenuSection";
import LogoutModal from "@/components/profile/LogoutModal";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fullName = user ? `${user.first_name} ${user.last_name}` : "Usuario";
  const isVerified = user?.verification_status === 'verified';

  // Read-only identity fields from real user data
  const identityFields = [
    { label: "DNI", value: user?.dni || "No disponible", locked: true },
    { label: "CUIT/CUIL", value: user?.cuit_cuil || "No disponible", locked: true },
  ];

  // Read-only contact fields from real user data
  const contactFields = [
    { label: "Email", value: user?.email || "No disponible", editable: false },
    { label: "Móvil", value: user?.phone || "No disponible", editable: false },
  ];


  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate("/login");
  };

  return (
    <AppLayout>
      <GlobalHeader
        title="Mi Perfil"
        showBackButton
        showAvatar={false}
      />

      <div className="flex flex-col flex-1">
        {/* Read-only notice */}
        <div className="px-4 pt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Los datos del perfil son de solo lectura en la versión web. Para modificarlos, usa la aplicación móvil.
            </AlertDescription>
          </Alert>
        </div>

        {/* Avatar Section */}
        <section className="flex flex-col items-center p-6 gap-6 bg-card border-b border-border shadow-sm">
          <ProfileAvatar
            name={fullName}
            subtitle={user?.email || "Usuario"}
            isVerified={isVerified}
            imageUrl={user?.photo_url}
          />
        </section>

        {/* Identity Card - Read Only */}
        <ProfileInfoCard
          title="Identidad"
          fields={identityFields}
          onFieldChange={() => { }} // No-op for read-only
        />

        {/* Contact Card - Read Only */}
        <ProfileInfoCard
          title="Contacto"
          fields={contactFields}
          onFieldChange={() => { }} // No-op for read-only
        />


        {/* Logout Button */}
        <div className="mt-10 px-6 mb-8">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-4 px-6 rounded-full border-2 border-destructive/40 bg-destructive/5 text-destructive font-bold tracking-wide hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300 flex items-center justify-center gap-2 shadow-sm min-h-[56px] dark:bg-destructive/10 dark:hover:bg-destructive"
          >
            <LogOut className="size-5" />
            Cerrar Sesión
          </button>
          <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
            Magnate Web v1.0.0 • Secure Banking
          </p>
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </AppLayout>
  );
};

export default Profile;
