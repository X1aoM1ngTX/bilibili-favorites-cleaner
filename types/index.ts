export interface BilibiliResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface BilibiliErrorResponse {
  code: number;
  message: string;
  data: null;
}

export interface FavoriteFolder {
  id: number;
  fid: number;
  mid: number;
  title: string;
  attr: number;
  fav_state: number;
  media_count: number;
}

export interface FavoriteFolderInfo {
  id: number;
  fid: number;
  mid: number;
  attr: number;
  title: string;
  cover: string;
  upper: {
    mid: number;
    name: string;
    face: string;
    followed: boolean;
    vip_type: number;
    vip_statue: number;
  };
  cover_type: number;
  cnt_info: {
    collect: number;
    play: number;
    thumb_up: number;
    share: number;
  };
  type: number;
  intro: string;
  ctime: number;
  mtime: number;
  state: number;
  fav_state: number;
  like_state: number;
  media_count: number;
  is_top: boolean;
}

export interface VideoInfo {
  id: number;
  type: number;
  title: string;
  cover: string;
  intro: string;
  page: number;
  duration: number;
  upper: {
    mid: number;
    name: string;
    face: string;
    jump_link: string;
  };
  attr: number;
  cnt_info: {
    collect: number;
    play: number;
    danmaku: number;
    vt: number;
    play_switch: number;
    reply: number;
    view_text_1: string;
  };
  link: string;
  ctime: number;
  pubtime: number;
  fav_time: number;
  bv_id: string;
  bvid: string;
  season: unknown;
  ogv: unknown;
  ugc: {
    first_cid: number;
  };
  media_list_link: string;
}

export interface FavoriteResourceList {
  info: FavoriteFolderInfo;
  medias: VideoInfo[];
  has_more: boolean;
  ttl: number;
}

export interface UserConfig {
  up_mid: string;
  csrf_token: string;
  cookie: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
