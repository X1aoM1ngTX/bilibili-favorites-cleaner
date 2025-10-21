const express = require('express');
const router = express.Router();
const https = require('https');
const querystring = require('querystring');
const { loadConfig } = require('../utils/config');

/**
 * 清理收藏夹
 */
async function cleanFavoriteFolder(mediaId, config) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      media_id: mediaId,
      platform: 'web',
      csrf: config.csrf_token
    });

    const options = {
      hostname: 'api.bilibili.com',
      port: 443,
      path: '/x/v3/fav/resource/clean',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com',
        'Cookie': config.cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            resolve(result.data || 0);
          } else {
            reject(new Error(result.message || '清理失败'));
          }
        } catch (error) {
          reject(new Error('解析响应失败'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 批量清理收藏夹
 */
async function cleanMultipleFolders(mediaIds, config) {
  const results = [];
  
  for (const mediaId of mediaIds) {
    try {
      const cleanedCount = await cleanFavoriteFolder(mediaId, config);
      results.push({
        mediaId,
        success: true,
        cleanedCount,
        error: null
      });
    } catch (error) {
      results.push({
        mediaId,
        success: false,
        cleanedCount: 0,
        error: error.message
      });
    }
  }
  
  return results;
}

// POST /api/clean - 清理单个收藏夹
router.post('/', async (req, res) => {
  try {
    const { mediaId } = req.body;
    
    if (!mediaId) {
      return res.status(400).json({
        success: false,
        error: '缺少收藏夹ID'
      });
    }

    const config = loadConfig();
    if (!config || !config.cookie) {
      return res.status(400).json({
        success: false,
        error: '请先配置Cookie'
      });
    }

    const result = await cleanFavoriteFolder(mediaId, config);
    res.json({
      success: true,
      data: {
        mediaId,
        cleanedCount: result
      }
    });
  } catch (error) {
    console.error('清理收藏夹失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/clean/batch - 批量清理收藏夹
router.post('/batch', async (req, res) => {
  try {
    const { mediaIds } = req.body;
    
    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的收藏夹ID列表'
      });
    }

    const config = loadConfig();
    if (!config || !config.cookie) {
      return res.status(400).json({
        success: false,
        error: '请先配置Cookie'
      });
    }

    const results = await cleanMultipleFolders(mediaIds, config);
    
    // 统计结果
    const totalCleaned = results.reduce((sum, result) => sum + result.cleanedCount, 0);
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failure: failureCount,
          totalCleaned
        }
      }
    });
  } catch (error) {
    console.error('批量清理收藏夹失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;