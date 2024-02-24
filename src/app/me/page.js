"use client";
import { useRouter } from "next/navigation";

export default function Me() {
  const { push } = useRouter();
  return (
    <div className="bg-green-200 w-fit h-fit p-10">
      {[1, 2, 3, 4, 5].map((id) => (
        <div
          key={id}
          className="font-bold w-20 h-20 bg-red-500 m-10 flex justify-center items-center"
          onClick={() => push(`/me/${id}`)}
        >
          {id}
        </div>
      ))}
    </div>
  );
}
