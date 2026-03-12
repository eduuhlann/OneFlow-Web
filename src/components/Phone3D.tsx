import React, { useRef, Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  Float, 
  PresentationControls, 
  ContactShadows,
  RoundedBox,
  Environment,
  useTexture
} from '@react-three/drei';
import * as THREE from 'three';
import logo from '../assets/logo.png';
import whatsappImg from '../assets/whatsapp.jpg';

import { useFrame } from '@react-three/fiber';

import { useProfile } from '../contexts/ProfileContext';

const PhoneModel = ({ isOn, togglePower }: { isOn: boolean; togglePower: (e: any) => void }) => {
  const { profile } = useProfile();
  const logoTexture = useTexture(logo);
  const screenTexture = useTexture(whatsappImg);
  
  // Dynamic User Avatar from Supabase
  const avatarTexture = useTexture(profile?.avatar_url || logo);
  
  const groupRef = useRef<THREE.Group>(null);

  // Cinematic "Breathing" Animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. MAIN FRAME (Precision Matte Chasis - Physical Material) */}
      <RoundedBox 
        args={[3.07, 6.07, 0.22]} 
        radius={0.34} 
        smoothness={10} 
        castShadow 
      >
        <meshPhysicalMaterial 
          color="#151515" 
          roughness={0.7} 
          metalness={0.4} 
          reflectivity={0.5}
          clearcoat={0.1}
          clearcoatRoughness={0.2}
          envMapIntensity={0.8}
        />
      </RoundedBox>

      {/* 1b. SIM TRAY */}
      <mesh position={[1.535, -1.8, 0]}>
        <boxGeometry args={[0.01, 0.6, 0.08]} />
        <meshStandardMaterial color="#080808" />
      </mesh>
      <mesh position={[1.536, -1.9, 0]}>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshStandardMaterial color="#000" />
      </mesh>

      {/* 2. BACK PANEL (Physical Matte / Frosted Glass) */}
      <mesh position={[0, 0, -0.111]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.92, 5.92]} />
        <meshPhysicalMaterial 
          color="#111" 
          roughness={0.9} 
          metalness={0.05} 
          reflectivity={0.2}
          thickness={0.1} // Simulates frosted glass depth
          envMapIntensity={0.2}
        />
      </mesh>

      {/* 2b. BRANDING */}
      <mesh position={[0, -2, -0.112]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.6, 0.18]} />
        <meshBasicMaterial map={logoTexture} transparent opacity={0.2} />
      </mesh>

      {/* 4. FRONT SCREEN GLASS (Cleaned Reflections & Front Camera) */}
      <mesh position={[0, 0, 0.112]}>
        <planeGeometry args={[2.88, 5.88]} />
        {isOn ? (
          <meshBasicMaterial 
            map={screenTexture} 
            toneMapped={false}
          />
        ) : (
          <meshPhysicalMaterial 
            color="#000" 
            roughness={0.01} 
            metalness={0.4} 
            clearcoat={1}
            clearcoatRoughness={0}
            envMapIntensity={0.1} // Near-zero to remove the "city" reflection bug
          />
        )}
      </mesh>

      {/* 4b. FRONT CAMERA (Punch-hole) */}
      <group position={[0, 2.7, 0.113]}>
        <mesh>
          <circleGeometry args={[0.06, 32]} />
          <meshBasicMaterial color="#000" />
        </mesh>
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.04, 32]} />
          <meshStandardMaterial 
            color="#111" 
            transparent 
            opacity={0.6} 
            roughness={0} 
            metalness={1} 
            envMapIntensity={2}
          />
        </mesh>
      </group>

      {/* 4c. DYNAMIC PROFILE SYNC OVERLAY (App Header) */}
      {isOn && (
        <group position={[0, 1.8, 0.113]}>
           {/* Avatar Circle */}
           <mesh position={[-0.9, 0.5, 0]}>
             <circleGeometry args={[0.18, 32]} />
             <meshBasicMaterial map={avatarTexture} transparent />
           </mesh>
           {/* Divider/Header feel */}
           <mesh position={[0, 0.3, 0]}>
             <planeGeometry args={[2.5, 0.01]} />
             <meshBasicMaterial color="#ffffff" opacity={0.1} transparent />
           </mesh>
        </group>
      )}

      {/* 4. BUTTONS (Physically Accurate Grooves) */}
      {/* Power Button */}
      <group position={[1.53, -0.5, 0]}>
        <mesh 
          onClick={(e) => {
            e.stopPropagation();
            togglePower(e);
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = 'auto')}
        >
          <capsuleGeometry args={[0.045, 0.42, 10, 20]} />
          <meshPhysicalMaterial 
            color="#333" 
            metalness={1} 
            roughness={0.2}
            clearcoat={0.1}
          />
        </mesh>
        {/* Subtle button texture detail */}
        <mesh rotation={[0, 0, 0]}>
          <capsuleGeometry args={[0.046, 0.4, 4, 16]} />
          <meshBasicMaterial color="#000" wireframe opacity={0.1} transparent />
        </mesh>
      </group>

      {/* Volume Buttons */}
      <group position={[1.53, 0.5, 0]}>
        {[0.38, -0.05].map((y, i) => (
          <group key={i} position={[0, y, 0]}>
            <mesh>
              <capsuleGeometry args={[0.045, 0.38, 10, 20]} />
              <meshPhysicalMaterial color="#333" metalness={1} roughness={0.2} />
            </mesh>
            <mesh>
              <capsuleGeometry args={[0.046, 0.36, 4, 16]} />
              <meshBasicMaterial color="#000" wireframe opacity={0.1} transparent />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5. CAMERA SYSTEM (Optical Stack Perfection) */}
      <group position={[-0.7, 2, -0.12]}>
        <RoundedBox args={[1.4, 1.4, 0.12]} radius={0.22} smoothness={6}>
          <meshPhysicalMaterial color="#050505" roughness={0.3} metalness={0.7} />
        </RoundedBox>
        
        {/* Optical Lens Internals */}
        {[ 
          [0.32, 0.32, -0.085], 
          [-0.32, 0.32, -0.085], 
          [0, -0.32, -0.085] 
        ].map((pos, i) => (
          <group key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
             {/* Titanium Bezel */}
             <mesh>
               <cylinderGeometry args={[0.29, 0.29, 0.08, 64]} />
               <meshPhysicalMaterial color="#222" metalness={1} roughness={0.2} />
             </mesh>
             {/* Inner Iris */}
             <mesh position={[0, -0.03, 0]}>
               <cylinderGeometry args={[0.24, 0.24, 0.02, 32]} />
               <meshStandardMaterial color="#000" />
             </mesh>
             {/* Layered Glass Bulb */}
             <mesh position={[0, -0.06, 0]}>
               <sphereGeometry args={[0.23, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
               <meshPhysicalMaterial 
                  color="#111" 
                  transparent 
                  opacity={0.9} 
                  roughness={0} 
                  metalness={1} 
                  clearcoat={1}
                  envMapIntensity={3}
               />
             </mesh>
          </group>
        ))}

        {/* Laser Pro Sensor */}
        <mesh position={[0.42, 0, -0.07]}>
          <sphereGeometry args={[0.06, 32, 32]} />
          <meshPhysicalMaterial color="#020202" roughness={0} metalness={1} clearcoat={1} />
        </mesh>

        {/* Dual-Tone Flash */}
        <mesh position={[0.42, -0.42, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.01, 32]} />
          <meshStandardMaterial 
            color="#ffeecc" 
            emissive="#ffaa33" 
            emissiveIntensity={isOn ? 0.5 : 2} 
          />
        </mesh>
      </group>

      {/* 6. BOTTOM I/O (Precision Master) */}
      <group position={[0, -3.02, 0]}>
        {/* Port */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.07, 0.28, 6, 12]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        {/* Precision Drilled Speaker Arrays */}
        {[-1, 1].map(side => (
          <group key={side} position={[0.55 * side, 0, 0]}>
            {[-0.1, 0, 0.1].map((offset, j) => (
              <mesh key={j} position={[offset, 0, 0]}>
                <sphereGeometry args={[0.02, 10, 10]} />
                <meshStandardMaterial color="#000" />
              </mesh>
            ))}
          </group>
        ))}
        {/* Pentalobe Screws (Micro-Detail) */}
        {[-0.22, 0.22].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.01, 6]} />
            <meshStandardMaterial color="#444" metalness={1} />
          </mesh>
        ))}
      </group>

      {/* 7. TOP RECEIVER */}
      <group position={[0, 2.82, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.112]}>
          <capsuleGeometry args={[0.01, 0.45, 4, 8]} />
          <meshStandardMaterial color="#020202" />
        </mesh>
      </group>
    </group>
  );
};

export const Phone3D = () => {
  const [isOn, setIsOn] = useState(false);

  return (
    <div className="w-full h-[700px] cursor-grab active:cursor-grabbing">
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
        <Suspense fallback={null}>
          {/* Neutral studio lighting without city reflections */}
          <ambientLight intensity={1} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={150} castShadow />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={100} />
          <pointLight position={[0, -5, 5]} intensity={50} />
          
          <PresentationControls
            global
            snap
            rotation={[0, -0.3, 0]}
            polar={[-Math.PI, Math.PI]}
            azimuth={[-Math.PI, Math.PI]}
          >
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
              <PhoneModel isOn={isOn} togglePower={() => setIsOn(!isOn)} />
            </Float>
          </PresentationControls>

          <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
        </Suspense>
      </Canvas>
    </div>
  );
};
