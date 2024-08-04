import { Input } from "@/components/ui/input";
import { useRef, useEffect, useState } from "react";
import Notifications from "@/app/(protected)/_components/Notifications";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useDebounce } from "@/lib/useDebounce";
import { getUsers } from "@/services/user";
import Link from "next/link";
import useOutsideAlerter from "@/lib/useOutsideAlerter";
import { Button } from "@/components/ui/button";
import { useContext } from "react";
import { AuthContext } from "@/lib/useAuth";
import { TbLogout, TbSettings, TbHome } from "react-icons/tb";

export default function StickyHeader({ user }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-20 shrink-0 w-full flex justify-between items-center pt-4 pb-1 bg-zinc-950 px-8">
      <div className="flex items-center gap-8">
        <div className="">
          <span className="text-accent">
            Welcome<br></br>
          </span>
          <span className="font-bold font-styled text-accent">
            {user.userInfo.firstName + " " + user.userInfo.lastName}
          </span>
        </div>
        <div>
          <SearchBar />
        </div>
      </div>
      <div className="flex items-center gap-8">
        <Notifications />
        <div className="relative">
          <button>
            <Avatar
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="cursor-pointer"
            >
              <AvatarImage src={user.userInfo.avatarUrl} alt="A" />
              <AvatarFallback>
                {user.userInfo.firstName[0] + user.userInfo.lastName[0]}
              </AvatarFallback>
            </Avatar>
          </button>
          {dropdownOpen && <UserDropdown setDropdownOpen={setDropdownOpen} />}
        </div>
      </div>
    </header>
  );
}

const UserDropdown = ({ setDropdownOpen }) => {
  const dropdownRef = useRef();
  const clickedOutside = useOutsideAlerter(dropdownRef);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (clickedOutside) {
      setDropdownOpen(false);
    }
  }, [clickedOutside]);

  return (
    <ul
      ref={dropdownRef}
      className="text-sm absolute top-11 right-2 bg-stone-800 text-white/80 rounded-sm shadow-md shadow-white/10 z-50 overflow-hidden px-3 py-2 flex flex-col gap-2"
    >
      <li className="p-2 hover:bg-white/10 rounded-xl cursor-pointer">
        <Link href="/profile" className="flex items-center gap-2">
          <Avatar className="h-[20px] w-[20px]">
            <AvatarImage src={user.userInfo.avatarUrl} alt="A" />
            <AvatarFallback>
              {user.userInfo.firstName[0] + user.userInfo.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <p className="grow text-center">{user.userInfo.username}</p>
        </Link>
      </li>
      <li className="w-full flex items-center justify-center">
        <div className="my-1 h-0.5 w-[85%] bg-white/60"></div>
      </li>
      <li className="p-2 hover:bg-white/10 rounded-xl cursor-pointer">
        <Link
          href="/settings"
          className="flex items-center justify-between gap-10"
        >
          <div className="flex items-center gap-2">
            <TbSettings size={17} className="stroke-accent" />
            <p className="grow text-center">Settings</p>
          </div>
          <p>{">"}</p>
        </Link>
      </li>
      <li className="p-2 hover:bg-white/10 rounded-xl cursor-pointer">
        <Link
          href="/logout"
          className="flex items-center justify-between gap-10"
        >
          <div className="flex items-center gap-2">
            <TbLogout size={17} className="stroke-accent" />
            <p className="grow text-center">Logout</p>
          </div>
          <p>{">"}</p>
        </Link>
      </li>
    </ul>
  );
};
{
  /* <TbLogout
icon: <TbSettings size={iconSize} className="stroke-accent" />,
icon: <BsFillPersonFill size={iconSize} className="fill-accent" />, */
}

function SearchBar() {
  const [searchText, setSearchText] = useState("");
  const query = useDebounce(searchText, 500);
  const [inputFocused, setInputFocused] = useState(false);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (query) {
      getUsers({ query: query }).then((res) => {
        setOptions(res.users);
        // console.log(options);
      });
    }
  }, [query, inputFocused]);

  useEffect(() => {
    if (!searchText) {
      setOptions([]);
    }
  }, [searchText]);

  return (
    <>
      <Input
        className="border-none bg-white w-96 shadow-md shadow-secondary relative"
        placeholder="Search for other users"
        value={searchText}
        onFocus={() => setInputFocused(!inputFocused)}
        onChange={(e) => setSearchText(e.target.value)}
      />
      {options.length !== 0 && (
        <SearchBarDropdown options={options} setOptions={setOptions} />
      )}
    </>
  );
}

const SearchBarDropdown = ({ options, setOptions }) => {
  const dropdownRef = useRef();
  const clickedOutside = useOutsideAlerter(dropdownRef);

  useEffect(() => {
    if (clickedOutside) {
      setOptions([]);
    }
    // console.log(clickedOutside);
  }, [clickedOutside]);

  return (
    <ul
      ref={dropdownRef}
      className="absolute bg-white w-52 shadow-md shadow-secondary rounded-md mt-1 z-10 overflow-hidden"
    >
      {options.map((option, index) => (
        <li key={index} className="p-2 hover:bg-gray-100 cursor-pointer">
          <Link
            href={`/profile/${option.username}`}
            onClick={() => setOptions([])}
          >
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={option.avatarUrl} alt="A" />
                <AvatarFallback>
                  {option.firstName[0] + option.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <p className="grow text-center">{option.username}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
};
