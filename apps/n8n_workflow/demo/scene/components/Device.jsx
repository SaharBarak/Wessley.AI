import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Device - Box or icon at anchor_xyz with bbox_m scale
 * Per instructions.md section 8.2
 */
export default function Device({ 
  node, 
  sceneConfig, 
  onClick, 
  selected = false 
}) {
  const meshRef = useRef();

  // Position from anchor_xyz
  const position = useMemo(() => {
    return node.anchor_xyz || [0, 0, 0];
  }, [node.anchor_xyz]);

  // Size from bbox_m or defaults
  const size = useMemo(() => {
    if (node.bbox_m) {
      return node.bbox_m;
    }
    
    // Default sizes by component type
    const defaultSizes = {
      component: [0.1, 0.1, 0.05],
      fuse: [0.02, 0.02, 0.03],
      relay: [0.03, 0.03, 0.04],
      bus: [0.08, 0.06, 0.02],
      ground_point: [0.015, 0.015, 0.015],
      connector: [0.025, 0.025, 0.015]
    };
    
    return defaultSizes[node.node_type] || [0.05, 0.05, 0.025];
  }, [node.bbox_m, node.node_type]);

  // Color by device type and zone
  const deviceColor = useMemo(() => {
    if (selected) return '#ffffff';
    
    // Color by node type
    const typeColors = {
      component: '#4a90e2',     // Blue for ECUs/modules
      fuse: '#f5a623',          // Orange for fuses
      relay: '#7ed321',         // Green for relays
      bus: '#bd10e0',           // Purple for power buses
      ground_point: '#000000',  // Black for ground points
      connector: '#9013fe',     // Violet for connectors
      location: '#50e3c2'       // Teal for locations
    };
    
    let color = typeColors[node.node_type] || '#888888';
    
    // Modify by zone
    if (node.anchor_zone === 'Engine Compartment') {
      // Slightly redder tint for engine bay components
      color = adjustColor(color, 1.1, 0.9, 0.9);
    } else if (node.anchor_zone === 'Dash Panel') {
      // Slightly bluer tint for dash components  
      color = adjustColor(color, 0.9, 0.9, 1.1);
    }
    
    return color;
  }, [node.node_type, node.anchor_zone, selected]);

  // Helper function to adjust color
  function adjustColor(hex, rMult, gMult, bMult) {
    if (hex.startsWith('#')) hex = hex.slice(1);
    const num = parseInt(hex, 16);
    let r = Math.min(255, Math.floor(((num >> 16) & 255) * rMult));
    let g = Math.min(255, Math.floor(((num >> 8) & 255) * gMult));
    let b = Math.min(255, Math.floor((num & 255) * bMult));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Geometry based on component type
  const geometry = useMemo(() => {
    switch (node.node_type) {
      case 'fuse':
        return <cylinderGeometry args={[size[0]/2, size[0]/2, size[2], 8]} />;
      
      case 'relay':
        return <boxGeometry args={size} />;
      
      case 'ground_point':
        return <sphereGeometry args={[size[0], 8, 8]} />;
      
      case 'connector':
        return <boxGeometry args={size} />;
      
      case 'bus':
        return <boxGeometry args={size} />;
      
      default: // component
        return <boxGeometry args={size} />;
    }
  }, [node.node_type, size]);

  // Material with appropriate properties
  const material = useMemo(() => {
    const baseProps = {
      color: deviceColor,
      transparent: true,
      opacity: selected ? 1.0 : 0.8
    };
    
    // Different material properties by type
    switch (node.node_type) {
      case 'fuse':
        return (
          <meshStandardMaterial
            {...baseProps}
            metalness={0.7}
            roughness={0.3}
            emissive={selected ? deviceColor : '#000000'}
            emissiveIntensity={selected ? 0.2 : 0}
          />
        );
      
      case 'relay':
        return (
          <meshStandardMaterial
            {...baseProps}
            metalness={0.5}
            roughness={0.5}
          />
        );
      
      case 'ground_point':
        return (
          <meshStandardMaterial
            {...baseProps}
            metalness={0.9}
            roughness={0.1}
          />
        );
      
      default:
        return (
          <meshStandardMaterial
            {...baseProps}
            metalness={0.3}
            roughness={0.7}
          />
        );
    }
  }, [deviceColor, node.node_type, selected]);

  // Animation for selected device
  useFrame((state) => {
    if (selected && meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * 3) * 0.005;
    } else if (meshRef.current) {
      meshRef.current.rotation.y = 0;
      meshRef.current.position.z = position[2];
    }
  });

  // Rotation based on node orientation
  const rotation = useMemo(() => {
    if (node.anchor_ypr_deg) {
      // Convert YPR (yaw, pitch, roll) degrees to radians
      return [
        (node.anchor_ypr_deg[1] || 0) * Math.PI / 180, // pitch -> x rotation
        (node.anchor_ypr_deg[0] || 0) * Math.PI / 180, // yaw -> y rotation  
        (node.anchor_ypr_deg[2] || 0) * Math.PI / 180  // roll -> z rotation
      ];
    }
    return [0, 0, 0];
  }, [node.anchor_ypr_deg]);

  return (
    <group position={position} rotation={rotation}>
      <mesh 
        ref={meshRef}
        onClick={onClick}
        userData={{ nodeId: node.id, nodeType: node.node_type }}
        castShadow
        receiveShadow
      >
        {geometry}
        {material}
      </mesh>
      
      {/* Selection outline */}
      {selected && (
        <mesh scale={[1.2, 1.2, 1.2]}>
          {geometry}
          <meshBasicMaterial
            color=\"#ffffff\"
            transparent={true}
            opacity={0.3}
            side={2} // DoubleSide
          />
        </mesh>
      )}
      
      {/* Voltage indicator */}
      {node.voltage && (
        <mesh position={[0, 0, size[2]/2 + 0.005]}>
          <planeGeometry args={[size[0] * 0.8, 0.005]} />
          <meshBasicMaterial
            color={node.voltage.includes('12V') ? '#ff0000' : '#00ff00'}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      )}
      
      {/* Fuse rating indicator */}
      {node.node_type === 'fuse' && node.canonical_id && (
        <mesh position={[0, 0, size[2]/2 + 0.002]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[size[0] * 1.5, 0.003]} />
          <meshBasicMaterial
            color=\"#ffffff\"
            transparent={true}
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  );
}