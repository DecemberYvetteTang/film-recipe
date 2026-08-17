import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOptionGroup {
  name: string;
  options: string[];
}

interface SelectProps {
  className?: string;
  groups: SelectOptionGroup[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export function Select({ className, groups, onValueChange, placeholder = "请选择", value }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLabel = useMemo(() => groups.flatMap((group) => group.options).find((option) => option === value), [groups, value]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-input bg-card px-4 text-left text-[16px] font-medium leading-6 text-foreground shadow-[0_8px_20px_rgba(20,18,14,0.06)] outline-none transition-colors",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20",
          !selectedLabel && "text-muted-foreground"
        )}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel ?? placeholder}</span>
        <ChevronDown size={18} className={cn("shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover p-2 shadow-[0_18px_40px_rgba(20,18,14,0.18)]"
          role="listbox"
        >
          {groups.map((group) => (
            <div key={group.name} className="py-1">
              <p className="px-3 pb-1 pt-2 text-[12px] font-semibold leading-4 text-muted-foreground">{group.name}</p>
              <div className="space-y-1">
                {group.options.map((option) => {
                  const isSelected = option === value;

                  return (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium leading-5 transition-colors",
                        isSelected ? "bg-[#2f5f50] text-white" : "text-foreground hover:bg-secondary"
                      )}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onValueChange(option);
                        setIsOpen(false);
                      }}
                    >
                      <span className="min-w-0 flex-1">{option}</span>
                      {isSelected ? <Check size={16} className="shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
