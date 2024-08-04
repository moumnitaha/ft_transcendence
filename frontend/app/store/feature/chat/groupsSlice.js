import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import ChatApi from "./instanceaxios";
// import axiosInstance from "../../../axios/axios"
const initialState = {
  status: "idle",
  data: [],
  error: "",
};

export const dataofgroup = createAsyncThunk(
  "groups/dataofgroup",
  async ({ id, user }) => {
    const response = await ChatApi.get(`/chat/groups/${id}/${user}`);
    const { data } = response;
    return data;
  }
);

export const deleteAllMessage = createAsyncThunk(
  "message/deleteAllMessage",
  async ({ group, userid }) => {
    const response = await ChatApi.put(`/group/delete/${group}/${userid}`);
    const { data } = response;
    return data;
  }
);


export const exitGroup = createAsyncThunk(
  "user/exitGroup",
  async ({ group, userid }) => {
    const response = await ChatApi.delete(`/delete/group/${group}/${userid}/`);
    const { data } = response;
    return data;
  }
);

export const GroupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(dataofgroup.pending, (state, action) => {
        state.status = "loading";
        state.data = [];
        state.error = "";
      })
      .addCase(dataofgroup.fulfilled, (state, action) => {
        state.status = "successed";
        state.data = action.payload;
      })
      .addCase(dataofgroup.rejected, (state, action) => {
        state.status = "failed";
        state.data = [];
        state.error = action.error.message;
      });
  },
});

export default GroupsSlice.reducer;
