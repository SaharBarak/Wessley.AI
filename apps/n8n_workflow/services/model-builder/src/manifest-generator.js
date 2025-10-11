/**
 * Manifest Generator
 * Creates viewer manifests for rich 3D viewer experiences
 */

class ManifestGenerator {
  
  constructor() {
    // Initialize any configuration
  }

  /**
   * Generate complete viewer manifest
   */
  generateManifest(graph3d, componentMeshes, wireMeshes, circuitGroups, buildInfo) {
    const manifest = {
      version: '1.0.0',
      type: 'electrical_system_3d',
      id: buildInfo.jobId,
      metadata: this.generateMetadata(graph3d, buildInfo),
      assets: this.generateAssetInfo(buildInfo),
      scene: this.generateSceneInfo(graph3d, componentMeshes, wireMeshes, circuitGroups),
      interactive: this.generateInteractiveInfo(componentMeshes, wireMeshes, circuitGroups),
      visualization: this.generateVisualizationInfo(graph3d),
      performance: this.generatePerformanceInfo(componentMeshes, wireMeshes, buildInfo)
    };
    
    return manifest;
  }

  /**
   * Generate metadata section
   */
  generateMetadata(graph3d, buildInfo) {
    return {
      title: `Electrical System - ${graph3d.vehicleId}`,
      description: `3D visualization of electrical system for ${graph3d.metadata?.brand} ${graph3d.metadata?.model} ${graph3d.metadata?.year}`,
      vehicle: {
        id: graph3d.vehicleId,
        brand: graph3d.metadata?.brand || 'Unknown',
        model: graph3d.metadata?.model || 'Unknown',
        year: graph3d.metadata?.year || 0,
        type: this.detectVehicleType(graph3d)
      },
      creation: {
        generatedAt: buildInfo.generatedAt,
        generatedBy: 'Wessley.ai Model Builder',
        version: '1.0.0',
        jobId: buildInfo.jobId
      },
      statistics: {
        nodeCount: graph3d.nodes?.length || 0,
        wireCount: graph3d.routes?.length || 0,
        circuitCount: graph3d.circuits?.length || 0,
        totalComponents: (graph3d.nodes?.length || 0) + (graph3d.routes?.length || 0)
      }
    };
  }

  /**
   * Generate asset information
   */
  generateAssetInfo(buildInfo) {
    return {
      glb: {
        filename: `${buildInfo.jobId}.glb`,
        path: buildInfo.glbPath,
        size: buildInfo.fileSize,
        format: 'GLB',
        version: '2.0'
      },
      manifest: {
        filename: `${buildInfo.jobId}_manifest.json`,
        size: 0, // Will be calculated after generation
        format: 'JSON'
      },
      thumbnails: [], // Could be generated separately
      documentation: [] // Links to related docs
    };
  }

  /**
   * Generate scene information
   */
  generateSceneInfo(graph3d, componentMeshes, wireMeshes, circuitGroups) {
    return {
      boundingBox: graph3d.metadata?.boundingBox || {
        min: [-2.5, -1.0, -0.5],
        max: [2.5, 1.0, 2.0]
      },
      scale: graph3d.metadata?.scale || 1.0,
      units: 'meters',
      up: 'Y',
      front: '+Z',
      coordinate_system: 'right_handed',
      lighting: {
        ambient: {
          color: '#FFFFFF',
          intensity: 0.6
        },
        directional: {
          color: '#FFFFFF',
          intensity: 0.8,
          position: [5, 5, 5]
        }
      },
      camera: {
        recommended: {
          position: [3, 2, 3],
          target: [0, 0, 0],
          fov: 60,
          near: 0.01,
          far: 100
        },
        presets: this.generateCameraPresets(graph3d)
      }
    };
  }

