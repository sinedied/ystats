import { promises as fs } from 'fs';
import yaml from 'js-yaml';

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
    console.error('Error while loading config: ', error);
    process.statusCode = -1;
    return;
  }
}
