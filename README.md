# :tv: ystats

> Simple CLI to quickly get YouTube stats for any video, playlist, channel or all at once.

## Installation

```bash
npm install -g ystats
```

## Usage

```
Usage: ys [config_path_or_URL] [options]

Options:
  -i, --ids <video_ids>         Coma separated list of video IDs
  -p, --playlist <playlist_id>  Playlist ID
  -c, --channel <channel_id>    Channel ID
  -t, --token <api_token>       Use specified API token
  -o, --output <file>           Write result to output file
  -a, --append                  Append to output file (requires -o)
  -f, --format <name>           Output format (json, yml, csv, txt, basic)
  -t, --total                   Add section with total stats
  -v, --version                 Show version
  --help                        Show help
```

To use this tool, you need a YouTube Data API key. You can get one by looking at [the instructions here](https://developers.google.com/youtube/v3/getting-started). You can provide it with the `--token` option, setting the `YT_API_TOKEN` environment variable or adding `YT_API_TOKEN=<key>` into a `.env` file in the current directory.

If you don't provide a config file path or URL, the tool will try to load a `ystats.yml` config file in the current directory.

Please note that the YouTube data API have [quota limits](https://developers.google.com/youtube/v3/getting-started#quota). If you are getting rate limited, you can try to use a different API token.

## IDs format

The various IDs (video, playlista and channel) can be provided in any of the following formats:
- raw id (e.g. `video_id`)
- YouTube browser URL (e.g. `https://www.youtube.com/watch?v=video_id`)
- YouTube share URL (e.g. `https://youtu.be/video_id`)

## Config file

The config file is a YAML file with the following structure:

```yaml
# List of videos IDs to get stats for
videos:
  - https://youtu.be/w-tLZjO6XMc
  - https://www.youtube.com/watch?v=FeJVdCz_uco

# List of playlist IDs to get stats for
playlists:
  - https://www.youtube.com/playlist?list=PLlrxD0HtieHje-_287YJKhY8tDeSItwtg
  - https://www.youtube.com/playlist?list=PLlrxD0HtieHgMPeBaDQFx9yNuFxx6S1VG

# List of channels IDs to get stats for
channels:
  - https://www.youtube.com/channel/UCsMica-v34Irf9KVTh6xx-g
```

Each of these sections are completely optional.
