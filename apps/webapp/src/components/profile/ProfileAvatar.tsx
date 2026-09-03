import { Camera, BadgeCheck } from "lucide-react";

interface ProfileAvatarProps {
  name: string;
  subtitle?: string;
  isVerified?: boolean;
  imageUrl?: string;
}

const ProfileAvatar = ({ 
  name, 
  subtitle = "Emprendedor Verificado", 
  isVerified = true,
  imageUrl 
}: ProfileAvatarProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="relative group cursor-pointer">
        <div className="size-32 rounded-full ring-4 ring-card shadow-xl bg-gradient-to-br from-primary/20 via-primary/40 to-primary/60 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name} 
              className="size-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-primary">{initials}</span>
          )}
        </div>
        <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 border-4 border-card shadow-md hover:bg-primary/90 transition-colors">
          <Camera className="size-5" />
        </button>
      </div>

      {/* Name & Status */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{name}</h1>
          {isVerified && (
            <BadgeCheck className="size-5 text-primary fill-primary/20" />
          )}
        </div>
        <p className="text-muted-foreground text-sm font-medium tracking-wide">{subtitle}</p>
      </div>
    </div>
  );
};

export default ProfileAvatar;
