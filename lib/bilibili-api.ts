import axios, { AxiosInstance } from 'axios';

export class BilibiliApi {
  private client: AxiosInstance;

  constructor(cookie: string) {
    this.client = axios.create({
      baseURL: 'https://api.bilibili.com',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com',
        'Cookie': cookie,
      },
      timeout: 30000,
      proxy: false,
    });
  }

  setCookie(cookie: string) {
    this.client.defaults.headers['Cookie'] = cookie;
  }

  async getFavoriteFolders(upMid: string) {
    const response = await this.client.get('/x/v3/fav/folder/created/list-all', {
      params: { up_mid: upMid },
    });
    return response.data;
  }

  async getFavoriteResources(mediaId: number, pn: number = 1, ps: number = 20) {
    const response = await this.client.get('/x/v3/fav/resource/list', {
      params: {
        media_id: mediaId,
        pn,
        ps,
        order: 'mtime',
        platform: 'web',
      },
    });
    return response.data;
  }

  async cleanFavoriteMedia(mediaId: number, csrf: string) {
    const response = await this.client.post(
      '/x/v3/fav/resource/clean',
      new URLSearchParams({
        media_id: mediaId.toString(),
        platform: 'web',
        csrf,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  }

  async moveVideos(
    resources: string,
    srcMediaId: number,
    tarMediaId: number,
    mid: string,
    csrf: string
  ) {
    const response = await this.client.post(
      '/x/v3/fav/resource/move',
      new URLSearchParams({
        resources,
        src_media_id: srcMediaId.toString(),
        tar_media_id: tarMediaId.toString(),
        mid,
        platform: 'web',
        csrf,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  }

  async sortFolders(sort: string, csrf: string, mid: string) {
    const response = await this.client.post(
      '/x/v3/fav/folder/sort',
      new URLSearchParams({
        sort,
        csrf,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': `https://space.bilibili.com/${mid}/favlist`,
          'Origin': 'https://space.bilibili.com',
        },
      }
    );
    return response.data;
  }

}
