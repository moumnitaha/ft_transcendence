"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRef } from "react";
import { signup } from "@/services/auth";
import { redirectTo42AuthPage } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useForm } from "react-hook-form";

/** this component dosent scale horizonatlly well */
export function SignupForm() {
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
    },
  });
  const router = useRouter();
  const {
    setError,
    clearErrors,
    formState: { errors },
  } = useForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    try {
      const data = {
        first_name: form.getValues("firstName"),
        last_name: form.getValues("lastName"),
        username: form.getValues("username"),
        email: form.getValues("email"),
        password: form.getValues("password"),
      };
      const response = await signup(data);

      toast.success("User created successfully", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
        onClose: () => router.push("/login"),
      });
    } catch (error) {
      if (error?.response?.data?.first_name)
        setError("firstName", {
          message: error?.response?.data?.first_name[0],
        });
      if (error?.response?.data?.last_name)
        setError("lastName", { message: error?.response?.data?.last_name[0] });
      if (error?.response?.data?.username)
        setError("username", { message: error?.response?.data?.username[0] });
      if (error?.response?.data?.email)
        setError("email", { message: error?.response?.data?.email[0] });
      if (error?.response?.data?.password)
        setError("password", { message: error?.response?.data?.password[0] });
    }
  };

  return (
    <div className="bg-secondary rounded-3xl flex items-center gap-2 p-4">
      <ToastContainer />
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="flex flex-col items-center">
          <h2 className="font-bold m-4 font-styled text-4xl">Welcome!</h2>
          <p className="text-center">
            Sign up to embark your ping pong journey.
          </p>
        </div>
        <div className="p-4 flex items-center flex-col gap-2">
          <Button
            variant="outline"
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
            <div className="flex justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Input
                  type="text"
                  placeholder="First Name"
                  {...form.register("firstName", {
                    required: "First Name is required",
                  })}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  type="text"
                  placeholder="Last Name"
                  {...form.register("lastName", {
                    required: "Last Name is required",
                  })}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <Input
                type="text"
                placeholder="Username"
                {...form.register("username", {
                  required: "Username is required",
                })}
              />
              {errors.username && (
                <p className="text-red-500 text-xs">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 w-full">
              <Input
                type="email"
                placeholder="Email"
                {...form.register("email", {
                  required: "Email is required",
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1 w-full">
              <Input
                type="password"
                placeholder="Password"
                {...form.register("password", {
                  required: "Password is required",
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-xs">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit">Sign Up</Button>
          </form>
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
