import React, {useState} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import {
    adduser,
    changeStateGroup,
  } from "../../../store/feature/chat/chatSlice.js";

import propLoader from '../_utils/LoaderIMg.js'
import { IoMdArrowDropleft, IoMdAdd } from "react-icons/io";
import avatar from "../../../../public/images/avatar.jpg";
import Image from 'next/image.js';


const Friend = ({ ele }) => {
    const dispatch = useDispatch();
    const [invite, setInvite] = useState(true);
    const { groupid, addstate } = useSelector((state) => state.ChatState);
  
    const { id, username, first_name, last_name, avatar_url } = ele;
    return (
      <div
        className="w-full min-h-[80px] grow-0 gap-2  flex flex-row  items-center justify-center  border-b-[0.5px] border-[#EEEEEE] "
        key={id}
      >
        <Image
          src={avatar_url || avatar}
          height={64}
          width={64}
          loader={propLoader}
          alt="profile"
          className="h-14 w-14 rounded-full"
        />
        <div className="text-[#474A4B] text-start ms-2 grow flex flex-col justify-between ">
          <p className="text-base w-full capitalize p-0 m-0 ">
            {first_name} {last_name}
          </p>
          <p className="text-sm w-full font-thin text-[#A0A5A9] m-0 p-0">
            {username}
          </p>
        </div>
        {invite && (
          <IoMdAdd
            className="place-self-center w-[60px] h-[30px] border-spacing-1 border p-1 border-[#EDFAFF]   grow-0  text-base  text-[#00498A] bg-[#EDFAFF]  rounded-sm shadow-gradient cursor-pointer"
            onClick={() => {
              dispatch(
                adduser({
                  groupid : groupid,
                  userid: id,
                })
              );
              setInvite(false);
            }}
          />
        )}
      </div>
    );
  };



const Friends = ({ friends, setCreateGroup }) => {
  const dispatch = useDispatch();
  return (
    <div className="w-full h-full  gap-6 mt-4 flex flex-col  items-start justify-between  ">
      <div className="flex flex-col items-start justify-start w-full h-full  ">
        {friends.map((ele) => {
          const { id } = ele;
          return <Friend key={id} ele={ele} />;
        })}
      </div>
      {setCreateGroup && <button
        className="  w-[100px] h-[40px] self-end ms-auto p-2 uppercase font-bold  tracking-widest  bg-blue-500 text-white text-sm text-center border-2 rounded-md  grow-0"
        onClick={() => {
          setCreateGroup(false);
          dispatch(changeStateGroup());
        }}
      >
        done
      </button>}
    </div>
  );
};



export default Friends
