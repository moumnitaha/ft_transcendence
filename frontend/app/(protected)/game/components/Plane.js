import React from "react";

const Plane = ({ position, dimensions, color }) => (
  <mesh position={position} receiveShadow castShadow>
    <boxGeometry args={dimensions} />
    <meshPhongMaterial color={color} />
  </mesh>
);

export default Plane;
