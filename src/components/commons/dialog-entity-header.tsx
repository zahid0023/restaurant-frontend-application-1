import type { ReactNode } from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DialogEntityHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function DialogEntityHeader({ icon, title, description }: DialogEntityHeaderProps) {
  return (
    <DialogHeader className="shrink-0 px-6 py-5 border-b bg-muted/40">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <DialogTitle className="text-base font-semibold leading-tight">{title}</DialogTitle>
          <DialogDescription className="text-xs mt-0.5">{description}</DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
}
