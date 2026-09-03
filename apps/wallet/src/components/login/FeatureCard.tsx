import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  label: string;
  gradientClass: string;
}

const FeatureCard = ({ icon: Icon, label, gradientClass }: FeatureCardProps) => {
  return (
    <div
      className={`${gradientClass} flex flex-col gap-2 rounded-xl justify-center items-center p-3 aspect-square shadow-sm relative overflow-hidden group cursor-default`}
    >
      <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors" />
      <Icon className="text-white h-8 w-8 relative z-10" strokeWidth={1.5} />
      <p className="text-white text-xs font-bold leading-tight text-center relative z-10">
        {label}
      </p>
    </div>
  );
};

export default FeatureCard;
