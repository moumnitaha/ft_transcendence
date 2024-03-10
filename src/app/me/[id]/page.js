"use client";
const { useParams, useRouter } = require("next/navigation");

export default function Page() {
  const { back } = useRouter();

  let id = useParams().id;
  return (
    <div
      className="font-bold w-20 h-20 bg-red-500 m-10 flex justify-center items-center"
      onClick={() => back()}
    >
      {id}
    </div>
  );
}
