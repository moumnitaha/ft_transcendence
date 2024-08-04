import {createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios';
// import axiosInstance from "../../../axios/axios"
import ChatApi from './instanceaxios'
const initialState = {
    message :[],
    status : 'idle', 
    error : null, 
}



export const deleteAllMessage = createAsyncThunk ('message/deleteAllMessage', async({conversation, userid}) => {
    const response = await ChatApi.put(`/chat/delete/${conversation}/${userid}`)
    const {data} = response;
    return data

})





export const dataUser = createAsyncThunk ('user/dataUser', async({sender, reciever}) => {
    const response = await ChatApi.get(`/user/${reciever}/${sender}`)
    const {data} = response;

    return data


})



export const NewConversationSlice = createSlice ({
    name : 'message',
    initialState, 
    reducers: {
    },
    extraReducers(builder){
        builder
            .addCase(dataUser.pending, (state, action) =>{
                state.status = 'loading'
                state.message = []
                state.error = ''

            })
            .addCase(dataUser.fulfilled, (state, action) =>{
                state.status = 'successed'
                state.message = action.payload

            })
            .addCase(dataUser.rejected, (state, action) =>{
                 ("rejected message:", action.payload)
                state.status = 'failed'
                state.message = []
                state.error = action.error.message;
            })  
            .addCase(deleteAllMessage.fulfilled, (state, action) =>{
                state.status = 'successed'
            }) }
})



export default NewConversationSlice.reducer