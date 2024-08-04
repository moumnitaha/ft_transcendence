import React from "react";
import { useEffect } from "react";
import backGround from "../assets/s.png";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const Background = ({ bg }) => {
  const { scene, gl: renderer } = useThree();
  const loader = new THREE.TextureLoader();

  useEffect(() => {
    // console.log("BGGGG+++++++++++++++", bg);
    const texture = loader.load(bg || backGround, () => {
      //   texture.encoding = THREE.sRGBEncoding;
      scene.background = texture;
    });

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.shadowMap.needsUpdate = true;

    return () => {
      // Clean up texture if needed
      texture.dispose();
    };
  }, [bg, loader, renderer, scene]);

  return null;
};

Background.displayName = "Background";

export default Background;
