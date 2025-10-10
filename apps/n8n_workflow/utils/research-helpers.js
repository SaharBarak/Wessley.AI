/**
 * Research Helper Utilities
 * Utilities for web research and LLM analysis
 */

const crypto = require('crypto');

/**
 * Generate search queries for vehicle research
 */
function generateVehicleSearchQueries(brand, model, year, trim = null, market = null) {
  const base = `${brand} ${model} ${year}`;
  const trimSuffix = trim ? ` ${trim}` : '';
  
  return {
    official: [
      `${base}${trimSuffix} service manual electrical wiring`,
      `${base}${trimSuffix} OEM wiring diagram manual`,
      `${base}${trimSuffix} factory service manual electrical`
    ],
    technical: [
      `${base}${trimSuffix} workshop manual electrical system`,
      `${base}${trimSuffix} repair manual fuse relay diagram`,
      `${base}${trimSuffix} electrical troubleshooting guide`
    ],
    community: [
      `${base}${trimSuffix} electrical problems forum`,
      `${base}${trimSuffix} fuse box layout diagram`,
      `${base}${trimSuffix} wiring harness connector pinout`
    ],
    parts: [
      `${base}${trimSuffix} parts catalog electrical components`,
      `${base}${trimSuffix} relay fuse specifications`,
      `${base}${trimSuffix} ECU module part numbers`
    ]
  };
}

/**
 * Calculate confidence score based on search results
 */
function calculateResearchConfidence(searchResults, sources) {
  let confidence = 0.5; // Base confidence
  
  const sourceCount = sources.length;
  const uniqueSources = new Set(sources.map(url => new URL(url).hostname)).size;
  
  // Source quantity scoring
  if (sourceCount >= 5) confidence += 0.2;
  else if (sourceCount >= 3) confidence += 0.15;
  else if (sourceCount >= 2) confidence += 0.1;
  
  // Source diversity scoring
  if (uniqueSources >= 3) confidence += 0.15;
  else if (uniqueSources >= 2) confidence += 0.1;
  
  // Source credibility scoring
  let credibilityScore = 0;
  let credibleSources = 0;
  
  sources.forEach(url => {
    const credibility = assessSourceCredibility(url);
    credibilityScore += credibility;
    if (credibility >= 0.7) credibleSources++;
  });
  
  const avgCredibility = credibilityScore / sourceCount;
  confidence += avgCredibility * 0.2;
  
  // High credibility source bonus
  if (credibleSources >= 2) confidence += 0.1;
  
  return Math.min(1.0, Math.max(0.0, confidence));
}

/**
 * Assess credibility of a source URL
 */
function assessSourceCredibility(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    // Official manufacturer sites
    if (hostname.includes('toyota.com') || 
        hostname.includes('honda.com') ||
        hostname.includes('ford.com') ||
        hostname.includes('gm.com') ||
        hostname.includes('nissan.com')) {
      return 0.95;
    }
    
    // Technical databases and manuals
    if (hostname.includes('alldata') ||
        hostname.includes('mitchell') ||
        hostname.includes('prodemand') ||
        hostname.includes('servicemanual')) {
      return 0.9;
    }
    
    // Automotive technical sites
    if (hostname.includes('automotive') ||
        hostname.includes('autozone') ||
        hostname.includes('rockauto') ||
        hostname.includes('repairpal')) {
      return 0.8;
    }
    
    // Educational institutions
    if (hostname.includes('.edu')) {
      return 0.85;
    }
    
    // Government sources
    if (hostname.includes('.gov')) {
      return 0.9;
    }
    
    // Technical forums (established)
    if (hostname.includes('reddit.com') ||
        hostname.includes('stackexchange') ||
        hostname.includes('forum')) {
      return 0.6;
    }
    
    // Generic automotive sites
    if (hostname.includes('car') ||
        hostname.includes('auto') ||
        hostname.includes('motor')) {
      return 0.5;
    }
    
    // Unknown sources
    return 0.3;
    
  } catch (error) {
    return 0.2; // Invalid URL
  }
}

