import React, { useRef, useEffect, useState, useMemo, useContext } from "react";
import avatar from "@/public/images/avatar.jpg";
import ChatAnimation from "@/public/images/chat.gif";
import Image from "next/image";
import { BsEmojiLaughingFill } from "react-icons/bs";
import { FaVideo, FaImages, FaMicrophone, FaS } from "react-icons/fa6";
import { TbUserCancel } from "react-icons/tb";
import { AiOutlineMore, AiOutlineDelete } from "react-icons/ai";
import { FaUser } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import moment from "moment";
import {
  addconversation,
  createNewConversation,
  removeConversationAfterDelay,
  emitEvent,
  readAllMessage,
  clearReadMsgs,
} from "../../../store/feature/chat/chatSlice";
import { useSelector, useDispatch } from "react-redux";
import { blockedUser } from "../../../store/feature/chat/MessageSlice.js";
import { deleteAllMessage } from "../../../store/feature/chat/newConversation.js";
import { dataUser } from "../../../store/feature/chat/newConversation";
import { useRouter } from "next/navigation";
import styles from "./Chat.module.css";
import { AuthContext } from "@/lib/useAuth";
import formatMessageTime from "../_utils/formatDate";
import propLoader from "../_utils/LoaderIMg";
import MessagesContainer from "./MessagesContainer";
import { HashLoader } from "react-spinners";
import MesageLonding from "../_utils/MesageLonding.js";
import Error from "../_utils/Error";

