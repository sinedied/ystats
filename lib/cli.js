import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';
import dotenv from 'dotenv';
import { getStatsForConfig, getStatsForPlaylist } from './youtube.js';
import { loadConfig } from './util.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultConfigFile = 'ytstats.yml';
const help = `Usage: ys [config_path_or_URL] [options]

Options:
  -i, --ids <video_ids>         Coma separated list of video IDs
  -p, --playlist <playlist_id>  Playlist ID
  -c, --channel <channel_id>    Channel ID
  -t, --token <api_token>       Use specified API token
  -o, --output <file>           Write result to output file
  -a, --append                  Append to output file (requires -o)
  -f, --format <name>           Output format (json, csv, txt, md)
  -v, --version                 Show version
  --help                        Show help
`;

export async function run(args) {
  const options = minimist(args, {
    string: ['token', 'output', 'format'],
    boolean: ['append', 'version', 'help'],
    alias: {
      t: 'token',
      o: 'output',
      a: 'append',
      f: 'format',
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

  if (options.ids) {
    const videoIds = options.ids.split(',');
    config.videos.push(...videoIds);
  }
  if (options.playlist) {
    config.playlists.push(options.playlist);
  }
  if (options.channel) {
    config.channels.push(options.channel);
  }

  // const stats = getStatsForConfig(config, token);



  // const s = await getStatsForVideos('orbSH_pLSLU', token);
  // console.log(JSON.stringify(s, null, 2));

  // const c = await getStatsForChannel('UChnxLLvzviaR5NeKOevB8iQ', token);
  // console.log(JSON.stringify(c, null, 2));

  const p = await getStatsForPlaylist('PLlrxD0HtieHgMPeBaDQFx9yNuFxx6S1VG', token);
  console.log(JSON.stringify(p, null, 2));
}


