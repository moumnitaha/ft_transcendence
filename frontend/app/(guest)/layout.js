"use client";
import { useEffect, useContext } from "react";
import { AuthContext } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { checkSession } from "@/services/user";

export default function Layout({ children }) {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  useEffect(() => {
    // this somehow fixes javascript not running on the return button after a successful oauth login
    window.addEventListener("unload", () => {});
    return () => {
      window.removeEventListener("unload", () => {});
    };
  }, []);
  useEffect(() => {
    if (user) {
      router.push("/profile");
      return;
    } else {
      checkSession().then((res) => {
        if (res) {
          router.push("/profile");
        }
      });
    }
  }, [user, router]);
  if (user) {
    return null;
  }
  return <>{children}</>;
}
