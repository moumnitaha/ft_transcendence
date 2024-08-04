import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { Text3D } from "@react-three/drei";
import fontData from "../assets/helvetiker_regular.typeface.json";
import { rotate } from "three/examples/jsm/nodes/Nodes";

const FacingText = ({ color, children, ...props }) => {
  const textRef = useRef();

  useFrame(({ camera }) => {
    if (textRef.current) {
      textRef.current.lookAt(camera.position);
    }
  });

  const materialProps = {
    color: color,
    transparent: true,
    opacity: 0.9, // Increased opacity for a slightly more solid look
    roughness: 0.2, // Lower roughness for a shinier surface
    metalness: 0.6, // Adds a metallic look
    clearcoat: 1, // Adds a clear coat on top
    clearcoatRoughness: 0, // Smooth clear coat
    depthWrite: true,
  };

  return (
    <Text3D
      //   rotateX={Math.PI}
      ref={textRef}
      font={fontData}
      size={14}
      height={1}
      curveSegments={20}
      bevelEnabled={true}
      bevelThickness={1}
      bevelSize={1}
      bevelOffset={0}
      bevelSegments={1}
      {...props}
    >
      {children}
      <meshStandardMaterial attach="material" {...materialProps} />
    </Text3D>
  );
};

export default FacingText;
