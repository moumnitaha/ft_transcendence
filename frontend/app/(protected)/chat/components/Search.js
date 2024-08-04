import React, {
  Fragment,
  useState,
  useRef,
  useEffect,
  useContext,
} from "react";
import { CiSearch } from "react-icons/ci";
import Image from "next/image";
import avatar from "../../../../public/images/avatar.jpeg";
import { BsCheck2All, BsFillPeopleFill, BsChatText } from "react-icons/bs";
import { BiSolidMessageSquareAdd } from "react-icons/bi";
import { useSelector, useDispatch } from "react-redux";
import formatMessageTime from "../_utils/formatDate";
import {
  SelectUser,
  newConversation,
  oldConversation,
  groupConversation,
  createNewConversation,
  GroupConversation,
  changeStateGroup,
  UpdateDataUSer,
  bar,
  create_Group,
  clearfilterData,
  readAllMessage,
  readAllMessageGroup,
  emitEvent,
  clearReadMsgs,
  clearReadMsgsgroup,
} from "../../../store/feature/chat/chatSlice.js";

import { IoMdArrowDropleft, IoMdAdd } from "react-icons/io";
import { FaUserFriends } from "react-icons/fa";
import { IoCloudUploadOutline } from "react-icons/io5";
import styles from "./Chat.module.css";
import { AuthContext } from "@/lib/useAuth";
import propLoader from "../_utils/LoaderIMg";
import Friends from "./Friends.js";

