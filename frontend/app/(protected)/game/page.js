"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { HashLoader } from "react-spinners";
import { AuthContext } from "@/lib/useAuth";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUserInfo, liveGames } from "@/services/user";
import moment from "moment";
import propLoader from "../chat/_utils/LoaderIMg";
import vs from "./assets/vs.png";
import PulseLoader from "react-spinners/PulseLoader";
import Modal from "./modal";

export default function Match() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [opponent, setOpponent] = useState("");
  const [joined, setJoined] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const [inQueue, setInQueue] = useState([]);
  const [inTrnmnt, setInTrnmnt] = useState([]);
  const [avatar1, setAvatar1] = useState("");
  const [avatar2, setAvatar2] = useState("");
  const [bg, setBg] = useState(0);
  const [creatTrnmt, setCreateTrnmt] = useState(true);
  const [online, setOnline] = useState([]);
  const [userr, setUser] = React.useState({
    username: "",
    nickname: "",
    firstName: "",
    lastName: "",
    avatarUrl: "",
    wins: 0,
    losses: 0,
    games: [],
  });
  const ws = useRef(null);
  const { push } = useRouter();
  if (user.userInfo && !name && !avatar1) {
    setName(user.userInfo.username);
    setAvatar1(user.userInfo.avatarUrl);
  }
  useEffect(() => {
    ws.current = new WebSocket(
      `wss://${window.location.hostname}:443/api/match/42`
    );
    ws.current.onopen = () => {
      //   toast.success("Connected to server");
    };
    return () => {
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const username = null;

    getUserInfo(username ? username : user.userInfo.username)
      .then((res) => {
        if (!res) {
          router.push("/404");
          return;
        }
        setUser({
          ...res,
        });
        setLoading(false);
      })
      .catch((err) => {});
    // let interval = setInterval(() => {
    //   liveGames().then((res) => {
    //     if (res) {
    //       setLiveGames(res);
    //     }
    //   });
    // }, 2000);
    // return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    ws.current.onclose = () => {
      setJoined(false);
    };
    ws.current.onmessage = (e) => {
      let data = JSON.parse(e.data);
      if (data.type === "in_queue") {
        setInQueue(data.queue);
      }
      if (data.type === "online_players") {
        setOnline(data.queue);
      }
      if (data.type === "in_tournament") {
        setJoined(true);
        setInRoom(true);
      }
      if (data.type === "left_tournament") {
        setJoined(false);
        setInRoom(false);
      }
      if (data.type === "tournament_queue") {
        setInTrnmnt(data.queue);
        if (data.queue.length > 0) {
          setCreateTrnmt(false);
        } else {
          setCreateTrnmt(true);
        }
      }
      if (data.type === "live_tournaments") {
      }
      //   if (data.type === "no_live_tournaments") {
      //     setCreateTrnmt(true);
      //   }
      if (data.type === "already_in_tournament") {
        setJoined(true);
        setInRoom(true);
      }
      if (data.type === "start_tournament") {
        setAvatar2(name === data.player1 ? data.avatar2 : data.avatar1);
        setTimeout(() => {
          setOpponent(name === data.player1 ? data.player2 : data.player1);
        }, 1000);
        setTimeout(() => {
          push(`/game/${data.room_name}`);
          // ws.current.close();
        }, 4000);
      } else if (data.type === "start_game") {
        if (![data.player1, data.player2].includes(name)) {
          return;
        }
        toast.success("Game starting in 3 seconds...");
        setTimeout(() => {
          setOpponent(name === data.player1 ? data.player2 : data.player1);
          setAvatar2(name === data.player1 ? data.avatar2 : data.avatar1);
        }, 500);
        setTimeout(() => {
          push(`/game/${data.room_name}`);
          //   ws.current.close();
        }, 3500);
      } else if (data.type === "already_in_game") {
        toast.error(`already_in_game`);
        setJoined(true);
        setBg(data.bg);
        // setInRoom(true);
        if (data.room_name) {
          push(`/game/${data.room_name}`);
        }
      } else if (data.type === "joined_queue") {
        toast.success("Joined Queue");
        setJoined(true);
      } else if (data.type === "already_in_queue") {
        toast.success("Already in Queue");
        setJoined(false);
      }
    };
    return () => {
      //   if (!joined) ws.current.close();
    };
  }, [joined]);
  return (
    <main className="w-full h-full bg-zinc-900 p-5 flex justify-center items-center">
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
      <div className="flex flex-col bg-zinc-950 w-[5%] h-full m-auto rounded-md items-center p-4 overflow-auto">
        <h1 className="font-bold text-2xl m-4 text-white text-shadow-neon text-center">
          Online Players
        </h1>
        {online?.map((i, idx) => (
          <div className="group" key={idx}>
            <Image
              onClick={() => {
                router.push(`/profile/${i.username}`);
              }}
              src={i.avatar}
              alt={i.username}
              className="w-[90%] border-green-500 border-4 rounded-full m-2 transition-transform transform hover:scale-110 cursor-pointer aspect-square hover:shadow-lg"
              width={40}
              height={40}
              loader={propLoader}
            />
            <div className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span>{i.username}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col bg-zinc-950 w-[73%] h-[100%] m-auto rounded-md relative justify-center">
        <div className="w-full h-auto flex flex-row justify-between items-center p-5">
          <h1 className="text-white text-4xl font-bold my-10 mx-24 text-shadow-neon">
            1 - Choose Your Space
          </h1>
          <p className="flex flex-row items-center">
            How to play: {"    "} <Modal />
          </p>
        </div>
        <div className="flex flex-col w-[90%] backdrop-blur-sm bg-transparent justify-around m-auto overflow-x-auto">
          {joined ? (
            <div className="flex flex-row w-[100%] h-[100%] backdrop-blur-sm bg-black bg-opacity-50 z-20 justify-around m-auto p-5 absolute items-center">
              <div className="flex justify-center items-center relative h-[98%] aspect-square rounded-xl overflow-hidden bg-slate-950 before:absolute before:top-[-50%] before:right-[-50%] before:bottom-[-50%] before:left-[-50%] before:bg-[conic-gradient(transparent,transparent,#00a6ff)] before:animate-spin-slow">
                <div className="before:absolute before:top-[-50%] before:right-[-50%] before:bottom-[-50%] before:left-[-50%] before:bg-[conic-gradient(transparent,transparent,#e74c3c)] before:animate-spin-slow aspect-square h-[95%] rounded-xl rotate-180"></div>
                <div className="flex flex-col justify-arround items-center bg-zinc-900 w-[98%] aspect-square rounded-xl text-white absolute">
                  <Image
                    src={avatar1}
                    alt="profile"
                    className="aspect-square w-[75%] rounded-full m-2 border-2 border-zinc-600"
                    width={120}
                    height={120}
                    loader={propLoader}
                    // priority={true}
                  />
                  <div className="text-xl font-bold m-auto">{"@" + name}</div>
                </div>
              </div>
              <Image src={vs} width={200} height={200} loader={propLoader} />
              <div className="flex justify-center items-center relative h-[98%] aspect-square rounded-xl overflow-hidden bg-slate-950 before:absolute before:top-[-50%] before:right-[-50%] before:bottom-[-50%] before:left-[-50%] before:bg-[conic-gradient(transparent,transparent,#00a6ff)] before:animate-spin-slow">
                <div className="before:absolute before:top-[-50%] before:right-[-50%] before:bottom-[-50%] before:left-[-50%] before:bg-[conic-gradient(transparent,transparent,#e74c3c)] before:animate-spin-slow aspect-square h-[95%] rounded-xl rotate-180"></div>
                <div className="flex flex-col justify-arround items-center bg-zinc-900 w-[98%] aspect-square rounded-xl text-white absolute">
                  {opponent ? (
                    <Image
                      src={avatar2}
                      alt="profile"
                      className="aspect-square w-[75%] rounded-full m-2 border-2 border-zinc-600"
                      width={120}
                      height={120}
                      loader={propLoader}
                      // priority={true}
                    />
                  ) : (
                    <HashLoader
                      color={"#f1f2f3"}
                      loading={true}
                      size={150}
                      className="m-auto"
                    />
                  )}
                  {opponent ? (
                    <div className="text-xl font-bold m-auto">
                      {"@" + opponent}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex flex-row w-full justify-between bg-zinc-900 p-5 rounded-sm">
            {[
              { id: 1, name: "Nebulon Prime" },
              {
                id: 2,
                name: "Astralithia",
              },
              { id: 3, name: "Vortexia" },
            ].map((i) => (
              <div
                className="group w-[31%] aspect-video rounded-small m-5 bg-gray-600 relative"
                key={i.id}
              >
                {bg !== i.id ? (
                  <div className="absolute top-0 left-0 w-full h-full backdrop-blur-sm bg-black bg-opacity-25 z-10 rounded-small transition-all duration-300 flex justify-center items-center text-white text-2xl font-bold group-hover:bg-opacity-0 group-hover:backdrop-blur-none group-hover:h-0 cursor-pointer group-hover:z-[-1] group-hover:opacity-0 text-shadow-neon">
                    {i.name}
                  </div>
                ) : null}
                <Image
                  src={`https://${window.location.hostname}/api/media/game/s${i.id}.jpg`}
                  alt="profile"
                  className={`w-[100%] aspect-video rounded-small cursor-pointer ${
                    bg === i.id ? "border-4 border-white" : ""
                  }`}
                  width={200}
                  height={200}
                  loader={propLoader}
                  onClick={() => {
                    if (!joined) {
                      setBg(i.id === bg ? 0 : i.id);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <h1 className="text-white text-4xl font-bold my-10 mx-24 text-shadow-neon">
          2 - Choose Your Game Mode
        </h1>
        <div className="flex flex-row justify-center items-center w-[90%] m-auto p-5 rounded-sm">
          <div className="w-[40%] flex flex-col items-center m-auto bg-zinc-900 p-14 rounded-md">
            <button
              disabled={joined || !name}
              className={`text-white button w-[100%] h-16 ${
                !joined && bg
                  ? "bg-blue-500 border-blue-400 active:[box-shadow:0_0px_0_0_#1b6ff8,0_0px_0_0_#1b70f841] [box-shadow:0_10px_0_0_#1b6ff8,0_15px_0_0_#1b70f841]"
                  : "bg-zinc-800 border-zinc-400 active:[box-shadow:0_0px_0_0_#484848,0_0px_0_0_#48484841] [box-shadow:0_10px_0_0_#484848,0_15px_0_0_#48484841]"
              } active:translate-y-2  active:border-b-[0px] cursor-pointer select-none transition-all duration-150 
			rounded-full  border-[1px] mx-auto font-bold text-lg my-4 text-shadow-neon`}
              onClick={() => {
                if (!bg) {
                  toast.error("Please select your game space first!");
                  return;
                }
                if (ws.current.readyState === WebSocket.OPEN) {
                  setJoined(true);
                  ws.current.send(
                    JSON.stringify({
                      type: "enter_queue",
                      player: name,
                      bg: bg,
                    })
                  );
                } else {
                  toast.error("Websocket not connected");
                  //   window.location.reload();
                }
              }}
            >
              1 vs 1 Game
            </button>
            <div className="text-white text-xl font-bold flex flex-row items-center w-[100%]">
              {"Waiting: "}
              <div className="bg-zinc-600 m-2 p-1 rounded-full flex flex-row min-w-10 min-h-10 items-center">
                {inQueue.length ? (
                  inQueue?.map((i, idx) => (
                    <Image
                      key={idx}
                      src={i}
                      alt="profile"
                      className={`border-white border-2 aspect-square w-10 h-10 rounded-full mx-1 bg-zinc-600 ${
                        idx > 0 ? "-ml-[10px]" : ""
                      }`}
                      width={40}
                      height={40}
                      loader={propLoader}
                    />
                  ))
                ) : (
                  <PulseLoader color={"#f1f2f3"} loading={true} size={10} />
                )}
              </div>
            </div>
          </div>
          <div className="w-[40%] flex flex-col items-center m-auto bg-zinc-900 p-14 rounded-md">
            {inRoom ? (
              <button
                className="text-white button w-[100%] h-16 bg-red-500  cursor-pointer select-none
			active:translate-y-2  active:[box-shadow:0_0px_0_0_#f81b1b,0_0px_0_0_#f81b1b41]
			active:border-b-[0px]
			transition-all duration-150 [box-shadow:0_10px_0_0_#f81b1b,0_15px_0_0_#f81b1b41]
			rounded-full  border-[1px] border-red-400 mx-auto font-bold text-lg my-4"
                onClick={() => {
                  if (ws.current.readyState === WebSocket.OPEN) {
                    setTimeout(() => {
                      setJoined(false);
                      setInRoom(false);
                      setOpponent("");
                      setAvatar2("");
                    }, 300);
                    ws.current.send(
                      JSON.stringify({
                        type: "leave_touranament_queue",
                        player: name,
                      })
                    );
                  }
                }}
              >
                Leave Tournament Queue
              </button>
            ) : (
              <button
                disabled={joined || !name}
                className={`text-white button w-[100%] h-16 ${
                  !joined && bg
                    ? "bg-blue-500 border-blue-400 active:[box-shadow:0_0px_0_0_#1b6ff8,0_0px_0_0_#1b70f841] [box-shadow:0_10px_0_0_#1b6ff8,0_15px_0_0_#1b70f841]"
                    : "bg-zinc-800 border-zinc-400 active:[box-shadow:0_0px_0_0_#484848,0_0px_0_0_#48484841] [box-shadow:0_10px_0_0_#484848,0_15px_0_0_#48484841]"
                } active:translate-y-2  active:border-b-[0px] cursor-pointer select-none transition-all duration-150 
				rounded-full  border-[1px] mx-auto font-bold text-lg my-4 text-shadow-neon`}
                onClick={() => {
                  if (ws.current.readyState === WebSocket.OPEN) {
                    if (!bg) {
                      toast.error("Please select your game space first!");
                      return;
                    }
                    if (!userr.nickname) {
                      toast.error("Please enter a nickname from the settings");
                      return;
                    }
                    if (creatTrnmt) {
                      toast.success("Tournaemnt Created Successfully");
                    }
                    setJoined(true);
                    ws.current.send(
                      JSON.stringify({
                        type: "enter_tournament",
                        bg: bg,
                        player: name,
                      })
                    );
                  } else {
                    toast.error("Websocket not connected");
                    //   window.location.reload();
                  }
                }}
              >
                {creatTrnmt ? "Launch a Tournament" : "Join the Tournament"}
              </button>
            )}
            <div className="text-white text-xl font-bold flex flex-row items-center w-[100%]">
              {"Waiting: "}
              <div className="bg-zinc-600 m-2 p-1 rounded-full flex flex-row min-w-10 min-h-10 items-center">
                {inTrnmnt.length ? (
                  inTrnmnt?.map((i, idx) => (
                    <Image
                      key={idx}
                      src={i}
                      alt="profile"
                      className={`border-white border-2 aspect-square w-10 h-10 rounded-full mx-1 bg-zinc-600 ${
                        idx > 0 ? "-ml-[10px]" : ""
                      }`}
                      width={40}
                      height={40}
                      loader={propLoader}
                    />
                  ))
                ) : (
                  <PulseLoader color={"#f1f2f3"} loading={true} size={10} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-zinc-950 w-[20%] h-full m-auto rounded-md items-center p-4 overflow-auto">
        <h1 className="font-bold text-2xl m-4 text-white text-shadow-neon">
          Recent Games
        </h1>
        {userr.games.map((game, idx) => (
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
    </main>
  );
}
