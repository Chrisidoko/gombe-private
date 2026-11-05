"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSubMenu,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu";
import { cx, focusRing } from "@/lib/utils";
import React from "react";

function DropdownUserProfile() {
  const [mounted] = React.useState(false);
  const [email] = React.useState("");
  const [initials] = React.useState("U");

  //   React.useEffect(() => {
  //     setMounted(true);
  //     const userEmail = Cookies.get("email");
  //     const userInitials = Cookies.get("initials");

  //     if (userEmail) setEmail(userEmail);
  //     if (userInitials) setInitials(userInitials);
  //   }, []);

  const handleSignOut = () => {
    // Cookies.remove("token");
    // Cookies.remove("email");
    // Cookies.remove("role");
    // Cookies.remove("initials");
    // router.push("/admin");
  };

  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="open settings"
          className={cx(
            focusRing,
            "group rounded-full p-1 hover:bg-gray-100 data-[state=open]:bg-gray-100"
          )}
        >
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-medium text-gray-700"
            aria-hidden="true"
          >
            {initials}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{email || "User Email"}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuSubMenu />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DropdownUserProfile };
