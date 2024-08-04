import React, { memo } from "react";
import Cube from "./Cube";
import Line from "./Line";
import Plane from "./Plane";
import Net from "./Net";
import TableStand from "./TableStand";
import Ball from "./Ball";
import Background from "./Background";
import FacingText from "./FacingText";
import CameraController from "./CameraController";
import PingPongRacket from "./Racket";
import { OrbitControls } from "@react-three/drei";

const MBack = memo(({ bg }) => <Background bg={bg} />);
MBack.displayName = "MBack";
const MemorizedBackground = React.memo(({ bg }) => <MBack bg={bg} />);
MemorizedBackground.displayName = "MemorizedBackground";

const Scene = ({
  p,
  player,
  score1,
  score2,
  lpaddleRef,
  rpaddleRef,
  ballRef,
  camPos,
  bg,
}) => {
  return (
    <>
      <MemorizedBackground bg={bg} />
      <spotLight
        position={[0, 0, 120]}
        intensity={350000}
        angle={Math.PI / 4}
        penumbra={0.25}
        decay={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        color={0xffffff}
      />
      <ambientLight color={0xffffff} intensity={5} />
      <directionalLight
        color={0xffffff}
        intensity={30}
        position={[p * -20, 0, 10]}
        castShadow
        shadow-mapSize={1024}
      />
      <directionalLight
        color={0xffffff}
        intensity={30}
        position={[p * 20, 0, 10]}
        castShadow
        shadow-mapSize={1024}
      />
      <directionalLight
        color={0xffffff}
        intensity={30}
        position={[0, p * 20, 10]}
        castShadow
        shadow-mapSize={1024}
      />
      <directionalLight
        color={0xffffff}
        intensity={30}
        position={[0, p * -20, 10]}
        castShadow
        shadow-mapSize={1024}
      />
      <directionalLight
        color={0xffffff}
        intensity={3}
        position={[-82, 0, 30]}
        castShadow
        shadow-mapSize={1024}
      />
      <directionalLight
        color={0xffffff}
        intensity={3}
        position={[82, 0, 30]}
        castShadow
        shadow-mapSize={1024}
      />
      <FacingText position={[0, player === 1 ? -50 : 50, 50]} color={0xff5050}>
        {score1}
      </FacingText>
      <FacingText position={[0, player === 1 ? 50 : -50, 50]} color={0x5050ff}>
        {score2}
      </FacingText>
      <Plane
        position={[0, 0, 5]}
        dimensions={[180, 100, 0.01]}
        color={0x222831}
      />
      <TableStand
        position={[0, 0, 2.35]}
        dimensions={[180, 100, 5]}
        color={"#222831"}
      />
      <Net
        position={[0, 0, 10]}
        dimensions={[0.25, 100, 10]}
        color={0xf1f2f3}
      />
      {/* red paddle */}
      <PingPongRacket
        position={[82, 0, 20]}
        color={0xff5050}
        materialProps={{
          metalness: 0.6,
          roughness: 0.2,
          clearcoat: 1,
          clearcoatRoughness: 0,
          transmission: 0.25,
          opacity: 1,
        }}
        refo={rpaddleRef}
        k={0}
      />
      <PingPongRacket
        position={[-82, 0, 20]}
        color={0x5050ff}
        materialProps={{
          metalness: 0.6,
          roughness: 0.2,
          clearcoat: 1,
          clearcoatRoughness: 0,
          transmission: 0.25,
          opacity: 1,
        }}
        refo={lpaddleRef}
        k={1}
      />
      <Cube
        position={[0, 50.125, 9]}
        dimensions={[180, 0.25, 18]}
        color={0x9f9f9f}
        materialProps={{
          transparent: true,
          transmission: 1,
          opacity: 0.5,
          roughness: 0.125,
          depthWrite: false,
          depthTest: true,
        }}
      />
      {/* left wall */}
      <Cube
        position={[0, -50.125, 9]}
        dimensions={[180, 0.25, 18]}
        color={0x9f9f9f}
        materialProps={{
          transparent: true,
          transmission: 1,
          opacity: 0.5,
          roughness: 0.125,
          depthWrite: false,
          depthTest: true,
        }}
      />
      <Ball
        position={[0, 0, 3 + 5 + 20 + 5]}
        radius={3}
        color={0xffffff}
        refo={ballRef}
      />
      <Line position={[0, 0, 5]} dimensions={[180, 1, 0.1]} color={0xf1f2f3} />
      <Line
        position={[-89, 0, 5]}
        dimensions={[2, 100, 0.1]}
        color={0xf1f2f3}
      />
      <Line position={[89, 0, 5]} dimensions={[2, 100, 0.1]} color={0xf1f2f3} />
      <Line position={[0, 49, 5]} dimensions={[180, 2, 0.1]} color={0xf1f2f3} />
      <Line
        position={[0, -49, 5]}
        dimensions={[180, 2, 0.1]}
        color={0xf1f2f3}
      />
      <CameraController camPos={camPos} player={player} />
      <OrbitControls />
    </>
  );
};

export default Scene;
