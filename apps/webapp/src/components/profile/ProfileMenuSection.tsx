import { LucideIcon } from "lucide-react";
import ProfileMenuItem from "./ProfileMenuItem";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  mobileOnly?: boolean;
}

interface ProfileMenuSectionProps {
  title: string;
  items: MenuItem[];
}

const ProfileMenuSection = ({ title, items }: ProfileMenuSectionProps) => {
  return (
    <div className="flex flex-col">
      <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider px-6 pt-6 pb-3">
        {title}
      </h3>
      <div className="px-4 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.label} className={item.mobileOnly ? "md:hidden" : ""}>
            <ProfileMenuItem
              icon={item.icon}
              label={item.label}
              subtitle={item.subtitle}
              onClick={item.onClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileMenuSection;
