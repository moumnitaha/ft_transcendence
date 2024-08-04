import {createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { jwtDecode } from "jwt-decode";

// import {addHeader} from '../../../axios/axios'
import axios from 'axios';





const initialState = {
    status: 'idle',
    data : [],
    userData : {},
    error: '',
    isLoging: false
}

export const loginUser =  createAsyncThunk ('user/loginUser', async({email, password}) => {
    const response = await axios.post('http://localhost:8000/token/', {
            email : email, 
            password : password,
    }, {
        headers : { 'Content-Type': 'application/json' },
    })
    const {data} = response;
    return data

})


const loginSlice = createSlice({
    name : 'login',
    initialState,
    reducers : {

    },
    extraReducers(builder){
        builder
            .addCase(loginUser.pending, (state, action) => {
                state.status = 'loading'
            })
            .addCase(loginUser.fulfilled, (state, action) =>{
                state.status = 'successed'
                state.data = action.payload
                state.isLoging = true
                state.userData = jwtDecode(action.payload.access)
                window.localStorage.setItem('jwt', JSON.stringify(state.data))
                window.localStorage.setItem('id', JSON.stringify(state.userData.user_id))

            })
            .addCase(loginUser.rejected, (state, action) =>{
                state.status = 'failed'
                state.data = []
                state.error = action.error.message;
            })  
           
    }
})

export default loginSlice.reducer