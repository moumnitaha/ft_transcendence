"use client";

import Image from "next/image";
import logo from "../public/logo.png";
import {
  BsChatText,
  BsChatTextFill,
  BsPerson,
  BsPeople,
  BsPeopleFill,
  BsPersonFill,
} from "react-icons/bs";
import { TbLogout } from "react-icons/tb";
import {
  IoSettingsOutline,
  IoHomeOutline,
  IoGameControllerOutline,
  IoHomeSharp,
  IoGameController,
  IoSettings,
} from "react-icons/io5";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navigation = () => {
  const links = [
    { route: "/Home", icon: <IoHomeOutline />, iconActiavte: <IoHomeSharp /> },
    { route: "/chat", icon: <BsChatText />, iconActiavte: <BsChatTextFill /> },
    { route: "/friends", icon: <BsPeople />, iconActiavte: <BsPeopleFill /> },
    { route: "/profil", icon: <BsPerson />, iconActiavte: <BsPersonFill /> },
    {
      route: "/game",
      icon: <IoGameControllerOutline />,
      iconActiavte: <IoGameController />,
    },
    {
      route: "/settings",
      icon: <IoSettingsOutline />,
      iconActiavte: <IoSettings />,
    },
  ];
  const pathname = usePathname();
  return (
    <aside className="navigations py-2 ">
      <Link href="/" className="  img h-[60px] w-[60px]   ">
        <Image src={logo} alt="object-fill " className="logo" />
      </Link>
      <ul className="w-full  max-h-[500px]   grow flex items-center">
        {links.map((ele, index) => {
          const isActivate = pathname.startsWith(ele.route) ? "activate" : "";
          return (
            <li
              className=" w-full text-[#B7CEE3] text-xl font-bold hover:cursor-pointer"
              key={index}
            >
              {isActivate ? (
                <Link className="activate" key={index} href={ele.route}>
                  {ele.iconActiavte}{" "}
                </Link>
              ) : (
                <Link
                  className=" w-full text-[#B7CEE3] text-xl font-bold"
                  key={index}
                  href={ele.route}
                >
                  {ele.icon}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      <div>
        <Link href="/logout">
          <TbLogout className="text-[#B7CEE3]" />
        </Link>

        <span className="text-primary">logout</span>
      </div>
    </aside>
  );
};

export default Navigation;
