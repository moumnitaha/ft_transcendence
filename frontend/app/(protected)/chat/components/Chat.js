import React, { useState, useEffect, useRef, useContext } from "react";
import { AiOutlineMore, AiOutlineDelete } from "react-icons/ai";
import { TbUserCancel } from "react-icons/tb";
import { BsEmojiLaughingFill } from "react-icons/bs";
import { FaVideo, FaImages, FaMicrophone } from "react-icons/fa6";
import { FaUser } from "react-icons/fa";
import avatar from "../../../../public/images/avatar.jpg";
import EmojiPicker from "emoji-picker-react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  addconversation,
  SelectUser,
  removeConversationAfterDelay,
  emitEvent,
  readAllMessage,
} from "../../../store/feature/chat/chatSlice";
import { blockedUser } from "../../../store/feature/chat/MessageSlice.js";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";

import {
  Fetch_message_of_conversation,
  Fetch_messages,
} from "../../../store/feature/chat/MessageSlice.js";
import { deleteAllMessage } from "../../../store/feature/chat/newConversation.js";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./Chat.module.css";
import { AuthContext } from "@/lib/useAuth";
import formatMessageTime from "../_utils/formatDate";
import propLoader from "../_utils/LoaderIMg";
import MessagesContainer from "./MessagesContainer";
import { HashLoader } from "react-spinners";
import MesageLonding from "../_utils/MesageLonding.js";
import Error from "../_utils/Error";

