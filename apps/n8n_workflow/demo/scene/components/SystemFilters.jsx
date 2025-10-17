import React, { useState, useMemo } from 'react';

/**
 * SystemFilters - UI toggles by rail, anchor_zone, or byType
 * Per instructions.md section 8.2
 */
export default function SystemFilters({ 
  graphModel, 
  visibleSystems, 
  onFilterChange, 
  className = \"\" 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterMode, setFilterMode] = useState('zone'); // 'zone', 'type', 'rail'

  // Extract available filter options
  const filterOptions = useMemo(() => {
    const zones = new Set();
    const types = new Set();
    const rails = new Set();
    
    Object.values(graphModel.nodesById || {}).forEach(node => {
      if (node.anchor_zone) zones.add(node.anchor_zone);
      if (node.node_type) types.add(node.node_type);
      if (node.rail) rails.add(node.rail);
    });
    
    return {
      zone: Array.from(zones).sort(),
      type: Array.from(types).sort(),
      rail: Array.from(rails).sort()
    };
  }, [graphModel]);

  // Get current filter list based on mode
  const currentFilters = filterOptions[filterMode] || [];

  // Count nodes for each filter
  const filterCounts = useMemo(() => {
    const counts = {};
    
    currentFilters.forEach(filter => {
      counts[filter] = Object.values(graphModel.nodesById || {}).filter(node => {
        switch (filterMode) {
          case 'zone': return node.anchor_zone === filter;
          case 'type': return node.node_type === filter;
          case 'rail': return node.rail === filter;
          default: return false;
        }
      }).length;
    });
    
    return counts;
  }, [currentFilters, filterMode, graphModel]);

  const handleFilterToggle = (filter) => {
    const newVisibleSystems = new Set(visibleSystems);
    
    if (newVisibleSystems.has(filter)) {
      newVisibleSystems.delete(filter);
    } else {
      newVisibleSystems.add(filter);
    }
    
    onFilterChange(Array.from(newVisibleSystems));
  };

  const handleSelectAll = () => {
    onFilterChange(currentFilters);
  };

  const handleSelectNone = () => {
    // Remove current filter type from visible systems
    const newVisibleSystems = new Set(visibleSystems);
    currentFilters.forEach(filter => newVisibleSystems.delete(filter));
    onFilterChange(Array.from(newVisibleSystems));
  };

  const handleModeChange = (mode) => {
    setFilterMode(mode);
  };

  // Get color for filter type
  const getFilterColor = (filter) => {
    switch (filterMode) {
      case 'zone':
        const zoneColors = {
          'Engine Compartment': 'bg-red-500',
          'Dash Panel': 'bg-blue-500',
          'Floor & Roof': 'bg-green-500',
          'Rear Cargo/Tailgate': 'bg-yellow-500',
          'Left Front Door': 'bg-purple-500',
          'Right Front Door': 'bg-cyan-500',
          'Chassis': 'bg-gray-500'
        };
        return zoneColors[filter] || 'bg-gray-400';
      
      case 'type':
        const typeColors = {
          'component': 'bg-blue-600',
          'fuse': 'bg-orange-500',
          'relay': 'bg-green-600',
          'wire': 'bg-gray-500',
          'connector': 'bg-purple-600',
          'harness': 'bg-red-600',
          'bus': 'bg-pink-600',
          'ground_point': 'bg-black'
        };
        return typeColors[filter] || 'bg-gray-400';
      
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`bg-gray-900 text-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between p-3 border-b border-gray-700\">
        <h3 className=\"text-sm font-bold\">System Filters</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className=\"text-gray-400 hover:text-white transition-colors\"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      
      {isExpanded && (
        <div className=\"p-3 space-y-3\">
          {/* Filter mode selector */}
          <div className=\"flex space-x-1 text-xs\">
            {['zone', 'type', 'rail'].map(mode => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`
                  px-2 py-1 rounded capitalize transition-colors
                  ${filterMode === mode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                {mode}
              </button>
            ))}
          </div>
          
          {/* Select all/none buttons */}
          <div className=\"flex space-x-1 text-xs\">
            <button
              onClick={handleSelectAll}
              className=\"px-2 py-1 bg-green-600 hover:bg-green-700 rounded transition-colors\"
            >
              All
            </button>
            <button
              onClick={handleSelectNone}
              className=\"px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors\"
            >
              None
            </button>
          </div>
          
          {/* Filter list */}
          <div className=\"max-h-60 overflow-y-auto space-y-1\">
            {currentFilters.map(filter => {
              const isVisible = visibleSystems.has(filter);
              const count = filterCounts[filter] || 0;
              
              return (
                <div
                  key={filter}
                  className=\"flex items-center justify-between p-2 rounded hover:bg-gray-800 transition-colors\"
                >
                  <div className=\"flex items-center space-x-2 flex-1 min-w-0\">
                    <div className={`w-3 h-3 rounded-full ${getFilterColor(filter)}`} />
                    <input
                      type=\"checkbox\"
                      checked={isVisible}
                      onChange={() => handleFilterToggle(filter)}
                      className=\"form-checkbox h-3 w-3 text-blue-600\"
                    />
                    <span className=\"text-xs truncate\" title={filter}>
                      {filter}
                    </span>
                  </div>
                  <span className=\"text-xs text-gray-400 ml-2\">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Summary */}
          <div className=\"pt-2 border-t border-gray-700 text-xs text-gray-400\">
            {visibleSystems.size} of {currentFilters.length} {filterMode}s visible
          </div>
        </div>
      )}
    </div>
  );
}