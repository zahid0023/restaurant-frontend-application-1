import { ZapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SiteLogo({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <ZapIcon className="text-primary" />
      <span className="font-bold text-primary-foreground text-base">
        Resort
      </span>
    </div>
  );
}
