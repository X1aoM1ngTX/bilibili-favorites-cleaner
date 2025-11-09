const express = require('express');
const router = express.Router();
const https = require('https');
const { loadConfig } = require('../utils/config');

/**
 * 获取收藏夹列表
 */
async function getFavoriteFolders(config) {
  return new Promise((resolve, reject) => {
    const url = `https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${config.up_mid}`;

    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com',
        'Cookie': config.cookie
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            resolve(result.data.list || []);
          } else {
            reject(new Error(result.message || '获取收藏夹失败'));
          }
        } catch (error) {
          reject(new Error('解析响应失败'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * 获取收藏夹详情
 */
async function getFavoriteResources(favoriteId, config) {
  return new Promise((resolve, reject) => {
    const url = `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${favoriteId}&pn=1&ps=20`;

    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com',
        'Cookie': config.cookie
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            resolve(result.data);
          } else {
            reject(new Error(result.message || '获取收藏夹详情失败'));
          }
        } catch (error) {
          reject(new Error('解析响应失败'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// GET /api/favorites - 获取收藏夹列表
router.get('/', async (req, res) => {
  try {
    const config = loadConfig();
    if (!config || !config.cookie) {
      return res.status(400).json({
        success: false,
        error: '请先配置Cookie'
      });
    }

    const folders = await getFavoriteFolders(config);
    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    console.error('获取收藏夹失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/favorites/:id - 获取收藏夹详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = loadConfig();
    
    if (!config || !config.cookie) {
      return res.status(400).json({
        success: false,
        error: '请先配置Cookie'
      });
    }

    const details = await getFavoriteResources(id, config);
    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('获取收藏夹详情失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;