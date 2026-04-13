"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full rounded-2xl bg-[#EBD5D5] py-4 flex items-center justify-center gap-2 font-medium text-[#E17070] transition-colors hover:bg-red-200"
    >
      <LogOut size={18} />
      Sair da conta
    </button>
  );
}