/**
 * Validate search result quality
 */
function validateSearchResults(searchResults) {
  const issues = [];
  
  if (!searchResults || !Array.isArray(searchResults)) {
    issues.push('Search results must be an array');
    return { valid: false, issues };
  }
  
  if (searchResults.length === 0) {
    issues.push('No search results found');
    return { valid: false, issues };
  }
  
  const sources = searchResults.flatMap(result => 
    result.results ? result.results.map(r => r.url) : []
  );
  
  if (sources.length < 2) {
    issues.push('Insufficient sources (minimum 2 required)');
  }
  
  const validSources = sources.filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
  
  if (validSources.length < sources.length) {
    issues.push(`${sources.length - validSources.length} invalid URLs found`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    stats: {
      totalResults: searchResults.length,
      totalSources: sources.length,
      validSources: validSources.length,
      uniqueDomains: new Set(validSources.map(url => new URL(url).hostname)).size
    }
  };
}

/**
 * Parse LLM response for structured data
 */
function parseLLMAnalysis(analysisText, vehicleInfo) {
  const components = [];
  const circuits = [];
  const specifications = {};
  
  // Component extraction patterns
  const componentPatterns = {
    fuse: /(?:fuse|F\d+)[\s\-:]*([^\n.,;]{5,50})/gi,
    relay: /(?:relay|R\d+)[\s\-:]*([^\n.,;]{5,50})/gi,
    connector: /(?:connector|plug|socket)[\s\-:]*([^\n.,;]{5,50})/gi,
    ecu: /(?:ECU|ECM|PCM|module)[\s\-:]*([^\n.,;]{5,50})/gi,
    sensor: /(?:sensor)[\s\-:]*([^\n.,;]{5,50})/gi
  };
  
  let componentId = 1;
  Object.entries(componentPatterns).forEach(([type, pattern]) => {
    const matches = analysisText.match(pattern) || [];
    matches.forEach(match => {
      const label = match.replace(new RegExp(`^${type}\\s*[-:]*\\s*`, 'i'), '').trim();
      if (label.length >= 5 && label.length <= 50) {
        components.push({
          id: `${type}_${String(componentId++).padStart(3, '0')}`,
          type,
          label: label,
          zone: inferZoneFromLabel(label),
          notes: 'Extracted from research analysis'
        });
      }
    });
  });
  
  // Circuit extraction
  const circuitPatterns = [
    /(?:circuit|system)[\s\-:]*([^\n.,;]{10,60})/gi,
    /(\w+\s+(?:power|ground|signal|lighting|ignition)\s+circuit)/gi
  ];
  
  let circuitId = 1;
  circuitPatterns.forEach(pattern => {
    const matches = analysisText.match(pattern) || [];
    matches.forEach(match => {
      const label = match.trim();
      if (label.length >= 10 && label.length <= 60) {
        circuits.push({
          id: `circuit_${String(circuitId++).padStart(3, '0')}`,
          label: label,
          voltage: inferVoltageFromLabel(label)
        });
      }
    });
  });
  
  return {
    components: components.slice(0, 50), // Limit to prevent bloat
    circuits: circuits.slice(0, 20),
    specifications,
    extractionStats: {
      componentMatches: components.length,
      circuitMatches: circuits.length,
      analysisLength: analysisText.length
    }
  };
}

/**
 * Infer zone from component label
 */
function inferZoneFromLabel(label) {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('engine') || lowerLabel.includes('ecu') || lowerLabel.includes('injection')) {
    return 'engine';
  }
  if (lowerLabel.includes('dash') || lowerLabel.includes('instrument') || lowerLabel.includes('cluster')) {
    return 'dash';
  }
  if (lowerLabel.includes('interior') || lowerLabel.includes('cabin') || lowerLabel.includes('seat')) {
    return 'interior';
  }
  if (lowerLabel.includes('trunk') || lowerLabel.includes('boot') || lowerLabel.includes('rear')) {
    return 'trunk';
  }
  if (lowerLabel.includes('headlight') || lowerLabel.includes('taillight') || lowerLabel.includes('exterior')) {
    return 'exterior';
  }
  
  return 'engine'; // Default
}

