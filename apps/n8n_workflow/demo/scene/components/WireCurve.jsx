import React, { useMemo, useRef } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * WireCurve - Same as harness but thinner + color by node.color
 * Per instructions.md section 8.2
 */
export default function WireCurve({ 
  node, 
  graphModel,
  sceneConfig, 
  onClick, 
  selected = false 
}) {
  const meshRef = useRef();

  // Generate curve geometry from path_xyz or synthesized path
  const { curve, tubeGeometry, hasPath } = useMemo(() => {
    let pathPoints = node.path_xyz;
    let synthesized = false;
    
    // If no path, try to synthesize from connected endpoints
    if (!pathPoints || pathPoints.length < 2) {
      const wireEdges = graphModel.edges.filter(e => 
        (e.source === node.id || e.target === node.id) &&
        ['pin_to_wire', 'wire_to_pin', 'wire_to_fuse', 'wire_to_ground', 'has_connector'].includes(e.relationship)
      );
      
      const endpoints = wireEdges.map(e => {
        const endpointId = e.source === node.id ? e.target : e.source;
        const endpointNode = graphModel.nodesById[endpointId];
        return endpointNode?.anchor_xyz;
      }).filter(pos => pos !== undefined);
      
      if (endpoints.length >= 2) {
        const start = endpoints[0];
        const end = endpoints[1];
        const mid = [
          (start[0] + end[0]) / 2 + 0.15, // Offset for readability
          (start[1] + end[1]) / 2,
          (start[2] + end[2]) / 2
        ];
        pathPoints = [start, mid, end];
        synthesized = true;
      }
    }
    
    if (!pathPoints || pathPoints.length < 2) {
      return { curve: null, tubeGeometry: null, hasPath: false };
    }
    
    // Convert path points to Vector3
    const points = pathPoints.map(([x, y, z]) => new Vector3(x, y, z));
    
    // Create Catmull-Rom curve with tension 0.5
    const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    
    // Create tube geometry - thinner than harness per instructions.md
    const thickness = sceneConfig?.materials?.wire?.thickness || 0.006;
    const tubeGeometry = new THREE.TubeGeometry(curve, 16, thickness, 6, false);
    
    return { curve, tubeGeometry, hasPath: !synthesized };
  }, [node.path_xyz, node.id, graphModel, sceneConfig]);

  // Wire color mapping
  const wireColor = useMemo(() => {
    if (selected) return '#ffffff';
    
    if (node.color) {
      // Parse common wire color codes
      const colorMap = {
        'W': '#ffffff',      // White
        'B': '#000000',      // Black  
        'R': '#ff0000',      // Red
        'G': '#00ff00',      // Green
        'Y': '#ffff00',      // Yellow
        'BL': '#0000ff',     // Blue
        'BR': '#8b4513',     // Brown
        'O': '#ffa500',      // Orange
        'P': '#800080',      // Purple
        'GY': '#808080',     // Gray
        'PK': '#ffc0cb',     // Pink
        'LG': '#90ee90',     // Light Green
        'LB': '#add8e6'      // Light Blue
      };
      
      // Handle color with stripe (e.g., \"R-G\", \"W-B\")
      const baseColor = node.color.split(/[-/\\s]/)[0];
      return colorMap[baseColor] || colorMap[node.color] || '#cccccc';
    }
    
    // Default wire color based on signal type
    if (node.signal) {
      if (node.signal.includes('power') || node.signal.includes('supply')) return '#ff0000';
      if (node.signal.includes('ground')) return '#000000';
      if (node.signal.includes('signal')) return '#0000ff';
    }
    
    // Default based on voltage
    if (node.voltage) {
      if (node.voltage.includes('12V')) return '#ff4444';
      if (node.voltage.includes('5V')) return '#44ff44';
    }
    
    return '#888888'; // Default gray
  }, [node.color, node.signal, node.voltage, selected]);

  // Material with wire-specific properties
  const material = useMemo(() => (
    <meshStandardMaterial
      color={wireColor}
      metalness={0.8}
      roughness={0.2}
      transparent={true}
      opacity={selected ? 1.0 : 0.9}
      emissive={selected ? wireColor : '#000000'}
      emissiveIntensity={selected ? 0.2 : 0}
    />
  ), [wireColor, selected]);

  // Animate selected wire
  useFrame((state) => {
    if (selected && meshRef.current) {
      meshRef.current.material.emissiveIntensity = 
        0.2 + 0.1 * Math.sin(state.clock.elapsedTime * 3);
    }
  });

  // Position fallback if no path and no connections
  const fallbackPosition = useMemo(() => {
    if (node.anchor_xyz) return node.anchor_xyz;
    return [0, 0, 0];
  }, [node.anchor_xyz]);

  if (!tubeGeometry) {
    // Fallback: render as thin line/cylinder
    return (
      <mesh 
        position={fallbackPosition}
        onClick={onClick}
        userData={{ nodeId: node.id, nodeType: node.node_type }}
      >
        <cylinderGeometry args={[0.002, 0.002, 0.05, 6]} />
        {material}
      </mesh>
    );
  }

  return (
    <group>
      <mesh 
        ref={meshRef}
        geometry={tubeGeometry}
        onClick={onClick}
        userData={{ nodeId: node.id, nodeType: node.node_type }}
        castShadow
      >
        {material}
      </mesh>
      
      {/* Wire gauge indicator (thicker outline for larger gauge) */}
      {node.gauge && selected && (
        <mesh geometry={tubeGeometry}>
          <meshBasicMaterial
            color=\"#ffff00\"
            transparent={true}
            opacity={0.2}
            side={2} // DoubleSide
          />
        </mesh>
      )}
      
      {/* Signal flow animation for selected wire */}
      {selected && node.signal && (
        <mesh geometry={tubeGeometry}>
          <meshBasicMaterial
            color=\"#00ffff\"
            transparent={true}
            opacity={0.1 + 0.1 * Math.sin(Date.now() * 0.01)}
          />
        </mesh>
      )}
      
      {/* Connection indicators */}
      {node.path_xyz && (
        <>
          {/* Start point */}
          <mesh position={node.path_xyz[0]}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshBasicMaterial color={wireColor} />
          </mesh>
          
          {/* End point */}
          <mesh position={node.path_xyz[node.path_xyz.length - 1]}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshBasicMaterial color={wireColor} />
          </mesh>
        </>
      )}
    </group>
  );
}