"use client";
import Image from "next/image";
import * as THREE from "three";
import React, { useEffect, useRef, useState, useContext, memo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BsCameraFill, BsCameraReelsFill, BsCameraVideo } from "react-icons/bs";
import { LuRotate3D, LuRotateCcw, LuRotateCw } from "react-icons/lu";
import { AuthContext } from "@/lib/useAuth";
import { Canvas } from "@react-three/fiber";
import Scene from "../components/Scene";
import propLoader from "../../chat/_utils/LoaderIMg";
import defaultA from "../assets/default.webp";

export default function Game() {
  const divRef = useRef(null);
  const ballRef = useRef(null);
  const lpaddleRef = useRef(null);
  const rpaddleRef = useRef(null);
  const [intrnmt, setIntrnmt] = useState(false);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [player, setPlayer] = useState(0);
  const [winner, setWinner] = useState(0);
  const [opponent, setOpponent] = useState("");
  const [camPos, setCamPos] = useState("front");
  const [started, setStarted] = useState(false);
  const [msg, setMsg] = useState("Loading...");
  const [toFinal, setToFinal] = useState(false);
  const [avatar1, setAvatar1] = useState("");
  const [avatar2, setAvatar2] = useState("");
  const [finished, setFinished] = useState(false);
  const [winnerAvatar, setWinnerAvatar] = useState("");
  const [nick1, setNick1] = useState("");
  const [nick2, setNick2] = useState("");
  const [bg1, setBg1] = useState("");
  const [bg2, setBg2] = useState("");
  const { push } = useRouter();
  const { room } = useParams();
  const { user } = useContext(AuthContext);
  THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0, 0, 1);
  let p = useRef(1);
  let ws = useRef(null);
  useEffect(() => {
    if (user.userInfo) {
      setAvatar1(user.userInfo.avatarUrl);
    }
    let animation = null;
    const animate = () => {
      animation = requestAnimationFrame(animate);
    };
    animate();
    ws.current = new WebSocket(
      `wss://${window?.location.hostname}:443/api/pong/${room}`
    );
    ws.current.onopen = () => {
      //   toast.success(">> CONNECTION OPENED <<");
      ws.current.send(JSON.stringify({ type: "setup_game" }));
    };
    ws.current.onerror = (event) => {};
    ws.current.onclose = (event) => {
      //   toast.error("Connection closed");
    };
    ws.current.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "error") {
        console.error("ERROR=>", data.message);
        toast.error(data.message, {
          onClose: () => push("/game"),
        });
      }
      if (data.type === "waiting") {
        setMsg(data.message);
      }
      if (data.type === "setup_game") {
        setBg1(data.bg1);
        setBg2(data.bg2);
      }
      if (data.type === "connect") {
        if (data.in_trnmt) {
          setIntrnmt(true);
          setNick1(data.player1_nick);
          setNick2(data.player2_nick);
        }
        if (data.message?.status === "finished") {
          //   toast.error("Game Already Finished");
          //   user.userInfo.username = data.message.player1;
          //   setOpponent(data.message.player2);
          //   setScore1(data.message.score1);
          //   setScore2(data.message.score2);
          setFinished(true);
          setWinnerAvatar(data.message.winner_avatar);
          setAvatar1(data.message.avatar1);
          setAvatar2(data.message.avatar2);
          setBg1(data.message.bg1);
          setBg2(data.message.bg2);
          setPlayer(data.message.player1);
          setOpponent(data.message.player2);
          //   setPlayer(1);
          //   setOpponent(data.message.player2);
          setMsg(`Game Already Finished, Winner: @${data.message.winner}`);
          ws.current.close();
        }
        if (data.message === "missing_player") {
          alert("missing_player");
          ws.current.close();
          push("/game");
        }
        if (data.message === 1 || data.message === 2) {
          setPlayer((prev) => prev + data.message);
          p.current = data.message === 1 ? -1 : 1;
          setCamPos("front");
          setOpponent(
            user.userInfo.username === data.player1
              ? data.player2
              : data.player1
          );
          setAvatar1(data.avatar1);
          setAvatar2(data.avatar2);
        }
        if (data.message === "room_full") {
          toast.error("Room is full", {
            onClose: () => push("/game"),
          });
          ws.current.close();
        }
        if (data.message === "room_not_found") {
          push("/404");
          toast.error("Game not found", {
            onClose: () => push("/game"),
          });
          ws.current.close();
        }
      }
      if (data.type === "game_over") {
        setWinner(data.winner);
        setStarted(false);
      }
      if (data.type === "final_game") {
        if ([data.player1, data.player2].includes(user.userInfo.username)) {
          setStarted(false);
          setMsg("To the final Game !!!");
          setToFinal(true);
          ws.current.close();
          setTimeout(() => {
            push(`/game/${data.room_name}`), 2000;
          });
        }
      }
      if (data.type === "start_game") {
      }
      if (data.type === "stop_game") {
        setWinner(data.winner);
        setStarted(false);
        toast.info(data.win_msg);
      }
      if (data.type === "move_ball") {
        setStarted(true);
        ballRef?.current?.position?.set(
          data.x / 4,
          -(data.y / 4),
          data.z / 4 + 5 + 3 + 5
        );
      }
      if (data.type === "move_paddle") {
        if (data.player === 1) {
          if (data.direction === "up") {
            if (lpaddleRef.current)
              lpaddleRef.current.position.y = -(data.position / 4);
          }
          if (data.direction === "down") {
            if (lpaddleRef.current)
              lpaddleRef.current.position.y = -(data.position / 4);
          }
        }
        if (data.player === 2) {
          if (data.direction === "up") {
            if (rpaddleRef.current)
              rpaddleRef.current.position.y = -(data.position / 4);
          }
          if (data.direction === "down") {
            if (rpaddleRef.current)
              rpaddleRef.current.position.y = -(data.position / 4);
          }
        }
      }
      if (data.type === "stop_paddle") {
      }
      if (data.type === "goal") {
        setScore1(data.r_score);
        setScore2(data.l_score);
      }
    });
    const refSize = () => {
      Canvas.width = divRef.current.clientWidth;
      Canvas.height = divRef.current.clientHeight;
    };
    window?.addEventListener("resize", refSize);
    return () => {
      window?.removeEventListener("resize", refSize);
      cancelAnimationFrame(animation);
      ws.current.close();
    };
  }, [room, push, user.userInfo]);

  useEffect(() => {
    if (!player || !ws?.current?.readyState || !started) return;
    let keyDown = false;
    const handleMove = (event, type) => {
      if (keyDown && type === "move_paddle") return;
      if (event.key === "ArrowUp" || event.key === "ArrowRight") {
        ws.current.send(
          JSON.stringify({
            type: type,
            direction: player === 1 && camPos === "front" ? "down" : "up",
            player: player,
          })
        );
      }
      if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
        ws.current.send(
          JSON.stringify({
            type: type,
            direction: player === 1 && camPos === "front" ? "up" : "down",
            player: player,
          })
        );
      }
      keyDown = type === "move_paddle";
    };
    const keydownHandler = (event) => handleMove(event, "move_paddle");
    const keyupHandler = (event) => handleMove(event, "stop_paddle");
    document.addEventListener("keydown", keydownHandler);
    document.addEventListener("keyup", keyupHandler);
    return () => {
      document.removeEventListener("keydown", keydownHandler);
      document.removeEventListener("keyup", keyupHandler);
    };
  }, [player, camPos, started]);

  return (
    <div className="flex justify-center items-center relative w-full h-fit p-1 m-auto max-w-[75%] rounded-xl overflow-hidden bg-zinc-950 before:absolute before:top-[-50%] before:right-[-50%] before:bottom-[-50%] before:left-[-50%] before:bg-[conic-gradient(transparent,transparent,#00a6ff)] before:animate-spin-slow">
      <main
        id="main"
        className="w-full h-fit bg-slate-950 border border-slate-500 p-4 rounded-sm m-auto relative"
      >
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
        {!finished ? (
          <div className="h-20 m-3 flex justify-between">
            <div className="flex flex-row w-[40%] justify-center rounded-lg">
              <div className="border-blue-300 text-white justify-center items-center flex rounded-full mx-5 w-[50%] font-sans text-base md:text-lg lg:text-xl border-2 bg-slate-900">
                {player
                  ? player === 1
                    ? intrnmt
                      ? "@" + nick1
                      : "@" + user?.userInfo?.username
                    : intrnmt
                    ? "@" + nick2
                    : "@" + opponent
                  : null}
              </div>
              <Image
                src={avatar1}
                alt="profile"
                className="h-20 w-20 rounded-full border-2 border-slate-300"
                width={120}
                height={120}
                loader={propLoader}
                //   priority={true}
              />
            </div>
            <div className="flex flex-row bg-transparent w-[20%] justify-center rounded-lg">
              <div className="font-bold justify-center items-center flex rounded-lg w-full font-sans text-5xl text-white">
                VS
              </div>
            </div>
            <div className="flex flex-row w-[40%] justify-center rounded-lg">
              <Image
                src={avatar2}
                alt="profile"
                className="h-20 w-20 rounded-full border-2 border-slate-300"
                width={120}
                height={120}
                loader={propLoader}
                //   priority={true}
              />
              <div className="border-red-300 text-white justify-center items-center flex rounded-full mx-5 w-[50%] font-sans text-base md:text-lg lg:text-xl border-2 bg-slate-900">
                {player
                  ? player === 1
                    ? intrnmt
                      ? "@" + nick2
                      : "@" + opponent
                    : intrnmt
                    ? "@" + nick1
                    : "@" + user?.userInfo?.username
                  : null}
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex flex-row">
          <div
            className={`relative m-auto flex justify-center items-center w-[95%] aspect-video`}
            ref={divRef}
          >
            {!started ? (
              <div
                className={`absolute w-[100%] h-[100%] bg-black bg-opacity-50 z-10 flex justify-center items-center`}
              >
                {winner && !toFinal ? (
                  <div
                    className={`${
                      winner === player ? "bg-green-400" : "bg-red-400"
                    } rounded-lg text-white justify-center items-center flex mx-5 w-[15%] font-sans text-xl font-bold flex-col p-5 bg-opacity-50 aspect-square relative`}
                  >
                    <Image
                      src={player === 1 ? avatar1 : avatar2}
                      alt="profile"
                      className=" w-[60%] aspect-square rounded-full border-4 border-slate-300"
                      width={200}
                      height={200}
                      loader={propLoader}
                      //   priority={true}
                    />
                    {winner === player ? "YOU WIN" : "YOU LOSE"}
                    {!intrnmt ? (
                      <button
                        className="m-2 bg-slate-500 text-white p-2 rounded-xl w-[80%] h-16 font-bold text-xl"
                        onClick={() => push("/game")}
                      >
                        PLAY AGAIN ?
                      </button>
                    ) : null}
                  </div>
                ) : !finished ? (
                  <span className="w-[80%] h-16 rounded-lg flex flex-col justify-center items-center text-white font-bold text-2xl md:text-3xl lg:text-5xl">
                    {msg}
                  </span>
                ) : (
                  <div className="w-[80%] h-16 rounded-lg flex flex-col justify-center items-center text-white font-bold text-2xl md:text-3xl lg:text-5xl">
                    {msg}
                    {/* <div className="relative bg-red-500 w-auto h- rounded-lg flex flex-col justify-center items-center text-white font-bold text-2xl md:text-3xl lg:text-5xl"> */}
                    <Image
                      src={winnerAvatar}
                      alt="profile"
                      className="w-28 h-28 m-5 rounded-full border-2 border-slate-300"
                      width={120}
                      height={120}
                      loader={propLoader}
                    />
                    {/* <Image
                        src={badge}
                        alt="badge"
                        width={120}
                        height={120}
                        loader={propLoader}
                        className=" absolute w-40 h-40 m-5 rounded-full border-2 border-slate-300"
                      />
                    </div> */}
                  </div>
                )}
              </div>
            ) : null}
            <Canvas
              gl={{
                antialias: true,
                // outputEncoding: THREE.sRGBEncoding,
                toneMapping: THREE.ACESFilmicToneMapping,
              }}
              shadows
              linear={true}
              style={{
                width: "auto",
                aspectRatio: "16/9",
              }}
            >
              <Scene
                p={p}
                player={player}
                score1={score1}
                score2={score2}
                lpaddleRef={lpaddleRef}
                rpaddleRef={rpaddleRef}
                ballRef={ballRef}
                camPos={camPos}
                bg={p.current === -1 ? bg1 : bg2}
              />
            </Canvas>
          </div>
          {!finished ? (
            <div className="flex flex-col justify-around bg-slate-950 w-[5%]">
              <button
                className="m-3 bg-slate-500 text-white p-2 rounded-lg flex justify-center items-center aspect-square"
                onClick={() => {
                  setCamPos("up");
                }}
              >
                <LuRotate3D />
              </button>
              <button
                className="m-3 bg-slate-500 text-white p-2 rounded-lg flex justify-center items-center aspect-square"
                onClick={() => {
                  setCamPos("side");
                }}
              >
                <LuRotateCcw />
              </button>
              <button
                className="m-3 bg-slate-500 text-white p-2 rounded-lg flex justify-center items-center aspect-square"
                onClick={() => {
                  setCamPos("front");
                }}
              >
                <LuRotateCw />
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