import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Allmesssges = () => {
  const { user: currentUser } = useContext(AuthContext);
  const states = useSelector((state) => state?.newConversation?.message);
  const dispatch = useDispatch();
  const newConvrsations_id = useSelector((state) => state?.ChatState?.userID);
  const [conversations, setConvesations] = useState(states?.conversation);
  const [msg, setMsg] = useState("");
  const [message, setMessage] = useState(
    states?.messages?.length ? [...states?.messages] : []
  );
  const [user, setUser] = useState(states?.user);
  const [lastLogin, setLastLogin] = useState(states?.user?.last_login);
  const [is_online, setIsOnline] = useState(states?.user?.is_online);
  const [blocked, setBlocked] = useState(conversations?.blocked);
  const [openpicker, setOpenPicker] = useState(false);
  const [gameinvite, setGameinvite] = useState(true);
  const router = useRouter();
  const [recommed, setRecommed] = useState(true);
  const reg = /^@g?a?m?e?/i;

  let ws = useRef();
  const btn = useRef();
  const Message = useRef();

  const ShowElement = () => {
    btn.current.classList.toggle("visible");
    btn.current.classList.toggle("invisible");
  };

  const protocol = "wss://";
  const ENTPOINT = `${protocol}${window.location.hostname}:443/api/conversation/${conversations?.id}/`;

  useEffect(() => {
    ws.current = new WebSocket(`${ENTPOINT}`);
    ws.current.onopen = function (e) {
      setMessage(states.messages);
    };
    dispatch(clearReadMsgs({ id: conversations?.id }));
    dispatch(
      readAllMessage({
        conversation: conversations?.id,
        userid: currentUser.userInfo.id,
      })
    );
    ws.current.onmessage = function (event) {
      let data = JSON.parse(event.data);
      if (data.type === "user.lastSeen" && data.message.data) {
        const { sender, receiver } = data?.message?.data;
        if (sender?.id === currentUser?.userInfo?.id) {
          setLastLogin(receiver.last_login);
          setIsOnline(receiver.is_online);
        } else {
          setLastLogin(sender.last_login);
          setIsOnline(sender.is_online);
        }
      } else if (data.type == "conversation.block") {
        setBlocked(data?.message?.user_id);
      } else if (data.type == "conversation.deblock") {
        setBlocked(0);
      } else if (data.type == "message.play") setGameinvite(false);
      else if (data.type == "cancel.play") setGameinvite(true);
      else if (data.type == "accept.game") {
        setTimeout(() => {
          router.push("/game/" + data?.message);
        }, 1000);
      } else if (data.type == "message.chat")
        setMessage((prev) => [...prev, data.message]);
      dispatch(
        readAllMessage({
          conversation: conversations?.id,
          userid: currentUser.userInfo.id,
        })
      );
      dispatch(emitEvent());
    };

    ws.current.onerror = (error) => {
      toast.error("Connection problem new ");
    };

  }, []);

  const handleMessage = (e) => {
    e.preventDefault();

    if (msg.trim().length > 0 && msg.length <= 300 && !blocked) {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "message.chat",
            data: msg,
            receiver: newConvrsations_id,
            sender: currentUser.userInfo.id,
            conversation: conversations?.id,
            username: currentUser.userInfo.username,
          })
        );
        setMsg("");
        dispatch(addconversation({ data: conversations, msg: msg }));
        dispatch(emitEvent());
      }
    }
  };

  const handleBlock = () => {
    ws.current.send(
      JSON.stringify({
        type: "conversation.block",
        conversation: conversations?.id,
        userID: currentUser?.userInfo?.id,
      })
    );
  };

  const handleDeBlock = () => {
    ws.current.send(
      JSON.stringify({
        type: "conversation.deblock",
        conversation: conversations?.id,
        userID: currentUser?.userInfo?.id,
      })
    );
  };

  const handleClick = () => {
    // Clear messages and show element
    ShowElement();
    setMessage([]);

    // Dispatch removeGroupAfterDelay action to remove the group after a delay
    dispatch(removeConversationAfterDelay({ id: conversations.id }));

    // After 500 milliseconds, dispatch GroupConversation and deleteAllMessage actions
    setTimeout(() => {
      dispatch(createNewConversation({ value: 0, id: conversations.id }));
      dispatch(
        deleteAllMessage({
          conversation: conversations.id,
          userid: currentUser.userInfo.id,
        })
      );
    }, 500);
  };

  const addEmoji = (e) => {
    setMsg((prev) => prev + e.emoji);
  };

  const playhandler = () => {
    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      user.is_online &&
      !blocked
    ) {
      ws.current.send(
        JSON.stringify({
          type: "message.chat",
          data: "@game",
          receiver: newConvrsations_id,
          sender: currentUser.userInfo.id,
          conversation: conversations?.id,
          username: currentUser.userInfo.username,
        })
      );

      ws.current.send(
        JSON.stringify({
          type: "message.play",
          reciever: newConvrsations_id,
        })
      );
      setGameinvite(false);
      setTimeout(() => {
        ws?.current?.send(
          JSON.stringify({
            type: "cancel.play",
            id: message[message.length - 1].id,
          })
        );
        setGameinvite(true);
      }, 60000);
    }
  };

  return (
    <section className="flex-1 grow  w-full h-full text-dark  flex flex-col  ">
      {user && (
        <div className="grow-0 w-full  min-h-[7%] max-h-[7%]  flex flex-row items-center gap-2 px-4 border-b border-gray shadow-sm">
          <ToastContainer
            position="top-right"
            autoClose={1000}
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
          <span className=" grid place-content-center  h-20 w-16  ">
            <Image
              src={user.avatar_url || avatar}
              alt="user_avatar "
              width={64}
              height={64}
              loader={propLoader}
              className={`${styles.cercle} h-full w-16  block object-fill border-2 border-gray  `}
            />
          </span>
          <div className=" flex-col  items-start justify-start text-base text-primary grow ">
            <h4 className="text-white font-[500] text-2xl  lowercase  first-letter:capitalize  text-muted  ">
              {" "}
              {user.first_name} {user.last_name}{" "}
            </h4>
            <h6 className="text-sm text-muted  font-[300] capitalize ">
              {is_online
                ? "active"
                : "last seen " + moment(lastLogin).fromNow()}{" "}
            </h6>
          </div>
          <div>
            {!blocked ? (
              <button
                className={
                  gameinvite
                    ? " bg-[#064A85]   text-white  w-[80px] text-base capitalize rounded-sm    grid place-content-center  p-2  tracking-wide"
                    : "bg-[#064A85]   text-white  w-[80px] text-base capitalize rounded-sm    grid place-content-center  p-2  tracking-wide opacity-75"
                }
                disabled={gameinvite ? false : true}
                onClick={() => playhandler()}
              >
                {" "}
                play{" "}
              </button>
            ) : null}
          </div>
          <div className="grow-0 h-full grid place-content-center relative ">
            <span
              className="text-xl text-black w-6 h-8 bg-[#EDFAFF] grid place-content-center rounded-md cursor-pointer "
              onClick={ShowElement}
            >
              <AiOutlineMore className="text-primary text-2xl  " />
            </span>
            <div
              className=" w-[150px] absolute top-16 right-0 grid place-content-center gap-3 text-xs text-primary bg-[#EDFAFF] rounded-[12px] invisible p-3 cursor-pointer"
              ref={btn}
            >
              {typeof message !== "string" && (
                <span
                  className="w-full flex flex-row items-center gap-2"
                  onClick={() => {
                    handleClick();
                  }}
                >
                  <AiOutlineDelete />
                  <p className="text-xs  lowercase">delete chat</p>
                </span>
              )}
              {!blocked ? (
                <span
                  className="w-full flex  items-center flex-row gap-2"
                  onClick={() => {
                    dispatch(
                      blockedUser({
                        conversation_id: conversations?.id,
                        page: 0,
                        id: currentUser.userInfo.id,
                      })
                    );
                    ShowElement();
                    handleBlock();
                  }}
                >
                  <TbUserCancel />
                  <p className="text-xs lowercase">block</p>
                </span>
              ) : blocked && blocked === currentUser.userInfo.id ? (
                <span
                  className="w-full flex  items-center flex-row gap-2"
                  onClick={() => {
                    ShowElement();
                    handleDeBlock();
                  }}
                >
                  <TbUserCancel />
                  <p className="text-xs lowercase">unblock</p>
                </span>
              ) : null}
              <span
                className="w-full flex flex-row gap-2"
                onClick={() => {
                  ShowElement();
                  router.push(`/profile/${user?.username}`);
                }}
              >
                <FaUser />
                <p className="text-xs lowercase">profil</p>
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="grow  min-h-[86%] max-h-[86%] w-full flex-col items-center justify-start  p-0  overflow-hidden ">
        {user && (
          <div className="grow-0  w-full grid place-content-center p-8 py-4   ">
            <Image
              src={user.avatar_url || avatar}
              width={64}
              height={64}
              loader={propLoader}
              alt="profile image"
              className="h-24 w-24 rounded-full border-4 border-Secondary text-[#D9D9D9] m-auto "
            />

            <h2 className="text-white lowercase font-medium text-center w-full   text-center ">
              {user.first_name} {user.last_name}{" "}
            </h2>
            <h5 className="text-white  text-sm font-medium text-center w-full  ">
              {user.username}
            </h5>
          </div>
        )}
        {message && (
          <MessagesContainer
            containerProps={{
              message,
              conversation_id: conversations?.id,
              setMessage,
              setGameinvite,
              gameinvite,
              ws,
            }}
          />
        )}
      </div>
      {blocked ? (
        <div className="message w-full min-h-[7%] max-h-[7%]  grow-0  flex flex-row items-center justify-center p-2 px-10 border-t border-slate-300  gap-2">
          {" "}
          <p className="text-sm text-slate-700 capitalize">
            {" "}
            this conversation blocked{" "}
          </p>
        </div>
      ) : (
        <form
          className="message w-full flex  flex-col reltive items-center justify-center gap-x-[25px] px-10 border-t border-slate-300   min-h-[8%] max-h-[8%] pt-2 relative"
          onSubmit={handleMessage}
        >
          <div className="w-full  h-[80%] flex  items-center justify-center gap-x-[25px]">
            <div className="basis-[75%] flex   flex-col justify-center items-center  h-full p-0  px-2  ">
              {msg.match(reg) && msg.length <= 5 && recommed && (
                <p
                  className="absolute top-[-50px]  left-0 w-[100%]  h-[50px]    flex items-center justify-start p-3 backdrop-blur-sm  bg-white/30 backdrop-brightness-150 rounded-t-md text-black  "
                  onClick={() => {
                    setMsg("@game");
                    setRecommed(false);
                  }}
                >
                  @game
                </p>
              )}
              <input
                type="text"
                className="w-full p-2 text-wrap bg-[#F5FBFF] rounded-[10px] px-4 outline-none  text-base text-colorInput placeholder:text-colorInput"
                placeholder="Type your message here ..."
                value={msg}
                onChange={(e) => {
                  setRecommed(true);
                  setMsg(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-row items-center justify-evenly h-full w-[200px] ">
              <div className={`${openpicker} ? ${styles.emoji} : "hidden" `}>
                <EmojiPicker
                  open={openpicker}
                  width={300}
                  height={300}
                  onEmojiClick={addEmoji}
                />
              </div>
              <BsEmojiLaughingFill
                className="text-white text-3xl me-2  "
                onClick={(prev) => setOpenPicker((prev) => !prev)}
              />
              <button
                type="sumbit"
                className="  bg-[#064A85]   text-white  w-[80px] text-base capitalize rounded-sm    grid place-content-center  p-2"
              >
                send
              </button>
            </div>
          </div>
          <Error message={msg} />
        </form>
      )}
    </section>
  );
};

const Newconversation = ({ id }) => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();
  useEffect(() => {
    if (id) {
      dispatch(
        dataUser({
          sender: user.userInfo.id,
          reciever: id,
        })
      );
    }
  }, [id]);

  const states = useSelector((state) => state?.newConversation);

  if (states.status == "loading")
    return (
      <section className="flex-1 grow  w-full h-full bg-whit   text-dark  flex flex-col  items-center justify-center ">
        <HashLoader color={"#fff"} size={250} />
      </section>
    );
  else if (states.status == "successed") {
    return <Allmesssges />;
  } else
    return (
      <section className="flex-1 grow  w-full h-full bg-whit   text-dark  flex flex-col  items-center justify-center ">
        <MesageLonding />
      </section>
    );
};

export default Newconversation;
