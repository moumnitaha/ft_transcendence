"use client";
import Image from "next/image";
import { BsChatText, BsFillPersonFill, BsFillPeopleFill } from "react-icons/bs";
import { TbLogout, TbSettings, TbHome } from "react-icons/tb";
import { GrGamepad } from "react-icons/gr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/lib/useAuth";
import { useContext } from "react";

export default function Sidenavbar() {
  const { user, logout } = useContext(AuthContext);
  const pathname = usePathname();
  const iconSize = 26;

  const links = [
    {
      route: "/",
      icon: <TbHome size={iconSize} className="stroke-accent" />,
      name: "Home",
    },
    {
      route: "/chat",
      icon: <BsChatText size={iconSize} className="fill-accent" />,
      name: "Chat",
    },
    {
      route: "/profile",
      icon: <BsFillPersonFill size={iconSize} className="fill-accent" />,
      name: "Profile",
    },
    {
      route: "/friends",
      icon: <BsFillPeopleFill size={iconSize} className="fill-accent" />,
      name: "Friends",
    },
    {
      route: "/game",
      icon: <GrGamepad size={iconSize} className="stroke-accent" />,
      name: "Game",
    },
    {
      route: "/settings",
      icon: <TbSettings size={iconSize} className="stroke-accent" />,
      name: "Settings",
    },
  ];
  return (
    <aside className="h-screen bg-zinc-950 min-w-20 flex flex-col justify-between items-center py-6">
      <div className="flex flex-col justify-start items-center">
        <Link href="/" className="border-b-2 border-primary pb-6">
          <Image
            src="/icons/logo.png"
            alt="logo"
            width={40}
            height={40}
            unoptimized
          />
        </Link>
        <ul className="flex flex-col gap-12 pt-8">
          {links.map((link, index) => (
            <li key={index} className="flex flex-col items-center gap-2 h-12">
              <Link
                href={link.route}
                className={`${
                  pathname === link.route ||
                  (pathname.startsWith(link.route) && link.route !== "/")
                    ? "brightness-150"
                    : "brightness-[65%]"
                }`}
              >
                {link.icon}
              </Link>
              {pathname === link.route ||
              (pathname.startsWith(link.route) && link.route !== "/") ? (
                <div className="bg-accent h-1 w-full"></div>
              ) : (
                <></>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col items-center">
        <button>
          <TbLogout
            size={iconSize}
            className="text-white"
            onClick={() => logout()}
          />
        </button>
        {/* <h2 className="text-primary font-bold text-shadow-neon">Log Out</h2> */}
      </div>
    </aside>
  );
}