import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Groups = () => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();
  const Groups = useSelector((state) => state.ChatState.data.groups);
  const group_to_filter = useSelector((state) => state.ChatState.filtergroup);
  const groupsConversation = useSelector(
    (state) => state.ChatState.groupsConversation
  );

  return (
    <div className="w-full   min-h-[200px]   flex flex-col  grow-0 my-4    justify-start items-center px-4 gap-4  ">
      <div className="w-full flex flex-row  grow-0 items-center justify-start ">
        <span className="text-sm text-white me-3 p-1 bg-[#0174D9] rounded-full w-[27px] h-[27px] grid place-content-center  ">
          <BsFillPeopleFill />{" "}
        </span>
        <h1 className="capitalize rounded text-[#0174D9]   text-base font-medium self-start ">
          groups & channels
        </h1>
      </div>
      <div className="flex flex-col  flex-1 grow-0 w-full text-base  m-0  gap-2 ">
        {!Groups?.length && (
          <div className="w-[100%] h-[200px]  grid place-content-center text-[#C0C1C5]">
            No group Chat
          </div>
        )}
        {Groups?.map((group, index) => {
          const { id, name, last_msg, date_Create, avatar, counters } = group;
          return (
            <div
              className={
                group_to_filter === id
                  ? `${styles.hide} flex flex-row w-full  p-0 h-full min-h-[70px] m-0   mt-2   `
                  : "flex flex-row w-full items-center    p-0 h-[70px] min-h-[70px] m-0   mt-2  cursor-pointer"
              }
              key={id}
              onClick={() => {
                dispatch(groupConversation());
                dispatch(
                  GroupConversation({
                    value: id,
                  })
                );
                dispatch(clearReadMsgsgroup({ id: id }));
                dispatch(
                  readAllMessageGroup({
                    group: id,
                    userid: user.userInfo.id,
                  })
                );
                // emitEvent();
              }}
            >
              <Image
                src={`${avatar}`}
                alt="Group avatar"
                className={`h-14 w-14 ${styles.cercle}`}
                width={400}
                height={300}
                loader={propLoader}
              />
              <div className="flex flex-col items-start  justify-between grow py-1 m-0 ms-2   max-w-[50%] h-[70px]">
                <h2 className="text-[#034B8A] capitalize  text-base  font-medium  leading-7 m-0 p-0">
                  {name}
                </h2>
                <p className="w-full text-[#C0C1C5] capitalize  font-light text-base m-0 p-0  whitespace-nowrap text-ellipsis overflow-hidden  ">
                  {last_msg}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between grow py-2 m-0 ms-2 gap-2  h-full">
                {counters != 0 && groupsConversation !== id ? (
                  <p className="h-[20px] min-w-[20px] bg-blue-500 text-white text-base  rounded-full grow-0 grid place-content-center">
                    {counters}
                  </p>
                ) : (
                  <BsCheck2All className="text-blue-500 text-base " />
                )}
                <p className="text-slate-200 text-sm  p-0">
                  {formatMessageTime(date_Create)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Allconversation = () => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();
  const conversations = useSelector(
    (state) => state.ChatState.data.conversation
  );
  const idConversation = useSelector(
    (state) => state.ChatState.userConversation
  );
  const userid = useSelector((state) => state.ChatState.userID);
  const converation_to_delete = useSelector(
    (state) => state.ChatState.filterconversation
  );
  const [conversation, setConversation] = useState(conversations);

  useEffect(() => {
    setConversation(conversations);
  }, [conversations]);

  return (
    <div className="w-full   min-h-[200px]  flex flex-col grow-0    justify-start items-center px-4 gap-2 overflow-x">
      <div className="w-full   flex flex-row grow-0 items-center justify-start ">
        <span className="text-sm text-white me-3 p-1 bg-[#0174D9] rounded-full w-[27px] h-[27px] grid place-content-center  ">
          <BsChatText />{" "}
        </span>
        <h1 className="capitalize rounded text-[#0174D9]   text-base font-medium self-start  ">
          All Message
        </h1>
      </div>
      <div className="flex flex-col items-center flex-1 gap-4 w-full text-base  m-0   ">
        {!conversations?.length && (
          <div className="w-[100%] h-[200px]  grid place-content-center text-[#C0C1C5]">
            No converation Chat
          </div>
        )}
        {conversations?.map((conversation, index) => {
          if (conversation?.sender?.id != user.userInfo.id) {
            const {
              id,
              sender: { first_name, last_name, username, avatar_url },
              last_msg,
              date,
              counters,
            } = conversation;
            return (
              <div
                className={
                  converation_to_delete == id
                    ? `${styles.hide} flex flex-row w-full  p-0 h-full min-h-[70px] m-0   mt-2  bg-red-500 `
                    : "flex flex-row w-full  items-center p-0 h-full min-h-[70px] m-0   mt-2 cursor-pointer "
                }
                key={index}
                onClick={() => {
                  dispatch(SelectUser({ value: id }));
                  dispatch(oldConversation());
                  dispatch(clearReadMsgs({ id: id }));
                  dispatch(
                    readAllMessage({
                      conversation: id,
                      userid: user.userInfo.id,
                    })
                  );
                  // emitEvent();
                }}
              >
                <Image
                  src={avatar_url || avatar}
                  height={64}
                  width={64}
                  loader={propLoader}
                  alt={avatar}
                  className={`h-14 w-14 ${styles.cercle}  `}
                />
                <div className="flex flex-col items-start  justify-between grow  m-0 ms-2  gap-2  max-w-[50%] h-[70px]  ">
                  <p className="text-[#034B8A] capitalize  text-base  font-medium  leading-7 m-0 p-0 w-full">
                    {first_name} {last_name}
                  </p>
                  <p className="w-full h-[35px] text-[#C0C1C5] capitalize  font-light text-base m-0 py-2 text-ellipsis overflow-hidden  ">
                    {last_msg}
                  </p>
                </div>
                <div className="flex flex-col items-end  justify-between grow py-2 m-0 ms-2 gap-4  h-full">
                  {counters != 0 && idConversation != id && userid == 0 ? (
                    <p className="h-[20px] min-w-[20px] bg-blue-500 text-white text-base  rounded-full grow-0 grid place-content-center">
                      {counters}
                    </p>
                  ) : (
                    <BsCheck2All className="text-blue-500 text-base " />
                  )}

                  <p className="text-slate-200 text-xs w-full text-end   ">
                    {formatMessageTime(date)}
                  </p>
                </div>
              </div>
            );
          } else {
            const {
              id,
              receiver: { first_name, last_name, username, avatar_url },
              last_msg,
              date,
              counters,
            } = conversation;
            return (
              <div
                className={
                  converation_to_delete == id
                    ? `${styles.hide} flex flex-row w-full  p-0 h-full min-h-[70px] m-0   mt-2   `
                    : "flex flex-row w-full items-center  p-0 h-full min-h-[70px] m-0   mt-2 cursor-pointer "
                }
                key={index}
                onClick={() => {
                  dispatch(SelectUser({ value: id }));
                  dispatch(oldConversation());
                  dispatch(clearReadMsgs({ id: id }));
                  dispatch(
                    readAllMessage({
                      conversation: id,
                      userid: user.userInfo.id,
                    })
                  );
                  // emitEvent();
                }}
              >
                <Image
                  src={avatar_url || avatar}
                  height={64}
                  width={64}
                  loader={propLoader}
                  alt="avatar"
                  className={`h-14 w-14 ${styles.cercle}  `}
                />
                <div className="flex flex-col items-start  max-w-[60%] justify-between grow gap-2  m-0 ms-2    h-full ">
                  <p className="text-[#034B8A] text-base  font-medium leading-7 m-0">
                    {first_name} {last_name}
                  </p>
                  <p className="w-full h-[35px] text-[#C0C1C5] capitalize  font-light text-base m-0 p-0 text-ellipsis overflow-hidden  ">
                    {last_msg}
                  </p>
                </div>
                <div className="flex flex-col items-end  justify-between grow py-2 m-0 ms-2 gap-4  h-full">
                  {counters != 0 && idConversation != id && userid == 0 ? (
                    <p className="h-[20px] min-w-[20px] bg-blue-500 text-white text-base   rounded-full grow-0 grid place-content-center">
                      {counters}
                    </p>
                  ) : (
                    <BsCheck2All className="text-blue-500 text-base text-end " />
                  )}

                  <p className="text-slate-200 text-xs w-full text-end  ">
                    {formatMessageTime(date)}
                  </p>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

const UserOnline = ({ UsersOnline }) => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();

  return (
    <div className="w-full  min-h-[120px]  flex flex-col items-center  grow-0 just ify-start px-6     ">
      <h1 className="h-full capitalize  text-[#DEDEDE]   text-base  font-medium my-2 p-0  self-start">
        online now
      </h1>
      <div className=" w-full flex flex-row justify-start grow-0 items-start mb-2 overflow-auto">
        {UsersOnline?.length ? (
          UsersOnline?.map((user, index) => {
            const { first_name: name, id, avatar_url } = user;
            return (
              <span
                className={`${styles.cercle} ${styles.imageWrapper} grid place-content-center me-2 justify-start grow-0 w-16 h-16 cercle relative cursor-pointer `}
                key={index}
              >
                <Image
                  src={avatar_url || avatar}
                  height={64}
                  width={64}
                  loader={propLoader}
                  alt="avatar"
                  className={`${styles.cercle} border-4 border-green-700 cursor-pointer`}
                />
                <span
                  className={`${styles.New_conversation}  ${styles.hiddenSpan} `}
                  onClick={() => {
                    dispatch(newConversation());
                    dispatch(createNewConversation({ value: id }));
                  }}
                >
                  <BiSolidMessageSquareAdd
                    className="text-lprimary text-base font-bold text-blue-500"
                    title="add conversation"
                  />
                </span>
              </span>
            );
          })
        ) : (
          <span
            className={` grid place-content-center me-2 justify-start grow-0 w-16 h-16 cercle relative  `}
          >
            <Image
              src={avatar}
              alt={avatar}
              className={`${styles.cercle}  outline-2 outline-green-400`}
            />
          </span>
        )}
      </div>
    </div>
  );
};

const Search = ({ createGroup, setCreateGroup }) => {
  const { user } = useContext(AuthContext);
  const [img, setImg] = useState("");
  const [Files, setFiles] = useState("");
  const [GroupName, setGroupName] = useState("");
  const dispatch = useDispatch();
  const [filter, setFilter] = useState("");
  const reg = /[A-Z]/gi;

  let userId = user.userInfo.id;
  const messageData = {
    type: "send_message_to_user",
    recipient_user_id: userId,
    message: "Hello, world!",
  };

  const stateGRoup = useSelector((state) => state.ChatState.groupState);
  const friends = useSelector((state) => state.ChatState.data.friends);
  const datafilter = useSelector((state) => state.ChatState.bardata);
  let socketG = useSelector((state) => state.ChatState.socketG);

  const [data, setData] = useState(
    useSelector((state) => state.ChatState.data)
  );
  const [friends_active, setActiveFriends] = useState(data?.friends_active);
  const [conversation, setconversations] = useState(data?.conversation);
  const protocol = "wss://";
  const ENTPOINT = `${protocol}${window.location.hostname}:443/api/chat/hello/`;

  let ws = useRef();
  useEffect(() => {
    ws.current = new WebSocket(`${ENTPOINT}`);
    ws.current.onopen = function (e) {
    };
    ws.current.onerror = (error) => {
      toast.error("Connection problem for baruser");
    };

  }, []);

  useEffect(() => {
    if (socketG != 0 && ws.current.readyState == WebSocket.OPEN) {
      ws?.current?.send(
        JSON.stringify({
          type: "send_message_to_user",
          id: user.userInfo.id,
        })
      );
    }

    ws.current.onmessage = function (event) {
      if (event) {
        const parsedEvent = JSON.parse(event.data);
        const { type, message } = parsedEvent;
        if (type === "user.update") {
          dispatch(UpdateDataUSer({ data: message }));
          setData(message);
          setActiveFriends(message.friends_active);
          setconversations(message.conversation);
        }
      }
    };
  }, [socketG]);

  const handleFetch = (e) => {
    e.preventDefault();
    setFilter(e.target.value);
    if (e.target.value) {
      dispatch(
        bar({
          id: user.userInfo.id,
          target: e.target.value,
        })
      );
    }
  };

  return (
    <div
      className="w-full h-full flex-col items-start  "
      onClick={() => dispatch(clearfilterData())}
    >
      <form
        className=" bg-[#F5F7F9] w-full min-h-10 rounded-md flex flex-row items-center justify-start p-2 ps-6  relative mb-4"
        onSubmit={handleFetch}
      >
        <span>
          <CiSearch className="text-[#898F94] text-2xl font-bold me-4" />
        </span>
        <input
          type="search"
          placeholder="Search.."
          className="flex-1 h-full bg-transparent text-base font-normal outline-none text-colorInput placeholder:text-[#898F94]"
          value={filter}
          onChange={(e) => handleFetch(e)}
        />
        {datafilter && (
          <div className="w-full  flex flex-col justify-start  items-center absolute top-full left-0 z-10 bg-backgroundchat rounded-xl  p-3 ">
            {datafilter.user && (
              <Findusers
                users={datafilter.user}
                conversations={datafilter.conversations}
              />
            )}
          </div>
        )}
      </form>
      <UserOnline UsersOnline={friends_active} />
      {/* <Groups /> */}
      <Allconversation conversations={conversation} />
    </div>
  );
};

export default Search;

const Findusers = ({ users, conversations }) => {
  const dispatch = useDispatch();
  return (
    <>
      {users?.map((user, index) => {
        const { last_name, username, first_name, avatar_url } = user;

        return (
          <div
            className="flex flex-row w-full  items-center p-0  max-h-[60px] m-0   mt-2 bg-secondary py-2 "
            key={index}
            onClick={() => {
              dispatch(SelectUser({ value: conversations[index].id }));
              dispatch(oldConversation());
              dispatch(clearfilterData());
            }}
          >
            <Image
              src={avatar_url || avatar}
              height={64}
              width={64}
              loader={propLoader}
              alt="avatar"
              className={` h-[40px]  w-[40px] rounded-full block object-fill   `}
            />
            <div className="flex flex-col items-start  justify-between grow m-0 ms-2    h-full">
              <p className="text-[#034B8A] capitalize text-base  font-bold  leading-7 m-0 p-0">
                {first_name} {last_name}
              </p>
              <p className="text-textgray capitalize  text-base  font-medium  m-0 p-0 text-ellipsis  ">
                {username}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
};