  /**
   * Generate interactive elements information
   */
  generateInteractiveInfo(componentMeshes, wireMeshes, circuitGroups) {
    const pickableObjects = [];
    const tooltips = {};
    const actions = {};
    
    // Process component meshes
    componentMeshes.forEach(mesh => {
      if (mesh.userData.pickable) {
        pickableObjects.push({
          id: mesh.userData.nodeId,
          name: mesh.name,
          type: 'component',
          category: mesh.userData.nodeType,
          circuits: mesh.userData.circuits || []
        });
        
        tooltips[mesh.userData.nodeId] = {
          content: mesh.userData.tooltip,
          position: 'auto',
          delay: 500
        };
        
        actions[mesh.userData.nodeId] = {
          click: 'show_component_details',
          hover: 'highlight_component',
          double_click: 'focus_on_component'
        };
      }
    });
    
    // Process wire meshes
    wireMeshes.forEach(mesh => {
      if (mesh.userData.pickable) {
        pickableObjects.push({
          id: mesh.userData.edgeId,
          name: mesh.name,
          type: 'wire',
          category: 'electrical_wire'
        });
        
        tooltips[mesh.userData.edgeId] = {
          content: mesh.userData.tooltip,
          position: 'auto',
          delay: 500
        };
        
        actions[mesh.userData.edgeId] = {
          click: 'show_wire_details',
          hover: 'highlight_wire_path'
        };
      }
    });
    
    // Process circuit groups
    circuitGroups.forEach(group => {
      if (group.userData.pickable) {
        pickableObjects.push({
          id: group.userData.circuitId,
          name: group.name,
          type: 'circuit',
          category: 'electrical_circuit',
          nodeCount: group.userData.nodeCount
        });
        
        tooltips[group.userData.circuitId] = {
          content: group.userData.tooltip,
          position: 'auto',
          delay: 500
        };
        
        actions[group.userData.circuitId] = {
          click: 'show_circuit_details',
          hover: 'highlight_circuit',
          double_click: 'isolate_circuit'
        };
      }
    });
    
    return {
      pickable_objects: pickableObjects,
      tooltips,
      actions,
      selection: {
        multi_select: true,
        highlight_color: '#FFFF00',
        selection_color: '#FF6600'
      },
      navigation: {
        orbit_controls: true,
        pan_controls: true,
        zoom_controls: true,
        fly_controls: false
      }
    };
  }

  /**
   * Generate visualization options
   */
  generateVisualizationInfo(graph3d) {
    return {
      rendering: {
        shadows: true,
        reflections: false,
        ambient_occlusion: true,
        anti_aliasing: true,
        tone_mapping: 'ACES_Filmic'
      },
      materials: {
        override_materials: false,
        wireframe_mode: false,
        transparency_support: true,
        pbr_materials: true
      },
      effects: {
        bloom: false,
        depth_of_field: false,
        motion_blur: false,
        screen_space_reflections: false
      },
      visibility: {
        components: true,
        wires: true,
        labels: false,
        bounding_boxes: false,
        connection_indicators: false,
        ground_plane: true
      },
      color_schemes: this.generateColorSchemes(graph3d),
      view_modes: [
        {
          id: 'realistic',
          name: 'Realistic View',
          description: 'Photorealistic rendering with materials',
          settings: {
            materials: true,
            lighting: 'realistic',
            shadows: true
          }
        },
        {
          id: 'schematic',
          name: 'Schematic View',
          description: 'Simplified view focusing on connections',
          settings: {
            materials: false,
            wireframe: true,
            labels: true
          }
        },
        {
          id: 'analysis',
          name: 'Analysis View',
          description: 'Color-coded by circuit or function',
          settings: {
            color_by_circuit: true,
            bounding_boxes: true,
            connection_indicators: true
          }
        }
      ]
    };
  }

  /**
   * Generate performance information
   */
  generatePerformanceInfo(componentMeshes, wireMeshes, buildInfo) {
    const totalVertices = this.calculateTotalVertices(componentMeshes, wireMeshes);
    const totalTriangles = this.calculateTotalTriangles(componentMeshes, wireMeshes);
    
    return {
      complexity: {
        total_vertices: totalVertices,
        total_triangles: totalTriangles,
        total_meshes: componentMeshes.length + wireMeshes.length,
        draw_calls: componentMeshes.length + wireMeshes.length
      },
      file_size: {
        glb_size: buildInfo.fileSize,
        manifest_size: 0, // Will be updated
        total_size: buildInfo.fileSize
      },
      generation_time: {
        processing_time_ms: buildInfo.processingTime || 0,
        generation_date: buildInfo.generatedAt
      },
      optimization: {
        geometry_merged: false,
        textures_compressed: false,
        materials_optimized: true,
        level_of_detail: false
      },
      recommended_specs: this.getRecommendedSpecs(totalVertices, totalTriangles)
    };
  }

