import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

export default function Card({ className, padding = "md", children, ...props }: CardProps) {
  const paddings = { sm: "p-3", md: "p-4", lg: "p-6" };
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-sm",
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
