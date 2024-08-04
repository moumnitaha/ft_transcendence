import React from 'react'
import { MdErrorOutline } from "react-icons/md";

const Error = ({message}) => {
  {
      return(
        <div className='w-full h-[20%] text-red-500  flex items-start justify-center g-x-4  '>
        {message.length > 300 && <>
        <MdErrorOutline className='text-base' />
        <p className='text-sm'> Message is too long. Please keep it under 300 characters. </p>
        </>
      }
   </div> 
      )
  }
}

export default Error
