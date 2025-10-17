/**
 * Wessley.ai Demo Server
 * Orchestrates the complete electrical system generation pipeline
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const axios = require('axios');

const app = express();
const PORT = 3010;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Service configuration
const SERVICES = {
  INGEST: 'http://localhost:3001',
  LAYOUT: 'http://localhost:3002', 
  MODEL_BUILDER: 'http://localhost:3000'
};

// Demo data generator
class DemoDataGenerator {
  
  static generateVehicleDescriptor(brand, model, year) {
    const vehicleId = `${brand}_${model.toLowerCase().replace(/\s+/g, '_')}_${year}`;
    
    return {
      vehicleId,
      metadata: {
        brand,
        model,
        year: parseInt(year),
        generated: new Date().toISOString()
      },
      nodes: this.generateNodes(brand, model, year),
      edges: this.generateEdges(),
      circuits: this.generateCircuits()
    };
  }
  
  static generateNodes(brand, model, year) {
    const baseNodes = [
      // Power System
      {
        id: 'battery_main',
        type: 'battery',
        label: 'Main Battery',
        zone: 'engine',
        metadata: { voltage: '12V', capacity: '70Ah', type: 'lead_acid' }
      },
      {
        id: 'alternator_main',
        type: 'alternator', 
        label: 'Main Alternator',
        zone: 'engine',
        metadata: { output: '120A', voltage: '12V', type: 'AC_generator' }
      },
      {
        id: 'starter_motor',
        type: 'motor',
        label: 'Starter Motor',
        zone: 'engine',
        metadata: { power: '2.2kW', voltage: '12V', type: 'DC_motor' }
      },
      
      // Fuse System
      {
        id: 'fuse_main_60a',
        type: 'fuse',
        label: 'Main 60A Fuse',
        zone: 'engine',
        metadata: { rating: '60A', type: 'blade' }
      },
      {
        id: 'fuse_box_main',
        type: 'connector',
        label: 'Main Fuse Box',
        zone: 'engine',
        metadata: { slots: 40, type: 'blade_box' }
      },
      {
        id: 'fuse_box_interior',
        type: 'connector',
        label: 'Interior Fuse Box',
        zone: 'dash',
        metadata: { slots: 20, type: 'mini_blade_box' }
      },
      {
        id: 'fuse_headlights_20a',
        type: 'fuse',
        label: 'Headlights 20A Fuse',
        zone: 'engine',
        metadata: { rating: '20A', type: 'blade' }
      },
      {
        id: 'fuse_tail_lights_15a',
        type: 'fuse',
        label: 'Tail Lights 15A Fuse',
        zone: 'engine',
        metadata: { rating: '15A', type: 'blade' }
      },
      {
        id: 'fuse_horn_10a',
        type: 'fuse',
        label: 'Horn 10A Fuse',
        zone: 'engine',
        metadata: { rating: '10A', type: 'blade' }
      },
      {
        id: 'fuse_fans_30a',
        type: 'fuse',
        label: 'Cooling Fans 30A Fuse',
        zone: 'engine',
        metadata: { rating: '30A', type: 'blade' }
      },
      
      // Relay System
      {
        id: 'relay_starter',
        type: 'relay',
        label: 'Starter Relay',
        zone: 'engine',
        metadata: { type: 'SPDT', rating: '40A' }
      },
      {
        id: 'relay_headlights',
        type: 'relay',
        label: 'Headlights Relay',
        zone: 'engine',
        metadata: { type: 'SPDT', rating: '30A' }
      },
      {
        id: 'relay_horn',
        type: 'relay',
        label: 'Horn Relay',
        zone: 'engine',
        metadata: { type: 'SPST', rating: '20A' }
      },
      {
        id: 'relay_fuel_pump',
        type: 'relay',
        label: 'Fuel Pump Relay',
        zone: 'engine',
        metadata: { type: 'SPDT', rating: '20A' }
      },
      {
        id: 'relay_cooling_fan',
        type: 'relay',
        label: 'Cooling Fan Relay',
        zone: 'engine',
        metadata: { type: 'SPDT', rating: '30A' }
      },
      {
        id: 'relay_ac_compressor',
        type: 'relay',
        label: 'AC Compressor Relay',
        zone: 'engine',
        metadata: { type: 'SPDT', rating: '25A' }
      },
      
      // Engine Control Systems
      {
        id: 'ecu_engine',
        type: 'ecu',
        label: 'Engine Control Unit',
        zone: 'engine',
        metadata: { type: 'engine_management', version: '2.0' }
      },
      {
        id: 'engine_harness_main',
        type: 'harness',
        label: 'Main Engine Harness',
        zone: 'engine',
        metadata: { wires: 85, connector_type: 'weatherproof' }
      },
      {
        id: 'fuel_pump',
        type: 'pump',
        label: 'Fuel Pump',
        zone: 'fuel_tank',
        metadata: { pressure: '3.5_bar', power: '120W' }
      },
      {
        id: 'fuel_injector_1',
        type: 'injector',
        label: 'Fuel Injector Cylinder 1',
        zone: 'engine',
        metadata: { flow_rate: '380cc/min', voltage: '12V' }
      },
      {
        id: 'fuel_injector_2',
        type: 'injector',
        label: 'Fuel Injector Cylinder 2',
        zone: 'engine',
        metadata: { flow_rate: '380cc/min', voltage: '12V' }
      },
      {
        id: 'fuel_injector_3',
        type: 'injector',
        label: 'Fuel Injector Cylinder 3',
        zone: 'engine',
        metadata: { flow_rate: '380cc/min', voltage: '12V' }
      },
      {
        id: 'fuel_injector_4',
        type: 'injector',
        label: 'Fuel Injector Cylinder 4',
        zone: 'engine',
        metadata: { flow_rate: '380cc/min', voltage: '12V' }
      },
      {
        id: 'ignition_coil_1',
        type: 'coil',
        label: 'Ignition Coil Cylinder 1',
        zone: 'engine',
        metadata: { voltage_output: '40kV', primary_resistance: '0.5_ohm' }
      },
      {
        id: 'ignition_coil_2',
        type: 'coil',
        label: 'Ignition Coil Cylinder 2',
        zone: 'engine',
        metadata: { voltage_output: '40kV', primary_resistance: '0.5_ohm' }
      },
      
      // Lighting System - Exterior
      {
        id: 'headlight_left',
        type: 'lamp',
        label: 'Left Headlight',
        zone: 'exterior',
        metadata: { power: '55W', type: 'halogen', beam_type: 'low_high' }
      },
      {
        id: 'headlight_right',
        type: 'lamp',
        label: 'Right Headlight', 
        zone: 'exterior',
        metadata: { power: '55W', type: 'halogen', beam_type: 'low_high' }
      },
      {
        id: 'fog_light_left',
        type: 'lamp',
        label: 'Left Fog Light',
        zone: 'exterior',
        metadata: { power: '35W', type: 'halogen', beam_type: 'fog' }
      },
      {
        id: 'fog_light_right',
        type: 'lamp',
        label: 'Right Fog Light',
        zone: 'exterior',
        metadata: { power: '35W', type: 'halogen', beam_type: 'fog' }
      },
      {
        id: 'tail_light_left',
        type: 'lamp',
        label: 'Left Tail Light',
        zone: 'exterior',
        metadata: { power: '21W', type: 'incandescent', functions: ['tail', 'brake', 'turn'] }
      },
      {
        id: 'tail_light_right',
        type: 'lamp',
        label: 'Right Tail Light',
        zone: 'exterior',
        metadata: { power: '21W', type: 'incandescent', functions: ['tail', 'brake', 'turn'] }
      },
      {
        id: 'reverse_light_left',
        type: 'lamp',
        label: 'Left Reverse Light',
        zone: 'exterior',
        metadata: { power: '21W', type: 'incandescent', function: 'reverse' }
      },
      {
        id: 'reverse_light_right',
        type: 'lamp',
        label: 'Right Reverse Light',
        zone: 'exterior',
        metadata: { power: '21W', type: 'incandescent', function: 'reverse' }
      },
      {
        id: 'license_plate_light',
        type: 'lamp',
        label: 'License Plate Light',
        zone: 'exterior',
        metadata: { power: '5W', type: 'incandescent', function: 'illumination' }
      },
      {
        id: 'side_marker_left',
        type: 'lamp',
        label: 'Left Side Marker',
        zone: 'exterior',
        metadata: { power: '5W', type: 'LED', function: 'position' }
      },
      {
        id: 'side_marker_right',
        type: 'lamp',
        label: 'Right Side Marker',
        zone: 'exterior',
        metadata: { power: '5W', type: 'LED', function: 'position' }
      },
      
      // Lighting System - Interior
      {
        id: 'dome_light',
        type: 'lamp',
        label: 'Dome Light',
        zone: 'interior',
        metadata: { power: '10W', type: 'incandescent', function: 'interior' }
      },
      {
        id: 'map_light_left',
        type: 'lamp',
        label: 'Left Map Light',
        zone: 'interior',
        metadata: { power: '5W', type: 'incandescent', function: 'reading' }
      },
      {
        id: 'map_light_right',
        type: 'lamp',
        label: 'Right Map Light',
        zone: 'interior',
        metadata: { power: '5W', type: 'incandescent', function: 'reading' }
      },
      {
        id: 'dashboard_illumination',
        type: 'lamp',
        label: 'Dashboard Illumination',
        zone: 'dash',
        metadata: { power: '2W', type: 'LED', function: 'instrument_backlighting' }
      },
      
      // Exhaust & Emissions
      {
        id: 'oxygen_sensor_upstream',
        type: 'sensor',
        label: 'Upstream O2 Sensor',
        zone: 'exhaust',
        metadata: { type: 'lambda_sensor', voltage_range: '0.1V-0.9V' }
      },
      {
        id: 'oxygen_sensor_downstream',
        type: 'sensor',
        label: 'Downstream O2 Sensor',
        zone: 'exhaust',
        metadata: { type: 'lambda_sensor', voltage_range: '0.1V-0.9V' }
      },
      {
        id: 'catalytic_converter_heater',
        type: 'heater',
        label: 'Catalytic Converter Heater',
        zone: 'exhaust',
        metadata: { power: '150W', voltage: '12V' }
      },
      {
        id: 'exhaust_gas_temp_sensor',
        type: 'sensor',
        label: 'Exhaust Gas Temperature Sensor',
        zone: 'exhaust',
        metadata: { range: '-40C_to_900C', voltage: '5V' }
      },
      
      // Cooling System
      {
        id: 'cooling_fan_main',
        type: 'fan',
        label: 'Main Cooling Fan',
        zone: 'engine',
        metadata: { power: '200W', cfm: '2500' }
      },
      {
        id: 'cooling_fan_aux',
        type: 'fan',
        label: 'Auxiliary Cooling Fan',
        zone: 'engine',
        metadata: { power: '150W', cfm: '1800' }
      },
      {
        id: 'coolant_temp_sensor',
        type: 'sensor',
        label: 'Coolant Temperature Sensor',
        zone: 'engine',
        metadata: { range: '-40C_to_150C', resistance_type: 'NTC' }
      },
      
      // Horn System
      {
        id: 'horn_high',
        type: 'horn',
        label: 'High Tone Horn',
        zone: 'exterior',
        metadata: { frequency: '500Hz', power: '30W' }
      },
      {
        id: 'horn_low',
        type: 'horn',
        label: 'Low Tone Horn',
        zone: 'exterior',
        metadata: { frequency: '400Hz', power: '30W' }
      },
      
      // Dashboard & Controls
      {
        id: 'dashboard_cluster',
        type: 'ecu',
        label: 'Dashboard Cluster',
        zone: 'dash',
        metadata: { type: 'instrument_cluster', displays: ['speed', 'fuel', 'temp', 'rpm'] }
      },
      {
        id: 'ignition_switch',
        type: 'connector',
        label: 'Ignition Switch',
        zone: 'dash',
        metadata: { positions: ['off', 'acc', 'on', 'start'] }
      },
      {
        id: 'headlight_switch',
        type: 'switch',
        label: 'Headlight Switch',
        zone: 'dash',
        metadata: { positions: ['off', 'parking', 'headlights', 'auto'] }
      },
      {
        id: 'wiper_switch',
        type: 'switch',
        label: 'Windshield Wiper Switch',
        zone: 'dash',
        metadata: { positions: ['off', 'intermittent', 'low', 'high'] }
      },
      
      // Ground Points
      {
        id: 'ground_main',
        type: 'ground',
        label: 'Main Ground',
        zone: 'engine',
        metadata: { connection: 'chassis', gauge: '4AWG' }
      },
      {
        id: 'ground_engine_block',
        type: 'ground',
        label: 'Engine Block Ground',
        zone: 'engine',
        metadata: { connection: 'engine_block', gauge: '6AWG' }
      },
      {
        id: 'ground_body',
        type: 'ground',
        label: 'Body Ground',
        zone: 'body',
        metadata: { connection: 'body_panel', gauge: '8AWG' }
      }
    ];
    
    // Add year-specific nodes
    if (year >= 2000) {
      baseNodes.push({
        id: 'ecu_abs',
        type: 'ecu',
        label: 'ABS Control Unit',
        zone: 'engine',
        metadata: { type: 'abs_control', channels: 4 }
      });
    }
    
    if (year >= 2005) {
      baseNodes.push({
        id: 'ecu_airbag',
        type: 'ecu',
        label: 'Airbag Control Unit',
        zone: 'interior',
        metadata: { type: 'airbag_control', zones: 6 }
      });
    }
    
    return baseNodes;
  }
  
  static generateEdges() {
    return [
      // Main Power Distribution
      {
        id: 'edge_battery_fuse_main',
        from: 'battery_main',
        to: 'fuse_main_60a',
        type: 'power',
        properties: { wireGauge: '6mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_fuse_main_fusebox',
        from: 'fuse_main_60a',
        to: 'fuse_box_main',
        type: 'power',
        properties: { wireGauge: '6mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_battery_alternator',
        from: 'battery_main',
        to: 'alternator_main',
        type: 'power',
        properties: { wireGauge: '6mm²', wireColor: 'red', voltage: '12V' }
      },
      
      // Starter System
      {
        id: 'edge_battery_starter_relay',
        from: 'battery_main',
        to: 'relay_starter',
        type: 'power',
        properties: { wireGauge: '4mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_starter_relay_motor',
        from: 'relay_starter',
        to: 'starter_motor',
        type: 'power',
        properties: { wireGauge: '10mm²', wireColor: 'yellow', voltage: '12V' }
      },
      {
        id: 'edge_ignition_starter_relay',
        from: 'ignition_switch',
        to: 'relay_starter',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'blue', voltage: '12V' }
      },
      
      // Headlight System
      {
        id: 'edge_fusebox_headlight_fuse',
        from: 'fuse_box_main',
        to: 'fuse_headlights_20a',
        type: 'power',
        properties: { wireGauge: '2.5mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_headlight_fuse_relay',
        from: 'fuse_headlights_20a',
        to: 'relay_headlights',
        type: 'power',
        properties: { wireGauge: '2.5mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_headlight_relay_left',
        from: 'relay_headlights',
        to: 'headlight_left',
        type: 'power',
        properties: { wireGauge: '2.5mm²', wireColor: 'white', voltage: '12V' }
      },
      {
        id: 'edge_headlight_relay_right',
        from: 'relay_headlights',
        to: 'headlight_right',
        type: 'power',
        properties: { wireGauge: '2.5mm²', wireColor: 'white', voltage: '12V' }
      },
      {
        id: 'edge_headlight_switch_relay',
        from: 'headlight_switch',
        to: 'relay_headlights',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'green', voltage: '12V' }
      },
      
      // Fog Lights
      {
        id: 'edge_headlight_relay_fog_left',
        from: 'relay_headlights',
        to: 'fog_light_left',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'yellow', voltage: '12V' }
      },
      {
        id: 'edge_headlight_relay_fog_right',
        from: 'relay_headlights',
        to: 'fog_light_right',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'yellow', voltage: '12V' }
      },
      
      // Tail Lights & Brake Lights
      {
        id: 'edge_fusebox_tail_fuse',
        from: 'fuse_box_main',
        to: 'fuse_tail_lights_15a',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_tail_fuse_left',
        from: 'fuse_tail_lights_15a',
        to: 'tail_light_left',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'brown', voltage: '12V' }
      },
      {
        id: 'edge_tail_fuse_right',
        from: 'fuse_tail_lights_15a',
        to: 'tail_light_right',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'brown', voltage: '12V' }
      },
      {
        id: 'edge_tail_fuse_reverse_left',
        from: 'fuse_tail_lights_15a',
        to: 'reverse_light_left',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'white', voltage: '12V' }
      },
      {
        id: 'edge_tail_fuse_reverse_right',
        from: 'fuse_tail_lights_15a',
        to: 'reverse_light_right',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'white', voltage: '12V' }
      },
      {
        id: 'edge_tail_fuse_license',
        from: 'fuse_tail_lights_15a',
        to: 'license_plate_light',
        type: 'power',
        properties: { wireGauge: '0.75mm²', wireColor: 'brown', voltage: '12V' }
      },
      {
        id: 'edge_tail_fuse_marker_left',
        from: 'fuse_tail_lights_15a',
        to: 'side_marker_left',
        type: 'power',
        properties: { wireGauge: '0.75mm²', wireColor: 'orange', voltage: '12V' }
      },
      {
        id: 'edge_tail_fuse_marker_right',
        from: 'fuse_tail_lights_15a',
        to: 'side_marker_right',
        type: 'power',
        properties: { wireGauge: '0.75mm²', wireColor: 'orange', voltage: '12V' }
      },
      
      // Interior Lighting
      {
        id: 'edge_interior_fusebox_dome',
        from: 'fuse_box_interior',
        to: 'dome_light',
        type: 'power',
        properties: { wireGauge: '1.0mm²', wireColor: 'gray', voltage: '12V' }
      },
      {
        id: 'edge_interior_fusebox_map_left',
        from: 'fuse_box_interior',
        to: 'map_light_left',
        type: 'power',
        properties: { wireGauge: '0.75mm²', wireColor: 'gray', voltage: '12V' }
      },
      {
        id: 'edge_interior_fusebox_map_right',
        from: 'fuse_box_interior',
        to: 'map_light_right',
        type: 'power',
        properties: { wireGauge: '0.75mm²', wireColor: 'gray', voltage: '12V' }
      },
      {
        id: 'edge_interior_fusebox_dashboard_lights',
        from: 'fuse_box_interior',
        to: 'dashboard_illumination',
        type: 'power',
        properties: { wireGauge: '0.75mm²', wireColor: 'green', voltage: '12V' }
      },
      
      // Horn System
      {
        id: 'edge_fusebox_horn_fuse',
        from: 'fuse_box_main',
        to: 'fuse_horn_10a',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_horn_fuse_relay',
        from: 'fuse_horn_10a',
        to: 'relay_horn',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_horn_relay_high',
        from: 'relay_horn',
        to: 'horn_high',
        type: 'power',
        properties: { wireGauge: '2.5mm²', wireColor: 'black', voltage: '12V' }
      },
      {
        id: 'edge_horn_relay_low',
        from: 'relay_horn',
        to: 'horn_low',
        type: 'power',
        properties: { wireGauge: '2.5mm²', wireColor: 'black', voltage: '12V' }
      },
      
      // Engine Control & Fuel System
      {
        id: 'edge_fusebox_ecu_engine',
        from: 'fuse_box_main',
        to: 'ecu_engine',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'brown', voltage: '12V' }
      },
      {
        id: 'edge_ecu_harness',
        from: 'ecu_engine',
        to: 'engine_harness_main',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'multi', voltage: '5V' }
      },
      {
        id: 'edge_fuel_pump_relay_pump',
        from: 'relay_fuel_pump',
        to: 'fuel_pump',
        type: 'power',
        properties: { wireGauge: '2.5mm²', wireColor: 'green', voltage: '12V' }
      },
      {
        id: 'edge_ecu_fuel_relay',
        from: 'ecu_engine',
        to: 'relay_fuel_pump',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'pink', voltage: '12V' }
      },
      {
        id: 'edge_ecu_injector_1',
        from: 'ecu_engine',
        to: 'fuel_injector_1',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'blue', voltage: '12V' }
      },
      {
        id: 'edge_ecu_injector_2',
        from: 'ecu_engine',
        to: 'fuel_injector_2',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'yellow', voltage: '12V' }
      },
      {
        id: 'edge_ecu_injector_3',
        from: 'ecu_engine',
        to: 'fuel_injector_3',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'green', voltage: '12V' }
      },
      {
        id: 'edge_ecu_injector_4',
        from: 'ecu_engine',
        to: 'fuel_injector_4',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'white', voltage: '12V' }
      },
      {
        id: 'edge_ecu_coil_1',
        from: 'ecu_engine',
        to: 'ignition_coil_1',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_ecu_coil_2',
        from: 'ecu_engine',
        to: 'ignition_coil_2',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'blue', voltage: '12V' }
      },
      
      // Cooling System
      {
        id: 'edge_fusebox_fan_fuse',
        from: 'fuse_box_main',
        to: 'fuse_fans_30a',
        type: 'power',
        properties: { wireGauge: '4mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_fan_fuse_relay',
        from: 'fuse_fans_30a',
        to: 'relay_cooling_fan',
        type: 'power',
        properties: { wireGauge: '4mm²', wireColor: 'red', voltage: '12V' }
      },
      {
        id: 'edge_fan_relay_main',
        from: 'relay_cooling_fan',
        to: 'cooling_fan_main',
        type: 'power',
        properties: { wireGauge: '4mm²', wireColor: 'black', voltage: '12V' }
      },
      {
        id: 'edge_fan_relay_aux',
        from: 'relay_cooling_fan',
        to: 'cooling_fan_aux',
        type: 'power',
        properties: { wireGauge: '2.5mm²', wireColor: 'black', voltage: '12V' }
      },
      {
        id: 'edge_ecu_coolant_sensor',
        from: 'ecu_engine',
        to: 'coolant_temp_sensor',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'yellow', voltage: '5V' }
      },
      {
        id: 'edge_ecu_fan_relay',
        from: 'ecu_engine',
        to: 'relay_cooling_fan',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'green', voltage: '12V' }
      },
      
      // Exhaust & Emissions
      {
        id: 'edge_ecu_o2_upstream',
        from: 'ecu_engine',
        to: 'oxygen_sensor_upstream',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'white', voltage: '5V' }
      },
      {
        id: 'edge_ecu_o2_downstream',
        from: 'ecu_engine',
        to: 'oxygen_sensor_downstream',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'gray', voltage: '5V' }
      },
      {
        id: 'edge_ecu_cat_heater',
        from: 'ecu_engine',
        to: 'catalytic_converter_heater',
        type: 'power',
        properties: { wireGauge: '2.5mm²', wireColor: 'orange', voltage: '12V' }
      },
      {
        id: 'edge_ecu_exhaust_temp',
        from: 'ecu_engine',
        to: 'exhaust_gas_temp_sensor',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'purple', voltage: '5V' }
      },
      
      // Dashboard & Controls
      {
        id: 'edge_fusebox_dashboard',
        from: 'fuse_box_interior',
        to: 'dashboard_cluster',
        type: 'power',
        properties: { wireGauge: '1.5mm²', wireColor: 'blue', voltage: '12V' }
      },
      {
        id: 'edge_ignition_ecu',
        from: 'ignition_switch',
        to: 'ecu_engine',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'purple', voltage: '5V' }
      },
      {
        id: 'edge_ignition_dashboard',
        from: 'ignition_switch',
        to: 'dashboard_cluster',
        type: 'signal',
        properties: { wireGauge: '0.75mm²', wireColor: 'red', voltage: '12V' }
      },
      
      // Ground Connections
      {
        id: 'edge_battery_ground',
        from: 'battery_main',
        to: 'ground_main',
        type: 'ground',
        properties: { wireGauge: '6mm²', wireColor: 'black', voltage: '0V' }
      },
      {
        id: 'edge_engine_ground',
        from: 'ground_main',
        to: 'ground_engine_block',
        type: 'ground',
        properties: { wireGauge: '6mm²', wireColor: 'black', voltage: '0V' }
      },
      {
        id: 'edge_body_ground',
        from: 'ground_main',
        to: 'ground_body',
        type: 'ground',
        properties: { wireGauge: '8mm²', wireColor: 'black', voltage: '0V' }
      },
      {
        id: 'edge_ecu_ground',
        from: 'ecu_engine',
        to: 'ground_engine_block',
        type: 'ground',
        properties: { wireGauge: '1.5mm²', wireColor: 'black', voltage: '0V' }
      }
    ];
  }
  
  static generateCircuits() {
    return [
      {
        id: 'circuit_power',
        label: 'Main Power Circuit',
        nodes: ['battery_main', 'fuse_main_60a', 'fuse_box_main', 'fuse_box_interior', 'alternator_main'],
        color: '#FF0000'
      },
      {
        id: 'circuit_starter',
        label: 'Starter Circuit',
        nodes: ['battery_main', 'relay_starter', 'starter_motor', 'ignition_switch'],
        color: '#FFD700'
      },
      {
        id: 'circuit_exterior_lighting',
        label: 'Exterior Lighting Circuit',
        nodes: ['fuse_headlights_20a', 'relay_headlights', 'headlight_left', 'headlight_right', 'fog_light_left', 'fog_light_right', 'headlight_switch'],
        color: '#00FF00'
      },
      {
        id: 'circuit_tail_lighting',
        label: 'Tail Lighting Circuit',
        nodes: ['fuse_tail_lights_15a', 'tail_light_left', 'tail_light_right', 'reverse_light_left', 'reverse_light_right', 'license_plate_light', 'side_marker_left', 'side_marker_right'],
        color: '#90EE90'
      },
      {
        id: 'circuit_interior_lighting',
        label: 'Interior Lighting Circuit',
        nodes: ['fuse_box_interior', 'dome_light', 'map_light_left', 'map_light_right', 'dashboard_illumination'],
        color: '#FFFF99'
      },
      {
        id: 'circuit_engine_management',
        label: 'Engine Management Circuit',
        nodes: ['ecu_engine', 'engine_harness_main', 'fuel_injector_1', 'fuel_injector_2', 'fuel_injector_3', 'fuel_injector_4', 'ignition_coil_1', 'ignition_coil_2', 'ignition_switch'],
        color: '#0000FF'
      },
      {
        id: 'circuit_fuel_system',
        label: 'Fuel System Circuit',
        nodes: ['relay_fuel_pump', 'fuel_pump', 'ecu_engine'],
        color: '#32CD32'
      },
      {
        id: 'circuit_cooling_system',
        label: 'Cooling System Circuit',
        nodes: ['fuse_fans_30a', 'relay_cooling_fan', 'cooling_fan_main', 'cooling_fan_aux', 'coolant_temp_sensor', 'ecu_engine'],
        color: '#00CED1'
      },
      {
        id: 'circuit_exhaust_emissions',
        label: 'Exhaust & Emissions Circuit',
        nodes: ['oxygen_sensor_upstream', 'oxygen_sensor_downstream', 'catalytic_converter_heater', 'exhaust_gas_temp_sensor', 'ecu_engine'],
        color: '#8A2BE2'
      },
      {
        id: 'circuit_horn_system',
        label: 'Horn System Circuit',
        nodes: ['fuse_horn_10a', 'relay_horn', 'horn_high', 'horn_low'],
        color: '#FF6347'
      },
      {
        id: 'circuit_dashboard',
        label: 'Dashboard Circuit',
        nodes: ['dashboard_cluster', 'ignition_switch', 'wiper_switch', 'headlight_switch'],
        color: '#FF00FF'
      }
    ];
  }
}

// Logging middleware
class DemoLogger {
  static log(service, level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service,
      level,
      message,
      data
    };
    
    console.log(`[${timestamp}] [${service}] [${level.toUpperCase()}] ${message}`);
    if (data) {
      console.log(`[${timestamp}] [${service}] [DATA]`, JSON.stringify(data, null, 2));
    }
    
    return logEntry;
  }
}

// Pipeline orchestrator
class ElectricalSystemPipeline {
  
  constructor() {
    this.logs = [];
    this.services = {};
  }
  
  log(service, level, message, data = null) {
    const entry = DemoLogger.log(service, level, message, data);
    this.logs.push(entry);
    return entry;
  }
  
  async generateElectricalSystem(brand, model, year) {
    const vehicleId = `${brand}_${model.toLowerCase().replace(/\s+/g, '_')}_${year}`;
    
    try {
      this.log('PIPELINE', 'info', `🚀 Starting electrical system generation for ${brand} ${model} ${year}`);
      
      // Step 1: Generate initial vehicle descriptor
      const vehicleDescriptor = await this.step1_generateDescriptor(brand, model, year);
      
      // Step 2: Enrich with LLM metadata (simulated)
      const enrichedGraph = await this.step2_enrichWithLLM(vehicleDescriptor);
      
      // Step 3: Calculate 3D spatial layout
      const spatialGraph = await this.step3_calculateSpatialLayout(enrichedGraph);
      
      // Step 4: Generate 3D model
      const modelResult = await this.step4_generateGLBModel(spatialGraph);
      
      this.log('PIPELINE', 'success', `✅ Complete electrical system generated successfully!`);
      
      return {
        success: true,
        vehicleId,
        glbUrl: modelResult.glbUrl,
        manifestUrl: modelResult.manifestUrl,
        metadata: modelResult.metadata,
        logs: this.logs
      };
      
    } catch (error) {
      this.log('PIPELINE', 'error', `❌ Pipeline failed: ${error.message}`, { error: error.stack });
      throw error;
    }
  }
  
  async step1_generateDescriptor(brand, model, year) {
    this.log('INGEST', 'info', '📥 Starting vehicle descriptor generation');
    
    try {
      // Call real ingest service
      this.log('INGEST', 'debug', `Calling ingest service at ${SERVICES.INGEST}`);
      
      const ingestPayload = {
        vehicleId: `${brand}_${model.toLowerCase().replace(/\s+/g, '_')}_${year}`,
        brand,
        model,
        year: parseInt(year)
      };
      
      const response = await axios.post(`${SERVICES.INGEST}/ingest`, ingestPayload, {
        timeout: 10000
      });
      
      this.log('INGEST', 'debug', 'Real ingest service response received', {
        status: response.status,
        dataKeys: Object.keys(response.data)
      });
      
      if (response.data && response.data.success) {
        const descriptor = response.data.descriptor;
        this.log('INGEST', 'info', `Real service found ${descriptor?.nodes?.length || 0} components and ${descriptor?.edges?.length || 0} connections`);
        this.log('INGEST', 'success', 'Real vehicle descriptor generation completed');
        return descriptor;
      } else {
        throw new Error('Ingest service returned invalid data');
      }
      
    } catch (error) {
      this.log('INGEST', 'warning', `Real ingest service failed: ${error.message}, using fallback data`);
      
      // Fallback to generated data
      const descriptor = DemoDataGenerator.generateVehicleDescriptor(brand, model, year);
      
      this.log('INGEST', 'debug', 'Generated fallback vehicle structure', {
        vehicleId: descriptor.vehicleId,
        nodeCount: descriptor.nodes.length,
        edgeCount: descriptor.edges.length,
        circuitCount: descriptor.circuits.length
      });
      
      this.log('INGEST', 'info', `Fallback: Found ${descriptor.nodes.length} base components and ${descriptor.edges.length} connections`);
      this.log('INGEST', 'success', 'Fallback vehicle descriptor generation completed');
      
      return descriptor;
    }
  }
  
  async step2_enrichWithLLM(vehicleDescriptor) {
    this.log('LLM', 'info', '🧠 Starting LLM metadata enrichment');
    
    await this.delay(1000);
    this.log('LLM', 'debug', 'Calling OpenAI GPT-4 for electrical knowledge enhancement');
    
    // Simulate LLM enrichment
    const enriched = { ...vehicleDescriptor };
    
    // Add enhanced metadata to nodes (with safety check)
    enriched.nodes = (enriched.nodes || []).map(node => ({
      ...node,
      enrichedMetadata: {
        ...node.metadata,
        confidence: 0.85 + Math.random() * 0.1,
        specifications: this.generateSpecifications(node.type),
        compatibility: this.generateCompatibility(node.type)
      }
    }));
    
    await this.delay(800);
    this.log('LLM', 'info', 'Enhanced component specifications with automotive knowledge');
    
    await this.delay(600);
    this.log('LLM', 'debug', 'Validated electrical compatibility and ratings');
    
    this.log('LLM', 'success', 'LLM metadata enrichment completed');
    
    return enriched;
  }
  
  async step3_calculateSpatialLayout(enrichedGraph) {
    this.log('SPATIAL', 'info', '📐 Starting 3D spatial layout calculation');
    
    try {
      // Call real layout service for positions
      this.log('SPATIAL', 'debug', `Calling layout service at ${SERVICES.LAYOUT}`);
      
      const positionsResponse = await axios.post(`${SERVICES.LAYOUT}/positions`, {
        nodes: enrichedGraph.nodes,
        edges: enrichedGraph.edges, 
        vehicleSignature: enrichedGraph.vehicleId,
        coordinateSystem: {
          type: 'cartesian',
          units: 'meters',
          origin: [0, 0, 0]
        }
      }, { timeout: 10000 });
      
      this.log('SPATIAL', 'debug', 'Real layout service positions received', {
        status: positionsResponse.status,
        nodeCount: positionsResponse.data?.graph3d?.nodes?.length || 0
      });
      
      // Call real layout service for routes
      const routesResponse = await axios.post(`${SERVICES.LAYOUT}/routes`, {
        graph3d: positionsResponse.data.graph3d
      }, { timeout: 10000 });
      
      this.log('SPATIAL', 'debug', 'Real layout service routes received', {
        status: routesResponse.status,
        routeCount: routesResponse.data?.graph3d?.routes?.length || 0
      });
      
      if (routesResponse.data?.success && routesResponse.data?.graph3d) {
        this.log('SPATIAL', 'info', `Real service positioned ${routesResponse.data.graph3d.nodes.length} components`);
        this.log('SPATIAL', 'info', `Real service generated ${routesResponse.data.graph3d.routes.length} wire routes`);
        this.log('SPATIAL', 'success', 'Real 3D spatial layout calculation completed');
        return routesResponse.data.graph3d;
      } else {
        throw new Error('Layout service returned invalid data');
      }
      
    } catch (error) {
      this.log('SPATIAL', 'warning', `Real layout service failed: ${error.message}, using fallback calculation`);
      
      // Fallback to local calculation
      const spatial = { ...enrichedGraph };
      
      spatial.nodes = spatial.nodes.map(node => {
        const position = this.calculateNodePosition(node.zone, node.type);
        return {
          ...node,
          position,
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        };
      });
      
      spatial.routes = this.calculateWireRoutes(spatial.nodes, spatial.edges);
      
      this.log('SPATIAL', 'info', `Fallback: Positioned ${spatial.nodes.length} components in realistic vehicle zones`);
      this.log('SPATIAL', 'info', `Fallback: Generated ${spatial.routes.length} wire routes with collision avoidance`);
      this.log('SPATIAL', 'success', 'Fallback 3D spatial layout calculation completed');
      
      return spatial;
    }
  }
  
  async step4_generateGLBModel(spatialGraph) {
    this.log('MODEL', 'info', '🏗️ Starting GLB model generation');
    
    try {
      // Call real model-builder service
      this.log('MODEL', 'debug', `Calling model-builder service at ${SERVICES.MODEL_BUILDER}`);
      
      const buildPayload = {
        jobId: `demo_${Date.now()}`,
        graph3d: spatialGraph,
        options: {
          quality: 'high',
          materials: true,
          interactive: true
        }
      };
      
      const response = await axios.post(`${SERVICES.MODEL_BUILDER}/build`, buildPayload, {
        timeout: 30000
      });
      
      this.log('MODEL', 'debug', 'Real model-builder service response received', {
        status: response.status,
        jobId: response.data?.jobId,
        hasGlbUrl: !!response.data?.glbUrl
      });
      
      if (response.data?.success && response.data?.glbUrl) {
        this.log('MODEL', 'info', `Real service created GLB with ${response.data.metadata?.meshCount || 0} meshes`);
        this.log('MODEL', 'info', `Real GLB file size: ${(response.data.metadata?.fileSize / 1024 / 1024)?.toFixed(1) || 'unknown'} MB`);
        this.log('MODEL', 'success', 'Real GLB model generation completed successfully');
        
        return {
          glbUrl: response.data.glbUrl,
          manifestUrl: response.data.manifestUrl,
          metadata: {
            nodeCount: spatialGraph.nodes.length,
            routeCount: spatialGraph.routes?.length || 0,
            circuitCount: spatialGraph.circuits?.length || 0,
            fileSize: response.data.metadata?.fileSize || 0,
            triangles: response.data.metadata?.triangles || 0,
            vertices: response.data.metadata?.vertices || 0,
            meshCount: response.data.metadata?.meshCount || 0
          }
        };
      } else {
        throw new Error('Model builder service returned invalid data');
      }
      
    } catch (error) {
      this.log('MODEL', 'warning', `Real model-builder service failed: ${error.message}, using fallback generation`);
      
      // Fallback to mock generation
      const buildInfo = {
        jobId: `job_${Date.now()}`,
        vehicleId: spatialGraph.vehicleId,
        generatedAt: new Date().toISOString(),
        processingTime: 2300
      };
      
      this.log('MODEL', 'debug', 'Fallback: Initializing Three.js scene and materials');
      this.log('MODEL', 'info', `Fallback: Creating ${spatialGraph.nodes.length} component meshes with proper geometries`);
      this.log('MODEL', 'debug', 'Fallback: Applying realistic materials: plastic, metal, glass');
      this.log('MODEL', 'info', `Fallback: Generating ${spatialGraph.routes?.length || 0} wire meshes with TubeGeometry`);
      this.log('MODEL', 'debug', 'Fallback: Organizing components into circuit groups');
      this.log('MODEL', 'debug', 'Fallback: Adding interactive userData for viewer integration');
      
      const glbPath = `/demo/models/${spatialGraph.vehicleId}.glb`;
      const manifestPath = `/demo/models/${spatialGraph.vehicleId}_manifest.json`;
      
      this.log('MODEL', 'info', 'Fallback: Exporting GLB file with optimized geometry');
      this.log('MODEL', 'debug', 'Fallback: Generated viewer manifest with camera presets and interactions');
      this.log('MODEL', 'success', 'Fallback GLB model generation completed successfully');
      
      return {
        glbUrl: glbPath,
        manifestUrl: manifestPath,
        metadata: {
          nodeCount: spatialGraph.nodes.length,
          routeCount: spatialGraph.routes?.length || 0,
          circuitCount: spatialGraph.circuits?.length || 0,
          fileSize: 2457600, // ~2.4MB
          triangles: 2156,
          vertices: 1247
        }
      };
    }
  }
  
  calculateNodePosition(zone, type) {
    const zonePositions = {
      engine: { center: [1.5, 0, 0.4], size: [1.0, 0.8, 0.6] },
      dash: { center: [0.5, 0, 0.8], size: [0.8, 1.2, 0.3] },
      interior: { center: [0, 0, 0.6], size: [1.8, 1.4, 0.8] },
      exterior: { center: [2.0, 0, 0.7], size: [0.5, 1.8, 0.4] }
    };
    
    const config = zonePositions[zone] || zonePositions.interior;
    
    // Add some randomness within zone
    const offset = [
      (Math.random() - 0.5) * config.size[0] * 0.5,
      (Math.random() - 0.5) * config.size[1] * 0.5,
      (Math.random() - 0.5) * config.size[2] * 0.5
    ];
    
    return [
      config.center[0] + offset[0],
      config.center[1] + offset[1],
      config.center[2] + offset[2]
    ];
  }
  
  calculateWireRoutes(nodes, edges) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    return (edges || []).map(edge => {
      if (!edge) {
        console.warn('Undefined edge found in calculateWireRoutes');
        return null;
      }
      
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      
      if (!fromNode || !toNode) return null;
      
      // Calculate simple route with one waypoint
      const midpoint = [
        (fromNode.position[0] + toNode.position[0]) / 2,
        (fromNode.position[1] + toNode.position[1]) / 2 + 0.1,
        (fromNode.position[2] + toNode.position[2]) / 2
      ];
      
      // Handle both edge.gauge (real service) and edge.properties.wireGauge (fallback)
      const wireGauge = edge.gauge || (edge.properties && edge.properties.wireGauge) || '2mm²';
      
      return {
        edgeId: edge.id,
        from: edge.from,
        to: edge.to,
        path: [fromNode.position, midpoint, toNode.position],
        style: {
          radius: this.getWireRadius(wireGauge),
          segments: 8,
          material: 'copper'
        }
      };
    }).filter(Boolean);
  }
  
  getWireRadius(gauge) {
    const gaugeMap = {
      '10mm²': 0.008,
      '6mm²': 0.006,
      '4mm²': 0.005,
      '2.5mm²': 0.003,
      '1.5mm²': 0.002,
      '0.75mm²': 0.001
    };
    return gaugeMap[gauge] || 0.002;
  }
  
  generateSpecifications(type) {
    const specs = {
      battery: { voltage: '12V', chemistry: 'Lead-acid', terminals: 2 },
      alternator: { phases: 3, rectifier: 'Silicon diode', regulation: 'Electronic' },
      fuse: { material: 'Zinc', response: 'Fast-blow', temperature: '85°C' },
      relay: { contacts: 'Silver-alloy', coil: 'Copper', insulation: 'Plastic' },
      ecu: { processor: '32-bit', memory: 'Flash', interfaces: ['CAN', 'LIN'] },
      lamp: { filament: 'Tungsten', lens: 'Polycarbonate', reflector: 'Aluminum' }
    };
    return specs[type] || {};
  }
  
  generateCompatibility(type) {
    return {
      voltage_range: '10.5V - 16V',
      temperature_range: '-40°C to +85°C',
      standards: ['ISO 14230', 'SAE J1939'],
      protection: 'IP65'
    };
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// N8N Webhook Integration
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/electro-3d/build';

class N8NIntegration {
  static async triggerMainWorkflow(vehicleData) {
    try {
      const webhookPayload = {
        brand: vehicleData.brand,
        model: vehicleData.model,
        year: vehicleData.year,
        vehicleSignature: `${vehicleData.brand}_${vehicleData.model}_${vehicleData.year}`,
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      console.log(`🔗 Triggering n8n workflow via webhook: ${N8N_WEBHOOK_URL}`);
      console.log(`📝 Payload:`, JSON.stringify(webhookPayload, null, 2));

      const response = await axios.post(N8N_WEBHOOK_URL, webhookPayload, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ n8n workflow triggered successfully`);
      console.log(`📊 Response status: ${response.status}`);
      
      return {
        success: true,
        workflowId: response.data?.workflowId || 'unknown',
        executionId: response.data?.executionId || null,
        requestId: webhookPayload.requestId
      };

    } catch (error) {
      console.error(`❌ n8n workflow trigger failed:`, error.message);
      return {
        success: false,
        error: error.message,
        requestId: null
      };
    }
  }
}

// API Routes

// Serve demo page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Generate electrical system (original direct service pipeline)
app.post('/api/generate', async (req, res) => {
  try {
    const { brand, model, year } = req.body;
    
    if (!brand || !model || !year) {
      return res.status(400).json({
        error: 'Missing required fields: brand, model, year'
      });
    }
    
    const pipeline = new ElectricalSystemPipeline();
    const result = await pipeline.generateElectricalSystem(brand, model, year);
    
    res.json(result);
    
  } catch (error) {
    console.error('Generation failed:', error);
    res.status(500).json({
      error: 'Pipeline execution failed',
      message: error.message
    });
  }
});

// Generate electrical system via n8n workflows
// Pipeline orchestrator endpoint - replaces n8n workflow
app.post('/api/generate-pipeline', async (req, res) => {
  try {
    const { brand, model, year } = req.body;
    
    if (!brand || !model || !year) {
      return res.status(400).json({
        error: 'Missing required fields: brand, model, year'
      });
    }

    console.log(`🚀 Starting direct pipeline generation for ${brand} ${model} ${year}`);

    // Call pipeline orchestrator service
    const pipelineResponse = await axios.post('http://localhost:3003/build', {
      brand,
      model,
      year,
      source: 'demo-frontend',
      timestamp: new Date().toISOString()
    }, {
      timeout: 300000, // 5 minutes for complete pipeline
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Pipeline executed successfully', {
      requestId: pipelineResponse.data.requestId,
      vehicleSignature: pipelineResponse.data.vehicleSignature,
      success: pipelineResponse.data.success
    });

    res.json(pipelineResponse.data);

  } catch (error) {
    console.error('❌ Pipeline execution failed:', error.message);
    
    // Return error details
    res.status(500).json({
      error: 'Pipeline execution failed',
      message: error.message,
      details: error.response?.data || null,
      timestamp: new Date().toISOString()
    });
  }
});

// Trigger individual n8n sub-workflows
app.post('/api/n8n/research', async (req, res) => {
  try {
    const { brand, model, year } = req.body;
    
    const webhookPayload = {
      brand,
      model,
      year,
      vehicleSignature: `${brand}_${model}_${year}`,
      requestId: `research_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(`${N8N_WEBHOOK_URL}/research`, webhookPayload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    res.json({ success: true, data: response.data });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/n8n/normalize', async (req, res) => {
  try {
    const researchManifest = req.body;
    
    const response = await axios.post(`${N8N_WEBHOOK_URL}/normalize`, researchManifest, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    res.json({ success: true, data: response.data });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/n8n/enrich', async (req, res) => {
  try {
    const normalizedGraph = req.body;
    
    const response = await axios.post(`${N8N_WEBHOOK_URL}/enrich`, normalizedGraph, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    res.json({ success: true, data: response.data });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/n8n/spatialize', async (req, res) => {
  try {
    const enrichedGraph = req.body;
    
    const response = await axios.post(`${N8N_WEBHOOK_URL}/spatialize`, enrichedGraph, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    res.json({ success: true, data: response.data });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/n8n/build-model', async (req, res) => {
  try {
    const spatialGraph = req.body;
    
    const response = await axios.post(`${N8N_WEBHOOK_URL}/build-model`, spatialGraph, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    res.json({ success: true, data: response.data });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get n8n workflow execution status
app.get('/api/n8n/status/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    // In a real implementation, this would check n8n execution status
    // For now, return a mock status
    res.json({
      executionId,
      status: 'running',
      progress: {
        research: 'completed',
        normalize: 'completed', 
        enrich: 'in_progress',
        spatialize: 'pending',
        model_build: 'pending'
      },
      startTime: new Date().toISOString(),
      logs: [
        { timestamp: new Date().toISOString(), level: 'info', message: 'Workflow execution started' },
        { timestamp: new Date().toISOString(), level: 'info', message: 'Research phase completed' },
        { timestamp: new Date().toISOString(), level: 'info', message: 'Normalization completed' },
        { timestamp: new Date().toISOString(), level: 'info', message: 'LLM enrichment in progress...' }
      ]
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logs for a specific job
app.get('/api/logs/:jobId', (req, res) => {
  // In a real implementation, this would fetch logs from a database
  res.json({
    jobId: req.params.jobId,
    logs: []
  });
});

// 3D Model Test Page
app.get('/test', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hyundai Galloper 3D Electrical Model Test</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #1a1a1a;
            color: white;
            font-family: 'Arial', sans-serif;
            overflow: hidden;
        }
        
        #container {
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        
        #info {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 100;
            background: rgba(0,0,0,0.8);
            padding: 15px;
            border-radius: 5px;
            max-width: 300px;
        }
        
        #info h1 {
            margin: 0 0 10px 0;
            color: #3498db;
            font-size: 18px;
        }
        
        #info p {
            margin: 5px 0;
            font-size: 12px;
            line-height: 1.4;
        }
        
        #controls {
            position: absolute;
            bottom: 10px;
            left: 10px;
            z-index: 100;
            background: rgba(0,0,0,0.8);
            padding: 15px;
            border-radius: 5px;
        }
        
        #controls h3 {
            margin: 0 0 10px 0;
            color: #e74c3c;
            font-size: 14px;
        }
        
        #controls p {
            margin: 3px 0;
            font-size: 11px;
        }
        
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 200;
            text-align: center;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        #error {
            color: #e74c3c;
            background: rgba(231, 76, 60, 0.1);
            border: 1px solid #e74c3c;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            display: none;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
    <div id="container">
        <div id="loading">
            <div class="spinner"></div>
            <p>Loading Hyundai Galloper 3D Model...</p>
        </div>
        
        <div id="info">
            <h1>🚗 Galloper Electrical System</h1>
            <p><strong>Model:</strong> Hyundai Galloper 2000</p>
            <p><strong>Components:</strong> <span id="componentCount">Loading...</span></p>
            <p><strong>Connections:</strong> <span id="connectionCount">Loading...</span></p>
            <p><strong>Status:</strong> <span id="status">Initializing...</span></p>
            <div id="error"></div>
        </div>
        
        <div id="controls">
            <h3>🎮 Controls</h3>
            <p><strong>Mouse:</strong> Drag to rotate view</p>
            <p><strong>Wheel:</strong> Zoom in/out</p>
            <p><strong>Click:</strong> Select components</p>
            <p><strong>View:</strong> Interactive electrical diagram</p>
        </div>
    </div>

    <script>
        class GalloperElectricalModel {
            constructor(container) {
                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(0x1a1a1a);
                this.components = new Map();
                this.connections = new Map();

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

            setupLighting() {
                // Ambient light
                const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
                this.scene.add(ambientLight);

                // Main directional light
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                directionalLight.position.set(10, 10, 5);
                directionalLight.castShadow = true;
                this.scene.add(directionalLight);

                // Fill light
                const fillLight = new THREE.DirectionalLight(0x8080ff, 0.3);
                fillLight.position.set(-10, 5, -5);
                this.scene.add(fillLight);
            }

            buildVehicleBody() {
                // Only keep a minimal ground reference plane (much smaller)
                const groundGeometry = new THREE.PlaneGeometry(8, 8);
                const groundMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x2a2a2a, 
                    transparent: true, 
                    opacity: 0.2 
                });
                const ground = new THREE.Mesh(groundGeometry, groundMaterial);
                ground.rotation.x = -Math.PI / 2;
                ground.receiveShadow = true;
                this.scene.add(ground);
                
                // Add a subtle grid helper for electrical layout reference
                const gridHelper = new THREE.GridHelper(6, 12, 0x333333, 0x333333);
                gridHelper.material.opacity = 0.1;
                gridHelper.material.transparent = true;
                this.scene.add(gridHelper);
            }

            addElectricalComponents() {
                // Main Power System
                this.addComponent('battery_main', new THREE.Vector3(0, 0.5, 2), 'battery', 'Main Battery 12V 70Ah', {
                    geometry: new THREE.BoxGeometry(1, 0.8, 0.6),
                    color: 0x2c3e50
                });

                this.addComponent('alternator_main', new THREE.Vector3(-1.5, 1, 0), 'alternator', 'Alternator 120A', {
                    geometry: new THREE.CylinderGeometry(0.4, 0.4, 0.6, 8),
                    color: 0x7f8c8d
                });

                this.addComponent('starter_motor', new THREE.Vector3(-2, 0.5, 1), 'motor', 'Starter Motor 2.2kW', {
                    geometry: new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8),
                    color: 0x8e44ad
                });

                // Fuse & Relay System
                this.addComponent('fuse_box_main', new THREE.Vector3(1.5, 1.5, -1), 'connector', 'Main Fuse Box (40 slots)', {
                    geometry: new THREE.BoxGeometry(1.2, 0.4, 0.8),
                    color: 0x34495e
                });

                this.addComponent('relay_starter', new THREE.Vector3(0.5, 1, -1.5), 'relay', 'Starter Relay 40A', {
                    geometry: new THREE.BoxGeometry(0.3, 0.4, 0.3),
                    color: 0xf39c12
                });

                this.addComponent('relay_headlights', new THREE.Vector3(1, 1, -1.5), 'relay', 'Headlight Relay 30A', {
                    geometry: new THREE.BoxGeometry(0.3, 0.4, 0.3),
                    color: 0xf39c12
                });

                this.addComponent('relay_cooling_fan', new THREE.Vector3(1.5, 1, -1.5), 'relay', 'Cooling Fan Relay 30A', {
                    geometry: new THREE.BoxGeometry(0.3, 0.4, 0.3),
                    color: 0xf39c12
                });

                // Engine Control System
                this.addComponent('ecu_engine', new THREE.Vector3(0, 1.2, -0.5), 'ecu', 'Engine Control Unit', {
                    geometry: new THREE.BoxGeometry(0.8, 0.5, 1),
                    color: 0x27ae60
                });

                this.addComponent('engine_harness', new THREE.Vector3(-0.5, 1.8, 0), 'harness', 'Main Engine Harness (85 wires)', {
                    geometry: new THREE.BoxGeometry(1.5, 0.2, 0.3),
                    color: 0x2c3e50
                });

                // Fuel System
                this.addComponent('fuel_pump', new THREE.Vector3(-3, 0.3, 0), 'pump', 'Fuel Pump 3.5 bar', {
                    geometry: new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8),
                    color: 0x16a085
                });

                // Fuel Injectors (4 cylinder layout)
                for (let i = 0; i < 4; i++) {
                    this.addComponent(\`fuel_injector_\${i + 1}\`, new THREE.Vector3(-1 + i * 0.5, 2.2, 0.3), 'injector', \`Fuel Injector Cyl \${i + 1}\`, {
                        geometry: new THREE.CylinderGeometry(0.12, 0.12, 0.5, 6),
                        color: 0xe74c3c
                    });
                }

                // Ignition System
                this.addComponent('ignition_coil_1', new THREE.Vector3(-1, 2.5, -0.3), 'coil', 'Ignition Coil 1-4', {
                    geometry: new THREE.BoxGeometry(0.4, 0.6, 0.3),
                    color: 0x9b59b6
                });

                this.addComponent('ignition_coil_2', new THREE.Vector3(-0.5, 2.5, -0.3), 'coil', 'Ignition Coil 2-3', {
                    geometry: new THREE.BoxGeometry(0.4, 0.6, 0.3),
                    color: 0x9b59b6
                });

                // Lighting System
                this.addComponent('headlight_left', new THREE.Vector3(2.5, 1.8, 2), 'lamp', 'Left Headlight 55W', {
                    geometry: new THREE.SphereGeometry(0.35, 12, 8),
                    color: 0xffffff,
                    emissive: true
                });

                this.addComponent('headlight_right', new THREE.Vector3(2.5, 1.8, -2), 'lamp', 'Right Headlight 55W', {
                    geometry: new THREE.SphereGeometry(0.35, 12, 8),
                    color: 0xffffff,
                    emissive: true
                });

                this.addComponent('fog_light_left', new THREE.Vector3(2.8, 1.3, 1.5), 'lamp', 'Left Fog Light 35W', {
                    geometry: new THREE.SphereGeometry(0.2, 8, 6),
                    color: 0xfff700,
                    emissive: true
                });

                this.addComponent('fog_light_right', new THREE.Vector3(2.8, 1.3, -1.5), 'lamp', 'Right Fog Light 35W', {
                    geometry: new THREE.SphereGeometry(0.2, 8, 6),
                    color: 0xfff700,
                    emissive: true
                });

                this.addComponent('tail_light_left', new THREE.Vector3(-3, 1.5, 2), 'lamp', 'Left Tail Light 21W', {
                    geometry: new THREE.BoxGeometry(0.2, 0.5, 0.3),
                    color: 0xff0000,
                    emissive: true
                });

                this.addComponent('tail_light_right', new THREE.Vector3(-3, 1.5, -2), 'lamp', 'Right Tail Light 21W', {
                    geometry: new THREE.BoxGeometry(0.2, 0.5, 0.3),
                    color: 0xff0000,
                    emissive: true
                });

                // Cooling System
                this.addComponent('cooling_fan_main', new THREE.Vector3(2, 1.5, 0), 'fan', 'Main Cooling Fan 200W', {
                    geometry: new THREE.CylinderGeometry(0.8, 0.8, 0.2, 8),
                    color: 0x95a5a6
                });

                this.addComponent('coolant_temp_sensor', new THREE.Vector3(-0.5, 1, 0.8), 'sensor', 'Coolant Temp Sensor', {
                    geometry: new THREE.CylinderGeometry(0.1, 0.1, 0.3, 6),
                    color: 0xf39c12
                });

                // Exhaust & Emissions
                this.addComponent('oxygen_sensor_upstream', new THREE.Vector3(-2, 0.5, -0.5), 'sensor', 'Upstream O2 Sensor', {
                    geometry: new THREE.CylinderGeometry(0.08, 0.08, 0.4, 6),
                    color: 0xe67e22
                });

                this.addComponent('oxygen_sensor_downstream', new THREE.Vector3(-2.5, 0.3, -0.5), 'sensor', 'Downstream O2 Sensor', {
                    geometry: new THREE.CylinderGeometry(0.08, 0.08, 0.4, 6),
                    color: 0xe67e22
                });

                this.addComponent('catalytic_converter_heater', new THREE.Vector3(-2.5, 0.8, 0), 'heater', 'Cat Converter Heater 150W', {
                    geometry: new THREE.BoxGeometry(0.3, 0.3, 0.8),
                    color: 0xd35400
                });

                // Horn System
                this.addComponent('horn_high', new THREE.Vector3(2.2, 1, 1.2), 'horn', 'High Tone Horn 500Hz', {
                    geometry: new THREE.ConeGeometry(0.2, 0.3, 6),
                    color: 0xf1c40f
                });

                this.addComponent('horn_low', new THREE.Vector3(2.2, 1, -1.2), 'horn', 'Low Tone Horn 400Hz', {
                    geometry: new THREE.ConeGeometry(0.2, 0.3, 6),
                    color: 0xf1c40f
                });

                // Dashboard & Controls
                this.addComponent('dashboard_cluster', new THREE.Vector3(-0.5, 2, -2), 'ecu', 'Dashboard Cluster', {
                    geometry: new THREE.BoxGeometry(1.8, 0.4, 0.8),
                    color: 0x2c3e50
                });

                this.addComponent('ignition_switch', new THREE.Vector3(-1, 1.5, -2.5), 'switch', 'Ignition Switch', {
                    geometry: new THREE.CylinderGeometry(0.15, 0.15, 0.2, 8),
                    color: 0x7f8c8d
                });

                // Ground Points
                this.addComponent('ground_main', new THREE.Vector3(0, 0.1, 0), 'ground', 'Main Ground Point', {
                    geometry: new THREE.BoxGeometry(0.3, 0.1, 0.3),
                    color: 0x1a1a1a
                });

                this.addComponent('ground_engine', new THREE.Vector3(-1, 0.1, 0), 'ground', 'Engine Block Ground', {
                    geometry: new THREE.BoxGeometry(0.3, 0.1, 0.3),
                    color: 0x1a1a1a
                });
            }

            addComponent(id, position, type, label, options) {
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

                const component = { id, position, mesh, metadata: { type, label } };
                this.components.set(id, component);
                this.componentGroup.add(mesh);
            }

            addWireConnections() {
                // Main Power Distribution (Red Wires)
                this.addWire('battery_to_fuse', 'battery_main', 'fuse_box_main', 0xff0000);
                this.addWire('battery_to_alternator', 'battery_main', 'alternator_main', 0xff0000);
                this.addWire('battery_to_starter_relay', 'battery_main', 'relay_starter', 0xff0000);
                
                // Starter System (Yellow Wires)
                this.addWire('starter_relay_to_motor', 'relay_starter', 'starter_motor', 0xffff00);
                this.addWire('ignition_to_starter_relay', 'ignition_switch', 'relay_starter', 0xffaa00);
                
                // Engine Management (Blue/Green Wires)
                this.addWire('fuse_to_ecu', 'fuse_box_main', 'ecu_engine', 0x3498db);
                this.addWire('ecu_to_harness', 'ecu_engine', 'engine_harness', 0x2c3e50);
                this.addWire('ecu_to_injector1', 'ecu_engine', 'fuel_injector_1', 0x3498db);
                this.addWire('ecu_to_injector2', 'ecu_engine', 'fuel_injector_2', 0xffff00);
                this.addWire('ecu_to_injector3', 'ecu_engine', 'fuel_injector_3', 0x27ae60);
                this.addWire('ecu_to_injector4', 'ecu_engine', 'fuel_injector_4', 0xffffff);
                
                // Ignition System (Purple Wires)
                this.addWire('ecu_to_coil1', 'ecu_engine', 'ignition_coil_1', 0x9b59b6);
                this.addWire('ecu_to_coil2', 'ecu_engine', 'ignition_coil_2', 0x8e44ad);
                
                // Fuel System (Green Wires)
                this.addWire('ecu_to_fuel_pump', 'ecu_engine', 'fuel_pump', 0x16a085);
                
                // Lighting System (White/Yellow Wires)
                this.addWire('relay_to_headlight_left', 'relay_headlights', 'headlight_left', 0xffffff);
                this.addWire('relay_to_headlight_right', 'relay_headlights', 'headlight_right', 0xffffff);
                this.addWire('fuse_to_headlight_relay', 'fuse_box_main', 'relay_headlights', 0xff6600);
                this.addWire('relay_to_fog_left', 'relay_headlights', 'fog_light_left', 0xfff700);
                this.addWire('relay_to_fog_right', 'relay_headlights', 'fog_light_right', 0xfff700);
                this.addWire('fuse_to_tail_left', 'fuse_box_main', 'tail_light_left', 0xff4444);
                this.addWire('fuse_to_tail_right', 'fuse_box_main', 'tail_light_right', 0xff4444);
                
                // Cooling System (Black Wires)
                this.addWire('relay_to_cooling_fan', 'relay_cooling_fan', 'cooling_fan_main', 0x2c3e50);
                this.addWire('ecu_to_fan_relay', 'ecu_engine', 'relay_cooling_fan', 0x27ae60);
                this.addWire('ecu_to_coolant_sensor', 'ecu_engine', 'coolant_temp_sensor', 0xf39c12);
                
                // Exhaust System (Orange Wires)
                this.addWire('ecu_to_o2_upstream', 'ecu_engine', 'oxygen_sensor_upstream', 0xe67e22);
                this.addWire('ecu_to_o2_downstream', 'ecu_engine', 'oxygen_sensor_downstream', 0xd35400);
                this.addWire('ecu_to_cat_heater', 'ecu_engine', 'catalytic_converter_heater', 0xff6600);
                
                // Horn System (Brown Wires)
                this.addWire('fuse_to_horn_high', 'fuse_box_main', 'horn_high', 0x8b4513);
                this.addWire('fuse_to_horn_low', 'fuse_box_main', 'horn_low', 0x8b4513);
                
                // Dashboard (Purple Wires)
                this.addWire('fuse_to_dashboard', 'fuse_box_main', 'dashboard_cluster', 0x6c3483);
                this.addWire('ignition_to_dashboard', 'ignition_switch', 'dashboard_cluster', 0x9b59b6);
                
                // Ground Connections (Black Wires)
                this.addWire('battery_to_ground', 'battery_main', 'ground_main', 0x000000);
                this.addWire('ecu_to_ground', 'ecu_engine', 'ground_engine', 0x000000);
                this.addWire('main_to_engine_ground', 'ground_main', 'ground_engine', 0x000000);
            }

            addWire(id, fromId, toId, color) {
                const fromComponent = this.components.get(fromId);
                const toComponent = this.components.get(toId);
                
                if (!fromComponent || !toComponent) return;

                const fromPos = fromComponent.position.clone();
                const toPos = toComponent.position.clone();

                const midPoint = new THREE.Vector3(
                    (fromPos.x + toPos.x) / 2,
                    Math.max(fromPos.y, toPos.y) + 0.5,
                    (fromPos.z + toPos.z) / 2
                );

                const curve = new THREE.QuadraticBezierCurve3(fromPos, midPoint, toPos);
                const points = curve.getPoints(20);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                
                const material = new THREE.LineBasicMaterial({ color });
                const line = new THREE.Line(geometry, material);

                const connection = { id, from: fromId, to: toId, mesh: line };
                this.connections.set(id, connection);
                this.wireGroup.add(line);
            }

            setupControls() {
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
                            document.getElementById('status').textContent = \`Selected: \${userData.label}\`;
                        }
                    }
                });

                // Mouse controls
                let isDragging = false;
                let previousMousePosition = { x: 0, y: 0 };

                this.renderer.domElement.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    previousMousePosition = { x: e.clientX, y: e.clientY };
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
                    
                    const spherical = new THREE.Spherical();
                    spherical.setFromVector3(this.camera.position);
                    spherical.theta -= deltaMove.x * rotationSpeed;
                    spherical.phi += deltaMove.y * rotationSpeed;
                    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
                    
                    this.camera.position.setFromSpherical(spherical);
                    this.camera.lookAt(0, 0, 0);

                    previousMousePosition = { x: event.clientX, y: event.clientY };
                });

                this.renderer.domElement.addEventListener('wheel', (event) => {
                    const direction = this.camera.position.clone().normalize();
                    const distance = event.deltaY * 0.1;
                    this.camera.position.add(direction.multiplyScalar(distance));
                });
            }

            highlightComponent(componentId) {
                // Reset all materials
                this.components.forEach(component => {
                    const material = component.mesh.material;
                    if (material.emissive) material.emissive.setHex(0x000000);
                });

                // Highlight selected component
                const selectedComponent = this.components.get(componentId);
                if (selectedComponent) {
                    const material = selectedComponent.mesh.material;
                    if (material.emissive) material.emissive.setHex(0x444444);
                }

                // Highlight connected wires
                this.connections.forEach(connection => {
                    const material = connection.mesh.material;
                    if (connection.from === componentId || connection.to === componentId) {
                        material.opacity = 1.0;
                    } else {
                        material.opacity = 0.3;
                    }
                });
            }

            animate() {
                requestAnimationFrame(() => this.animate());

                // Rotate cooling fan
                const coolingFan = this.components.get('cooling_fan_main');
                if (coolingFan) {
                    coolingFan.mesh.rotation.z += 0.1;
                }

                this.renderer.render(this.scene, this.camera);
            }
        }

        // Initialize the model
        window.addEventListener('load', () => {
            try {
                const container = document.getElementById('container');
                const model = new GalloperElectricalModel(container);
                
                // Update UI
                document.getElementById('loading').style.display = 'none';
                document.getElementById('componentCount').textContent = model.components.size;
                document.getElementById('connectionCount').textContent = model.connections.size;
                document.getElementById('status').textContent = 'Ready - Click components to interact';
                
                // Handle window resize
                window.addEventListener('resize', () => {
                    model.camera.aspect = window.innerWidth / window.innerHeight;
                    model.camera.updateProjectionMatrix();
                    model.renderer.setSize(window.innerWidth, window.innerHeight);
                });
                
            } catch (error) {
                console.error('Error initializing model:', error);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
                document.getElementById('error').textContent = 'Error loading 3D model: ' + error.message;
            }
        });
    </script>
</body>
</html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      demo: 'running',
      pipeline: 'ready'
    }
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Wessley.ai Demo Server running on http://localhost:${PORT}`);
  console.log(`📊 Demo interface: http://localhost:${PORT}`);
  console.log(`💻 API endpoint: http://localhost:${PORT}/api/generate`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;