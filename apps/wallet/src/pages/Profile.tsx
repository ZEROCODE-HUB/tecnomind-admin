import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Smartphone, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import ProfileMenuSection from "@/components/profile/ProfileMenuSection";
import LogoutModal from "@/components/profile/LogoutModal";
import AliasManagement from "@/components/profile/AliasManagement";
import OperationalLimits from "@/components/profile/OperationalLimits";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // State for editable fields - initialized from user context
  const [identityFields, setIdentityFields] = useState([
    { label: "DNI", value: user?.dni || "XX.XXX.XXX", locked: true },
    { label: "CUIT", value: user?.cuit || "20-12345678-9", locked: true },
  ]);
  
  const [contactFields, setContactFields] = useState([
    { label: "Email", value: user?.email || "usuario@magnate.com", editable: true },
    { label: "Móvil", value: user?.phone || "+54 9 11 1234 5678", editable: true },
  ]);

  // Track if there are unsaved changes
  const hasChanges = useMemo(() => {
    const identityChanged = identityFields.some((field) => 
      field.label === "DNI" ? field.value !== user?.dni : field.value !== user?.cuit
    );
    const contactChanged = contactFields.some((field) => 
      field.label === "Email" ? field.value !== user?.email : field.value !== user?.phone
    );
    return identityChanged || contactChanged;
  }, [identityFields, contactFields, user]);

  const handleIdentityFieldChange = (label: string, value: string) => {
    setIdentityFields(prev => 
      prev.map(field => 
        field.label === label ? { ...field, value } : field
      )
    );
  };

  const handleContactFieldChange = (label: string, value: string) => {
    setContactFields(prev => 
      prev.map(field => 
        field.label === label ? { ...field, value } : field
      )
    );
  };

  const handleSave = () => {
    toast.success("Datos guardados correctamente");
  };

  const securityItems = [
    {
      icon: KeyRound,
      label: "Cambiar PIN de acceso",
      onClick: () => console.log("Cambiar PIN"),
      mobileOnly: true,
    },
    {
      icon: Smartphone,
      label: "Dispositivos vinculados",
      subtitle: "iPhone 13 • Activo ahora",
      onClick: () => navigate("/linked-devices"),
      mobileOnly: true,
    },
  ];

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
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
        {/* Avatar Section */}
        <section className="flex flex-col items-center p-6 gap-6 bg-card border-b border-border shadow-sm">
          <ProfileAvatar
            name={user?.name || "Usuario"}
            subtitle={user?.subtitle || "Usuario"}
            isVerified={user?.isVerified || false}
          />
        </section>

        {/* Operational Limits - Above Identity */}
        <OperationalLimits />

        {/* Alias Management - Mobile Only */}
        <AliasManagement userCuit={user?.cuit.replace(/-/g, "") || "20123456789"} />

        {/* Identity Card */}
        <ProfileInfoCard 
          title="Identidad" 
          fields={identityFields} 
          onFieldChange={handleIdentityFieldChange}
        />

        {/* Contact Card */}
        <ProfileInfoCard 
          title="Contacto" 
          fields={contactFields} 
          onFieldChange={handleContactFieldChange}
        />

        {/* Save Button */}
        <div className="px-4 mt-6">
          <Button 
            className="w-full py-6 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-all"
            disabled={!hasChanges}
            onClick={handleSave}
          >
            Guardar
          </Button>
        </div>

        {/* Security Menu */}
        <ProfileMenuSection title="Seguridad" items={securityItems} />

        {/* Logout Button */}
        <div className="mt-10 px-6 mb-8">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-4 px-6 rounded-full border border-destructive/30 bg-destructive/10 text-destructive font-bold tracking-wide hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300 flex items-center justify-center gap-2 shadow-sm min-h-[56px]"
          >
            <LogOut className="size-5" />
            Cerrar Sesión
          </button>
          <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
            Magnate v2.4.0 (Build 892) • Enterprise Grade Security
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