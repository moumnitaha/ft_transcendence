"use client";
import React, {
  Fragment,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
} from "react";

import { fetchusers } from "../../store/feature/chat/chatSlice.js";
// import User from "./components/User";
import Search from "./components/Search";
import Conversation from "./components/Conversation";
// import ClipLoader from "react-spinners/ClipLoader";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/lib/useAuth";
// import { lol } from '@/services/test';

function Page() {
  const { user } = useContext(AuthContext);
  const userData = useSelector((state) => state.login.userData);
  //  (userData.user_id)

  const dispatch = useDispatch();
  const state = useSelector((state) => state.ChatState);
  const [createGroup, setCreateGroup] = useState(false);

  const router = useRouter();

  useEffect(() => {
    dispatch(fetchusers({ id: user?.userInfo?.id }));
  }, []);

  if (state.status === "successed") {
    return (
      <section className="w-full   h-full overflow-y-hidden flex flex-row justify-start p-0    ">
        <section className="  h-full  max-w-[450px]   relative w-[400px] flex flex-col grow-0 justify-start items-start  shadow  border-gray border-e  p-0   ">
          <div className="w-[400px] h-full gap-4 overflow-y-auto overflow-x-hidden    flex flex-col items-center justify-start  px-4 py-3">
            <Search createGroup={createGroup} setCreateGroup={setCreateGroup} />
          </div>
        </section>
        <Conversation />
      </section>
    );
  } else if (state.status === "failed") {

    return null;

  }
}
export default Page;
