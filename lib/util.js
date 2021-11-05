import process from 'process';
import { promises as fs } from 'fs';
import yaml from 'js-yaml';
import { formatSeparator } from './format.js';

export async function loadConfig(configPathOrUrl) {
  const config = {
    videos: [],
    playlists: [],
    channels: []
  };

  if (!configPathOrUrl) {
    return config;
  }

  try {
    let rawConfig = undefined;
    if (configPathOrUrl.startsWith('http')) {
      const response = await got(configPathOrUrl);
      rawConfig = response.body;
    } else {
      rawConfig = await fs.readFile(configPathOrUrl);
    }

    if (rawConfig) {
      const yamlConfig = yaml.load(rawConfig);
      if (!yamlConfig) {
        return config;
      }

      if (Array.isArray(yamlConfig.videos)) {
        config.videos = yamlConfig.videos;
      }
      if (Array.isArray(yamlConfig.playlists)) {
        config.playlists = yamlConfig.playlists;
      }
      if (Array.isArray(yamlConfig.channels)) {
        config.channels = yamlConfig.channels;
      }
    }

    return config;
  } catch (error) {
    console.error('Error while loading config: ' + error);
    process.statusCode = -1;
    return config;
  }
}

export async function saveStatsToFile(outputFile, formattedStats, format, append) {
  try {
    let data = formattedStats;
    if (append) {
      if (format === 'json') {
        console.error('Error, appending to JSON files is not supported.');
        process.statusCode = -1;
        return;
      }

      const separator = formatSeparator(format);
      data = separator + data;
      await fs.appendFile(outputFile, data);
    } else {
      await fs.writeFile(outputFile, data);
    }
    
  } catch (error) {
    console.error('Error while saving file: ' + error);
    process.statusCode = -1;
  }
}
