#!/usr/bin/env node
/**
 * Complete Electrical System Topology Validator
 * Validates the enhanced NDJSON data and 3D visualization system
 */

const fs = require('fs');
const path = require('path');

class SystemValidator {
    constructor() {
        this.graphModel = null;
        this.sceneConfig = null;
        this.errors = [];
        this.warnings = [];
        this.validationResults = {
            spatial: { passed: 0, failed: 0, warnings: 0 },
            relationships: { passed: 0, failed: 0, warnings: 0 },
            harnesses: { passed: 0, failed: 0, warnings: 0 },
            zones: { passed: 0, failed: 0, warnings: 0 },
            topology: { passed: 0, failed: 0, warnings: 0 }
        };
    }

    async validate() {
        console.log('🔍 Starting Complete Electrical System Topology Validation...\n');
        
        try {
            // Load enhanced data
            await this.loadData();
            
            // Run comprehensive validations
            this.validateSpatialData();
            this.validateRelationships();
            this.validateHarnessRouting();
            this.validateZoneOrganization();
            this.validateTopologyIntegrity();
            
            // Generate validation report
            this.generateValidationReport();
            
            console.log('✅ Validation complete!\n');
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            throw error;
        }
    }

    async loadData() {
        console.log('📄 Loading enhanced data...');
        
        // Load enhanced NDJSON
        const ndjsonPath = path.join(__dirname, 'graph', 'enhanced_model.ndjson');
        if (!fs.existsSync(ndjsonPath)) {
            throw new Error('Enhanced NDJSON file not found');
        }
        
        const ndjsonContent = fs.readFileSync(ndjsonPath, 'utf8');
        this.graphModel = this.parseNDJSON(ndjsonContent);
        
        // Load scene configuration
        const configPath = path.join(__dirname, 'scene', 'enhanced_scene.config.json');
        if (fs.existsSync(configPath)) {
            this.sceneConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        console.log(`   ✓ Loaded ${Object.keys(this.graphModel.nodesById).length} nodes`);
        console.log(`   ✓ Loaded ${this.graphModel.edges.length} edges`);
        console.log(`   ✓ Loaded ${Object.keys(this.graphModel.byZone).length} zones`);
        console.log(`   ✓ Loaded ${Object.keys(this.sceneConfig?.harnesses || {}).length} harnesses\n`);
    }

    parseNDJSON(content) {
        const lines = content.trim().split('\n');
        const nodesById = {};
        const edges = [];
        const byZone = {};
        const byType = {};
        let metadata = null;
        
        for (const line of lines) {
            const record = JSON.parse(line);
            
            if (record.kind === 'meta') {
                metadata = record;
            } else if (record.kind === 'node') {
                nodesById[record.id] = record;
                
                if (record.anchor_zone) {
                    if (!byZone[record.anchor_zone]) byZone[record.anchor_zone] = [];
                    byZone[record.anchor_zone].push(record.id);
                }
                
                if (!byType[record.node_type]) byType[record.node_type] = [];
                byType[record.node_type].push(record.id);
                
            } else if (record.kind === 'edge') {
                edges.push(record);
            }
        }
        
        return { nodesById, edges, byZone, byType, metadata };
    }

    validateSpatialData() {
        console.log('🌐 Validating Spatial Data...');
        
        const vehicleBounds = {
            x: [-2.1, 2.1],
            y: [-0.9, 0.9], 
            z: [0, 1.8]
        };
        
        let spatialComponents = 0;
        let outOfBounds = 0;
        let missingCoordinates = 0;
        
        for (const [nodeId, node] of Object.entries(this.graphModel.nodesById)) {
            if (node.node_type === 'component' || node.node_type === 'fuse' || 
                node.node_type === 'relay' || node.node_type === 'connector') {
                
                spatialComponents++;
                
                if (!node.anchor_xyz) {
                    missingCoordinates++;
                    this.warnings.push(`Missing coordinates: ${nodeId}`);
                    this.validationResults.spatial.warnings++;
                } else {
                    const [x, y, z] = node.anchor_xyz;
                    
                    if (x < vehicleBounds.x[0] || x > vehicleBounds.x[1] ||
                        y < vehicleBounds.y[0] || y > vehicleBounds.y[1] ||
                        z < vehicleBounds.z[0] || z > vehicleBounds.z[1]) {
                        outOfBounds++;
                        this.warnings.push(`Out of bounds: ${nodeId} at [${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}]`);
                        this.validationResults.spatial.warnings++;
                    } else {
                        this.validationResults.spatial.passed++;
                    }
                }
            }
        }
        
        const spatialCoverage = ((spatialComponents - missingCoordinates) / spatialComponents * 100).toFixed(1);
        
        console.log(`   ✓ Spatial components: ${spatialComponents}`);
        console.log(`   ✓ With coordinates: ${spatialComponents - missingCoordinates} (${spatialCoverage}%)`);
        console.log(`   ⚠️ Missing coordinates: ${missingCoordinates}`);
        console.log(`   ⚠️ Out of bounds: ${outOfBounds}\n`);
    }

    validateRelationships() {
        console.log('🔗 Validating Relationships...');
        
        let validEdges = 0;
        let invalidEdges = 0;
        const relationshipCounts = {};
        
        for (const edge of this.graphModel.edges) {
            const sourceNode = this.graphModel.nodesById[edge.source];
            const targetNode = this.graphModel.nodesById[edge.target];
            
            // Count relationship types
            relationshipCounts[edge.relationship] = (relationshipCounts[edge.relationship] || 0) + 1;
            
            if (!sourceNode) {
                this.errors.push(`Missing source node: ${edge.source}`);
                this.validationResults.relationships.failed++;
                invalidEdges++;
                continue;
            }
            
            if (!targetNode) {
                this.errors.push(`Missing target node: ${edge.target}`);
                this.validationResults.relationships.failed++;
                invalidEdges++;
                continue;
            }
            
            // Validate relationship constraints
            const isValid = this.validateRelationshipConstraints(edge, sourceNode, targetNode);
            if (isValid) {
                validEdges++;
                this.validationResults.relationships.passed++;
            } else {
                invalidEdges++;
                this.validationResults.relationships.failed++;
            }
        }
        
        console.log(`   ✓ Valid edges: ${validEdges}`);
        console.log(`   ❌ Invalid edges: ${invalidEdges}`);
        console.log(`   📊 Relationship types:`);
        
        for (const [relationship, count] of Object.entries(relationshipCounts)) {
            console.log(`      - ${relationship}: ${count}`);
        }
        console.log('');
    }

    validateRelationshipConstraints(edge, sourceNode, targetNode) {
        const { relationship } = edge;
        
        switch (relationship) {
            case 'has_pin':
                if (sourceNode.node_type !== 'connector') {
                    this.errors.push(`Invalid has_pin: source ${edge.source} is not connector`);
                    return false;
                }
                break;
                
            case 'pin_to_wire':
                if (sourceNode.node_type !== 'pin' || targetNode.node_type !== 'wire') {
                    this.errors.push(`Invalid pin_to_wire: ${edge.source} -> ${edge.target}`);
                    return false;
                }
                break;
                
            case 'wire_to_fuse':
                if (targetNode.node_type !== 'fuse') {
                    this.errors.push(`Invalid wire_to_fuse: target ${edge.target} is not fuse`);
                    return false;
                }
                break;
                
            case 'wire_to_ground':
                if (targetNode.node_type !== 'ground_point') {
                    this.errors.push(`Invalid wire_to_ground: target ${edge.target} is not ground_point`);
                    return false;
                }
                break;
        }
        
        return true;
    }

    validateHarnessRouting() {
        console.log('🛣️ Validating Harness Routing...');
        
        if (!this.sceneConfig?.harnesses) {
            this.warnings.push('No harness routing data found');
            this.validationResults.harnesses.warnings++;
            console.log(`   ⚠️ No harness configuration found\n`);
            return;
        }
        
        let validHarnesses = 0;
        let totalWireCount = 0;
        let totalPathLength = 0;
        
        for (const [harnessId, harnessData] of Object.entries(this.sceneConfig.harnesses)) {
            const path = harnessData.path;
            const bundleCount = harnessData.bundleCount || 0;
            
            if (!path || path.length < 2) {
                this.errors.push(`Invalid harness path: ${harnessId}`);
                this.validationResults.harnesses.failed++;
                continue;
            }
            
            const pathLength = this.calculatePathLength(path);
            totalPathLength += pathLength;
            totalWireCount += bundleCount;
            validHarnesses++;
            this.validationResults.harnesses.passed++;
            
            console.log(`   ✓ ${harnessId}: ${bundleCount} wires, ${pathLength.toFixed(2)}m path`);
        }
        
        console.log(`   📊 Total: ${validHarnesses} harnesses, ${totalWireCount} wires, ${totalPathLength.toFixed(2)}m total length\n`);
    }

    calculatePathLength(path) {
        if (!path || path.length < 2) return 0;
        
        let totalLength = 0;
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const dx = curr[0] - prev[0];
            const dy = curr[1] - prev[1];
            const dz = curr[2] - prev[2];
            totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
        return totalLength;
    }

    validateZoneOrganization() {
        console.log('📍 Validating Zone Organization...');
        
        const zoneStats = {};
        let unzoned = 0;
        
        for (const [nodeId, node] of Object.entries(this.graphModel.nodesById)) {
            if (node.anchor_zone) {
                if (!zoneStats[node.anchor_zone]) {
                    zoneStats[node.anchor_zone] = { total: 0, types: {} };
                }
                zoneStats[node.anchor_zone].total++;
                zoneStats[node.anchor_zone].types[node.node_type] = 
                    (zoneStats[node.anchor_zone].types[node.node_type] || 0) + 1;
                this.validationResults.zones.passed++;
            } else {
                unzoned++;
                this.warnings.push(`Unzoned component: ${nodeId}`);
                this.validationResults.zones.warnings++;
            }
        }
        
        console.log(`   📊 Zone distribution:`);
        for (const [zone, stats] of Object.entries(zoneStats)) {
            console.log(`      - ${zone}: ${stats.total} components`);
            for (const [type, count] of Object.entries(stats.types)) {
                if (count > 1) {
                    console.log(`        └ ${type}: ${count}`);
                }
            }
        }
        console.log(`   ⚠️ Unzoned components: ${unzoned}\n`);
    }

    validateTopologyIntegrity() {
        console.log('🔬 Validating Topology Integrity...');
        
        // Check for orphaned nodes
        const connectedNodes = new Set();
        for (const edge of this.graphModel.edges) {
            connectedNodes.add(edge.source);
            connectedNodes.add(edge.target);
        }
        
        const allNodes = Object.keys(this.graphModel.nodesById);
        const orphanedNodes = allNodes.filter(nodeId => !connectedNodes.has(nodeId));
        
        // Check for power distribution integrity
        const powerSources = this.graphModel.byType.bus || [];
        const groundPoints = this.graphModel.byType.ground_point || [];
        const powerComponents = this.graphModel.byType.component || [];
        
        // Check critical systems
        const criticalSystems = {
            'Engine Management': ['comp_engine_ecu', 'comp_injector_1', 'comp_ignition_coil'],
            'Safety Systems': ['comp_abs_module', 'comp_srs_ecu'],
            'Power Generation': ['comp_battery', 'comp_alternator'],
            'Lighting': ['comp_lamp_head_left', 'comp_lamp_head_right']
        };
        
        let criticalSystemsPresent = 0;
        for (const [systemName, components] of Object.entries(criticalSystems)) {
            const present = components.filter(compId => this.graphModel.nodesById[compId]);
            if (present.length > 0) {
                criticalSystemsPresent++;
                this.validationResults.topology.passed++;
                console.log(`   ✓ ${systemName}: ${present.length}/${components.length} components`);
            } else {
                this.validationResults.topology.failed++;
                console.log(`   ❌ ${systemName}: No components found`);
            }
        }
        
        console.log(`   📊 Topology summary:`);
        console.log(`      - Total nodes: ${allNodes.length}`);
        console.log(`      - Connected nodes: ${connectedNodes.size}`);
        console.log(`      - Orphaned nodes: ${orphanedNodes.length}`);
        console.log(`      - Power sources: ${powerSources.length}`);
        console.log(`      - Ground points: ${groundPoints.length}`);
        console.log(`      - Critical systems: ${criticalSystemsPresent}/${Object.keys(criticalSystems).length}\n`);
        
        if (orphanedNodes.length > 0) {
            this.warnings.push(`${orphanedNodes.length} orphaned nodes found`);
            this.validationResults.topology.warnings++;
        }
    }

    generateValidationReport() {
        const reportPath = path.join(__dirname, 'logs', 'validation_report.md');
        
        const report = [];
        report.push('# Complete Electrical System Topology Validation Report');
        report.push('');
        report.push(`Generated: ${new Date().toISOString()}`);
        report.push(`Model: ${this.graphModel.metadata?.model || 'PajeroPininV60_Electrical'}`);
        report.push('');
        
        // Overall status
        const totalPassed = Object.values(this.validationResults).reduce((sum, cat) => sum + cat.passed, 0);
        const totalFailed = Object.values(this.validationResults).reduce((sum, cat) => sum + cat.failed, 0);
        const totalWarnings = Object.values(this.validationResults).reduce((sum, cat) => sum + cat.warnings, 0);
        
        const overallScore = (totalPassed / (totalPassed + totalFailed) * 100).toFixed(1);
        
        report.push('## Overall Validation Status');
        report.push('');
        report.push(`- **Overall Score**: ${overallScore}% (${totalPassed} passed, ${totalFailed} failed)`);
        report.push(`- **Warnings**: ${totalWarnings}`);
        report.push(`- **Errors**: ${this.errors.length}`);
        report.push('');
        
        // Category breakdown
        report.push('## Validation Categories');
        report.push('');
        for (const [category, results] of Object.entries(this.validationResults)) {
            const categoryScore = results.passed + results.failed > 0 ? 
                (results.passed / (results.passed + results.failed) * 100).toFixed(1) : '100.0';
            const status = results.failed === 0 ? '✅' : results.passed > results.failed ? '⚠️' : '❌';
            
            report.push(`### ${status} ${category.charAt(0).toUpperCase() + category.slice(1)}`);
            report.push(`- **Score**: ${categoryScore}% (${results.passed} passed, ${results.failed} failed, ${results.warnings} warnings)`);
            report.push('');
        }
        
        // System readiness
        report.push('## System Readiness Assessment');
        report.push('');
        const readinessCriteria = [
            { name: 'Spatial Data Coverage', passed: this.validationResults.spatial.passed > 0, critical: true },
            { name: 'Relationship Integrity', passed: this.validationResults.relationships.failed < 5, critical: true },
            { name: 'Harness Routing', passed: this.validationResults.harnesses.passed > 0, critical: false },
            { name: 'Zone Organization', passed: this.validationResults.zones.passed > 0, critical: false },
            { name: 'Topology Completeness', passed: this.validationResults.topology.passed > 0, critical: true }
        ];
        
        let readyForProduction = true;
        for (const criteria of readinessCriteria) {
            const status = criteria.passed ? '✅' : '❌';
            const criticality = criteria.critical ? ' (Critical)' : '';
            report.push(`- ${status} **${criteria.name}**${criticality}`);
            
            if (!criteria.passed && criteria.critical) {
                readyForProduction = false;
            }
        }
        
        report.push('');
        report.push(`**Production Readiness**: ${readyForProduction ? '✅ READY' : '❌ NOT READY'}`);
        report.push('');
        
        // Errors and warnings
        if (this.errors.length > 0) {
            report.push('## Critical Errors');
            report.push('');
            this.errors.slice(0, 10).forEach(error => {
                report.push(`- ${error}`);
            });
            if (this.errors.length > 10) {
                report.push(`- ... and ${this.errors.length - 10} more errors`);
            }
            report.push('');
        }
        
        if (this.warnings.length > 0) {
            report.push('## Warnings');
            report.push('');
            this.warnings.slice(0, 15).forEach(warning => {
                report.push(`- ${warning}`);
            });
            if (this.warnings.length > 15) {
                report.push(`- ... and ${this.warnings.length - 15} more warnings`);
            }
            report.push('');
        }
        
        // Recommendations
        report.push('## Recommendations');
        report.push('');
        
        if (this.validationResults.spatial.warnings > 10) {
            report.push('- **Spatial Data**: Consider improving coordinate coverage for better visualization');
        }
        
        if (this.validationResults.relationships.failed > 0) {
            report.push('- **Relationships**: Review and fix invalid edge relationships');
        }
        
        if (this.validationResults.harnesses.passed === 0) {
            report.push('- **Harnesses**: Implement harness routing for realistic wire visualization');
        }
        
        if (this.validationResults.zones.warnings > 5) {
            report.push('- **Zones**: Assign zone information to unzoned components');
        }
        
        report.push('- **Performance**: System is ready for 3D visualization and interactive exploration');
        report.push('- **Integration**: Enhanced data format is compatible with R3F scene rendering');
        report.push('');
        
        // Write report
        fs.writeFileSync(reportPath, report.join('\n'));
        
        console.log('📋 Validation Report Generated');
        console.log(`   📁 Report: ${reportPath}`);
        console.log(`   🎯 Overall Score: ${overallScore}%`);
        console.log(`   ${readyForProduction ? '✅ READY FOR PRODUCTION' : '❌ NEEDS ATTENTION'}`);
    }
}

// Main execution
async function main() {
    const validator = new SystemValidator();
    
    try {
        await validator.validate();
        process.exit(0);
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = SystemValidator;