const idRegex = /(?:youtu\.be\/([^?&\s]+))|(?:youtube\.com\/(?:(?:channel\/([^?&\s]+))|(?:playlist\?.*?(?:list=([^?&\s]+)))|(?:watch\?.*?(?:v=([^?&\s]+)))))/gi;

export const isChannelId = id => id && id.startsWith('UC');
export const isPlaylistId = id => id && id.startsWith('PL');
export const isVideoId = id => !(isChannel(id) || isPlaylist(id));

export function parseId(idOrUrl) {
  if (!idOrUrl.startsWith('http')) {
    return idOrUrl;
  }

  const match = new RegExp(idRegex).exec(idOrUrl);
  if (!match) {
    console.error(`Invalid YouTube ID: ${idOrUrl}`);
    return null;
  }

  return match[1] || match[2] || match[3] || match[4];
}

export function getUrlFromId(id) {
  if (isChannelId(id)) {
    return `https://www.youtube.com/channel/${id}`;
  }
  if (isPlaylistId(id)) {
    return `https://www.youtube.com/playlist?list=${id}`;
  }
  return `https://youtu.be/${id}`;
}
