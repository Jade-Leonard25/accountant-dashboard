import { motion } from 'motion/react';
import { useEffect } from 'react';
import LogoLogin from '../assets/logo.png';
import ElectricLogo from './ElectricLogo';
// Change this number to resize the logo (pixels)
const IMAGE_SIZE = 560;

export default function LoadingScreen({ onLoadingComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onLoadingComplete) onLoadingComplete();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (

      <ElectricLogo src={LogoLogin} 
       color="#ecc7ff"
    glowColor="#ad6dff"
    scale={0.7}
    strands={4}
    bend={0.6}
    crackle={1.5}
    arcs={1}
    speed={2.5}
    interactive
    intensity={1}
    glow={1}
    thickness={1.5}
    flicker={0.6}
    fill={0}
    cursorIntensity={0.75}
    cursorRadius={100}
      />
  );
}