const ConversationMessage = ({ conversation_id }) => {
  const states = useSelector((state) => state?.Message);
  const { user: currentuser } = useContext(AuthContext);
  const dispatch = useDispatch();
  const [msg, setMsg] = useState("");
  const [message, setMessage] = useState(states?.message?.messages);

  // const [user, setUsers] = useState(states.message[0]?.conversation?.sender.id  == currentuser.userInfo.id ?  states.message[0]?.conversation?.receiver : states.message[0]?.conversation?.sender );
  const [user, setUsers] = useState(states?.message?.user);
  const [lastLogin, setLastLogin] = useState(states?.message?.user?.last_login);
  const [is_online, setIsOnline] = useState(states?.message?.user?.is_online);
  const [openpicker, setOpenPicker] = useState(false);
  const [gameinvite, setGameinvite] = useState(true);
  const [recommed, setRecommed] = useState(true);

  let ws = useRef();
  const btn = useRef();
  const protocol = "wss://";
  const router = useRouter();
  const reg = /^@g?a?m?e?/i;

  const [blocked, setBlocked] = useState(
    states?.message?.conversation?.blocked
  );

  const ENTPOINT = `${protocol}${window.location.hostname}:443/api/conversation/${conversation_id}/`;

  const ShowElement = () => {
    btn.current.classList.toggle("visible");
    btn.current.classList.toggle("invisible");
  };

  useEffect(() => {
    ws.current = new WebSocket(`${ENTPOINT}`);
    ws.current.onopen = function (e) {};
    // Cleanup function to close the WebSocket connection when component unmounts

    ws.current.onmessage = function (event) {
      let data = JSON.parse(event.data);

      if (data.type === "user.lastSeen" && data.message.data) {
        const { sender, receiver } = data?.message?.data;
        if (sender?.id === currentuser?.userInfo?.id) {
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
      } else if (data.type == "message.chat") {
        // console.log("message.chat");
        setMessage((prev) => [...prev, data.message]);
      }
      dispatch(
        readAllMessage({
          conversation: conversation_id,
          userid: currentuser.userInfo.id,
        })
      );
      // dispatch(emitEvent());
    };

    ws.current.onerror = (error) => {
      toast.error("Connection problem chat");
    };
  }, []);

  useEffect(() => {}, []);

  const handleMessage = (e) => {
    e.preventDefault();
    if (msg.trim().length > 0 && msg.trim().length <= 300 && !blocked) {
      // Check if the WebSocket connection is open before sending the message
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "message.chat",
            data: msg,
            receiver: user.id,
            sender: currentuser.userInfo.id,
            conversation: conversation_id,
            username: currentuser.userInfo.username,
          })
        );
        // scrollToBottom();
        setMsg(""); // Clear the message input
        dispatch(
          addconversation({ data: states.message.conversation, msg: msg })
        );
        dispatch(emitEvent());
      } else {
        // WebSocket connection is not yet open, handle accordingly (e.g., queue the message, display an error message)
        // console.error("WebSocket connection is not yet open. Message not sent.");
        // You may want to display an error message to the user or queue the message to send later
      }
    }
  };

  const handleBlock = () => {
    ws.current.send(
      JSON.stringify({
        type: "conversation.block",
        conversation: conversation_id,
        userID: currentuser.userInfo.id,
      })
    );
  };

  const handleDeBlock = () => {
    ws.current.send(
      JSON.stringify({
        type: "conversation.deblock",
        conversation: conversation_id,
        userID: currentuser.userInfo.id,
      })
    );
  };

  const handleClick = () => {
    // Clear messages and show element
    setMessage([]);
    ShowElement();

    // Dispatch removeGroupAfterDelay action to remove the group after a delay
    dispatch(removeConversationAfterDelay({ id: conversation_id }));

    // After 500 milliseconds, dispatch GroupConversation and deleteAllMessage actions
    setTimeout(() => {
      dispatch(SelectUser({ id: conversation_id, value: 0 }));
      dispatch(
        deleteAllMessage({
          conversation: conversation_id,
          userid: currentuser.userInfo.id,
        })
      );
    }, 500);
  };

  // Function to handle changes in the input field
  const handleChange = (e) => {
    setMsg(e.target.value);
    setRecommed(true);
  };

  const addEmoji = (e) => {
    setMsg((prev) => prev + e.emoji);
  };

  const playhandler = () => {
    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      user.is_online &&
      gameinvite &&
      !blocked
    ) {
      ws.current.send(
        JSON.stringify({
          type: "message.chat",
          data: "@game",
          receiver: user.id,
          sender: currentuser.userInfo.id,
          conversation: conversation_id,
          username: currentuser.userInfo.username,
        })
      );

      ws.current.send(
        JSON.stringify({
          type: "message.play",
          reciever: user.id,
        })
      );
      setGameinvite(false);
      setTimeout(() => {
        setGameinvite(true);
        ws.current.send(
          JSON.stringify({
            type: "cancel.play",
            id: message[message.length - 1].id,
          })
        );
      }, 60000);
    }
  };

  // return <h1> hello </h1>
  return (
    <section className="flex-1   w-full  text-dark  flex flex-col     ">
      <div className="grow-0 w-full min-h-[7%] max-h-[7%]  flex flex-row items-center gap-2 px-4 border-b border-gray shadow-sm ">
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
        <span className=" grid place-content-center md:h-[25px] md:w-[25px] lg:h-20 lg:w-16  ">
          <Image
            src={user?.avatar_url || avatar}
            height={64}
            width={64}
            loader={propLoader}
            alt="user_avatar "
            className={`${styles.cercle} h-full w-16  block object-fill border-2 border-gray  `}
          />
        </span>
        <div className=" flex-col  items-start justify-start text-base text-primary grow  ">
          <h4 className="font-[500] text-xl  lowercase text-white  first-letter:capitalize  ">
            {" "}
            {user?.first_name} {user?.last_name}{" "}
          </h4>
          <h6 className="text-sm text-[#C0C1C5] font-[300] capitalize">
            {is_online ? "active" : "last seen " + moment(lastLogin).fromNow()}{" "}
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
        <div className="grow-0 h-full  grid place-content-center   relative">
          <span
            className="text-xl text-black w-6 h-8 bg-[#EDFAFF] grid place-content-center rounded-md cursor-pointer "
            onClick={ShowElement}
          >
            <AiOutlineMore className="text-primary text-2xl " />
          </span>
          <div
            className=" w-28 absolute  top-16 right-0 grid place-content-center gap-3 text-xs text-primary bg-[#EDFAFF] rounded-[12px] invisible p-3 cursor-pointer"
            ref={btn}
          >
            <span
              className="w-full flex flex-row items-center gap-2"
              onClick={() => {
                handleClick();
              }}
            >
              <AiOutlineDelete />
              <p className="text-xs lowercase">delete chat</p>
            </span>
            {!blocked ? (
              <span
                className="w-full flex  items-center flex-row gap-2"
                onClick={() => {
                  dispatch(
                    blockedUser({
                      conversation_id: conversation_id,
                      page: 0,
                      id: currentuser.userInfo.id,
                    })
                  );
                  ShowElement();
                  handleBlock();
                }}
              >
                <TbUserCancel />
                <p className="text-xs lowercase">block</p>
              </span>
            ) : blocked && blocked === currentuser.userInfo.id ? (
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
              className="w-full flex items-center flex-row gap-2"
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
      <div className="grow  min-h-[86%] max-h-[86%] w-full flex-col items-center justify-start  p-0 bg-backgroundchat overflow-hidden ">
        {user && (
          <div className="grow-0  w-full grid place-content-center p-8  ">
            <Image
              src={user?.avatar_url || avatar}
              height={64}
              width={64}
              loader={propLoader}
              alt="profile image"
              className="h-24 w-24 rounded-full border-4 border-Secondary text-[#D9D9D9] m-auto "
            />
            <h2 className="text-white capitalize font-medium text-center">
              {" "}
              {user?.first_name} {user?.last_name}{" "}
            </h2>
            <h5 className="text-white capitalize text-sm font-medium m-auto">
              {user?.username}
            </h5>
          </div>
        )}
        {
          <MessagesContainer
            containerProps={{
              message,
              conversation_id,
              setMessage,
              setGameinvite,
              gameinvite,
              ws,
            }}
          />
        }
      </div>
      {blocked ? (
        <div className="message w-full  grow-0 min-h-[7%] max-h-[7%]  flex flex-row items-center justify-center p-2 px-10 border-t border-slate-300   gap-2 ">
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
          <div className="w-full h-[80%]  flex  items-center justify-center gap-x-[25px]">
            <div className="basis-[75%] flex   flex-row justify-start items-center  w-full h-full p-0  px-2 ">
              {msg.match(reg) && msg.length <= 5 && recommed && (
                <p
                  className="absolute top-[-50px] left-0 w-[100%]  h-[50px]    flex items-center justify-start p-3 backdrop-blur-sm  bg-white/30 backdrop-brightness-150 rounded-t-md text-black  "
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
                className="w-full p-2 bg-[#F5FBFF] rounded-[10px] px-4 outline-none  text-base text-colorInput placeholder:text-colorInput"
                placeholder="Type your message here ..."
                value={msg}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-row items-center justify-evenly h-full w-[200px]  ">
              <div className={styles.emoji}>
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

const Chat = ({ conversation_id }) => {
  const dispatch = useDispatch();
  const { user } = useContext(AuthContext);
  useEffect(() => {
    dispatch(
      Fetch_message_of_conversation({
        conversation_id,
        page: 1,
        id: user.userInfo.id,
      })
    );
  }, [dispatch, conversation_id]);

  const states = useSelector((state) => state?.Message);
  if (states.status == "loading")
    return (
      <section className="flex-1 grow  w-full h-full bg-whit   text-dark  flex flex-col  items-center justify-center overflow-y-auto  ">
        <HashLoader color={"#fff"} size={250} />
      </section>
    );
  else if (states.status == "successed") {
    return (
      <ConversationMessage conversation_id={conversation_id} states={states} />
    );
  } else
    return (
      <section className="flex-1 grow  w-full h-full bg-whit   text-dark  flex flex-col  items-center justify-center ">
        <MesageLonding />
      </section>
    );
};

export default Chat;
