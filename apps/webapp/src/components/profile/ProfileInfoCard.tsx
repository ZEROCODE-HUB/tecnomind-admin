import { useState } from "react";
import { Lock, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface InfoField {
  label: string;
  value: string;
  editable?: boolean;
  locked?: boolean;
}

interface ProfileInfoCardProps {
  title: string;
  fields: InfoField[];
  onFieldChange?: (label: string, value: string) => void;
}

const ProfileInfoCard = ({ title, fields, onFieldChange }: ProfileInfoCardProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleStartEdit = (field: InfoField) => {
    if (!field.editable) return;
    setEditingField(field.label);
    setEditValue(field.value);
  };

  const handleConfirmEdit = (label: string) => {
    if (onFieldChange) {
      onFieldChange(label, editValue);
    }
    setEditingField(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider px-6 pt-6 pb-3">
        {title}
      </h3>
      <div className="px-4">
        <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
          {fields.map((field, index) => (
            <div
              key={field.label}
              className={`group flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                index < fields.length - 1 ? "border-b border-border" : ""
              } ${field.editable && editingField !== field.label ? "cursor-pointer" : ""}`}
              onClick={() => editingField !== field.label && handleStartEdit(field)}
            >
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  {field.label}
                </span>
                {editingField === field.label ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-8 text-base"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-foreground text-base font-normal tracking-wide">
                    {field.value}
                  </span>
                )}
              </div>
              {field.locked && <Lock className="size-5 text-muted-foreground/50" />}
              {field.editable && editingField !== field.label && (
                <Pencil className="size-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              {editingField === field.label && (
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmEdit(field.label);
                    }}
                    className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoCard;
