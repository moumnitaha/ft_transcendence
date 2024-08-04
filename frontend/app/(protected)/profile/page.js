"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AuthContext } from "@/lib/useAuth";
import {
  acceptFriendRequest,
  send_game_invite,
  addFriend,
  getUserInfo,
  is_friend,
  getIsOnline,
} from "@/services/user";
import React, { useContext, useEffect, useState } from "react";
import { HashLoader } from "react-spinners";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import moment from "moment";
import { useDispatch } from "react-redux";
import {
  newConversation,
  createNewConversation,
} from "@/app/store/feature/chat/chatSlice.js";
import propLoader from "../chat/_utils/LoaderIMg";
import { Label, Pie, PieChart, Text } from "recharts";
import PlayerDashboard from "./dashboard";

// "wins": player.wins,
// "losses": player.losses,
// "games": games,
export default function Profil({ params }) {
  const router = useRouter();
  const { user: currentUser } = useContext(AuthContext);
  const [user, setUser] = React.useState({
    userInfo: {
      username: "",
      firstName: "",
      lastName: "",
      avatarUrl: "",
      wins: 0,
      losses: 0,
      games: [],
    },
  });
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const username = params.slug;

    getUserInfo(username ? username : currentUser.userInfo.username)
      .then((res) => {
        if (!res) {
          router.push("/404");
          return;
        }
        // console.log("res=>", res);
        setUser({
          userInfo: {
            ...res,
          },
        });
        // console.log(user);
        setLoading(false);
      })
      .catch((err) => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <HashLoader color={"#fff"} size={250} />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap w-full h-full">
      <div className="flex items-start justify-center h-full w-full">
        <UserCard user={user} />
      </div>
      <div className=""></div>
    </div>
  );
}

/**
 * need to make a search bar component for searching for friends
 * need a dropdown for notifciations
 * need progress bars
 * need a user card component
 * need an achievements component
 */

/**
Games should be an object with number of games played and number of games won
 */

function calculateXP(wins, losses) {
  // Constants
  const xpPerWin = 100;
  const xpPerLoss = 30;
  const initialXPForLevel1 = 200;
  const initialIncrement = 100;
  const incrementStep = 50;

  let totalXP = wins * xpPerWin - losses * xpPerLoss;
  if (totalXP < 0) totalXP = 0;

  let currentLevel = 0;
  let xpForNextLevel = initialXPForLevel1;
  let cumulativeXP = 0;

  while (totalXP >= cumulativeXP + xpForNextLevel) {
    cumulativeXP += xpForNextLevel;
    currentLevel += 1;
    xpForNextLevel = initialIncrement + (currentLevel - 1) * incrementStep;
  }

  let fractionalLevel = (totalXP - cumulativeXP) / xpForNextLevel;
  let preciseLevel = currentLevel + fractionalLevel;

  let nextLevelXP = cumulativeXP + xpForNextLevel;
  let totalXPRequiredForNextLevel = nextLevelXP - totalXP;

  return {
    level: preciseLevel.toFixed(2),
    currentXP: totalXP,
    xpForNextLevel: totalXPRequiredForNextLevel + totalXP,
  };
}

