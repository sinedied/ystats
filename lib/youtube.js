import { google } from 'googleapis';
import { parseId, getUrlFromId } from './id.js';

const youtube = google.youtube('v3');

export async function getStatsForConfig(config, token) {
  return {
    videos: await getStatsForVideos(config.videos, token),
    playlists: await getStatsForPlaylists(config.playlists, token),
    channels: await getStatsForChannels(config.channels, token)
  };
}

export async function getStatsForVideos(videoIdsOrUrls, token) {
  if (!videoIdsOrUrls || videoIdsOrUrls.length === 0) {
    return [];
  }

  const ids = (Array.isArray(videoIdsOrUrls) ? videoIdsOrUrls : [videoIdsOrUrls]).map(parseId).join(',');
  const stats = [];
  let page = undefined;

  do {
    try {
      const results = await youtube.videos.list({
        auth: token,
        part: 'snippet,statistics',
        id: ids,
        maxResults: 50,
        pageToken: page
      });
      page = results.data.nextPageToken;
      const videos = results.data.items;
      for (let v of videos) {
        stats.push({
          id: v.id,
          url: getUrlFromId(v.id),
          title: v.snippet.title,
          stats: v.statistics,
        });
      }
    } catch (error) {
      page = undefined;
      console.error('The API returned an error: ' + error);
    }
  } while (page);

  return stats;
}

export async function getStatsForChannels(channelIdsOrUrls, token) {
  if (!channelIdsOrUrls || channelIdsOrUrls.length === 0) {
    return [];
  }

  const ids = Array.isArray(channelIdsOrUrls) ? channelIdsOrUrls : channelIdsOrUrls.split(',');
  const stats = [];

  const promises = ids.maps(i => getStatsForChannel(i, token));
  const allStats = await Promise.all(promises);
  for (let s of allStats) {
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
    if (channels.length == 0) {
      console.error(`Channel ${channelId} not found.`);
    } else {
      const c = channels[0];
      stats.push({
        id: c.id,
        url: getUrlFromId(c.id),
        title: c.snippet.title,
        stats: c.statistics,
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

  const promises = ids.maps(i => getStatsForPlaylist(i, token));
  const allStats = await Promise.all(promises);
  for (let s of allStats) {
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
  let videoIds = [];
  let page = undefined;

  try {
    do {
      const results = await youtube.playlistItems.list({
        auth: token,
        part: 'snippet',
        playlistId,
        maxResults: 50,
        pageToken: page
      });
      const items = results.data.items;
      if (items.length == 0) {
        console.error(`Playlist ${playlistId} not found.`);
        return stats;
      } else {
        page = results.data.nextPageToken;
        const ids = items.map(i => i.snippet.resourceId.videoId);
        videoIds.push(...ids);
      }
    } while (page);
    
    const playlistDetails = await getPlaylistDetails(playlistId, token);
    const videosStats = await getStatsForVideos(videoIds, token);
    const videos = Object.values(videosStats);
    const playlistStats = {
      viewCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      favoriteCount: 0,
      commentCount: 0
    };
    for (let v of videos) {
      playlistStats.viewCount += parseInt(v.stats.viewCount);
      playlistStats.likeCount += parseInt(v.stats.likeCount);
      playlistStats.dislikeCount += parseInt(v.stats.dislikeCount);
      playlistStats.favoriteCount += parseInt(v.stats.favoriteCount);
      playlistStats.commentCount += parseInt(v.stats.commentCount);
    }
    stats.push({
      id: playlistId,
      url: getUrlFromId(playlistDetails.id),
      title: playlistDetails.title,
      stats: playlistStats,
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
    const items = results.data.items;
    if (items.length == 0) {
      console.error(`Playlist ${playlistId} not found.`);
      return snippet;
    }
    return items[0].snippet;
    
  } catch (error) {
    console.error('The API returned an error: ' + error);
  }

  return snippet;
}
