"use client";
import { useContext, useEffect, useState } from "react";
import { oauth } from "@/services/auth";
import { AuthContext } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function Callback() {
  const { user, login } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    if (code && state) {
      oauth(code, state).then(
        (response) => {
          if (response.status === "otp_required") {
            router.push(
              `/login/otp?user=${encodeURIComponent(response.username)}`
            );
            return;
          }
          login({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
          });
        },
        (error) => {
          setError(error.response.data.message);
        }
      );
    } else {
      // redirect to login page
    }
    return;
  }, []);
  return (
    <div className="h-full w-full flex items-center justify-center font-bold">
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div>Currently processing your authentication...</div>
      )}
    </div>
  );
}