export function UserCard({ user }) {
  const { user: currentUser, setUser } = useContext(AuthContext);
  const [isOnline, setIsOnline] = React.useState(false);
  const [isFriend, setIsFriend] = React.useState(false);
  const [reciever, setReciever] = useState(false);
  const [games, setGames] = React.useState({
    gamesWon: 0,
    gamesLost: 0,
    level: 0,
    xp: 0,
    nextXp: 0,
  });
  //   console.log(calculateXP(user?.userInfo?.wins, user?.userInfo?.losses));
  const router = useRouter();
  const { slug } = useParams();
  const dispatch = useDispatch();
  useEffect(() => {
    setGames({
      gamesWon: user?.userInfo?.wins,
      gamesLost: user?.userInfo?.losses,
      level: calculateXP(user?.userInfo?.wins, user?.userInfo?.losses).level,
      xp: calculateXP(user?.userInfo?.wins, user?.userInfo?.losses).currentXP,
      nextXp: calculateXP(user?.userInfo?.wins, user?.userInfo?.losses)
        .xpForNextLevel,
    });
    if (currentUser.userInfo.username !== user.userInfo.username) {
      is_friend({ friendUsername: user.userInfo.username })
        .then((res) => {
          //   console.log(res);
          setIsFriend(res.is_friend);
          setReciever(res.reciever);
        })
        .catch((err) => {
          //   console.log(err);
        });
    }
  }, []);

  useEffect(() => {
    if (currentUser?.notifications?.data?.type === "friend_request_accepted") {
      if (currentUser.notifications.data.accepted) setIsFriend("accepted");
      else setIsFriend("declined");
      const userWithRemovedNotif = { ...currentUser };
      delete userWithRemovedNotif.notifications;
      setUser(userWithRemovedNotif);
    }
  }, [currentUser]);

  const handleRedirect = () => {
    dispatch(newConversation());
    dispatch(createNewConversation({ value: user?.userInfo?.id }));
    router.push("/chat");
  };

  const data = [
    { name: "Wins", fill: "#e23670", value: user?.userInfo?.wins },
    { name: "Losses", fill: "#2662d9", value: user?.userInfo?.losses },
  ];

  useEffect(() => {
    getIsOnline(user.userInfo.username).then((res) => {
      setIsOnline(res.is_online);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 bg-secondary rounded-3xl p-6 w-[80%]">
      <div className="flex flex-col items-center gap-2 h-[30%]  ">
        <div className="pt-10 flex items-end justify-center w-full bg-[url('/images/cover.jpg')] rounded-lg bg-cover">
          <Avatar className="h-32 w-32 border-8 border-secondary -mb-2">
            <AvatarImage src={user.userInfo.avatarUrl} alt="A" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col justify-center items-center gap-2 text-accent">
          <span className="text-3xl text-shadow-neon">
            {user.userInfo.firstName + " " + user.userInfo.lastName}
          </span>
          <span className="text-xl font-styled text-shadow-neon">
            {"@"}
            {user.userInfo.username}
          </span>
          {currentUser.userInfo.username !== user.userInfo.username && (
            <>
              {isFriend === "accepted" ? (
                <div className="flex gap-4 items-center">
                  <Button
                    className="transition-all hover:brightness-150"
                    onClick={() => handleRedirect()}
                  >
                    Message
                  </Button>
                  <Button
                    className="transition-all hover:brightness-150"
                    onClick={() => {
                      send_game_invite({
                        friendUsername: user.userInfo.username,
                      })
                        .then(() => {
                          //   console.log("Game invite sent to",user.userInfo.username);
                          toast.success(
                            "Game invite sent to " + user.userInfo.username
                          );
                        })
                        .catch((err) => {
                          //   console.error("Game invite error =>", err);
                          // toast.error(err.toString());
                        });
                    }}
                  >
                    Challenge
                  </Button>
                  <div
                    title={isOnline ? "Online" : "Offline"}
                    className={`rounded-full h-4 w-4 cursor-pointer ${
                      isOnline ? "bg-green-500" : "bg-stone-600"
                    }`}
                  ></div>
                </div>
              ) : null}
              {isFriend !== "accepted" && (
                <Button
                  className="bg-accent text-secondary"
                  onClick={() => {
                    !reciever
                      ? addFriend({
                          friendUsername: user.userInfo.username,
                        }).then((res) => {
                          is_friend({
                            friendUsername: user.userInfo.username,
                          }).then((res) => {
                            // console.log("ADD FRIEND=>", res);
                            setIsFriend(res.is_friend);
                            setReciever(res.reciever);
                          });
                        })
                      : acceptFriendRequest({ friendUsername: slug }).then(
                          (res) => {
                            // console.log(res);
                            // console.log(slug);
                            setReciever(false);
                            setIsFriend("accepted");
                          }
                        );
                  }}
                  disabled={isFriend === "pending" && !reciever}
                >
                  {isFriend === "false" || isFriend === "declined"
                    ? "Add friend"
                    : reciever
                    ? "Accept friend request"
                    : "Friend request sent"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="h-[35%] flex items-center">
        <div className="shadow-xl h-20 w-full  rounded-3xl bg-secondary flex items-center gap-6 justify-between p-4 px-8 text-background">
          <div className="h-full flex flex-col items-center justify-start  min-w-32">
            Level <span className="font-bold">{games.level}</span>
          </div>
          <div className="h-full w-[70%] flex flex-col items-start justify-start  min-w-52">
            Progress to next level
            <Progress
              value={(games.level - Math.floor(games.level)) * 100}
              className="w-full min-h-2 bg-ring"
            />
          </div>
          <div className="h-full flex flex-col items-center justify-start min-w-32">
            XP{" "}
            <span className="font-bold">
              {games.xp} / {games.nextXp}
            </span>
          </div>
        </div>
      </div>
      <div className="h-[35%] flex justify-around items-center gap-4 text-white bg-zinc-800 rounded-md w-[100%] m-auto">
        <h1 className=" text-xl font-bold text-shadow-neon">Statistics</h1>
        <div className="flex flex-col items-center gap-2">
          <div className=" text-lg font-bold text-shadow-neon">
            Games Played
          </div>
          <div className=" text-lg">{games.gamesWon + games.gamesLost}</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className=" text-lg font-bold text-shadow-neon">Games Won</div>
          <div className=" text-lg">{games.gamesWon}</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className=" text-lg font-bold text-shadow-neon">Games Lost</div>
          <div className=" text-lg">{games.gamesLost}</div>
        </div>
        <PieChart width={200} height={200} className="absolute">
          <Pie
            data={data}
            dataKey={"value"}
            nameKey={"name"}
            innerRadius={40}
            outerRadius={60}
            strokeWidth={0}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-white text-xl"
                      >
                        {data[0].value > 0
                          ? Math.round(
                              (data[0].value /
                                (data[0].value + data[1].value)) *
                                100
                            )
                          : 0}
                        %
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </div>
      <div className="flex flex-row gap-1 w-full h-full justify-between">
        <PlayerDashboard
          data={user.userInfo.games}
          username={user.userInfo.username}
        />
        {user.userInfo.games.length > 0 ? (
          <div className="flex flex-col bg-zinc-800 w-[24%] min-h-full rounded-md items-center p-4 overflow-auto">
            <h1 className="font-bold text-2xl m-4 text-white text-shadow-neon">
              Recent Games:
            </h1>
            {user.userInfo.games.map((game, idx) => (
              <div
                key={idx}
                className="w-full flex flex-col m-2 p-2 bg-zinc-900 rounded-lg shadow-md transition-transform transform hover:scale-105 "
              >
                <div className="flex items-center w-full h-auto rounded-lg">
                  <div
                    className="flex-1 flex flex-col items-center   rounded-sm cursor-pointer m-1"
                    onClick={() => router.push(`/profile/${game.player1}`)}
                  >
                    <Image
                      src={game.avatar1}
                      alt="profile"
                      className="h-10 w-10 rounded-full"
                      width={40}
                      height={40}
                      loader={propLoader}
                    />
                    <span className="font-bold text-white">{game.player1}</span>
                  </div>
                  <div className="flex items-center  text-white">
                    <div
                      className={`flex justify-center items-center w-10 h-10 rounded-sm text-xl font-bold m-1 ${
                        game.winner === game.player1
                          ? "border-2 border-green-300"
                          : "border-2 border-red-300"
                      }`}
                    >
                      {game.score1}
                    </div>
                    <span className="text-xl font-bold">vs</span>
                    <div
                      className={`flex justify-center items-center w-10 h-10 rounded-sm text-xl font-bold m-1 ${
                        game.winner === game.player2
                          ? "border-2 border-green-300"
                          : "border-2 border-red-300"
                      }`}
                    >
                      {game.score2}
                    </div>
                  </div>
                  <div
                    className="flex-1 flex flex-col flex-col-reverse items-center  rounded-sm m-1 cursor-pointer"
                    onClick={() => router.push(`/profile/${game.player2}`)}
                  >
                    <span className="font-bold text-white">{game.player2}</span>
                    <Image
                      src={game.avatar2}
                      alt="profile"
                      className="h-10 w-10 rounded-full"
                      width={40}
                      height={40}
                      loader={propLoader}
                    />
                  </div>
                </div>
                <div className="text-styled m-auto text-white">
                  {moment(game.finished_at).fromNow()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className=" text-xl font-bold text-white flex flex-col items-center justify-center p-8 w-[24%] bg-zinc-800 rounded-md">
            No games played yet
          </div>
        )}
      </div>
    </div>
  );
}
