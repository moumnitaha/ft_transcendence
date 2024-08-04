"use client";

import Sidenavbar from "./_components/Sidenavbar";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/lib/useAuth";
import { useEffect, useContext } from "react";
import StickyHeader from "./_components/StickyHeader";

export default function Layout({ children }) {
  const { user } = useContext(AuthContext);

  const router = useRouter();
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }
  return (
    <>
      <Sidenavbar />
      <div className="h-full w-full flex flex-col">
        <StickyHeader user={user} />
        <main className="h-full w-full py-2 overflow-y-auto">{children}</main>
      </div>
    </>
  );
}
