import React, {useRef, useEffect, useState, useMemo} from 'react'
// import ChatAnimation from '@/public/images/chat.gif';
// import Image  from 'next/image'
import { useSelector, useDispatch } from 'react-redux';
import Chat from './Chat.js'
// import Groups from './Groups.js'
import Newconversation from './NewConversation.js'
import MesageLonding from '../_utils/MesageLonding.js';






const Conversation = () => {
  const [message , setMessage] = useState([])
  const [msg , setMsg] = useState('')
  const dispatch = useDispatch();
  const conversation_id = useSelector(state => state.ChatState.userConversation)
  const newConvrsations_id = useSelector(state => state.ChatState.userID)
  const Template = useSelector(state => state.ChatState)
  const btn = useRef()








if(conversation_id == 0  && newConvrsations_id == 0 )
  {
  return <MesageLonding />

  }

else
{
  if(Template.new_conversation)
    return <Newconversation  id={newConvrsations_id}/>
  else if (Template.converation)
    {
      return <Chat conversation_id={conversation_id} />
    }
}


}

export default Conversation