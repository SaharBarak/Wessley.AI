import React, { useMemo } from 'react';

/**
 * ConnectorPins - Small spheres/cones around connector anchor (fan out)
 * Per instructions.md section 8.2
 */
export default function ConnectorPins({ 
  node, 
  graphModel,
  sceneConfig, 
  onClick, 
  selected = false 
}) {
  // Get pins for this connector
  const pins = useMemo(() => {
    if (!graphModel.edges) return [];
    
    return graphModel.edges
      .filter(edge => edge.source === node.id && edge.relationship === 'has_pin')
      .map(edge => graphModel.nodesById[edge.target])
      .filter(pin => pin !== undefined);
  }, [node.id, graphModel]);

  // Position from connector anchor
  const position = useMemo(() => {
    return node.anchor_xyz || [0, 0, 0];
  }, [node.anchor_xyz]);

  // Generate pin positions in a fan/circular pattern
  const pinPositions = useMemo(() => {
    if (pins.length === 0) return [];
    
    const connectorSize = node.bbox_m || [0.025, 0.025, 0.015];
    const radius = Math.max(connectorSize[0], connectorSize[1]) * 0.8;
    
    return pins.map((pin, index) => {
      if (pins.length === 1) {
        // Single pin at center
        return [0, 0, connectorSize[2] / 2 + 0.005];
      } else if (pins.length === 2) {
        // Two pins side by side
        return [
          (index === 0 ? -radius/2 : radius/2),
          0,
          connectorSize[2] / 2 + 0.005
        ];
      } else {
        // Multiple pins in circular pattern
        const angle = (index / pins.length) * Math.PI * 2;
        return [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          connectorSize[2] / 2 + 0.005
        ];
      }
    });
  }, [pins, node.bbox_m]);

  // Pin color based on signal or wire connection
  const getPinColor = (pin, index) => {
    if (selected) return '#ffffff';
    
    // Look for wire connected to this pin
    const wireEdge = graphModel.edges.find(edge => 
      (edge.source === pin.id && edge.relationship === 'pin_to_wire') ||
      (edge.target === pin.id && edge.relationship === 'wire_to_pin')
    );
    
    if (wireEdge) {
      const wireId = wireEdge.source === pin.id ? wireEdge.target : wireEdge.source;
      const wire = graphModel.nodesById[wireId];
      
      if (wire && wire.color) {
        // Use wire color
        const wireColorMap = {
          'W': '#ffffff',
          'B': '#000000',
          'R': '#ff0000',
          'G': '#00ff00',
          'Y': '#ffff00',
          'BL': '#0000ff',
          'BR': '#8b4513',
          'O': '#ffa500'
        };
        const baseColor = wire.color.split(/[-/\\s]/)[0];
        return wireColorMap[baseColor] || '#cccccc';
      }
      
      if (wire && wire.signal) {
        // Color by signal type
        if (wire.signal.includes('power')) return '#ff0000';
        if (wire.signal.includes('ground')) return '#000000';
        if (wire.signal.includes('signal')) return '#0000ff';
      }
    }
    
    // Default pin colors by position
    const defaultColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    return defaultColors[index % defaultColors.length];
  };

  if (pins.length === 0) {
    // No pins, just render the connector body
    return null;
  }

  return (
    <group position={position}>
      {/* Connector body outline */}
      <mesh onClick={onClick} userData={{ nodeId: node.id, nodeType: node.node_type }}>
        <boxGeometry args={node.bbox_m || [0.025, 0.025, 0.015]} />
        <meshBasicMaterial
          color={selected ? '#ffffff' : '#666666'}
          transparent={true}
          opacity={0.3}
          wireframe={true}
        />
      </mesh>
      
      {/* Individual pins */}
      {pins.map((pin, index) => {
        const pinPos = pinPositions[index];
        const pinColor = getPinColor(pin, index);
        
        return (
          <group key={pin.id} position={pinPos}>
            {/* Pin body */}
            <mesh
              onClick={onClick}
              userData={{ nodeId: pin.id, nodeType: pin.node_type }}
            >
              <cylinderGeometry args={[0.002, 0.002, 0.008, 6]} />
              <meshStandardMaterial
                color={pinColor}
                metalness={0.8}
                roughness={0.2}
                emissive={selected ? pinColor : '#000000'}
                emissiveIntensity={selected ? 0.3 : 0}
              />
            </mesh>
            
            {/* Pin contact point */}
            <mesh position={[0, 0, 0.005]}>
              <sphereGeometry args={[0.003, 6, 6]} />
              <meshStandardMaterial
                color={pinColor}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            
            {/* Pin number/label */}
            {selected && (
              <mesh position={[0, 0, 0.01]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[0.008, 0.004]} />
                <meshBasicMaterial
                  color=\"#ffffff\"
                  transparent={true}
                  opacity={0.8}
                />
              </mesh>
            )}
          </group>
        );
      })}
      
      {/* Connection lines from pins to wire endpoints */}
      {selected && pins.map((pin, index) => {
        const pinPos = pinPositions[index];
        
        // Find connected wire
        const wireEdge = graphModel.edges.find(edge => 
          (edge.source === pin.id && edge.relationship === 'pin_to_wire') ||
          (edge.target === pin.id && edge.relationship === 'wire_to_pin')
        );
        
        if (wireEdge) {
          const wireId = wireEdge.source === pin.id ? wireEdge.target : wireEdge.source;
          const wire = graphModel.nodesById[wireId];
          
          if (wire && wire.path_xyz && wire.path_xyz.length > 0) {
            // Draw line to nearest wire path point
            const wireStart = wire.path_xyz[0];
            const wireEnd = wire.path_xyz[wire.path_xyz.length - 1];
            
            // Choose closer endpoint
            const pinWorldPos = [
              position[0] + pinPos[0],
              position[1] + pinPos[1], 
              position[2] + pinPos[2]
            ];
            
            const distToStart = Math.sqrt(
              Math.pow(pinWorldPos[0] - wireStart[0], 2) +
              Math.pow(pinWorldPos[1] - wireStart[1], 2) +
              Math.pow(pinWorldPos[2] - wireStart[2], 2)
            );
            
            const distToEnd = Math.sqrt(
              Math.pow(pinWorldPos[0] - wireEnd[0], 2) +
              Math.pow(pinWorldPos[1] - wireEnd[1], 2) +
              Math.pow(pinWorldPos[2] - wireEnd[2], 2)
            );
            
            const wirePoint = distToStart < distToEnd ? wireStart : wireEnd;
            const connectionVector = [
              wirePoint[0] - pinWorldPos[0],
              wirePoint[1] - pinWorldPos[1],
              wirePoint[2] - pinWorldPos[2]
            ];
            
            const connectionLength = Math.sqrt(
              connectionVector[0] ** 2 + connectionVector[1] ** 2 + connectionVector[2] ** 2
            );
            
            if (connectionLength > 0.01) { // Only draw if significant distance
              const midPoint = [
                pinPos[0] + connectionVector[0] / 2,
                pinPos[1] + connectionVector[1] / 2,
                pinPos[2] + connectionVector[2] / 2
              ];
              
              return (
                <mesh key={`connection-${pin.id}`} position={midPoint}>
                  <cylinderGeometry args={[0.001, 0.001, connectionLength, 4]} />
                  <meshBasicMaterial
                    color=\"#ffff00\"
                    transparent={true}
                    opacity={0.6}
                  />
                </mesh>
              );
            }
          }
        }
        
        return null;
      })}
    </group>
  );
}