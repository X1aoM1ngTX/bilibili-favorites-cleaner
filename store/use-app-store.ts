import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserConfig, FavoriteFolder, FavoriteFolderInfo } from '@/types';

interface AppState {
  userConfig: UserConfig | null;
  favoriteFolders: FavoriteFolder[];
  favoriteFolderInfo: FavoriteFolderInfo | null;
  isLoggedIn: boolean;
  
  setUserConfig: (config: UserConfig | null) => void;
  setFavoriteFolders: (folders: FavoriteFolder[]) => void;
  setFavoriteFolderInfo: (info: FavoriteFolderInfo | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userConfig: null,
      favoriteFolders: [],
      favoriteFolderInfo: null,
      isLoggedIn: false,

      setUserConfig: (config) =>
        set({
          userConfig: config,
          isLoggedIn: !!config,
        }),

      setFavoriteFolders: (folders) => set({ favoriteFolders: folders }),

      setFavoriteFolderInfo: (info) => set({ favoriteFolderInfo: info }),

      logout: () =>
        set({
          userConfig: null,
          favoriteFolders: [],
          favoriteFolderInfo: null,
          isLoggedIn: false,
        }),
    }),
    {
      name: 'bilibili-fav-cleaner-storage',
      partialize: (state) => ({
        userConfig: state.userConfig,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
