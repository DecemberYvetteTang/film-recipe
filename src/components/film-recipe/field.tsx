import type { ReactNode } from "react";

interface FieldProps {
  children: ReactNode;
  label: string;
}

export function Field({ children, label }: FieldProps) {
  return (
    <div className="block space-y-2">
      <span className="text-sm font-semibold leading-5 text-foreground">{label}</span>
      {children}
    </div>
  );
}
