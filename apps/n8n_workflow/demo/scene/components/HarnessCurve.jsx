import React, { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * HarnessCurve - Draws tube along path_xyz using Catmull-Rom curves
 * Per instructions.md section 8.2
 */
export default function HarnessCurve({ 
  node, 
  sceneConfig, 
  onClick, 
  selected = false 
}) {
  // Generate curve geometry from path_xyz
  const { curve, tubeGeometry } = useMemo(() => {
    if (!node.path_xyz || node.path_xyz.length < 2) {
      return { curve: null, tubeGeometry: null };
    }
    
    // Convert path points to Vector3
    const points = node.path_xyz.map(([x, y, z]) => new Vector3(x, y, z));
    
    // Create Catmull-Rom curve with tension 0.5 per instructions.md
    const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    
    // Create tube geometry
    const thickness = sceneConfig?.materials?.harness?.thickness || 0.015;
    const tubeGeometry = new THREE.TubeGeometry(curve, 32, thickness, 8, false);
    
    return { curve, tubeGeometry };
  }, [node.path_xyz, sceneConfig]);

  // Color based on harness type or zone
  const material = useMemo(() => {
    let color = '#666666'; // Default gray
    
    // Color by zone
    if (node.anchor_zone) {
      const zoneColors = {
        'Engine Compartment': '#ff4444',
        'Dash Panel': '#4444ff',
        'Floor & Roof': '#44ff44',
        'Rear Cargo/Tailgate': '#ffff44',
        'Left Front Door': '#ff44ff',
        'Right Front Door': '#44ffff'
      };
      color = zoneColors[node.anchor_zone] || color;
    }
    
    // Highlight if selected
    if (selected) {
      color = '#ffffff';
    }
    
    return (
      <meshStandardMaterial
        color={color}
        metalness={0.1}
        roughness={0.8}
        transparent={true}
        opacity={selected ? 1.0 : 0.8}
      />
    );
  }, [node.anchor_zone, selected]);

  // Position at anchor if available
  const position = useMemo(() => {
    if (node.anchor_xyz) {
      return node.anchor_xyz;
    }
    return [0, 0, 0];
  }, [node.anchor_xyz]);

  if (!tubeGeometry) {
    // Fallback: render as simple box if no path
    return (
      <mesh 
        position={position}
        onClick={onClick}
        userData={{ nodeId: node.id, nodeType: node.node_type }}
      >
        <boxGeometry args={[0.1, 0.1, 0.02]} />
        {material}
      </mesh>
    );
  }

  return (
    <group position={[0, 0, 0]}>
      <mesh 
        geometry={tubeGeometry}
        onClick={onClick}
        userData={{ nodeId: node.id, nodeType: node.node_type }}
        castShadow
        receiveShadow
      >
        {material}
      </mesh>
      
      {/* Add glow effect for selected harness */}
      {selected && (
        <mesh geometry={tubeGeometry}>
          <meshBasicMaterial
            color=\"#ffffff\"
            transparent={true}
            opacity={0.3}
            side={2} // DoubleSide
          />
        </mesh>
      )}
      
      {/* Add connection points at path ends */}
      {node.path_xyz && node.path_xyz.length >= 2 && (
        <>
          <mesh position={node.path_xyz[0]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial color=\"#88ff88\" />
          </mesh>
          <mesh position={node.path_xyz[node.path_xyz.length - 1]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial color=\"#ff8888\" />
          </mesh>
        </>
      )}
    </group>
  );
}