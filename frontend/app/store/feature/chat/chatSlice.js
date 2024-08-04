import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// import axios from 'axios';

import ChatApi from "./instanceaxios";
const initialState = {
  data: [],
  new: {},
  status: "idle",
  error: null,
  userConversation: 0,
  groupsConversation: 0,
  userID: 0,
  new_conversation: false,
  converation: false,
  groups: false,
  groupState: false,
  groupid: "",
  addstate: false,
  Newgroup: {},
  filterconversation: 0,
  filtergroup: 0,
  socketG: 0,
  bardata: [],
};

export const fetchusers = createAsyncThunk(
  "users/fetchusers",
  async ({ id }) => {
    const response = await ChatApi.get(`/${id}/`);
    const { data } = response;
    return data;
  }
);

export const bar = createAsyncThunk(
  "users/filtedata",
  async ({ id, target }) => {
    const response = await ChatApi.get(`/filter/${id}/`, {
      params: { target: target },
    });
    const { data } = response;
    return data;
  }
);

export const adduser = createAsyncThunk(
  "user/adduser",
  async ({ groupid, userid }) => {
    const res = await ChatApi.post("/chat/group/add_user/", {
      user: userid,
      group: groupid,
      admin: false,
    });
    const { data } = res;
    return data;
  }
);

export const removeuser = createAsyncThunk(
  "user/removeuser",
  async ({ groupid, userid }) => {
    const res = await ChatApi.delete(`/delete/group/${groupid}/${userid}/`);
    const { data } = res;
    return data;
  }
);

export const create_Group = createAsyncThunk(
  "Group/createGroup",
  async (uploadData) => {
    const response = await ChatApi.post("/chat/group/create/", uploadData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const { data } = response;
    return data;
  }
);

export const readAllMessage = createAsyncThunk(
  "message/readAllMessage",
  async ({ conversation, userid }) => {
    const response = await ChatApi.put(`/chat/see/${conversation}/${userid}`);
    const { data } = response;
    return data;
  }
);

export const readAllMessageGroup = createAsyncThunk(
  "message/readAllMessageGroup",
  async ({ group, userid }) => {
    const response = await ChatApi.put(`/group/see/${group}/${userid}`);
    const { data } = response;
    return data;
  }
);

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    initializeSocket(state, action) {},
    emitEvent(state, action) {
      //   console.log("modifie scoket Golab")
      state.socketG += 1;
    },
    onEvent(state, action) {},
    UpdateDataUSer: (state, action) => {
      state.data = action.payload.data;
    },
    SelectUser: (state, action) => {
      state.userConversation = action.payload.value;
      state.userID = 0;
      state.groupsConversation = 0;
      state.filterconversation = 0;
      if (action.payload.id)
        state.data.conversation = state.data.conversation.filter(
          (ele) => ele.id !== action.payload.id
        );
    },
    createNewConversation: (state, action) => {
      state.userID = action.payload.value;
      state.groupsConversation = 0;
      state.userConversation = 0;
      state.filterconversation = 0;
      state.filtergroup = 0;
      if (action.payload.id) {
        state.data.conversation = state.data.conversation.filter(
          (ele) => ele.id !== action.payload.id
        );
      }
    },
    removeGroupAfterDelay: (state, action) => {
      const groupIdToRemove = action.payload.id;
      // Instead of performing async operation here, dispatch an action to handle it outside the reducer
      state.filtergroup = groupIdToRemove;
    },
    removeConversationAfterDelay: (state, action) => {
      const ConversationIdToRemove = action.payload.id;
      // Instead of performing async operation here, dispatch an action to handle it outside the reducer
      state.filterconversation = ConversationIdToRemove;
    },
    GroupConversation: (state, action) => {
      state.groupsConversation = action.payload.value;
      state.userID = 0;
      state.userConversation = 0;

      state.filtergroup = 0;
      if (action.payload.id)
        state.data.groups = state.data.groups.filter(
          (ele) => ele.id !== action.payload.id
        );
    },
    newConversation: (state, action) => {
      state.new_conversation = true;
      state.converation = false;
      state.groups = false;
    },
    oldConversation: (state, action) => {
      state.new_conversation = false;
      state.converation = true;
      state.groups = false;
    },
    groupConversation: (state, action) => {
      state.new_conversation = false;
      state.converation = false;
      state.groups = true;
    },
    addconversation: (state, action) => {
      const date = new Date();
      state.new = {
        ...action.payload.data,
        last_msg: action.payload.msg,
        date: date.toString(),
      };
      const filteredConversations = state.data.conversation.filter(
        (ele) => ele.id !== state.new.id
      );
      state.data.conversation = [state.new, ...filteredConversations];
    },
    changeStateGroup: (state, action) => {
      state.groupState = false;
    },
    clearfilterData: (state, action) => {
      state.bardata = [];
    },
    clearReadMsgs: (state, action) => {
      state?.data?.conversation?.forEach((element) => {
        if (element.id == action.payload.id) {
          element.counters = 0;
        }
      });
    },
    clearReadMsgsgroup: (state, action) => {
      state?.data?.groups?.forEach((element) => {
        if (element.id == action.payload.id) {
          element.counters = 0;
        }
      });
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchusers.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchusers.fulfilled, (state, action) => {
        state.status = "successed";
        state.data = action.payload;
      })
      .addCase(fetchusers.rejected, (state, action) => {
        state.status = "failed";
        state.data = [];
        state.error = action.error.message;
      })
      .addCase(create_Group.pending, (state, action) => {})
      .addCase(create_Group.fulfilled, (state, action) => {
        state.groupState = true;
        state.data.groups = [...state.data.groups, action.payload.group];
        state.groupid = action.payload.group.id;
      })
      .addCase(create_Group.rejected, (state, action) => {
        state.addstate = false;
      })
      .addCase(adduser.pending, (state, action) => {})
      .addCase(adduser.fulfilled, (state, action) => {
        state.addstate = true;
      })
      .addCase(adduser.rejected, (state, action) => {
        state.addstate = false;
      })
      .addCase(bar.fulfilled, (state, action) => {
        if (action.payload) state.bardata = action.payload;
        else state.bardata = [];
      })
      .addCase(bar.rejected, (state, action) => {
        state.bardata = [];
      });
  },
});

export const {
  SelectUser,
  newConversation,
  oldConversation,
  groupConversation,
  createNewConversation,
  addconversation,
  GroupConversation,
  changeStateGroup,
  removeGroupAfterDelay,
  removeConversationAfterDelay,
  UpdateDataUSer,
  initializeSocket,
  emitEvent,
  onEvent,
  clearfilterData,
  clearReadMsgs,
  clearReadMsgsgroup,
} = chatSlice.actions;
export default chatSlice.reducer;
