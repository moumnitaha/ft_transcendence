"use client"
import React from 'react'

const Errors = ({error, reset}) => {
  return (
    <section className="min-h-screen  w-full flex flex-col items-center   not_found  ">
    <h1 className='font-bold text-[30rem] '>error </h1>
    <button  onClick={reset} className=" text-primary bg-slate-500 p-2 m-4 rounded  w-[150px] text-center skew-x-[-20deg] capitalize tracking-wide ">
    try again
      </button>
    </section>
  )
}

export default Errors
