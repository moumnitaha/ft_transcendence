"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { can_access_2fa, verify_otp } from "@/services/auth";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/lib/useAuth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Otp() {
  const { user, login } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const params = useSearchParams();
  const form = useForm({
    defaultValues: {
      otp: "",
    },
  });
  const router = useRouter();

  useEffect(() => {
    if (!params.has("user")) {
      router.push("/login");
    }
    can_access_2fa({
      username: params.get("user"),
    })
      .then((response) => {
        if (!response.can_access_2fa) {
          router.push("/login");
        }
      })
      .catch((error) => {
        router.push("/login");
      });
  }, [params, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!params.has("user")) {
      return;
    }
    if (form.getValues().otp.length !== 6) {
      setError("Please enter a valid OTP");
    }
    try {
      const response = await verify_otp({
        username: params.get("user"),
        otp: form.getValues().otp,
      });
      login({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
    } catch (error) {
      setError("Invalid OTP");
    //   console.error(error);
    }
  };
  return (
    <main className="signlogin-pages w-full flex min-h-screen flex-col items-center justify-center p-24 bg-">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-2xl font-bold text-white">Enter OTP</label>
        <Input {...form.register("otp")} placeholder="OTP" />
        <div className="flex gap-4">
          <Button type="submit">Submit</Button>
          <Button
            type="button"
            onClick={() => router.push("/login")}
            className="bg-gray-200 text-black"
          >
            Back
          </Button>
        </div>
        <p className="text-red-500">{error}</p>
      </form>
    </main>
  );
}
