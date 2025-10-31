"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/logout", { method: "POST" });

      if (res.ok) {
        router.push("/");
      } else {
        console.error("Logout failed:", await res.text());
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={handleLogout}
      className={`flex items-center font-semibold gap-1 text-blue-700 px-3 py-1 rounded-lg cursor-pointer ${
        loading ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <LogOut size={20} />
      <p>{loading ? "Logging out.." : "Logout"}</p>
    </div>
  );
}
