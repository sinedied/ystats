import yaml from 'js-yaml';
import { table } from 'table';

export function formatSeparator(format = 'basic') {
  const date = new Date().toLocaleString();
  const char = format === 'yml' ? '#' : '-';
  return `${char.repeat(4)} ${date} `.padEnd(79, char) + '\n\n';
}

export function format(stats, format = 'basic') {
  switch (format) {
    case 'txt':
      return formatTxt(stats);
    case 'json':
      return JSON.stringify(stats, null, 2);
    case 'csv':
      return formatCsv(stats);
    case 'yml':
      return formatYml(stats);
    default:
      return formatBasic(stats);
  }
}

function formatBasic(stats) {
  let out = '';
  const formatSection = (title, entries) => {
    const rows = (title === 'Channels' ? formatChannelTable(entries) : formatTable(entries)).map((r) => r.slice(2));
    out += `${title}:\n`;
    out += table(rows, {
      drawHorizontalLine: (index, size) => index === 0 || index === 1 || index === size
    });
    out += '\n';
  };

  if (stats.videos.length > 0) {
    formatSection('Videos', stats.videos);
  }

  if (stats.playlists.length > 0) {
    formatSection('Playlists', stats.playlists);
  }

  if (stats.channels.length > 0) {
    formatSection('Channels', stats.channels);
  }

  if (stats.total) {
    const rows = formatTotalTable(stats.total);
    out += `Total\n${table(rows)}\n`;
  }

  return out;
}

function formatTxt(stats) {
  let out = '';
  const formatSection = (title, entries) => {
    const rows = title === 'Channels' ? formatChannelTable(entries) : formatTable(entries);
    out += `${title}:\n`;
    out += table(rows, {
      drawHorizontalLine: (index, size) => index === 0 || index === 1 || index === size
    });
    out += '\n';
  };

  if (stats.videos.length > 0) {
    formatSection('Videos', stats.videos);
  }

  if (stats.playlists.length > 0) {
    formatSection('Playlists', stats.playlists);
  }

  if (stats.channels.length > 0) {
    formatSection('Channels', stats.channels);
  }

  if (stats.total) {
    const rows = formatTotalTable(stats.total);
    out += `Total\n${table(rows)}\n`;
  }

  return out;
}

function formatCsv(stats) {
  let out = '';
  const formatSection = (title, entries) => {
    const rows = title === 'Channels' ? formatChannelTable(entries) : formatTable(entries);
    out += `${title}\n`;
    for (const r of rows) {
      const row = [...r];
      row[2] = `"${row[2]}"`; // Title
      out += row.join(',') + '\n';
    }

    out += '\n';
  };

  if (stats.videos.length > 0) {
    formatSection('Videos', stats.videos);
  }

  if (stats.playlists.length > 0) {
    formatSection('Playlists', stats.playlists);
  }

  if (stats.channels.length > 0) {
    formatSection('Channels', stats.channels);
  }

  if (stats.total) {
    const rows = formatTotalTable(stats.total);
    out += 'Total\n';
    for (const r of rows) {
      out += r.join(',') + '\n';
    }

    out += '\n';
  }

  return out;
}

function formatYml(stats) {
  let out = '';
  if (stats.videos.length > 0) {
    out += yaml.dump({ videos: stats.videos });
  }

  if (stats.playlists.length > 0) {
    out += yaml.dump({ playlists: stats.playlists });
  }

  if (stats.channels.length > 0) {
    out += yaml.dump({ channels: stats.channels });
  }

  if (stats.total) {
    out += yaml.dump({ total: stats.total });
  }

  return out;
}

function formatTable(entries) {
  const rows = entries.map((e) => [
    e.id,
    e.url,
    e.title,
    e.stats.views,
    e.stats.likes,
    e.stats.dislikes,
    e.stats.favorites,
    e.stats.comments
  ]);
  rows.unshift(['ID', 'Url', 'Title', 'Views', 'Likes', 'Dislikes', 'Favorites', 'Comments']);
  return rows;
}

function formatChannelTable(entries) {
  const rows = entries.map((e) => [e.id, e.url, e.title, e.stats.views, e.stats.subscribers, e.stats.videos]);
  rows.unshift(['ID', 'Url', 'Title', 'Views', 'Subscribers', 'Videos']);
  return rows;
}

function formatTotalTable(total) {
  return [
    ['Views', 'Likes', 'Dislikes', 'Favorites', 'Comments'],
    [total.views, total.likes, total.dislikes, total.favorites, total.comments]
  ];
}
