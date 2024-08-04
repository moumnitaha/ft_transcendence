import React from "react";

const TableStand = ({ position, dimensions, color }) => (
  <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={dimensions} />
    <meshPhongMaterial color={color} />
  </mesh>
);

export default TableStand;
