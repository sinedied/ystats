import { google } from 'googleapis';
import { parseId, getUrlFromId } from './id.js';

const youtube = google.youtube('v3');

export async function getStatsForConfig(config, token, total = false) {
  const stats = {
    videos: await getStatsForVideos(config.videos, token),
    playlists: await getStatsForPlaylists(config.playlists, token),
    channels: await getStatsForChannels(config.channels, token)
  };
  if (total) {
    const totalStats = sumStats([
      { stats: sumStats(stats.videos) },
      { stats: sumStats(stats.playlists) },
      { stats: sumStats(stats.channels) }
    ]);
    stats.total = totalStats;
  }

  return stats;
}

export async function getStatsForVideos(videoIdsOrUrls, token) {
  if (!videoIdsOrUrls || videoIdsOrUrls.length === 0) {
    return [];
  }

  const ids = (Array.isArray(videoIdsOrUrls) ? videoIdsOrUrls : [videoIdsOrUrls]).filter((id) => id).map(parseId);

  return processIdsInBatches(ids, async (videoIds) => {
    const stats = [];
    let page;

    do {
      try {
        const results = await youtube.videos.list({
          auth: token,
          part: 'snippet,statistics',
          id: videoIds.join(','),
          maxResults: 50,
          pageToken: page
        });
        page = results.data.nextPageToken;
        const videos = results.data.items;
        for (const v of videos) {
          stats.push({
            id: v.id,
            url: getUrlFromId(v.id),
            title: v.snippet.title,
            stats: parseStats(v.statistics)
          });
        }
      } catch (error) {
        page = undefined;
        console.error('The API returned an error: ' + error);
      }
    } while (page);

    return stats;
  });
}

export async function getStatsForChannels(channelIdsOrUrls, token) {
  if (!channelIdsOrUrls || channelIdsOrUrls.length === 0) {
    return [];
  }

  const ids = Array.isArray(channelIdsOrUrls) ? channelIdsOrUrls : channelIdsOrUrls.split(',');
  const stats = [];

  const promises = ids.map((i) => getStatsForChannel(i, token));
  const allStats = await Promise.all(promises);
  for (const s of allStats) {
    stats.push(...s);
  }

  return stats;
}

export async function getStatsForChannel(channelIdOrUrl, token) {
  if (!channelIdOrUrl) {
    return [];
  }

  const channelId = parseId(channelIdOrUrl);
  const stats = [];

  try {
    const results = await youtube.channels.list({
      auth: token,
      part: 'snippet,statistics',
      id: channelId
    });
    const channels = results.data.items;
    if (channels.length === 0) {
      console.error(`Channel ${channelId} not found.`);
    } else {
      const c = channels[0];
      stats.push({
        id: c.id,
        url: getUrlFromId(c.id),
        title: c.snippet.title,
        stats: {
          views: Number(c.statistics.viewCount),
          subscribers: Number(c.statistics.subscriberCount),
          videos: Number(c.statistics.videoCount)
        }
      });
    }
  } catch (error) {
    console.error('The API returned an error: ' + error);
  }

  return stats;
}

export async function getStatsForPlaylists(playlistIdsOrUrls, token) {
  if (!playlistIdsOrUrls || playlistIdsOrUrls.length === 0) {
    return [];
  }

  const ids = Array.isArray(playlistIdsOrUrls) ? playlistIdsOrUrls : playlistIdsOrUrls.split(',');
  const stats = [];

  const promises = ids.map((i) => getStatsForPlaylist(i, token));
  const allStats = await Promise.all(promises);
  for (const s of allStats) {
    stats.push(...s);
  }

  return stats;
}

export async function getStatsForPlaylist(playlistIdOrUrl, token) {
  if (!playlistIdOrUrl) {
    return [];
  }

  const playlistId = parseId(playlistIdOrUrl);
  const stats = [];
  const videoIds = [];
  let page;

  try {
    do {
      const results = await youtube.playlistItems.list({
        auth: token,
        part: 'snippet',
        playlistId,
        maxResults: 50,
        pageToken: page
      });
      const { items } = results.data;
      if (items.length === 0) {
        console.error(`Playlist ${playlistId} not found.`);
        return stats;
      }

      page = results.data.nextPageToken;
      const ids = items.map((i) => i.snippet.resourceId.videoId);
      videoIds.push(...ids);
    } while (page);

    const playlistDetails = await getPlaylistDetails(playlistId, token);
    const videosStats = await getStatsForVideos(videoIds, token);
    const videos = Object.values(videosStats);
    stats.push({
      id: playlistId,
      url: getUrlFromId(playlistId),
      title: playlistDetails.title,
      stats: sumStats(videos),
      videos
    });
  } catch (error) {
    console.error('The API returned an error: ' + error);
  }

  return stats;
}

export async function getPlaylistDetails(playlistId, token) {
  const snippet = {};

  try {
    const results = await youtube.playlists.list({
      auth: token,
      part: 'snippet',
      id: playlistId
    });
    const { items } = results.data;
    if (items.length === 0) {
      console.error(`Playlist ${playlistId} not found.`);
      return snippet;
    }

    return items[0].snippet;
  } catch (error) {
    console.error('The API returned an error: ' + error);
  }

  return snippet;
}

function parseStats(stats) {
  return {
    views: Number(stats.viewCount),
    likes: Number(stats.likeCount),
    dislikes: Number(stats.dislikeCount),
    favorites: Number(stats.favoriteCount),
    comments: Number(stats.commentCount)
  };
}

function sumStats(entries) {
  const sum = {
    views: 0,
    likes: 0,
    dislikes: 0,
    favorites: 0,
    comments: 0
  };
  for (const e of entries) {
    sum.views += e.stats.views;
    sum.likes += e.stats.likes || 0;
    sum.dislikes += e.stats.dislikes || 0;
    sum.favorites += e.stats.favorites || 0;
    sum.comments += e.stats.comments || 0;
  }

  return sum;
}

async function processIdsInBatches(ids, processBatchFunc) {
  // Split the ids into batches of 50 (max allowed by the API)
  if (ids.length > 50) {
    const batches = [];
    for (let i = 0; i < ids.length; i += 50) {
      batches.push(processBatchFunc(ids.slice(i, i + 49)));
    }

    const results = await Promise.all(batches);
    return results.flat();
  }

  return processBatchFunc(ids);
}
