import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useLayoutEffect,
} from "react";
import styles from "./Chat.module.css";
import { AuthContext } from "@/lib/useAuth";
import propLoader from "../_utils/LoaderIMg";

import { useSelector, useDispatch } from "react-redux";
import formatMessageTime from "../_utils/formatDate";
import avatar from "../../../../public/images/avatar.jpg";
import { AiOutlineClose } from "react-icons/ai";
import Image from "next/image";
import MesageLonding from "../_utils/MesageLonding.js";

const Msgs = ({ message, ws, conversation_id }) => {
  const { user } = useContext(AuthContext);
  const {
	id,
    conversation,
    text_message,
    sender,
    deletefor,
    datetime,
    join: data_join,
  } = message;
  const [img, setImg] = useState();

  useEffect(() => {
    if (
      message?.conversation?.sender?.id === user.userInfo.id ||
      message?.Conversation_user?.sender?.id === user.userInfo.id
    )
      setImg(
        message?.conversation?.receiver?.avatar_url ||
          message?.Conversation_user?.receiver?.avatar_url
      );
    else
      setImg(
        message?.conversation?.sender?.avatar_url ||
          message?.Conversation_user?.sender?.avatar_url
      );
  }, []);

  const [join, setJoin] = useState(
    !data_join && formatMessageTime(datetime) === "now"
  );

  const deleteMessage = deletefor
    ? deletefor.filter((ele) => ele.userId == user.userInfo.id)
    : [];

  useEffect(() => {
    const interval = setInterval(() => {
      setJoin(false);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const cancelrequest = () => {
    setJoin(false);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "cancel.play",
          id: id,
        })
      );
    }
  };

  const JoinGame = () => {
    setJoin(false);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "accept.game",
          data: "@game",
          conversation_id: conversation_id,
        })
      );

      setTimeout(() => {
        cancelrequest();
      }, 60000);
    }
  };

  if (deleteMessage.length || !text_message) return null;
  if (sender != user.userInfo.id) {
    if (text_message === "@game") {
      return (
        <div className="flex flex-col justify-evenly  w-fit  opacity-75 p-2  max-w-[500px] place-self-center  rounded-[15px] m-2">
          {join && (
            <span
              className=" place-self-end text-red-600 text-base "
              onClick={() => cancelrequest()}
            >
              {" "}
              <AiOutlineClose />{" "}
            </span>
          )}
          <div className="w-[280px] h-[40px] flex justify-between  items-center m-1   p-2 px-0">
            <p className="text-[#30628D] animate w-full   break-all  text-base  grid place-content-center   capitalize  ">
              join us for the game
            </p>
            {join && (
              <button
                className="bg-[#064A85]   text-white  w-[80px] text-base capitalize rounded-sm    grid place-content-center  p-1  tracking-wide cursor-pointer "
                onClick={() => JoinGame()}
              >
                join
              </button>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col justify-center  w-fit  p-3  max-w-[500px] place-self-start ">
          <div className="flex items-center justify-evenly">
            {img && (
              <Image
                src={img}
                alt={sender}
                width={500}
                height={500}
                loader={propLoader}
                className="w-[25px] h-[25px] rounded-full self-start"
              />
            )}
            <p className="bg-[#30628D] animate w-full    break-all  text-base text-white grid place-content-center p-3 pe-5 rounded-[15px] rounded-tl-none   m-2">
              {text_message}
            </p>
          </div>
          <span className="w-full  text-end  text-white text-[8px]  px-4 ">
            {formatMessageTime(datetime)}
          </span>
        </div>
      );
    }
  } else {
    if (text_message === "@game") return;
    else {
      return (
        <div className="flex flex-col justify-center  w-fit  p-3  my-0 max-w-[500px] place-self-end">
          <p className="bg-[#F6F6F6]  animate  w-full break-all  text-base text-black grid place-content-center p-3 pe-5 rounded-[15px] rounded-br-none  m-1">
            {text_message}
          </p>
          <span className="w-full  text-start  text-white text-[8px]  px-4 ">
            {formatMessageTime(datetime)}
          </span>
        </div>
      );
    }
  }
};

const MessagesContainer = ({ containerProps }) => {
  const endRef = useRef(null);
  const {
    message,
    conversation_id,
    setMessage,
    setGameinvite,
    gameinvite,
    ws,
  } = containerProps;
  const [img, setImg] = useState();
  const { user } = useContext(AuthContext);

  const messageContainerRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    // Scroll to the bottom of the message container whenever new messages are added
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  return (
    <div
      className={`${styles.contact}  w-full  h-[80%] flex flex-col justify-start grow overflow-y-auto  p-0 pb-8 `}
      ref={messageContainerRef}
    >
      {message &&
        message?.map((msg, index) => (
          <Msgs
            key={index}
            message={msg}
            ws={ws?.current}
            conversation_id={conversation_id}
            img={img}
          />
        ))}
      <div ref={endRef}></div>
    </div>
  );
};

export default MessagesContainer;
