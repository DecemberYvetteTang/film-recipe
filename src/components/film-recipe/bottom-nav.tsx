import { Archive, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomNavItem = "quick" | "new" | "backup";

const navItems: Array<{
  id: BottomNavItem;
  label: string;
  icon: typeof Search;
}> = [
  { id: "quick", label: "快查", icon: Search },
  { id: "new", label: "新建", icon: Plus },
  { id: "backup", label: "备份", icon: Archive }
];

interface BottomNavProps {
  activeItem?: BottomNavItem;
  onChange?: (item: BottomNavItem) => void;
}

export function BottomNav({ activeItem = "quick", onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-[22px] left-1/2 z-20 grid h-16 w-[342px] -translate-x-1/2 grid-cols-3 rounded-[32px] border border-white/80 bg-[rgba(255,253,248,0.78)] p-2 shadow-[0_18px_34px_rgba(20,18,14,0.16)] backdrop-blur-xl"
      aria-label="底部导航"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeItem;

        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex h-12 items-center justify-center rounded-3xl text-foreground transition-colors",
              isActive && "bg-secondary text-primary"
            )}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange?.(item.id)}
          >
            <span className="grid place-items-center gap-1">
              <Icon size={20} strokeWidth={isActive ? 2.4 : 2.1} />
              <span className="text-[11px] font-semibold leading-[14px] tracking-[0]">{item.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
