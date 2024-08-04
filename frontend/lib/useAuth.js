"use client";
import { useState, useEffect, useCallback, createContext } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserInfo, checkSession } from "@/services/user";
import { log_out } from "@/services/auth";
import axios from "axios";

export const AuthContext = createContext(null);

export function redirectTo42AuthPage() {
  const authUrl = "https://api.intra.42.fr/oauth/authorize";

  const clientId = process.env.NEXT_PUBLIC_42_UID;
  const redirectUri = encodeURIComponent(
    `https://${window.location.hostname}/oauth/42/callback`
  );
  const responseType = "code";
  const scope = "public";
  const state = "a_very_long_random_string_witchmust_be_guessable_letroll";

  const url = `${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&state=${state}`;

  window.location.href = url;
}

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const login = useCallback(() => {
    getCurrentUserInfo().then((response) =>
      setUser({ userInfo: { ...response } })
    );
  }, []);

  const logout = useCallback(() => {
    log_out()
      .then(() => {
        setUser(null);
        if (router.pathname !== "/register" && router.pathname !== "/login") {
          router.push("/");
        }
      })
      .catch((error) => {
        if (error.response.status === 401) {
          axios
            .post("/api/users/refresh")
            .then(() => {
              logout();
            })
            .catch((err) => {});
        }
      });
  }, [router]);

  useEffect(() => {
    const authMount = async () => {
      const sessionValid = await checkSession();
      if (!sessionValid) {
        logout();
        setLoading(false);
        return;
      }
      const userInfo = await getCurrentUserInfo();
      setUser({ userInfo: { ...userInfo } });
      setLoading(false);
    };
    authMount();
  }, []);

  return { user, setUser, login, logout, loading };
};
