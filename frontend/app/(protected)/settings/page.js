"use client";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/lib/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import {
  delete_account,
  disable2fa,
  edit_nickname,
  editName,
  enable2fa,
  get2faQrCode,
  get_nickname,
  is2faEnabled,
  isOauth as isOauthApi,
  upload_avatar,
} from "@/services/user";
import QRCode from "react-qr-code";
import { editPassword } from "@/services/user";
import { verify_otp } from "@/services/auth";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { edit_nickname, get_nickname } from "@/services/user";

export default function SettingsPage() {
  const { user, setUser } = useContext(AuthContext);

  return (
    <div className="flex flex-col items-stretch justify-center gap-4 pt-2 pb-4 px-4 md:px-[20vw]">
      <ToastContainer
        position="top-right"
        autoClose={1000}
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
      <PersonalInformation user={user} />
      <EditNickname user={user} setUser={setUser} />
      <TwoFa />
      <PasswordChange user={user} />
      <DeleteAccount />
    </div>
  );
}

function DeleteAccount() {
  return (
    <div className="flex flex-col bg-secondary rounded-3xl p-6 px-10 flex-1 grow justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-accent text-xl font-bold text-shadow-neon">
          Close account
        </h1>
        <p className="text-muted">You can permanently delete your account.</p>
      </div>
      <div className="flex flex-col justify-between items-end">
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm("Are you sure you want to delete your account?")) {
              delete_account().then(() => {
                window.location.href = "/";
              });
            }
          }}
        >
          Close account
        </Button>
      </div>
    </div>
  );
}

