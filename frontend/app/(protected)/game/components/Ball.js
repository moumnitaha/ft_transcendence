import React from "react";
import { DoubleSide } from "three";

const Ball = ({ radius, position, color, refo }) => (
  <mesh position={position} castShadow ref={refo}>
    <sphereGeometry args={[radius, 28, 28]} />
    <meshPhongMaterial color={color} side={DoubleSide} />
  </mesh>
);
export default Ball;
