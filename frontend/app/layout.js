"use client";
// import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/useAuth";
import { AuthContext } from "@/lib/useAuth";
import React, { useEffect } from "react";
import ReduxProvider from "./redux-provider";
import Loading from "./loading";
// const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const { user, setUser, login, logout, loading } = useAuth(AuthContext);

  useEffect(() => {
    document.title = "ft_transcendence";
  }, []);

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={cn(
          //   inter.className,
          "h-screen w-screen flex items-start justify-start bg-zinc-900"
        )}
      >
        {loading ? (
          <Loading />
        ) : (
          <ReduxProvider>
            <AuthContext.Provider value={{ user, setUser, login, logout }}>
              {children}
            </AuthContext.Provider>
          </ReduxProvider>
        )}
      </body>
    </html>
  );
}
