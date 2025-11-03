const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  
  // 开发服务器配置
  devServer: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // 生产构建配置
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  
  // CSS配置
  css: {
    loaderOptions: {
      css: {
        // CSS相关配置
      }
    }
  },
  
  // 配置别名
  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src')
      }
    }
  },
  
  // PWA配置（如果需要）
  pwa: {
    name: '哔哩哔哩收藏夹清理工具',
    themeColor: '#667eea',
    msTileColor: '#667eea'
  }
})