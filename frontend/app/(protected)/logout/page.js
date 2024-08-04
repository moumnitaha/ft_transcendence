"use client";

import { React, useEffect } from "react";
import { AuthContext } from "@/lib/useAuth";
import { useContext } from "react";

export default function Logout() {
  const { logout } = useContext(AuthContext);
  useEffect(() => {
    logout();
  }, []);

  return (
    <div className="h-full w-full flex items-center justify-center font-bold">
      <h1>Currently Logging You Out</h1>;
    </div>
  );
}
