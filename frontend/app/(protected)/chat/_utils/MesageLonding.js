import React from 'react'
import { TiMessages } from "react-icons/ti";
import styles from '../components/Chat.module.css'

const MesageLonding = () => {
  return (

    <section className={styles.bannerMessage}>
    <div className={styles.items3}>
        <TiMessages className='w-full h-full text-[200px] text-white capitalize shadow-sm ' />
    </div>
    <div className='w-full h-[100px] flex flex-col items-center justify-between capitalize  text-white  '>
    <p className='text-white   text-base tracking-wider text-center'>
        Message sameone and chat right now!
    </p>


    </div>

    </section>
  )
}

export default MesageLonding
