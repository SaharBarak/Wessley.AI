import React, { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import HarnessCurve from './HarnessCurve';
import WireCurve from './WireCurve';
import Device from './Device';
import ConnectorPins from './ConnectorPins';
import GroundStrap from './GroundStrap';
import Labels from './Labels';
import SystemFilters from './SystemFilters';

/**
 * SceneRoot - Main R3F component that loads scene.config.json and mounts groups
 * Per instructions.md section 8.2
 */
export default function SceneRoot({ 
  ndjsonPath = '/graph/model.ndjson',
  sceneConfigPath = '/scene/scene.config.json',
  showLabels = true,
  enableFilters = true 
}) {
  const [graphModel, setGraphModel] = useState(null);
  const [sceneConfig, setSceneConfig] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [visibleSystems, setVisibleSystems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load NDJSON and scene config
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load scene config
        const configResponse = await fetch(sceneConfigPath);
        const config = await configResponse.json();
        setSceneConfig(config);
        
        // Load and parse NDJSON
        const ndjsonResponse = await fetch(ndjsonPath);
        const ndjsonText = await ndjsonResponse.text();
        
        const model = parseNDJSON(ndjsonText);
        setGraphModel(model);
        
        // Initialize visible systems (all visible by default)
        const systems = new Set();
        Object.values(model.byType).forEach(nodeIds => {
          nodeIds.forEach(id => {
            const node = model.nodesById[id];
            if (node.anchor_zone) systems.add(node.anchor_zone);
            if (node.rail) systems.add(node.rail);
          });
        });
        setVisibleSystems(systems);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadData();
  }, [ndjsonPath, sceneConfigPath]);

  // Parse NDJSON text into graph model
  const parseNDJSON = (ndjsonText) => {
    const lines = ndjsonText.trim().split('\n');
    const nodes = [];
    const edges = [];
    let metadata = null;
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const record = JSON.parse(line);
      
      if (record.kind === 'meta') {
        metadata = record;
      } else if (record.kind === 'node') {
        nodes.push(record);
      } else if (record.kind === 'edge') {
        edges.push(record);
      }
    }
    
    // Build indexes
    const nodesById = {};
    const byType = {};
    const neighbors = {};
    const anchors = {};
    
    nodes.forEach(node => {
      nodesById[node.id] = node;
      
      if (!byType[node.node_type]) {
        byType[node.node_type] = [];
      }
      byType[node.node_type].push(node.id);
      
      if (node.anchor_xyz) {
        anchors[node.id] = {
          xyz: node.anchor_xyz,
          ypr: node.anchor_ypr_deg,
          bbox: node.bbox_m
        };
      }
    });
    
    edges.forEach(edge => {
      if (!neighbors[edge.source]) neighbors[edge.source] = [];
      if (!neighbors[edge.target]) neighbors[edge.target] = [];
      neighbors[edge.source].push(edge.target);
      neighbors[edge.target].push(edge.source);
    });
    
    return {
      metadata,
      nodes,
      edges,
      nodesById,
      byType,
      neighbors,
      anchors
    };
  };

  // Filter nodes by visibility
  const visibleNodes = useMemo(() => {
    if (!graphModel) return [];
    
    return graphModel.nodes.filter(node => {
      if (visibleSystems.has(node.anchor_zone)) return true;
      if (node.rail && visibleSystems.has(node.rail)) return true;
      if (visibleSystems.size === 0) return true; // Show all if no filters
      return false;
    });
  }, [graphModel, visibleSystems]);

  // Filter edges by visibility (both endpoints must be visible)
  const visibleEdges = useMemo(() => {
    if (!graphModel) return [];
    
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    
    return graphModel.edges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [graphModel, visibleNodes]);

  // Group nodes by type for rendering
  const groupedNodes = useMemo(() => {
    if (!sceneConfig || !visibleNodes.length) return {};
    
    const groups = {};
    
    visibleNodes.forEach(node => {
      const { instances } = sceneConfig;
      
      if (instances.components.includes(node.node_type)) {
        if (!groups.components) groups.components = [];
        groups.components.push(node);
      } else if (instances.wires.includes(node.node_type)) {
        if (!groups.wires) groups.wires = [];
        groups.wires.push(node);
      } else if (instances.harnesses.includes(node.node_type)) {
        if (!groups.harnesses) groups.harnesses = [];
        groups.harnesses.push(node);
      }
    });
    
    return groups;
  }, [sceneConfig, visibleNodes]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleFilterChange = (systems) => {
    setVisibleSystems(new Set(systems));
  };

  if (loading) {
    return (
      <div className=\"flex items-center justify-center h-screen\">
        <div className=\"text-xl\">Loading electrical system...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className=\"flex items-center justify-center h-screen\">
        <div className=\"text-xl text-red-500\">Error: {error}</div>
      </div>
    );
  }

  if (!graphModel || !sceneConfig) {
    return (
      <div className=\"flex items-center justify-center h-screen\">
        <div className=\"text-xl\">No data loaded</div>
      </div>
    );
  }

  return (
    <div className=\"w-full h-screen relative\">
      {enableFilters && (
        <SystemFilters
          graphModel={graphModel}
          visibleSystems={visibleSystems}
          onFilterChange={handleFilterChange}
          className=\"absolute top-4 left-4 z-10\"
        />
      )}
      
      {selectedNode && (
        <NodePropertiesPanel
          node={selectedNode}
          graphModel={graphModel}
          onClose={() => setSelectedNode(null)}
          className=\"absolute top-4 right-4 z-10\"
        />
      )}
      
      <Canvas
        camera={{ position: [2, 2, 2], fov: 60 }}
        style={{ background: '#0a0a0a' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={10}
          minDistance={0.5}
        />
        
        {/* Render components (ECUs, fuses, relays, etc.) */}
        {groupedNodes.components?.map(node => (
          <Device
            key={node.id}
            node={node}
            sceneConfig={sceneConfig}
            onClick={() => handleNodeClick(node)}
            selected={selectedNode?.id === node.id}
          />
        ))}
        
        {/* Render connectors with pins */}
        {visibleNodes
          .filter(node => node.node_type === 'connector')
          .map(node => (
            <ConnectorPins
              key={node.id}
              node={node}
              graphModel={graphModel}
              sceneConfig={sceneConfig}
              onClick={() => handleNodeClick(node)}
              selected={selectedNode?.id === node.id}
            />
          ))}
        
        {/* Render wires */}
        {groupedNodes.wires?.map(node => (
          <WireCurve
            key={node.id}
            node={node}
            graphModel={graphModel}
            sceneConfig={sceneConfig}
            onClick={() => handleNodeClick(node)}
            selected={selectedNode?.id === node.id}
          />
        ))}
        
        {/* Render harnesses */}
        {groupedNodes.harnesses?.map(node => (
          <HarnessCurve
            key={node.id}
            node={node}
            sceneConfig={sceneConfig}
            onClick={() => handleNodeClick(node)}
            selected={selectedNode?.id === node.id}
          />
        ))}
        
        {/* Render ground straps */}
        {visibleNodes
          .filter(node => node.node_type === 'ground_point')
          .map(node => (
            <GroundStrap
              key={node.id}
              node={node}
              graphModel={graphModel}
              sceneConfig={sceneConfig}
              onClick={() => handleNodeClick(node)}
              selected={selectedNode?.id === node.id}
            />
          ))}
        
        {/* Render labels */}
        {showLabels && (
          <Labels
            nodes={visibleNodes}
            selectedNode={selectedNode}
            sceneConfig={sceneConfig}
          />
        )}
        
        {/* Coordinate frame reference */}
        <axesHelper args={[0.5]} position={[0, 0, 0]} />
        
      </Canvas>
    </div>
  );
}

// Node properties panel component
function NodePropertiesPanel({ node, graphModel, onClose, className }) {
  const neighbors = graphModel.neighbors[node.id] || [];
  
  return (
    <div className={`bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm ${className}`}>
      <div className=\"flex justify-between items-center mb-3\">
        <h3 className=\"text-lg font-bold\">{node.canonical_id || node.id}</h3>
        <button onClick={onClose} className=\"text-gray-400 hover:text-white\">
          ✕
        </button>
      </div>
      
      <div className=\"space-y-2 text-sm\">
        <div><strong>Type:</strong> {node.node_type}</div>
        <div><strong>Code ID:</strong> {node.code_id || 'N/A'}</div>
        <div><strong>Zone:</strong> {node.anchor_zone || 'N/A'}</div>
        
        {node.voltage && (
          <div><strong>Voltage:</strong> {node.voltage}</div>
        )}
        
        {node.color && (
          <div><strong>Color:</strong> {node.color}</div>
        )}
        
        {node.gauge && (
          <div><strong>Gauge:</strong> {node.gauge}</div>
        )}
        
        {node.signal && (
          <div><strong>Signal:</strong> {node.signal}</div>
        )}
        
        {node.anchor_xyz && (
          <div><strong>Position:</strong> [{node.anchor_xyz.map(v => v.toFixed(2)).join(', ')}]</div>
        )}
        
        {neighbors.length > 0 && (
          <div>
            <strong>Connections ({neighbors.length}):</strong>
            <div className=\"max-h-20 overflow-y-auto mt-1\">
              {neighbors.slice(0, 5).map(neighborId => {
                const neighbor = graphModel.nodesById[neighborId];
                return (
                  <div key={neighborId} className=\"text-xs text-gray-300\">
                    {neighbor?.canonical_id || neighborId}
                  </div>
                );
              })}
              {neighbors.length > 5 && (
                <div className=\"text-xs text-gray-400\">
                  ...and {neighbors.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}