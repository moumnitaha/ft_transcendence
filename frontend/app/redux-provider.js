"use client";
import { useRef } from "react";
import { Provider } from "react-redux";
import { Store } from "./store/store";
// import chatreducer  from './store/feature/chat/chatslice';

export default function ReduxProvider({ children }) {
  return <Provider store={Store}>{children}</Provider>;
}