function VerifyOtp({ setTfaEnabled }) {
  const { user } = useContext(AuthContext);
  const form = useForm({
    defaultValues: {
      otp: "",
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await verify_otp({
        username: user.userInfo.username,
        otp: form.getValues().otp,
      });
      await enable2fa();
      setTfaEnabled(true);
      toast.success("Two-factor authentication enabled successfully");
    } catch (error) {
      toast.error("Invalid OTP");
      //   console.error(error);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-muted">
        Scan this QR code and enter the OTP from your authenticator app
      </p>
      <Input {...form.register("otp")} placeholder="OTP" />
      <Button>Verify</Button>
    </form>
  );
}

function TwoFa() {
  const { user } = useContext(AuthContext);
  const [QR, setQR] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [tfaEnabled, setTfaEnabled] = useState(false);

  useEffect(() => {
    get2faQrCode().then((data) => setQR(data.otp_secret));
    is2faEnabled().then((data) => {
      //   console.log(data);
      setTfaEnabled(data.is_2fa);
    });
  }, []);

  return (
    <div className="flex flex-col gap-2 items-start justify-between bg-secondary rounded-3xl p-6 px-10 flex-1">
      <h1 className="text-accent text-xl font-bold text-shadow-neon">
        Two-factor authentication
      </h1>
      <div className="flex flex-col justify-between items-start w-full gap-4">
        {tfaEnabled ? (
          <>
            <p className="text-muted">
              Two-factor authentication is enabled on your account.
            </p>
            <div className="w-full flex justify-end gap-2">
              <Button
                className="shadow-xl shadow-[rgba(0,0,0,0.1)] justify-end"
                onClick={() => {
                  disable2fa().then(() => {
                    setTfaEnabled(false);
                    toast.success(
                      "Two-factor authentication disabled successfully"
                    );
                  });
                }}
              >
                Disable
              </Button>
            </div>
          </>
        ) : (
          <>
            {showQr ? (
              <div className="flex flex-col w-full items-center gap-6">
                <QRCode
                  size={175}
                  className="border-2 border-white"
                  value={
                    `otpauth://totp/ft_transcendence:${user.userInfo.email}?secret=${QR}&issuer=ft_transcendence` ||
                    ""
                  }
                />
                <VerifyOtp setTfaEnabled={setTfaEnabled} />
                <Button
                  className="shadow-xl shadow-[rgba(0,0,0,0.1)]"
                  onClick={() => setShowQr(false)}
                >
                  cancel
                </Button>
              </div>
            ) : (
              <>
                <p className="text-muted">
                  Two-factor authentication adds an extra layer of security to
                  your account.
                </p>
                <div className="w-full flex justify-end gap-2">
                  <Button
                    className="shadow-xl shadow-[rgba(0,0,0,0.1)]"
                    onClick={() => setShowQr(true)}
                  >
                    Show QR code
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PersonalInformation({}) {
  const { user, setUser } = useContext(AuthContext);

  const form = useForm({
    defaultValues: {
      firstName: user.userInfo.firstName,
      lastName: user.userInfo.lastName,
    },
  });

  const {
    formState: { errors },
    setError,
    clearErrors,
  } = form;

  const handleSubmit = (e) => {
    e.preventDefault();
    editName(form.getValues())
      .then((data) => {
        toast.success("Name updated successfully");
        setUser({
          ...user,
          userInfo: {
            ...user.userInfo,
            ...form.getValues(),
          },
        });
        clearErrors();
      })
      .catch((error) => {
        if (error.response?.data) {
          const { data } = error.response;

          // Example: Set errors for specific fields
          if (data.first_name) {
            setError("firstName", {
              type: "manual",
              message: data.first_name[0],
            });
          }
          if (data.last_name) {
            setError("lastName", {
              type: "manual",
              message: data.last_name[0],
            });
          }
        }
      });
  };

  return (
    <div className="flex flex-col gap-4 bg-secondary rounded-3xl p-6 px-10 flex-1">
      <h1 className="text-accent text-xl font-bold text-shadow-neon">
        Personal Information
      </h1>
      <div className="w-full flex gap-3">
        <AvatarUpload user={user} setUser={setUser} />
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="w-72 flex gap-2">
          <div className="w-full flex flex-col gap-2">
            <Input
              {...form.register("firstName")}
              placeholder="First Name"
              className="w-full"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs">{errors.firstName.message}</p>
            )}
            <Input
              {...form.register("lastName")}
              placeholder="Last Name"
              className="w-full"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        <div className="w-full flex justify-end gap-2">
          <Button className="shadow-xl shadow-[rgba(0,0,0,0.1)]">Save</Button>
        </div>
      </form>
    </div>
  );
}

function PasswordChange({ user }) {
  const form = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const [isOauth, setIsOauth] = useState(true);

  useEffect(() => {
    isOauthApi().then((data) => setIsOauth(data.is_oauth));
  }, []);

  const {
    formState: { errors },
    setError,
    clearErrors,
  } = form;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.getValues().newPassword !== form.getValues().confirmPassword) {
      setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match",
      });
      return;
    }
    clearErrors();

    editPassword(form.getValues())
      .then((data) => {
        toast.success("Password updated successfully");
      })
      .catch((error) => {
        // console.log(error.response.data);
        if (error.response?.data?.old_password) {
          setError("oldPassword", {
            type: "manual",
            message: error.response.data.old_password[0],
          });
        }
        if (error.response?.data?.new_password) {
          setError("newPassword", {
            type: "manual",
            message: error.response.data.new_password[0],
          });
        }
      });
  };
  if (isOauth) return <></>;

  return (
    <div className="flex flex-col gap-4 bg-secondary rounded-3xl p-6 px-10 flex-1">
      <h1 className="text-accent text-xl font-bold text-shadow-neon">
        Password
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 w-72">
          <Input
            {...form.register("oldPassword")}
            placeholder="Old Password"
            type="password"
          />
          {errors.oldPassword && (
            <p className="text-red-500 text-xs">{errors.oldPassword.message}</p>
          )}
          <Input
            {...form.register("newPassword")}
            placeholder="New Password"
            type="password"
          />
          {errors.newPassword && (
            <p className="text-red-500 text-xs">{errors.newPassword.message}</p>
          )}
          <Input
            {...form.register("confirmPassword")}
            //   className="w-1/2"
            placeholder="Confirm New Password"
            type="password"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <div className="w-full flex justify-end gap-2">
          <Button className="shadow-xl shadow-[rgba(0,0,0,0.1)]">Save</Button>
        </div>
      </form>
    </div>
  );
}

function AvatarUpload({ user, setUser }) {
  const [avatarUrl, setAvatarUrl] = useState(user.userInfo.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("avatar", file);
    setUploading(true);
    upload_avatar(formData)
      .then((data) => {
        toast.success("Avatar updated successfully");
        setUser({
          ...user,
          userInfo: {
            ...user.userInfo,
            avatarUrl: data.avatar_url,
          },
        });
        setAvatarUrl(data.avatar_url);
        setUploading(false);
        setError(null);
      })
      .catch((error) => {
        setError("Failed to upload avatar");
        setUploading(false);
      });
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-2">
      <Avatar className="w-24 h-24">
        <AvatarImage src={avatarUrl} alt="avatar" />
        <AvatarFallback>
          {uploading ? (
            <p>Uploading...</p>
          ) : (
            <label htmlFor="avatar" className="cursor-pointer text-accent">
              Upload Avatar
            </label>
          )}
        </AvatarFallback>
      </Avatar>
      <Input
        type="file"
        id="avatar"
        accept="image/*"
        onChange={handleUpload}
        className="w-52"
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

function EditNickname({ user, setUser }) {
  const form = useForm({
    defaultValues: {
      nickname: user.userInfo.nickname,
    },
  });

  const {
    formState: { errors },
    setError,
    clearErrors,
  } = form;

  useEffect(() => {
    get_nickname().then((data) => {
      form.setValue("nickname", data.nickname);
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    edit_nickname(form.getValues())
      .then((data) => {
        toast.success("Nickname updated successfully");
        setUser({
          ...user,
          userInfo: {
            ...user.userInfo,
            ...form.getValues(),
          },
        });
        clearErrors();
      })
      .catch((error) => {
        // console.error(error);
        toast.error(error);
      });
  };
  return (
    <div className="flex flex-col gap-4 bg-secondary rounded-3xl p-6 px-10 flex-1">
      <h1 className="text-accent text-xl font-bold text-shadow-neon">
        Nickname
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="w-72 flex flex-col gap-2">
          <Input
            {...form.register("nickname")}
            placeholder="Nickname"
            className="w-full"
          />
          {errors.nickname && (
            <p className="text-red-500 text-xs">{errors.nickname.message}</p>
          )}
        </div>
        <p className="text-stone-400 text-xs">
          This is the name that will be displayed to other users in tournaments.
        </p>
        <div className="w-full flex justify-end gap-2">
          <Button className="shadow-xl shadow-[rgba(0,0,0,0.1)]">Save</Button>
        </div>
      </form>
    </div>
  );
}
