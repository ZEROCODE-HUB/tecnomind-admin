interface ConceptInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ConceptInput = ({ value, onChange }: ConceptInputProps) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-3 ml-4 mr-2">
        <p className="text-xs font-bold tracking-[0.15em] text-muted-foreground uppercase opacity-90">
          Concepto
        </p>
        <span className="text-[10px] font-medium text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full uppercase tracking-wider">
          Opcional
        </span>
      </div>
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-secondary border border-border rounded-xl py-4 pl-6 pr-4 text-base font-medium text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-muted-foreground/40 placeholder:font-normal min-h-[44px]"
          placeholder="Ej: Varios, Alquiler, Expensas..."
          maxLength={100}
          autoComplete="off"
        />
      </div>
    </div>
  );
};

export default ConceptInput;
