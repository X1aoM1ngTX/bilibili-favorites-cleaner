import { createRouter, createWebHistory } from 'vue-router'
import LoginPanelPage from '../pages/LoginPanelPage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: LoginPanelPage
  },
  {
    path: '/fav/clear',
    name: '清理收藏夹',
    component: () => import('../pages/ClearFavoritesPage.vue')
  },
  {
    path: '/fav/move',
    name: '移动视频',
    component: () => import('../pages/MoveVideoPage.vue')
  },
  {
    path: '/fav/sort',
    name: '收藏夹排序',
    component: () => import('../pages/SortFavoritesPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router