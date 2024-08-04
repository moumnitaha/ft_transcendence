"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirectTo42AuthPage } from "@/lib/useAuth";
import { useContext, useRef } from "react";
import { login as apiLogin } from "@/services/auth";
import { AuthContext } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useForm } from "react-hook-form";

export default function LoginForm() {
  const { login } = useContext(AuthContext);
  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const router = useRouter();

  const {
    setError,
    clearErrors,
    formState: { errors },
  } = form;
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    const data = {
      username: form.getValues("username"),
      password: form.getValues("password"),
    };
    try {
      const response = await apiLogin(data);
      if (response.status === "otp_required") {
        router.push(`/login/otp?user=${encodeURIComponent(response.username)}`);
      } else {
        login({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
        });
      }
    } catch (error) {
      setError("username", {
        message: error?.response?.data?.message,
      });
    }
  };

  return (
    <div className="bg-secondary rounded-3xl flex items-center gap-2 p-4">
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      />
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="flex flex-col items-center">
          <h2 className="font-bold m-4 font-styled text-4xl text-shadow-neon text-accent">
            Welcome back!
          </h2>
        </div>
        <div className="p-4 flex items-center flex-col gap-2">
          <Button
            className="p-2 bg-blue-500 hover:brightness-125 outline outline-1 outline-black aspect-square rounded-full"
            onClick={() => {
              redirectTo42AuthPage();
            }}
          >
            <Image
              className="w-full"
              src="/icons/42icon.png"
              alt="42 icon"
              width={500}
              height={500}
            />
          </Button>
          <p className="text-stone-400 text-xs">Login using 42 intra.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 bg-primary w-14"></div>
          or
          <div className="h-0.5 bg-primary w-14"></div>
        </div>
        <div className="flex flex-col items-center w-96">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center gap-4 p-5"
          >
            <Input
              type="text"
              placeholder="Username"
              {...form.register("username", {
                required: "Username is required",
              })}
            />

            <Input
              type="password"
              placeholder="Password"
              {...form.register("password", {
                required: "Password is required",
              })}
            />
            {errors.username && (
              <p className="text-red-500 text-xs">{errors.username.message}</p>
            )}
            <Button type="submit">login</Button>
          </form>
          <Link
            href="/signup"
            className="text-primary underline-offset-4 hover:underline"
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
