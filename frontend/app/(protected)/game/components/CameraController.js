import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";

const CameraController = ({ camPos, player }) => {
  const { camera } = useThree();
  const camRef = useRef(camera);
  camera.fov = 45;
  camera.aspect = 16 / 9;
  camera.near = 1;
  camera.far = 1000;

  useEffect(() => {
    if (camRef.current) {
      const cam = camRef.current;
      const duration = 1;
      const ease = "power2.inOut";
      if (camPos === "up") {
        gsap.to(cam.position, {
          x: 0,
          y: 0,
          z: 145,
          duration,
          ease,
        });
      } else if (camPos === "side") {
        gsap.to(cam.position, {
          x: 0,
          y: -120,
          z: 65,
          duration,
          ease,
        });
      } else if (camPos === "front") {
        gsap.to(cam.position, {
          x: (player === 1 ? -1 : 1) * 150,
          y: 0,
          z: 65,
          duration,
          ease,
        });
      }
    }
  }, [camPos, player]);

  return null;
};

export default CameraController;
