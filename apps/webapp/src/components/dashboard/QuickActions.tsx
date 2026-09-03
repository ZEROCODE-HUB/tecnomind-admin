import { Send, BarChart3, Share2, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QuickActionButton from "./QuickActionButton";

const actions = [
  { icon: Send, label: "Transferir", isPrimary: false, path: "/transfer", desktopOnly: false },
  { icon: Receipt, label: "Movimientos", isPrimary: false, path: "/movements", desktopOnly: true },
  { icon: BarChart3, label: "Estadísticas", isPrimary: false, path: "/statistics", desktopOnly: false },
  { icon: Share2, label: "Compartir CVU", isPrimary: false, path: "/share-cvu", desktopOnly: false },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <section className="px-6 py-4">
      <div className="flex flex-row justify-between flex-wrap gap-4">
        {actions.map((action) => (
          <div
            key={action.label}
            className={`flex-1 min-w-[80px] ${action.desktopOnly ? "hidden md:block" : ""}`}
          >
            <QuickActionButton
              icon={action.icon}
              label={action.label}
              isPrimary={action.isPrimary}
              onClick={() => navigate(action.path)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;
