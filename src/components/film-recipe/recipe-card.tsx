import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  title: string;
  status: "常用" | "想试";
  tags: string[];
  sampleSource: "我拍摄" | "作者参考图";
  tone?: "mist" | "blue" | "paper" | "green";
  className?: string;
}

const toneClassNames: Record<NonNullable<RecipeCardProps["tone"]>, string> = {
  mist: "from-[#b7c9cc] to-[#849a9a]",
  blue: "from-[#315c78] to-[#244758]",
  paper: "from-[#dac8a7] to-[#b9ab93]",
  green: "from-[#2f6a58] to-[#1f493e]"
};

export function RecipeCard({ title, status, tags, sampleSource, tone = "mist", className }: RecipeCardProps) {
  return (
    <article className={cn("break-inside-avoid", className)}>
      <div className={cn("relative h-48 overflow-hidden rounded-lg bg-gradient-to-b", toneClassNames[tone])}>
        <div className="absolute left-3 right-3 top-3 h-0.5 rounded-full bg-white/54" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-black/12" />
        <span className="absolute bottom-3 left-3 text-xs leading-[17px] text-white/88">{sampleSource}</span>
      </div>
      <div className="mt-3 space-y-1.5 px-2">
        <h3 className="text-[15px] font-bold leading-[22px] tracking-[0]">{title}</h3>
        <Badge variant={status === "常用" ? "default" : "accent"} className="h-auto border-0 bg-transparent p-0 text-xs">
          {status}
        </Badge>
        <p className="line-clamp-1 text-xs leading-[17px] text-muted-foreground">{tags.join("  ")}</p>
      </div>
    </article>
  );
}
