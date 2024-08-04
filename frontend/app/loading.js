import React from "react";
// import { ModelViewer } from '../components/model-viewer';
import { HashLoader } from "react-spinners";

const Loading = () => {
  return (
    <div className="w-full min-h-screen bg-white-500 text-white text-9xl flex justify-center items-center">
      <HashLoader color={"#fff"} size={250} />
    </div>
  );
};

export default Loading;
