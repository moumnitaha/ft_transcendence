import {createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios';


import ChatApi from './instanceaxios'

const initialState = {
    message :[],
    status : 'idle', 
    error : null, 
    blocked: false,
    data: []
   
}





export const Fetch_message_of_conversation = createAsyncThunk ('message/Fetch_message_of_conversation', async({conversation_id, page, id}) => {

    const response = await ChatApi.get(`/chat/${conversation_id}/${id}`)
        const {data} = response;
        return data

})


export const blockedUser = createAsyncThunk ('message/blockedUser', async({conversation_id, id}) => {
        const response = await ChatApi.put(`/chat/${conversation_id}/${id}`)
        const {data} = response;
        return data

})


export const dataUser = createAsyncThunk ('user/dataUser', async({sender, reciever}) => {
    const response = await ChatApi.get(`/user/${reciever}/${sender}`)
    const {data} = response;
    return data


})



export const MessageSlice = createSlice ({
    name : 'message',
    initialState, 
    reducers: {
        blockedConversation : () => {
             ("Blocked conversation dispatch");
        //    blockedUser(actions.payload.id)
            // state.message.converation.blocked = true;
        }
    },
    extraReducers(builder){
        builder
            .addCase(Fetch_message_of_conversation.pending, (state, action) => {
                //// ("loading pending")
                state.status = 'loading'
                state.message = []
                state.data = []
                state.error = ''
            })
            .addCase(Fetch_message_of_conversation.fulfilled, (state, action) =>{
                state.status = 'successed'
                state.message = action.payload
                state.data = []
                state.error = ''
                // state.blocked = action.payload.conversation

            })
            .addCase(Fetch_message_of_conversation.rejected, (state, action) =>{
                state.status = 'failed'
                state.message = []
                state.data = []
                state.error = action.error.message;
            })

            // .addCase(Fetch_messages.fulfilled, (state, action) =>{
            //     state.status = 'successed'
            //     state.message = action.payload
            //     // state.blocked = action.payload.conversation

            // })
            // .addCase(Fetch_messages.rejected, (state, action) =>{
            //     state.status = 'failed'
            //     state.data = []
            //     state.error = action.error.message;
            // })
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
            .addCase(blockedUser.fulfilled, (state, action) =>{
                state.status = 'successed'
                // state.data = action.payload

            })
    }
})


export const  {blockedConversation} = MessageSlice.actions

export default MessageSlice.reducer