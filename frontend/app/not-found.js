import Link from "next/link";
import React from "react";
// import './globalStyle.css'

const NotFound = () => {
  return (
    <section className="min-h-screen  w-full flex flex-col items-center   not_found  ">
      {/* <div className="flex flex-row items-center  gap-4 w-full h-5  text-xl">
        <a
          href="/login"
          className="text-primary bg-slate-500 p-5 m-4 rounded-md"
          style={{ color: "#fff" }}
        >
          Login
        </a>
        <a
          href="/signup"
          className="text-primary bg-slate-500 p-5 m-4 rounded-md"
          style={{ color: "#fff" }}
        >
          Sign Up
        </a>
        <a
          href="/game"
          className="text-primary bg-slate-500 p-5 m-4 rounded-md"
          style={{ color: "#fff" }}
        >
          Game
        </a>
        <a
          href="/profile"
          className="text-primary bg-slate-500 p-5 m-4 rounded-md"
          style={{ color: "#fff" }}
        >
          Profile
        </a>
        <a
          href="/chat"
          className="text-primary bg-slate-500 p-5 m-4 rounded-md"
          style={{ color: "#fff" }}
        >
          Chat
        </a>
        <a
          href="/settings"
          className="text-primary bg-slate-500 p-5 m-4 rounded-md"
          style={{ color: "#fff" }}
        >
          Settings
        </a>
      </div> */}
      <h1 className="font-bold text-[30rem] ">404</h1>
      <p className="  text-white text-center capitalize tracking-wider text-3xl   ">page not found</p>
      <button className=" text-primary bg-slate-500 p-2 m-4 rounded  w-[150px] text-center skew-x-[-20deg] ">
        <Link href="/" className="capitalize tracking-wide">go Home</Link>
      </button>
    </section>
  );
};

export default NotFound;
