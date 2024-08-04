"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  newConversation,
  createNewConversation,
} from "@/app/store/feature/chat/chatSlice.js";
import { getLeaderboard, get_friends, send_game_invite } from "@/services/user";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import { TbChessKingFilled } from "react-icons/tb";

function getOrdinalSuffix(number) {
  const j = number % 10;
  const k = number % 100;
  if (j === 1 && k !== 11) {
    return number + "st";
  }
  if (j === 2 && k !== 12) {
    return number + "nd";
  }
  if (j === 3 && k !== 13) {
    return number + "rd";
  }
  return number + "th";
}

export default function Page() {
  const [friends, setFriends] = useState([]);
  const [Leaderboard, setLeaderboard] = useState([]);
  const [bestPlayer, setBestPlayer] = useState([]);
  useEffect(() => {
    get_friends().then((res) => {
      //   console.log("friends =>", res);
      setFriends(res.friends.filter((friend) => friend.is_online));
    });
  }, []);
  const { push } = useRouter();

  useEffect(() => {
    getLeaderboard()
      .then((res) => {
        setLeaderboard(res.players);
        return res.players.slice(0, 3);
      })
      .then((res) => {
        const [
          player1 = {
            avatar_url: `https://${window.location.hostname}/api/media/player.webp`,
            username: "Player 1",
          },
          player2 = {
            avatar_url: `https://${window.location.hostname}/api/media/player.webp`,
            username: "Player 2",
          },
          player3 = {
            avatar_url: `https://${window.location.hostname}/api/media/player.webp`,
            username: "Player 3",
          },
        ] = res;
        setBestPlayer([
          { ...player2, place: 2 },
          { ...player1, place: 1 },
          { ...player3, place: 3 },
        ]);
      });
  }, []);

  return (
    <div className="flex items-center h-full">
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
      <div className="flex w-full h-full p-4  gap-4">
        <div className="flex flex-col justify-center gap-4 w-full  text-background">
          <div className="flex items-end h-[70%] min-h-[70%] p-6  justify-between rounded-3xl bg-secondary ">
            <div className="h-full flex flex-col items-start justify-center gap-24 p-10">
              <div className="flex flex-col gap-5">
                <h1 className="text-5xl font-bold text-shadow-neon">
                  Ping Pong
                </h1>
                <h2 className="text-5xl font-bold text-shadow-neon">
                  Let The Fun Begin
                </h2>
              </div>
              <Button
                className="px-5 h-12 text-2xl font-bold transition-all bg-gradient-to-tr from-primary to-zinc-400 hover:brightness-150"
                onClick={() => push("/game")}
              >
                Play Now
              </Button>
            </div>
            <Image
              src="/images/homeKid.png"
              alt="game"
              className="object-cover w-2/4 h-[115%] rounded-3xl"
              width={700}
              height={700}
            />
          </div>
          <div className="flex h-[28%] min-h-[28%] flex-col  items-start gap-10 bg-secondary px-10 py-5 rounded-3xl ">
            <h1 className="font-bold text-accent text-shadow-neon text-3xl">
              Online friends
            </h1>
            {friends.length === 0 ? (
              <h1 className="text-xl font-bold text-stone-400">
                No friends online currently
              </h1>
            ) : (
              <ul className="flex gap-4 overflow-x-auto -mx-2 px-2 py-4">
                {friends?.map((user) => (
                  <li key={user.username}>
                    <FriendCard user={user} toast={toast} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="grow w-2/4 bg-secondary p-10 rounded-3xl flex flex-col gap-4 text-white h-[100%]">
          <h1 className="text-3xl font-bold text-accent text-shadow-neon">
            Leaderboard
          </h1>
          <div className="w-full h-[200px]  flex items-center justify-evenly  ">
            {bestPlayer?.map((item, index) => {
              const { username, avatar_url, place } = item;
              return (
                <div
                  key={index}
                  className={
                    index == 1
                      ? "flex  flex-col items-center gap-2 mb-10 relative"
                      : "flex  flex-col items-center gap-2 relative "
                  }
                >
                  <Avatar
                    className={
                      place == 1
                        ? "w-20 h-20 border-[3px] border-yellow-500"
                        : "w-20 h-20 border-[3px] border-[#CD7F32] "
                    }
                  >
                    <AvatarImage src={avatar_url} alt="A" />
                    <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="grid place-content-center w-[20px] h-[20px] text-xs rounded-full absolute top-2 -end-1 outline bg-blue-300 outline-white">
                    {place}
                  </span>
                  <span className="text-base capitalize font-normal">
                    {username}
                  </span>
                  {index === 1 && (
                    <span className="absolute -top-8">
                      <TbChessKingFilled className="w-20 h-10 text-yellow-500" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="">
                <th className="text-start px-6 py-3 text-base font-normal capitalize tracking-wider text-blue-500">
                  Place
                </th>
                <th className="text-start px-6 py-3 text-base font-normal capitalize tracking-wider text-blue-500">
                  Name
                </th>
                <th className="text-start px-6 py-3 text-base font-normal capitalize tracking-wider text-blue-500">
                  Matches
                </th>
                <th className="text-start px-6 py-3 text-base font-normal capitalize tracking-wider text-blue-500">
                  XP
                </th>
              </tr>
            </thead>
            <tbody className="h-1">
              {Leaderboard?.map((user, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getOrdinalSuffix(index + 1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap- shadow">
                      <Avatar className="w-8 h-8 me-2">
                        <AvatarImage src={user.avatar_url} alt="A" />
                        <AvatarFallback>
                          {user.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-normal">@{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {user.matches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {user.xp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function FriendCard({ user }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const handleRedirect = () => {
    dispatch(newConversation());
    dispatch(createNewConversation({ value: user?.id }));
    router.push("/chat");
  };
  return (
    <div className="flex flex-col items-center gap-2 bg-secondary p-4 rounded-3xl shadow-lg border">
      <Avatar>
        <AvatarImage src={user?.avatar_url} alt="A" />
        <AvatarFallback>
          {user?.first_name[0] + user?.last_name[0]}
        </AvatarFallback>
      </Avatar>
      <div
        className="flex flex-col justify-center items-center cursor-pointer"
        onClick={() => router.push(`/profile/${user?.username}`)}
      >
        <h2>
          {user?.first_name} {user?.last_name}
        </h2>
        <p>
          {"@"}
          {user?.username}
        </p>
      </div>
      <div className="flex gap-4">
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
