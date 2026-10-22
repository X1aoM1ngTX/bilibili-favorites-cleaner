import axios, { AxiosInstance } from 'axios';
import { requestWithRateLimit } from './rate-limit';

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

export interface QrCodeGenerateResult {
  url: string;
  qrcode_key: string;
}

export type QrCodePollStatus =
  | 'waiting'
  | 'scanned'
  | 'expired'
  | 'success'
  | 'error';

export interface QrCodePollResult {
  status: QrCodePollStatus;
  message: string;
  cookie?: string;
}

/** 从 Set-Cookie 响应头里拼出登录 Cookie（值保持原样，不做解码） */
function cookieFromSetCookie(setCookie: unknown): string | null {
  if (!Array.isArray(setCookie) || setCookie.length === 0) return null;

  const wanted = ['SESSDATA', 'bili_jct', 'DedeUserID'];
  const found: Record<string, string> = {};

  for (const raw of setCookie) {
    if (typeof raw !== 'string') continue;
    const pair = raw.split(';')[0];
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex <= 0) continue;
    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (wanted.includes(name) && value) {
      found[name] = value;
    }
  }

  if (!found.SESSDATA) return null;
  return wanted
    .filter((name) => found[name])
    .map((name) => `${name}=${found[name]}`)
    .join('; ');
}

/**
 * 兜底：登录成功时 data.url 是一次性跳转链接，查询串里带着同一批 Cookie。
 * 这里保留原始（仍是 URL 编码的）值，正好符合 Cookie 头的格式。
 */
function cookieFromRedirectUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url) return null;

  const pick = (name: string) => {
    const matched = new RegExp(`[?&]${name}=([^&]+)`).exec(url);
    return matched ? matched[1] : '';
  };

  const sessdata = pick('SESSDATA');
  if (!sessdata) return null;

  const biliJct = pick('bili_jct');
  const dedeUserId = pick('DedeUserID');

  return [
    `SESSDATA=${sessdata}`,
    biliJct ? `bili_jct=${biliJct}` : '',
    dedeUserId ? `DedeUserID=${dedeUserId}` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export class BilibiliApi {
  private client: AxiosInstance;
  private passport: AxiosInstance;

  constructor(cookie: string = '') {
    this.client = axios.create({
      baseURL: 'https://api.bilibili.com',
      headers: {
        'User-Agent': DESKTOP_UA,
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com',
        'Cookie': cookie,
      },
      timeout: 30000,
      proxy: false,
    });

    // 扫码登录走 passport 域名，不带任何 Cookie
    this.passport = axios.create({
      baseURL: 'https://passport.bilibili.com',
      headers: {
        'User-Agent': DESKTOP_UA,
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com',
      },
      timeout: 15000,
      proxy: false,
    });
  }

  setCookie(cookie: string) {
    this.client.defaults.headers['Cookie'] = cookie;
  }

  async getFavoriteFolders(upMid: string) {
    return requestWithRateLimit('read', async () => {
      const response = await this.client.get(
        '/x/v3/fav/folder/created/list-all',
        {
          params: { up_mid: upMid },
        }
      );
      return response.data;
    });
  }

  async getFavoriteResources(mediaId: number, pn: number = 1, ps: number = 20) {
    return requestWithRateLimit('read', async () => {
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
    });
  }

  async cleanFavoriteMedia(mediaId: number, csrf: string) {
    return requestWithRateLimit('write', async () => {
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
    });
  }

  async moveVideos(
    resources: string,
    srcMediaId: number,
    tarMediaId: number,
    mid: string,
    csrf: string
  ) {
    return requestWithRateLimit('write', async () => {
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
    });
  }

  async sortFolders(sort: string, csrf: string, mid: string) {
    return requestWithRateLimit('write', async () => {
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
    });
  }

  /** 申请登录二维码 */
  async generateQrCode(): Promise<QrCodeGenerateResult> {
    const response = await this.passport.get(
      '/x/passport-login/web/qrcode/generate'
    );
    const body = response.data;

    if (body?.code !== 0 || !body?.data?.qrcode_key || !body?.data?.url) {
      throw new Error(body?.message || '生成登录二维码失败');
    }

    return {
      url: body.data.url as string,
      qrcode_key: body.data.qrcode_key as string,
    };
  }

  /** 轮询扫码状态，成功后返回可直接使用的 Cookie */
  async pollQrCode(qrcodeKey: string): Promise<QrCodePollResult> {
    const response = await this.passport.get(
      '/x/passport-login/web/qrcode/poll',
      {
        params: { qrcode_key: qrcodeKey },
        validateStatus: () => true,
      }
    );

    const body = response.data;
    if (body?.code !== 0) {
      throw new Error(body?.message || '查询扫码状态失败');
    }

    const data = body.data ?? {};

    switch (data.code) {
      case 86101:
        return { status: 'waiting', message: '等待扫码' };
      case 86090:
        return { status: 'scanned', message: '已扫码，请在手机上确认' };
      case 86038:
        return { status: 'expired', message: '二维码已过期，请刷新' };
      case 0: {
        const cookie =
          cookieFromSetCookie(response.headers?.['set-cookie']) ??
          cookieFromRedirectUrl(data.url);

        if (!cookie) {
          return {
            status: 'error',
            message: '登录成功，但未能解析出 Cookie，请改用 Cookie 登录',
          };
        }

        return { status: 'success', message: '登录成功', cookie };
      }
      default:
        return {
          status: 'error',
          message: data.message || '扫码登录失败',
        };
    }
  }
}