  /**
   * Generate camera presets for different views
   */
  generateCameraPresets(graph3d) {
    const boundingBox = graph3d.metadata?.boundingBox || {
      min: [-2.5, -1.0, -0.5],
      max: [2.5, 1.0, 2.0]
    };
    
    const center = [
      (boundingBox.min[0] + boundingBox.max[0]) / 2,
      (boundingBox.min[1] + boundingBox.max[1]) / 2,
      (boundingBox.min[2] + boundingBox.max[2]) / 2
    ];
    
    const size = [
      boundingBox.max[0] - boundingBox.min[0],
      boundingBox.max[1] - boundingBox.min[1],
      boundingBox.max[2] - boundingBox.min[2]
    ];
    
    const distance = Math.max(...size) * 2;
    
    return [
      {
        id: 'overview',
        name: 'Overview',
        position: [center[0] + distance, center[1] + distance, center[2] + distance],
        target: center,
        description: 'Complete system overview'
      },
      {
        id: 'engine_bay',
        name: 'Engine Bay',
        position: [center[0] + 2, center[1] + 1, center[2] + 1],
        target: [2, 0, 0.3],
        description: 'Focus on engine compartment'
      },
      {
        id: 'dashboard',
        name: 'Dashboard',
        position: [center[0], center[1] + 1, center[2] + 2],
        target: [0.5, 0, 0.8],
        description: 'Dashboard and interior components'
      },
      {
        id: 'undercarriage',
        name: 'Undercarriage',
        position: [center[0], center[1] - 2, center[2]],
        target: [0, 0, -0.3],
        description: 'Under-vehicle components'
      }
    ];
  }

  /**
   * Generate color schemes for different visualization modes
   */
  generateColorSchemes(graph3d) {
    return [
      {
        id: 'default',
        name: 'Component Type',
        description: 'Color by component type',
        type: 'component_type'
      },
      {
        id: 'circuit',
        name: 'By Circuit',
        description: 'Color by circuit membership',
        type: 'circuit_based'
      },
      {
        id: 'voltage',
        name: 'By Voltage',
        description: 'Color by voltage level',
        type: 'voltage_based',
        colors: {
          '12V': '#FF0000',
          '5V': '#00FF00',
          '3.3V': '#0000FF',
          'Signal': '#FFFF00'
        }
      },
      {
        id: 'zone',
        name: 'By Zone',
        description: 'Color by physical zone',
        type: 'zone_based',
        colors: {
          'engine': '#FF6666',
          'dash': '#66FF66',
          'interior': '#6666FF',
          'exterior': '#FFFF66'
        }
      }
    ];
  }

  /**
   * Detect vehicle type from graph data
   */
  detectVehicleType(graph3d) {
    const nodeTypes = new Set();
    graph3d.nodes?.forEach(node => nodeTypes.add(node.type));
    
    if (nodeTypes.has('ecu') && nodeTypes.size > 20) {
      return 'modern_vehicle';
    } else if (nodeTypes.has('relay') && nodeTypes.size > 10) {
      return 'standard_vehicle';
    } else {
      return 'basic_vehicle';
    }
  }

  /**
   * Calculate total vertices in all meshes
   */
  calculateTotalVertices(componentMeshes, wireMeshes) {
    let total = 0;
    
    [...componentMeshes, ...wireMeshes].forEach(mesh => {
      if (mesh.geometry && mesh.geometry.attributes.position) {
        total += mesh.geometry.attributes.position.count;
      }
    });
    
    return total;
  }

  /**
   * Calculate total triangles in all meshes
   */
  calculateTotalTriangles(componentMeshes, wireMeshes) {
    let total = 0;
    
    [...componentMeshes, ...wireMeshes].forEach(mesh => {
      if (mesh.geometry) {
        if (mesh.geometry.index) {
          total += mesh.geometry.index.count / 3;
        } else if (mesh.geometry.attributes.position) {
          total += mesh.geometry.attributes.position.count / 3;
        }
      }
    });
    
    return Math.floor(total);
  }

  /**
   * Get recommended hardware specs
   */
  getRecommendedSpecs(vertices, triangles) {
    if (triangles > 100000) {
      return {
        gpu: 'High-end (RTX 3060 or better)',
        ram: '8GB+',
        cpu: 'Modern quad-core',
        note: 'Complex model - may require powerful hardware'
      };
    } else if (triangles > 50000) {
      return {
        gpu: 'Mid-range (GTX 1060 or better)',
        ram: '4GB+',
        cpu: 'Modern dual-core',
        note: 'Moderate complexity model'
      };
    } else {
      return {
        gpu: 'Basic (integrated graphics)',
        ram: '2GB+',
        cpu: 'Any modern processor',
        note: 'Lightweight model'
      };
    }
  }
}

module.exports = ManifestGenerator;