"use client";
import { get_friends } from "@/services/user";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";

import { newConversation } from "@/app/store/feature/chat/chatSlice";
import { createNewConversation } from "@/app/store/feature/chat/chatSlice";
import { useRouter } from "next/navigation";
import { send_game_invite } from "@/services/user";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";

function FriendCard({ user }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const handleRedirect = () => {
    dispatch(newConversation());
    dispatch(createNewConversation({ value: user?.id }));
    router.push("/chat");
  };
  return (
    <div className="flex flex-col items-center gap-2 bg-secondary p-3 rounded-xl shadow-2xl border-stone-500 border">
      <div className="pt-10 flex items-end justify-center w-full bg-[url('/images/cover.jpg')] rounded bg-cover">
        <Avatar className="border-2 border-secondary ">
          <AvatarImage src={user?.avatar_url} alt="A" />
          <AvatarFallback>
            {user?.first_name[0] + user?.last_name[0]}
          </AvatarFallback>
        </Avatar>
      </div>
      <div
        className="flex flex-col justify-center items-center cursor-pointer px-6 pt-3 pb-3"
        onClick={() => router.push(`/profile/${user?.username}`)}
      >
        <h2 className="text-2xl">
          {user?.first_name} {user?.last_name}
        </h2>
        <p className=" text-gray-400">
          {"@"}
          {user?.username}
        </p>
      </div>
      <div className="flex gap-4 pb-3">
        <Button
          className="transition-all hover:brightness-150"
          onClick={() => handleRedirect()}
        >
          Message
        </Button>
        <Button
          className="transition-all hover:brightness-150"
          onClick={() => {
            send_game_invite({ friendUsername: user.username })
              .then(() => {
                // console.log("Game invite sent to", user.username);
                toast.success("Game invite sent to " + user.username);
              })
              .catch((err) => {
                // console.error("Game invite error =>", err);
                toast.error(err.toString());
              });
          }}
        >
          Challenge
        </Button>
      </div>
    </div>
  );
}

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    get_friends().then((res) => {
      //   console.log("friends =>", res);
      setFriends(res.friends);
    });
  }, []);
  return (
    <div className="flex flex-col gap-4 p-5 h-full w-full">
      <h1 className="text-white text-4xl font-bold text-shadow-neon">
        Friends
      </h1>
      <div className="flex items-center justify-center gap-2 w-full">
        <label className="text-white">Search:</label>
        <Input
          className="w-64"
          placeholder="Search"
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {friends.length === 0 && (
        <div className="flex flex-col gap-2 items-center justify-center text-stone-400 h-full w-full">
          <h1>{"You currently have no friends :("}</h1>
          <p className=" text-xs">
            You can add friends by searching for their username in the search
            bar above.
          </p>
        </div>
      )}
      {friends.length > 0 && (
        <ul className="flex flex-wrap items-center gap-4 overflow-x-auto -mx-2 px-2 py-4 text-white">
          {friends
            .filter((friend) => {
              if (filter === "") return true;
              return (
                friend.first_name
                  .toLowerCase()
                  .includes(filter.toLowerCase()) ||
                friend.last_name.toLowerCase().includes(filter.toLowerCase()) ||
                friend.username.toLowerCase().includes(filter.toLowerCase())
              );
            })
            .map((friend, _) => {
              return (
                <>
                  <li key={_}>
                    <FriendCard user={friend} />
                  </li>
                </>
              );
            })}
        </ul>
      )}
    </div>
  );
}
