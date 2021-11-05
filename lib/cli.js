import fs from 'fs';
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';
import dotenv from 'dotenv';
import { getStatsForConfig } from './youtube.js';
import { loadConfig, saveStatsToFile } from './util.js';
import { format } from './format.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultConfigFile = 'ytstats.yml';
const help = `Usage: ys [config_path_or_URL] [options]

Options:
  -i, --id <video_ids>          Coma-separated list of video IDs
  -p, --playlist <playlist_ids> Coma-separated list of Playlist IDs
  -c, --channel <channel_ids>   Coma-separated list of Channel IDs
  -t, --token <api_token>       Use specified API token
  -o, --output <file>           Write result to output file
  -a, --append                  Append to output file (requires -o)
  -f, --format <name>           Output format (json, yml, csv, txt, basic)
  -l, --total                   Add section with total stats
  -v, --version                 Show version
  --help                        Show help
`;

export async function run(args) {
  const options = minimist(args, {
    string: ['token', 'output', 'format'],
    boolean: ['append', 'total', 'version', 'help'],
    alias: {
      i: 'id',
      p: 'playlist',
      c: 'channel',
      t: 'token',
      o: 'output',
      a: 'append',
      f: 'format',
      l: 'total',
      v: 'version'
    }
  });

  if (options.version) {
    const file = fs.readFileSync(path.join(__dirname, 'package.json'));
    const pkg = JSON.parse(file);
    console.info(pkg.version);
    return;
  }

  if (options.help) {
    return console.log(help);
  }

  const token = options.token || process.env.YT_API_TOKEN;
  if (!token) {
    console.error('Error: API token not specified.');
    console.error('Use --token or set YT_API_TOKEN environment variable to provide one.');
    process.statusCode = -1;
    return;
  }

  let configFile = options._[0];
  if (!configFile && fs.existsSync(defaultConfigFile)) {
    configFile = defaultConfigFile;
  }

  const config = await loadConfig(configFile);

  if (options.id) {
    const videoIds = options.id.split(',');
    config.videos.push(...videoIds);
  }

  if (options.playlist) {
    const playlistIds = options.playlist.split(',');
    config.playlists.push(...playlistIds);
  }

  if (options.channel) {
    const channelIds = options.channel.split(',');
    config.channels.push(...channelIds);
  }

  const stats = await getStatsForConfig(config, token, options.total);
  const formattedStats = format(stats, options.format);

  if (options.output) {
    await saveStatsToFile(options.output, formattedStats, options.format, options.append);
  } else {
    console.log(formattedStats);
  }
}
