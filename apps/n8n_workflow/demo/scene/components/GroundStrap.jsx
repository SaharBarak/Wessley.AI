import React, { useMemo } from 'react';

/**
 * GroundStrap - Short strap from ground_point to plane
 * Per instructions.md section 8.2
 */
export default function GroundStrap({ 
  node, 
  graphModel,
  sceneConfig, 
  onClick, 
  selected = false 
}) {
  // Find ground plane connection
  const groundPlane = useMemo(() => {
    const groundEdge = graphModel.edges.find(edge => 
      edge.source === node.id && edge.relationship === 'ground_to_plane'
    );
    
    if (groundEdge) {
      return graphModel.nodesById[groundEdge.target];
    }
    return null;
  }, [node.id, graphModel]);

  // Position from ground point anchor
  const position = useMemo(() => {
    return node.anchor_xyz || [0, 0, 0];
  }, [node.anchor_xyz]);

  // Ground plane position (usually at z=0 for chassis)
  const groundPlanePos = useMemo(() => {
    if (groundPlane && groundPlane.anchor_xyz) {
      return groundPlane.anchor_xyz;
    }
    // Default to ground level below the ground point
    return [position[0], position[1], 0];
  }, [groundPlane, position]);

  // Calculate strap geometry
  const strapGeometry = useMemo(() => {
    const start = position;
    const end = groundPlanePos;
    
    const length = Math.sqrt(
      Math.pow(end[0] - start[0], 2) +
      Math.pow(end[1] - start[1], 2) +
      Math.pow(end[2] - start[2], 2)
    );
    
    const midPoint = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2
    ];
    
    // Calculate rotation to align cylinder with connection vector
    const direction = [
      end[0] - start[0],
      end[1] - start[1], 
      end[2] - start[2]
    ];
    
    const rotation = [
      Math.atan2(direction[1], Math.sqrt(direction[0]**2 + direction[2]**2)),
      Math.atan2(direction[0], direction[2]),
      0
    ];
    
    return { length, midPoint, rotation };
  }, [position, groundPlanePos]);

  // Material thickness from scene config
  const thickness = useMemo(() => {
    return sceneConfig?.materials?.ground?.thickness || 0.008;
  }, [sceneConfig]);

  return (
    <group>
      {/* Ground point terminal */}
      <mesh 
        position={position}
        onClick={onClick}
        userData={{ nodeId: node.id, nodeType: node.node_type }}
      >
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial
          color={selected ? '#ffff00' : '#444444'}
          metalness={0.9}
          roughness={0.1}
          emissive={selected ? '#ffff00' : '#000000'}
          emissiveIntensity={selected ? 0.3 : 0}
        />
      </mesh>
      
      {/* Ground strap cable */}
      <mesh 
        position={strapGeometry.midPoint}
        rotation={strapGeometry.rotation}
        onClick={onClick}
        userData={{ nodeId: node.id, nodeType: node.node_type }}
      >
        <cylinderGeometry args={[thickness, thickness, strapGeometry.length, 8]} />
        <meshStandardMaterial
          color={selected ? '#ffff00' : '#333333'}
          metalness={0.8}
          roughness={0.3}
          emissive={selected ? '#ffff00' : '#000000'}
          emissiveIntensity={selected ? 0.2 : 0}
        />
      </mesh>
      
      {/* Ground plane connection point */}
      <mesh position={groundPlanePos}>
        <cylinderGeometry args={[0.02, 0.02, 0.005, 8]} />
        <meshStandardMaterial
          color={selected ? '#ffff00' : '#222222'}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Ground symbol at connection point */}
      {selected && (
        <>
          {/* Ground symbol lines */}
          <mesh position={[groundPlanePos[0], groundPlanePos[1], groundPlanePos[2] - 0.01]}>
            <boxGeometry args={[0.03, 0.002, 0.002]} />
            <meshBasicMaterial color=\"#ffff00\" />
          </mesh>
          <mesh position={[groundPlanePos[0], groundPlanePos[1], groundPlanePos[2] - 0.015]}>
            <boxGeometry args={[0.02, 0.002, 0.002]} />
            <meshBasicMaterial color=\"#ffff00\" />
          </mesh>
          <mesh position={[groundPlanePos[0], groundPlanePos[1], groundPlanePos[2] - 0.02]}>
            <boxGeometry args={[0.01, 0.002, 0.002]} />
            <meshBasicMaterial color=\"#ffff00\" />
          </mesh>
        </>
      )}
      
      {/* Voltage indicator (should be 0V for ground) */}
      {selected && (
        <mesh position={[position[0], position[1], position[2] + 0.025]}>
          <planeGeometry args={[0.03, 0.01]} />
          <meshBasicMaterial
            color=\"#000000\"
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      )}
      
      {/* Connection spark effect for selected ground */}
      {selected && (
        <mesh position={groundPlanePos}>
          <sphereGeometry args={[0.005, 8, 8]} />
          <meshBasicMaterial
            color=\"#ffff00\"
            transparent={true}
            opacity={0.6 + 0.4 * Math.sin(Date.now() * 0.01)}
          />
        </mesh>
      )}
    </group>
  );
}