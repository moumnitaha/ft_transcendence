import React from "react";
import { DoubleSide } from "three";

const Net = ({ position, dimensions, color }) => (
  <mesh position={position}>
    <boxGeometry args={dimensions} />
    <meshPhysicalMaterial
      color={color}
      side={DoubleSide}
      transparent
      opacity={0.5}
    />
  </mesh>
);
export default Net;
