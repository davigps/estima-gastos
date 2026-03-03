"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between md:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs">
          🦷
        </div>
        <span className="font-semibold text-gray-900 text-sm">
          {title ?? "Estima Odontologia"}
        </span>
      </div>
      <div className="hidden md:block">
        {title && <h1 className="text-lg font-semibold text-gray-900">{title}</h1>}
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
        Sair
      </Button>
    </header>
  );
}
