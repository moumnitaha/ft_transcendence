import React from "react";
import keys from "./assets/keys.png";
import Image from "next/image";
import propLoader from "../chat/_utils/LoaderIMg";
import { CiCircleInfo } from "react-icons/ci";

export default function Modal() {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <>
      <button
        className="bg-zinc-600 text-white active:bg-blue-600 font-bold uppercase text-xl p-2 rounded-full shadow hover:shadow-lg outline-none focus:outline-none m-1 ease-linear transition-all duration-150 w-8 h-8 flex justify-center items-center"
        type="button"
        onClick={() => setShowModal(true)}
      >
        <CiCircleInfo />
      </button>
      {showModal ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-auto my-6 mx-auto max-w-3xl">
              {/*content*/}
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                {/*header*/}
                <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                  <h3 className="text-3xl font-semibold">How To Play !</h3>
                  <button
                    className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() => setShowModal(false)}
                  >
                    <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div className="relative p-6 flex-auto flex flex-row">
                  <Image
                    src={keys}
                    alt="profile"
                    className="h-24 w-24 rounded-md"
                    width={40}
                    height={40}
                    loader={propLoader}
                  />
                  <p className="m-4 text-blueGray-500 text-lg leading-relaxed">
                    Welcome to our ping pong game! To control the paddle, simply
                    use the left and right arrow keys on your keyboard. Keep the
                    ball in play and see how long you can last—good luck!
                  </p>
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                  <button
                    className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </>
  );
}
