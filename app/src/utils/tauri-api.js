import { invoke } from '@tauri-apps/api/core'

// 配置相关API
export const configApi = {
  get: async () => {
    return await invoke('get_config')
  },
  
  save: async (config) => {
    return await invoke('save_config_command', { config })
  },
  
  delete: async () => {
    return await invoke('delete_config_command')
  }
}

// 收藏夹相关API
export const favoritesApi = {
  get: async () => {
    return await invoke('get_favorites')
  },
  
  getDetails: async (favoriteId) => {
    return await invoke('get_favorite_details', { favoriteId })
  }
}

// 清理相关API
export const cleanApi = {
  clean: async (mediaId) => {
    return await invoke('clean_favorite', { mediaId })
  },
  
  cleanMultiple: async (mediaIds) => {
    return await invoke('clean_multiple_favorites', { mediaIds })
  }
}

// 移动相关API
export const moveApi = {
  getFavorites: async () => {
    return await invoke('get_move_favorites')
  },
  
  getVideos: async (sourceId, targetId) => {
    return await invoke('get_move_videos', { sourceId, targetId })
  },
  
  moveVideos: async (sourceId, targetId, videoIds) => {
    return await invoke('move_videos', { sourceId, targetId, videoIds })
  }
}

// 排序相关API
export const sortApi = {
  getFolders: async () => {
    return await invoke('get_sort_folders')
  },
  
  executeSort: async (folderIds) => {
    return await invoke('execute_sort', { folderIds })
  }
}