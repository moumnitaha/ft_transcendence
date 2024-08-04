'use client'
import  { configureStore } from '@reduxjs/toolkit';
import chatreducer  from './feature/chat/chatSlice';
import MessageReducer  from './feature/chat/MessageSlice.js';
import NewConversationReducer  from './feature/chat/newConversation.js';
import GroupsConversationReducer from './feature/chat/groupsSlice.js'
import LoginReducer from './feature/auth/userAuthSLice.js'
// import { createWrapper } from 'next-redux-wrapper';



export const Store = configureStore({
    reducer: {
        ChatState: chatreducer,
        Message: MessageReducer,
        newConversation: NewConversationReducer,
        groups: GroupsConversationReducer,
        login: LoginReducer,
        // slice for reduce
    },
    devTools: true,

});


// export const wrapper = createWrapper(Store);