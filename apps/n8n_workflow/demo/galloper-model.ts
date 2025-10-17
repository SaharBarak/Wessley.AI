/**
 * Hyundai Galloper 3D Electrical Model
 * Generates a complete 3D vehicle with interactive electrical components
 */

import * as THREE from 'three';

export interface ElectricalComponent {
  id: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  metadata: {
    type: string;
    label: string;
    voltage?: string;
    current?: string;
    power?: string;
  };
}

export interface WireConnection {
  id: string;
  from: string;
  to: string;
  path: THREE.Vector3[];
  mesh: THREE.Line;
  properties: {
    wireGauge: string;
    wireColor: string;
    voltage: string;
  };
}

export class GalloperElectricalModel {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public components: Map<string, ElectricalComponent> = new Map();
  public connections: Map<string, WireConnection> = new Map();
  private vehicleGroup: THREE.Group;
  private componentGroup: THREE.Group;
  private wireGroup: THREE.Group;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(15, 10, 15);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Groups for organization
    this.vehicleGroup = new THREE.Group();
    this.componentGroup = new THREE.Group();
    this.wireGroup = new THREE.Group();
    
    this.scene.add(this.vehicleGroup);
    this.scene.add(this.componentGroup);
    this.scene.add(this.wireGroup);

    this.setupLighting();
    this.buildVehicleBody();
    this.addElectricalComponents();
    this.addWireConnections();
    this.setupControls();
    this.animate();
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x8080ff, 0.3);
    fillLight.position.set(-10, 5, -5);
    this.scene.add(fillLight);
  }

  private buildVehicleBody(): void {
    // Vehicle body (simplified Galloper shape)
    const bodyGeometry = new THREE.BoxGeometry(8, 2, 3.5);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 1, 0);
    body.castShadow = true;
    this.vehicleGroup.add(body);

    // Hood
    const hoodGeometry = new THREE.BoxGeometry(2.5, 0.3, 3.5);
    const hoodMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e });
    const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
    hood.position.set(3.25, 2.15, 0);
    this.vehicleGroup.add(hood);

    // Windshield
    const windshieldGeometry = new THREE.BoxGeometry(0.1, 1.5, 3);
    const windshieldMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87ceeb, 
      transparent: true, 
      opacity: 0.3 
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.set(1.5, 2.5, 0);
    this.vehicleGroup.add(windshield);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.3, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    
    const wheelPositions = [
      [-2.5, 0.7, 1.5],  // Front left
      [-2.5, 0.7, -1.5], // Front right
      [2.5, 0.7, 1.5],   // Rear left
      [2.5, 0.7, -1.5]   // Rear right
    ];

    wheelPositions.forEach((pos, index) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      this.vehicleGroup.add(wheel);
    });

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private addElectricalComponents(): void {
    // Battery
    this.addComponent('battery_main', new THREE.Vector3(3, 0.5, 1), 'battery', 'Main Battery', {
      geometry: new THREE.BoxGeometry(0.8, 0.6, 0.4),
      color: 0x2c3e50
    });

    // Alternator
    this.addComponent('alternator_main', new THREE.Vector3(2.5, 1, 0), 'alternator', 'Alternator', {
      geometry: new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8),
      color: 0x7f8c8d
    });

    // Engine ECU
    this.addComponent('ecu_engine', new THREE.Vector3(2, 0.8, -0.5), 'ecu', 'Engine ECU', {
      geometry: new THREE.BoxGeometry(0.6, 0.4, 0.8),
      color: 0x27ae60
    });

    // Fuse Box (Engine Bay)
    this.addComponent('fuse_box_main', new THREE.Vector3(3.5, 1.2, -1), 'connector', 'Main Fuse Box', {
      geometry: new THREE.BoxGeometry(0.8, 0.3, 0.6),
      color: 0x34495e
    });

    // Headlights
    this.addComponent('headlight_left', new THREE.Vector3(4.2, 1.5, 1.2), 'lamp', 'Left Headlight', {
      geometry: new THREE.SphereGeometry(0.3, 8, 6),
      color: 0xffffff,
      emissive: true
    });

    this.addComponent('headlight_right', new THREE.Vector3(4.2, 1.5, -1.2), 'lamp', 'Right Headlight', {
      geometry: new THREE.SphereGeometry(0.3, 8, 6),
      color: 0xffffff,
      emissive: true
    });

    // Tail Lights
    this.addComponent('tail_light_left', new THREE.Vector3(-4.2, 1.3, 1.2), 'lamp', 'Left Tail Light', {
      geometry: new THREE.BoxGeometry(0.2, 0.4, 0.3),
      color: 0xff0000,
      emissive: true
    });

    this.addComponent('tail_light_right', new THREE.Vector3(-4.2, 1.3, -1.2), 'lamp', 'Right Tail Light', {
      geometry: new THREE.BoxGeometry(0.2, 0.4, 0.3),
      color: 0xff0000,
      emissive: true
    });

    // Fuel Injectors (4 cylinder)
    for (let i = 0; i < 4; i++) {
      this.addComponent(`fuel_injector_${i + 1}`, new THREE.Vector3(1.5 + i * 0.3, 1.8, 0), 'injector', `Fuel Injector ${i + 1}`, {
        geometry: new THREE.CylinderGeometry(0.1, 0.1, 0.4, 6),
        color: 0xe74c3c
      });
    }

    // Ignition Coils
    this.addComponent('ignition_coil_1', new THREE.Vector3(1.2, 2, 0.3), 'coil', 'Ignition Coil 1', {
      geometry: new THREE.BoxGeometry(0.3, 0.5, 0.2),
      color: 0x9b59b6
    });

    this.addComponent('ignition_coil_2', new THREE.Vector3(1.2, 2, -0.3), 'coil', 'Ignition Coil 2', {
      geometry: new THREE.BoxGeometry(0.3, 0.5, 0.2),
      color: 0x9b59b6
    });

    // Cooling Fan
    this.addComponent('cooling_fan_main', new THREE.Vector3(4, 1, 0), 'fan', 'Cooling Fan', {
      geometry: new THREE.CylinderGeometry(0.6, 0.6, 0.2, 6),
      color: 0x95a5a6
    });

    // Dashboard Cluster
    this.addComponent('dashboard_cluster', new THREE.Vector3(0, 2, 0), 'ecu', 'Dashboard Cluster', {
      geometry: new THREE.BoxGeometry(1.5, 0.3, 0.8),
      color: 0x2c3e50
    });

    // Starter Motor
    this.addComponent('starter_motor', new THREE.Vector3(2, 0.5, 0.8), 'motor', 'Starter Motor', {
      geometry: new THREE.CylinderGeometry(0.4, 0.4, 0.6, 8),
      color: 0x7f8c8d
    });

    // O2 Sensors (Exhaust)
    this.addComponent('oxygen_sensor_upstream', new THREE.Vector3(0, 0.3, 0.5), 'sensor', 'Upstream O2 Sensor', {
      geometry: new THREE.CylinderGeometry(0.1, 0.1, 0.3, 6),
      color: 0xf39c12
    });

    this.addComponent('oxygen_sensor_downstream', new THREE.Vector3(-1, 0.3, 0.5), 'sensor', 'Downstream O2 Sensor', {
      geometry: new THREE.CylinderGeometry(0.1, 0.1, 0.3, 6),
      color: 0xf39c12
    });
  }

  private addComponent(
    id: string, 
    position: THREE.Vector3, 
    type: string, 
    label: string, 
    options: {
      geometry: THREE.BufferGeometry;
      color: number;
      emissive?: boolean;
    }
  ): void {
    const material = options.emissive 
      ? new THREE.MeshStandardMaterial({ 
          color: options.color, 
          emissive: options.color,
          emissiveIntensity: 0.3 
        })
      : new THREE.MeshLambertMaterial({ color: options.color });

    const mesh = new THREE.Mesh(options.geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.userData = { componentId: id, type, label };

    const component: ElectricalComponent = {
      id,
      position,
      mesh,
      metadata: { type, label }
    };

    this.components.set(id, component);
    this.componentGroup.add(mesh);
  }

  private addWireConnections(): void {
    // Power connections (red wires)
    this.addWire('battery_to_fuse', 'battery_main', 'fuse_box_main', 0xff0000, '6mm²');
    this.addWire('battery_to_alternator', 'battery_main', 'alternator_main', 0xff0000, '6mm²');
    this.addWire('battery_to_starter', 'battery_main', 'starter_motor', 0xffff00, '10mm²');

    // ECU connections (multi-color)
    this.addWire('ecu_to_injector1', 'ecu_engine', 'fuel_injector_1', 0x3498db, '0.75mm²');
    this.addWire('ecu_to_injector2', 'ecu_engine', 'fuel_injector_2', 0xffff00, '0.75mm²');
    this.addWire('ecu_to_injector3', 'ecu_engine', 'fuel_injector_3', 0x27ae60, '0.75mm²');
    this.addWire('ecu_to_injector4', 'ecu_engine', 'fuel_injector_4', 0xffffff, '0.75mm²');

    // Ignition connections
    this.addWire('ecu_to_coil1', 'ecu_engine', 'ignition_coil_1', 0xff0000, '0.75mm²');
    this.addWire('ecu_to_coil2', 'ecu_engine', 'ignition_coil_2', 0x3498db, '0.75mm²');

    // Lighting connections
    this.addWire('fuse_to_headlight_left', 'fuse_box_main', 'headlight_left', 0xffffff, '2.5mm²');
    this.addWire('fuse_to_headlight_right', 'fuse_box_main', 'headlight_right', 0xffffff, '2.5mm²');

    // Sensor connections
    this.addWire('ecu_to_o2_upstream', 'ecu_engine', 'oxygen_sensor_upstream', 0xffffff, '0.75mm²');
    this.addWire('ecu_to_o2_downstream', 'ecu_engine', 'oxygen_sensor_downstream', 0x95a5a6, '0.75mm²');

    // Dashboard connection
    this.addWire('fuse_to_dashboard', 'fuse_box_main', 'dashboard_cluster', 0x3498db, '1.5mm²');
  }

  private addWire(id: string, fromId: string, toId: string, color: number, gauge: string): void {
    const fromComponent = this.components.get(fromId);
    const toComponent = this.components.get(toId);
    
    if (!fromComponent || !toComponent) return;

    const fromPos = fromComponent.position.clone();
    const toPos = toComponent.position.clone();

    // Create a curved path for more realistic wire routing
    const midPoint = new THREE.Vector3(
      (fromPos.x + toPos.x) / 2,
      Math.max(fromPos.y, toPos.y) + 0.5,
      (fromPos.z + toPos.z) / 2
    );

    const curve = new THREE.QuadraticBezierCurve3(fromPos, midPoint, toPos);
    const points = curve.getPoints(20);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
    const line = new THREE.Line(geometry, material);

    const connection: WireConnection = {
      id,
      from: fromId,
      to: toId,
      path: points,
      mesh: line,
      properties: {
        wireGauge: gauge,
        wireColor: `#${color.toString(16).padStart(6, '0')}`,
        voltage: '12V'
      }
    };

    this.connections.set(id, connection);
    this.wireGroup.add(line);
  }

  private setupControls(): void {
    // Mouse interaction for component selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener('click', (event) => {
      mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.componentGroup.children);

      if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        const userData = selectedObject.userData;
        
        if (userData.componentId) {
          this.highlightComponent(userData.componentId);
          console.log('Selected component:', userData);
        }
      }
    });

    // Orbit controls simulation with mouse
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    this.renderer.domElement.addEventListener('mousedown', () => {
      isDragging = true;
    });

    this.renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.renderer.domElement.addEventListener('mousemove', (event) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      const rotationSpeed = 0.005;
      
      // Rotate camera around the vehicle
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(this.camera.position);
      spherical.theta -= deltaMove.x * rotationSpeed;
      spherical.phi += deltaMove.y * rotationSpeed;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      
      this.camera.position.setFromSpherical(spherical);
      this.camera.lookAt(0, 0, 0);

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    });

    // Zoom with wheel
    this.renderer.domElement.addEventListener('wheel', (event) => {
      const direction = this.camera.position.clone().normalize();
      const distance = event.deltaY * 0.1;
      this.camera.position.add(direction.multiplyScalar(distance));
    });
  }

  private highlightComponent(componentId: string): void {
    // Reset all materials
    this.components.forEach(component => {
      const material = component.mesh.material as THREE.MeshLambertMaterial;
      material.emissive.setHex(0x000000);
    });

    // Highlight selected component
    const selectedComponent = this.components.get(componentId);
    if (selectedComponent) {
      const material = selectedComponent.mesh.material as THREE.MeshLambertMaterial;
      material.emissive.setHex(0x444444);
    }

    // Highlight connected wires
    this.connections.forEach(connection => {
      const material = connection.mesh.material as THREE.LineBasicMaterial;
      if (connection.from === componentId || connection.to === componentId) {
        material.opacity = 1.0;
        material.linewidth = 4;
      } else {
        material.opacity = 0.3;
        material.linewidth = 1;
      }
    });
  }

  public animate(): void {
    requestAnimationFrame(() => this.animate());

    // Rotate cooling fan
    const coolingFan = this.components.get('cooling_fan_main');
    if (coolingFan) {
      coolingFan.mesh.rotation.z += 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public getComponentInfo(componentId: string): ElectricalComponent | undefined {
    return this.components.get(componentId);
  }

  public getConnections(): WireConnection[] {
    return Array.from(this.connections.values());
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

// Export for use in HTML
(window as any).GalloperElectricalModel = GalloperElectricalModel;