/**
 * Infer voltage from circuit label
 */
function inferVoltageFromLabel(label) {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('high voltage') || lowerLabel.includes('hv') || lowerLabel.includes('400v')) {
    return '400V';
  }
  if (lowerLabel.includes('24v') || lowerLabel.includes('24 volt')) {
    return '24V';
  }
  if (lowerLabel.includes('5v') || lowerLabel.includes('5 volt') || lowerLabel.includes('signal')) {
    return '5V';
  }
  
  return '12V'; // Default automotive voltage
}

/**
 * Generate evidence hash for caching
 */
function generateEvidenceHash(sources, searchMetadata) {
  const evidenceString = JSON.stringify({
    sources: sources.sort(), // Sort for consistency
    metadata: {
      sourceCount: searchMetadata.sourceCount,
      avgCredibility: Math.round(searchMetadata.avgCredibility * 100) / 100
    }
  });
  
  return crypto.createHash('sha256').update(evidenceString).digest('hex');
}

/**
 * Build LLM prompt for research analysis
 */
function buildResearchPrompt(vehicleInfo, searchResults) {
  const systemPrompt = `You are an automotive electrical systems expert. Analyze search results to extract structured information about vehicle electrical components, circuits, and specifications.

STRICT RULES:
1. Only include information explicitly mentioned in the search results
2. Cite specific sources for each claim
3. Use automotive industry terminology
4. Include confidence scores for each piece of information
5. If information is missing or unclear, note it explicitly

Extract the following if available:
- Electrical components (fuses, relays, connectors, ECUs, sensors)
- Circuit information (voltage, protection, function)
- Specifications (ratings, part numbers, locations)
- Common issues and troubleshooting information`;

  const userPrompt = `Vehicle: ${vehicleInfo.brand} ${vehicleInfo.model} ${vehicleInfo.year}${vehicleInfo.trim ? ' ' + vehicleInfo.trim : ''}

Search Results:
${searchResults.map(result => 
  `Query: ${result.query}\n${result.results.map(r => 
    `- ${r.title}\n  URL: ${r.url}\n  Content: ${r.snippet}`
  ).join('\n')}`
).join('\n\n')}

Please extract electrical system information in a structured format with confidence scores and source citations.`;

  return { systemPrompt, userPrompt };
}

/**
 * Validate research manifest completeness
 */
function validateResearchCompleteness(manifest) {
  const issues = [];
  const warnings = [];
  
  // Required fields
  if (!manifest.sources || manifest.sources.length < 2) {
    issues.push('Insufficient sources (minimum 2 required)');
  }
  
  if (typeof manifest.confidence !== 'number' || manifest.confidence < 0 || manifest.confidence > 1) {
    issues.push('Invalid confidence score');
  }
  
  // Content quality checks
  if (!manifest.components || manifest.components.length === 0) {
    warnings.push('No electrical components identified');
  }
  
  if (!manifest.circuits || manifest.circuits.length === 0) {
    warnings.push('No electrical circuits identified');
  }
  
  if (manifest.confidence < 0.5) {
    warnings.push('Low confidence score may indicate poor source quality');
  }
  
  // Component validation
  if (manifest.components) {
    manifest.components.forEach((comp, index) => {
      if (!comp.id || !comp.type || !comp.label) {
        issues.push(`Component ${index}: missing required fields`);
      }
    });
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    quality: {
      sourceCount: manifest.sources?.length || 0,
      componentCount: manifest.components?.length || 0,
      circuitCount: manifest.circuits?.length || 0,
      confidence: manifest.confidence || 0
    }
  };
}

module.exports = {
  generateVehicleSearchQueries,
  calculateResearchConfidence,
  assessSourceCredibility,
  validateSearchResults,
  parseLLMAnalysis,
  inferZoneFromLabel,
  inferVoltageFromLabel,
  generateEvidenceHash,
  buildResearchPrompt,
  validateResearchCompleteness
};