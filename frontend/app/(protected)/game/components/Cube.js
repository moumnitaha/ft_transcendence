import React from "react";
import { DoubleSide } from "three";

const Cube = ({ position, dimensions, color, materialProps, refo }) => (
  <mesh position={position} castShadow receiveShadow ref={refo}>
    <boxGeometry args={dimensions} />
    <meshPhysicalMaterial color={color} side={DoubleSide} {...materialProps} />
  </mesh>
);

export default Cube;
