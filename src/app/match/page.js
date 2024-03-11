"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Match() {
  const [name, setName] = useState("");
  const [opponent, setOpponent] = useState("");
  const [joined, setJoined] = useState(false);
  const [msg, setMsg] = useState("");
  const ws = useRef(null);
  const { push } = useRouter();
  useEffect(() => {
    ws.current = new WebSocket("ws://10.30.164.21:8000/match/42");
    ws.current.onopen = () => {
      console.log("connected");
    };
  }, []);

  useEffect(() => {
    if (!joined) return;
    ws.current.onclose = () => {
      console.log("disconnected");
    };
    ws.current.onmessage = (e) => {
      let data = JSON.parse(e.data);
      console.log("data => ", data);
      if (data.type === "start_game") {
        console.log(data.player1, data.player2, data.room_name);
        let encoded = btoa(
          data.player1 + "_" + data.player2 + "_" + data.room_name
        );
        console.log(encoded);
        encoded = encoded.replace(/=/g, "");
        console.log(encoded);
        setOpponent(name === data.player1 ? data.player2 : data.player1);
        setMsg("Game starting in 3 seconds...");
        //redirect to game page
        setTimeout(() => {
          push(`/match/${data.room_name}`);
        }, 3000);
      }
    };
    return () => {
      ws.current.close();
    };
  }, [joined]);
  return (
    <main className="w-[100svw] h-[100svh] bg-gradient-to-t from-cyan-700 p-5">
      <div className="flex justify-center items-center h-20">
        <input
          disabled={joined}
          type="text"
          placeholder="Enter your name"
          className="p-2 rounded-lg text-black"
          onChange={(e) => setName(e.target.value)}
        />
        <button
          disabled={joined}
          className="bg-slate-300 text-black justify-center items-center flex rounded-full mx-5 w-[50%] font-sans py-2"
          onClick={() => {
            if (!name) {
              alert("Please enter a Nickname");
              return;
            }
            setJoined(true);
            ws.current.send(
              JSON.stringify({
                type: "enter_queue",
                player: name,
              })
            );
          }}
        >
          Enter Queue
        </button>
      </div>
      <div className="flex justify-center items-center h-20">
        <div className="bg-slate-300 text-black justify-center items-center flex rounded-full mx-5 w-[50%] font-sans py-2">
          {!joined ? "Enter a nickname..." : name}
        </div>
        <div className="bg-slate-300 text-black justify-center items-center flex rounded-full mx-5 w-[50%] font-sans py-2">
          {opponent
            ? opponent
            : joined
            ? "Waiting for opponent..."
            : "No opponent yet!"}
        </div>
      </div>
      {msg && (
        <div className="bg-slate-300 text-black justify-center items-center flex rounded-full mx-auto w-[50%] font-sans py-2">
          {msg}
        </div>
      )}
    </main>
  );
}
