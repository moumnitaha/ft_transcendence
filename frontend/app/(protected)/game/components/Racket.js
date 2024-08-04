import React, { useRef } from "react";
import { DoubleSide } from "three";

const PingPongRacket = ({ position, color, materialProps, refo, k }) => {
  const handleRef = useRef();
  const paddleRef = useRef();

  return (
    <group position={position} ref={refo} rotation={[0, k ? -0.1 : 0.1, 0]}>
      {/* Racket Head */}
      <mesh
        ref={paddleRef}
        rotation={[0, 0, Math.PI / 2]}
        position={[0, 0, 0]}
        scale={[1, 1, 1.15]} // Make the head slightly oval
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[6, 6, 0.5, 64]} />
        <meshPhysicalMaterial
          color={color}
          side={DoubleSide}
          {...materialProps}
        />
      </mesh>
      {/* Handle */}
      <mesh
        ref={handleRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -8]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.5, 0.5, 5, 32]} />
        <meshPhysicalMaterial color="#000" {...materialProps} />
      </mesh>
    </group>
  );
};

export default PingPongRacket;
