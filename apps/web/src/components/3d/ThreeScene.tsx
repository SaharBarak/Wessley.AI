'use client'

import * as React from "react"
import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Grid, useGLTF, Environment, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

// Vehicle GLB Component with placeholder fallback
function VehicleModel({ url }: { url?: string }) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  if (!url) {
    // Placeholder: Simple car-like shape
    return (
      <group ref={groupRef} position={[0, 0.5, 0]}>
        {/* Car body */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[2, 0.6, 4]} />
          <meshStandardMaterial color="#4a90e2" metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* Car roof */}
        <mesh position={[0, 0.8, -0.5]}>
          <boxGeometry args={[1.6, 0.4, 2]} />
          <meshStandardMaterial color="#4a90e2" metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* Wheels */}
        {[[-0.8, -0.1, 1.3], [0.8, -0.1, 1.3], [-0.8, -0.1, -1.3], [0.8, -0.1, -1.3]].map((pos, i) => (
          <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
        
        {/* Headlights */}
        <mesh position={[-0.6, 0.2, 2.1]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0.6, 0.2, 2.1]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.3} />
        </mesh>
      </group>
    )
  }

  // Load actual GLB model when URL is provided
  const { scene } = useGLTF(url)
  
  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1} />
    </group>
  )
}

// Loading fallback component
function LoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 1, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  )
}

// Main scene setup
function Scene() {
  return (
    <>
      {/* Camera with good default position */}
      <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={60} />
      
      {/* Lighting setup */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4a90e2" />
      
      {/* Environment for reflections */}
      <Environment preset="studio" background={false} />
      
      {/* Ground Grid */}
      <Grid 
        position={[0, 0, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#444"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#666"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid={true}
      />
      
      {/* Vehicle model */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <VehicleModel />
      </Suspense>
      
      {/* Orbit controls for interaction */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </>
  )
}

export function ThreeScene() {

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [5, 3, 5], fov: 60 }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1
        }}
        style={{ background: '#1a1a1a', borderBottomLeftRadius: '10rem', borderBottomRightRadius: '10rem' }}
      >
        <Scene />
      </Canvas>
      
    </div>
  )
}