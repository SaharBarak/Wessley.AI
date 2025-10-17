import React from 'react';
import { Html } from '@react-three/drei';

/**
 * Labels - Optional HTML overlays for canonical_id/code_id
 * Per instructions.md section 8.2
 */
export default function Labels({ 
  nodes, 
  selectedNode, 
  sceneConfig,
  showAll = false 
}) {
  // Filter nodes that should show labels
  const labelNodes = nodes.filter(node => {
    // Always show label for selected node
    if (selectedNode && node.id === selectedNode.id) return true;
    
    // Show labels for important components when showAll is true
    if (showAll) {
      return ['component', 'fuse', 'relay', 'bus'].includes(node.node_type) && 
             node.anchor_xyz && 
             (node.canonical_id || node.code_id);
    }
    
    // Only show labels for selected or major components
    return ['component', 'bus'].includes(node.node_type) && 
           node.anchor_xyz && 
           (node.canonical_id || node.code_id);
  });

  return (
    <>
      {labelNodes.map(node => {
        const position = node.anchor_xyz;
        const isSelected = selectedNode && node.id === selectedNode.id;
        const labelText = node.canonical_id || node.code_id || node.id;
        
        // Calculate label offset based on bounding box
        const bbox = node.bbox_m || [0.05, 0.05, 0.025];
        const yOffset = bbox[2] / 2 + 0.02;
        
        return (
          <Html
            key={`label-${node.id}`}
            position={[position[0], position[1], position[2] + yOffset]}
            center
            occlude
            distanceFactor={8}
            style={{
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            <div
              className={`
                px-2 py-1 rounded text-xs font-mono
                transition-all duration-200 whitespace-nowrap
                ${isSelected 
                  ? 'bg-yellow-400 text-black font-bold shadow-lg scale-110' 
                  : 'bg-gray-800 text-white opacity-80 hover:opacity-100'
                }
              `}
              style={{
                fontSize: isSelected ? '12px' : '10px',
                maxWidth: '120px',
                textAlign: 'center',
                lineHeight: '1.2',
                border: isSelected ? '2px solid #fbbf24' : '1px solid #374151',
                backdropFilter: 'blur(4px)'
              }}
            >
              <div className=\"truncate\">
                {labelText}
              </div>
              
              {/* Show additional info for selected node */}
              {isSelected && (
                <div className=\"text-xs mt-1 opacity-90\">
                  {node.node_type}
                  {node.voltage && (
                    <div className=\"text-xs\">{node.voltage}</div>
                  )}
                  {node.anchor_zone && (
                    <div className=\"text-xs truncate\">{node.anchor_zone}</div>
                  )}
                </div>
              )}
            </div>
          </Html>
        );
      })}
      
      {/* Zone labels */}
      {sceneConfig && sceneConfig.groups && showAll && (
        <>
          {sceneConfig.groups.map(group => {
            // Calculate zone center from nodes in that zone
            const zoneNodes = nodes.filter(node => 
              node.anchor_zone === group.filter.anchor_zone && node.anchor_xyz
            );
            
            if (zoneNodes.length === 0) return null;
            
            const centerX = zoneNodes.reduce((sum, node) => sum + node.anchor_xyz[0], 0) / zoneNodes.length;
            const centerY = zoneNodes.reduce((sum, node) => sum + node.anchor_xyz[1], 0) / zoneNodes.length;
            const maxZ = Math.max(...zoneNodes.map(node => node.anchor_xyz[2]));
            
            return (
              <Html
                key={`zone-${group.id}`}
                position={[centerX, centerY, maxZ + 0.1]}
                center
                occlude={false}
                distanceFactor={12}
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              >
                <div
                  className=\"
                    px-3 py-2 rounded-lg text-sm font-bold
                    bg-blue-500 text-white opacity-70
                    border-2 border-blue-300
                  \"
                  style={{
                    backdropFilter: 'blur(6px)',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}
                >
                  {group.filter.anchor_zone}
                  <div className=\"text-xs font-normal opacity-80\">
                    {zoneNodes.length} components
                  </div>
                </div>
              </Html>
            );
          })}
        </>
      )}
      
      {/* Coordinate frame labels */}
      {showAll && (
        <>
          <Html position={[0.6, 0, 0]} center distanceFactor={6}>
            <div className=\"text-red-500 font-bold text-sm bg-black bg-opacity-50 px-2 py-1 rounded\">
              +X (Forward)
            </div>
          </Html>
          <Html position={[0, 0.6, 0]} center distanceFactor={6}>
            <div className=\"text-green-500 font-bold text-sm bg-black bg-opacity-50 px-2 py-1 rounded\">
              +Y (Left)
            </div>
          </Html>
          <Html position={[0, 0, 0.6]} center distanceFactor={6}>
            <div className=\"text-blue-500 font-bold text-sm bg-black bg-opacity-50 px-2 py-1 rounded\">
              +Z (Up)
            </div>
          </Html>
        </>
      )}
    </>
  );
}