import React from "react";
import { DoubleSide } from "three";
const Line = ({ position, dimensions, color }) => (
  <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={dimensions} />
    <meshPhysicalMaterial color={color} side={DoubleSide} />
  </mesh>
);
export default Line;
