"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const drawNet = (canvas) => {
  const net = {
    width: 2,
    height: 20,
    x: canvas.width / 2 - 2 / 2,
    y: 0,
    color: "#F5F5F5",
  };
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.rect(
      net.x,
      net.y + i * (net.height + (canvas.height - net.height * 12) / 11),
      net.width,
      net.height
    ); // 6 spaces between 7 blocks
    ctx.fillStyle = net.color;
    ctx.fill();
    ctx.closePath();
  }
};

const drawBall = (canvas, ball) => {
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.shadowBlur = 12.5;
  ctx.shadowColor = "#777";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 5;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

const drawPaddle = (canvas, paddle) => {
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.fillStyle = paddle.color;
  ctx.fill();
  ctx.closePath();
};

const ball = {
  x: 720 / 2,
  y: 400 / 2,
  radius: 12,
  color: "white",
  dx: 5,
  dy: 5,
};

const leftPaddle = {
  x: 10,
  y: 400 / 2 - 50,
  width: 20,
  height: 100,
  color: "white",
};

const rightPaddle = {
  x: 720 - 30,
  y: 400 / 2 - 50,
  width: 20,
  height: 100,
  color: "white",
};

export default function Game() {
  const { replace } = useRouter();
  const params = useParams();
  //   console.log("params===>", params);
  const canvasRef = useRef(null);
  //   const [room, setRoom] = useState("");
  //   const [joined, setJoined] = useState(false);
  const [player, setPlayer] = useState(0);
  const [name, setName] = useState("");
  const [opponent, setOpponent] = useState("");
  let ws = useRef(null);
  //   setRoom(params.game);
  useEffect(() => {
    console.log("socket=>", ws.current);
    // if (!joined) return;
    ws.current = new WebSocket(`ws://10.30.164.21:8000/pong/${params.game}`);
    console.log("socket 2=>", ws.current);
    ws.current.onopen = () => {
      console.log(">> CONNECTION OPENED <<");
    };
    ws.current.onerror = (event) => {
      console.log(event);
    };
    console.log("ready state", ws.current.readyState);
    ws.current.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connect") {
        console.log("======>connected<======");
        console.log(data);
        if (data.message === 1 || data.message === 2) {
          console.log("SETTING PLAYER", data.message);
          setPlayer((prev) => prev + data.message);
          setName(data.name);
          setOpponent(data.opponent);
        }
        if (data.message === "room_full") {
          alert("room_full");
          replace("/match");
          ws.current.close();

          //   setJoined(false);
        }
      }
      if (data.type === "start_game") {
        console.log(data);
      }
      if (data.type === "move_ball") {
        // console.log("BALL==>", data);
        ball.x = data.x;
        ball.y = data.y;
        ball.dx = data.dx;
        ball.dy = data.dy;
      }
      if (data.type === "move_paddle") {
        if (data.player === 1) {
          if (data.direction === "up") {
            leftPaddle.y = data.position;
          }
          if (data.direction === "down") {
            leftPaddle.y = data.position;
          }
        }
        if (data.player === 2) {
          if (data.direction === "up") {
            rightPaddle.y = data.position;
          }
          if (data.direction === "down") {
            rightPaddle.y = data.position;
          }
        }
      }
      if (data.type === "stop_paddle") {
        // console.log("==>stop<==");
      }
    });
    //start the game
    const update = () => {
      canvasRef.current
        .getContext("2d")
        .clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      requestAnimationFrame(update);
      drawNet(canvasRef.current);
      drawBall(canvasRef.current, ball);
      drawPaddle(canvasRef.current, leftPaddle);
      drawPaddle(canvasRef.current, rightPaddle);
    };

    update();
    return () => {
      ws.current.close();
    };
  }, []);

  useEffect(() => {
    if (!player) return;
    let keyDown = false;
    document.addEventListener("keydown", function (event) {
      if (keyDown) return;
      console.log(player);
      if (event.key === "ArrowUp") {
        ws.current.send(
          JSON.stringify({
            type: "move_paddle",
            direction: "up",
            player: player,
          })
        );
      }
      if (event.key === "ArrowDown") {
        ws.current.send(
          JSON.stringify({
            type: "move_paddle",
            direction: "down",
            player: player,
          })
        );
      }
      keyDown = true;
    });
    document.addEventListener("keyup", function (event) {
      keyDown = false;
      if (event.key === "ArrowUp") {
        ws.current.send(
          JSON.stringify({
            type: "stop_paddle",
            direction: "up",
            player: player,
          })
        );
      }
      if (event.key === "ArrowDown") {
        ws.current.send(
          JSON.stringify({
            type: "stop_paddle",
            direction: "down",
            player: player,
          })
        );
      }
    });
    return () => {
      document.removeEventListener("keydown", (e) => {
        console.log("EVENT =>", e);
        e.preventDefault();
      });
      document.removeEventListener("keyup", (e) => {
        console.log(e);
        e.preventDefault();
      });
    };
  }, [player]);

  return (
    <main
      id="main"
      className="w-[100svw] h-[100svh] bg-gradient-to-t from-cyan-700 p-5"
    >
      <div className="h-20 m-5 flex justify-between">
        <div className="flex flex-row w-[30%] justify-center rounded-lg">
          <div className="bg-slate-300 text-black justify-center items-center flex rounded-full mx-5 w-[50%] font-sans">
            {player ? (player === 1 ? name : opponent) : null}
          </div>
          <Image
            src="https://profile.intra.42.fr/images/default.png"
            alt="profile"
            className="h-20 w-20 rounded-full"
            width={120}
            height={120}
            priority={true}
          />
        </div>
        <div className="flex flex-row bg-slate-300 w-[30%] justify-center rounded-lg">
          <div className="text-black font-bold justify-center items-center flex rounded-lg w-[50%] font-sans text-xl">
            VS
          </div>
        </div>
        <div className="flex flex-row w-[30%] justify-center rounded-lg">
          <Image
            src="https://profile.intra.42.fr/images/default.png"
            alt="profile"
            className="h-20 w-20 rounded-full"
            width={120}
            height={120}
            priority={true}
          />
          <div className="bg-slate-300 text-black justify-center items-center flex rounded-full mx-5 w-[50%] font-sans">
            {player ? (player === 1 ? opponent : name) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-row justify-around my-3">
        {/* {joined ? (
          <> */}
        <button
          className="bg-slate-300 text-black justify-center items-center flex rounded-full w-[20%] font-sans mx-auto"
          onClick={() => {
            if (ws) {
              ws.current.send(JSON.stringify({ type: "move_ball" }));
            } else {
              console.warn("socket not connected", ws);
            }
          }}
        >
          START
        </button>
        {params.game}
        <button
          className="bg-slate-300 text-black justify-center items-center flex rounded-full w-[20%] font-sans mx-auto"
          onClick={() => {
            ws.current.send(JSON.stringify({ type: "stop_ball" }));
          }}
        >
          STOP
        </button>
        {/* </>
        ) : (
          <>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value.trim())}
              className="text-black"
            />
            <input
              className="bg-slate-300 text-black justify-center items-center flex rounded-full w-[5%] font-sans mx-auto"
              type="submit"
              value="Join"
              disabled={room === ""}
              onClick={() => {
                setJoined(true);
              }}
            />
          </>
        )} */}
      </div>
      <canvas
        ref={canvasRef}
        width={720}
        height={400}
        className="mx-auto bg-cyan-700 rounded-lg"
      />
    </main>
  );
}
