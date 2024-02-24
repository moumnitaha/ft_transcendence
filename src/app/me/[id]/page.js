"use client";
const { useParams } = require("next/navigation");

export default function Page() {
  let id = useParams().id;
  return (
    <div className="font-bold w-20 h-20 bg-red-500 m-10 flex justify-center items-center">
      {id}
    </div>
  );
}
