let configCache = null;

export async function loadCTScanConfig() {
  if (configCache !== null) {
    return configCache;
  }

  try {
    const response = await fetch('/demo-data/medical_imaging/ct_scan_config.json');
    if (!response.ok) {
      configCache = [];
      return configCache;
    }

    const configs = await response.json();
    
    if (!Array.isArray(configs)) {
      configCache = [];
      return configCache;
    }
    
    const validConfigs = configs.filter(config => config.file_path);
    configCache = validConfigs;
    return configCache;
  } catch (error) {
    console.error('Error loading CT scan config:', error);
    configCache = [];
    return configCache;
  }
}

export async function getRescaleValues(filePath) {
  const configs = await loadCTScanConfig();
  let config = configs.find(c => c.file_path === filePath);
  
  if (!config && filePath) {
    const fileName = filePath.split('/').pop();
    config = configs.find(c => c.file_path.split('/').pop() === fileName);
  }

  if (config) {
    return {
      rescaleIntercept: config.rescale_intercept != null ? config.rescale_intercept : null,
      rescaleSlope: config.rescale_slope != null ? config.rescale_slope : null
    };
  }

  return {
    rescaleIntercept: null,
    rescaleSlope: null
  };
}

