const express = require('express');
const router = express.Router();
const https = require('https');
const querystring = require('querystring');
const { loadConfig } = require('../utils/config');

/**
 * 获取收藏夹详细信息（包括视频总数）
 */
async function getFavoriteFolderInfo(mediaId, config) {
  return new Promise((resolve, reject) => {
    const url = `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=1&ps=1&keyword=&order=mtime&type=0&tid=0&platform=web&web_location=333.1387`;

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
            resolve({
              mediaId: result.data.info.id,
              title: result.data.info.title,
              mediaCount: result.data.info.media_count,
              upper: result.data.info.upper
            });
          } else {
            reject(new Error(result.message || '获取收藏夹信息失败'));
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
 * 获取收藏夹前N个视频（按收藏时间倒序），支持分页
 */
async function getFavoriteVideos(mediaId, count, config) {
  return new Promise((resolve, reject) => {
    // 计算需要获取的总页数
    const pageSize = 20; // B站API限制每页最多20个视频
    const totalPages = Math.ceil(count / pageSize);

    // 如果只需要一页
    if (totalPages === 1) {
      const actualPageSize = Math.min(count, 20); // B站API限制ps最大值为20
      const url = `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=1&ps=${actualPageSize}&keyword=&order=mtime&type=0&tid=0&platform=web&web_location=333.1387`;

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
              // 返回视频列表，按收藏时间倒序排列（最新的在前）
              const videos = result.data.medias || [];
              resolve(videos);
            } else {
              reject(new Error(result.message || '获取收藏夹视频失败'));
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
    } else {
      // 需要多页获取
      const videoArray = [];

      // 使用 Promise.all 来并发获取所有页面的数据
      const pagePromises = [];

      for (let page = 1; page <= totalPages; page++) {
        const url = `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${page}&ps=${pageSize}&keyword=&order=mtime&type=0&tid=0&platform=web&web_location=333.1387`;

        const pagePromise = new Promise((resolve, reject) => {
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
                  resolve(result.data.medias || []);
                } else {
                  reject(new Error(result.message || `获取第${page}页视频失败`));
                }
              } catch (error) {
                reject(new Error(`解析第${page}页响应失败`));
              }
            });
          });

          req.on('error', (error) => {
            reject(new Error(`获取第${page}页请求失败: ${error.message}`));
          });

          req.end();
        });

        pagePromises.push(pagePromise);
      }

      Promise.all(pagePromises)
        .then((pageResults) => {
          // 合并所有页面的视频数据
        const allVideos = [];
        pageResults.forEach(pageVideos => {
          allVideos.push(...pageVideos);
        });

          // 按收藏时间倒序排序（最新的在前）
          allVideos.sort((a, b) => new Date(b.fav_time) - new Date(a.fav_time));

          resolve(allVideos.slice(0, count)); // 只返回请求的数量
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
}

/**
 * 移动视频到目标收藏夹
 */
async function moveVideos(resourceIds, srcMediaId, tarMediaId, config) {
  return new Promise((resolve, reject) => {
    // 格式：id:type,id:type,... (视频类型为2)
    const resources = resourceIds.map(id => `${id}:2`).join(',');

    const postData = querystring.stringify({
      resources: resources,
      src_media_id: srcMediaId,
      tar_media_id: tarMediaId,
      mid: config.up_mid,
      platform: 'web',
      csrf: config.csrf_token
    });

    const options = {
      hostname: 'api.bilibili.com',
      port: 443,
      path: '/x/v3/fav/resource/move',
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
            resolve(result.data);
          } else {
            reject(new Error(result.message || '移动视频失败'));
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
 * 计算可移动的视频数量
 */
function calculateMovableCount(srcCount, tarCount) {
  const MAX_FAVORITES_LIMIT = 1000;
  const availableSpace = MAX_FAVORITES_LIMIT - tarCount;

  // 如果目标收藏夹已满，无法移动
  if (availableSpace <= 0) {
    return 0;
  }

  // 不能超过源收藏夹的视频数量
  return Math.min(availableSpace, srcCount);
}

// GET /api/move/info/:mediaId - 获取收藏夹详细信息
router.get('/info/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;

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

    const folderInfo = await getFavoriteFolderInfo(mediaId, config);
    res.json({
      success: true,
      data: folderInfo
    });
  } catch (error) {
    console.error('获取收藏夹信息失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/move/calculate - 计算可移动的视频数量
router.get('/calculate', async (req, res) => {
  try {
    const { srcMediaId, tarMediaId } = req.query;

    if (!srcMediaId || !tarMediaId) {
      return res.status(400).json({
        success: false,
        error: '缺少源收藏夹ID或目标收藏夹ID'
      });
    }

    const config = loadConfig();
    if (!config || !config.cookie) {
      return res.status(400).json({
        success: false,
        error: '请先配置Cookie'
      });
    }

    // 获取两个收藏夹的信息
    const [srcInfo, tarInfo] = await Promise.all([
      getFavoriteFolderInfo(srcMediaId, config),
      getFavoriteFolderInfo(tarMediaId, config)
    ]);

    // 计算可移动的视频数量
    const movableCount = calculateMovableCount(srcInfo.mediaCount, tarInfo.mediaCount);

    res.json({
      success: true,
      data: {
        srcFolder: srcInfo,
        tarFolder: tarInfo,
        movableCount,
        canMove: movableCount > 0
      }
    });
  } catch (error) {
    console.error('计算可移动数量失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/move/videos/:mediaId - 获取收藏夹前N个视频
router.get('/videos/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { count } = req.query;

    if (!mediaId) {
      return res.status(400).json({
        success: false,
        error: '缺少收藏夹ID'
      });
    }

    const videoCount = parseInt(count);
    if (isNaN(videoCount) || videoCount <= 0) {
      return res.status(400).json({
        success: false,
        error: '视频数量必须是正整数'
      });
    }

    const config = loadConfig();
    if (!config || !config.cookie) {
      return res.status(400).json({
        success: false,
        error: '请先配置Cookie'
      });
    }

    const videos = await getFavoriteVideos(mediaId, videoCount, config);
    res.json({
      success: true,
      data: {
        mediaId,
        videos: videos.slice(0, videoCount),
        requestedCount: videoCount,
        actualCount: videos.length
      }
    });
  } catch (error) {
    console.error('获取收藏夹视频失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/move/execute - 执行视频移动操作
router.post('/execute', async (req, res) => {
  try {
    const { srcMediaId, tarMediaId } = req.body;

    if (!srcMediaId || !tarMediaId) {
      return res.status(400).json({
        success: false,
        error: '缺少源收藏夹ID或目标收藏夹ID'
      });
    }

    if (srcMediaId === tarMediaId) {
      return res.status(400).json({
        success: false,
        error: '源收藏夹和目标收藏夹不能相同'
      });
    }

    const config = loadConfig();
    if (!config || !config.cookie) {
      return res.status(400).json({
        success: false,
        error: '请先配置Cookie'
      });
    }

    // 1. 获取两个收藏夹的信息
    const [srcInfo, tarInfo] = await Promise.all([
      getFavoriteFolderInfo(srcMediaId, config),
      getFavoriteFolderInfo(tarMediaId, config)
    ]);

    // 2. 计算可移动的视频数量
    const movableCount = calculateMovableCount(srcInfo.mediaCount, tarInfo.mediaCount);

    if (movableCount === 0) {
      return res.json({
        success: true,
        data: {
          movedCount: 0,
          message: tarInfo.mediaCount >= 1000 ? '目标收藏夹已满（1000个视频上限）' : '源收藏夹中没有视频可移动'
        }
      });
    }

    // 3. 获取源收藏夹前N个视频
    const videos = await getFavoriteVideos(srcMediaId, movableCount, config);
    const actualCount = Math.min(movableCount, videos.length);

    if (actualCount === 0) {
      return res.json({
        success: true,
        data: {
          movedCount: 0,
          message: '源收藏夹中没有视频'
        }
      });
    }

    // 4. 提取视频ID
    const resourceIds = videos.slice(0, actualCount).map(video => video.id);

    // 5. 移动视频
    await moveVideos(resourceIds, srcMediaId, tarMediaId, config);

    res.json({
      success: true,
      data: {
        srcMediaId,
        tarMediaId,
        srcFolder: {
          id: srcInfo.mediaId,
          title: srcInfo.title,
          originalCount: srcInfo.mediaCount,
          remainingCount: srcInfo.mediaCount - actualCount
        },
        tarFolder: {
          id: tarInfo.mediaId,
          title: tarInfo.title,
          originalCount: tarInfo.mediaCount,
          newCount: tarInfo.mediaCount + actualCount
        },
        movedCount: actualCount,
        movableCount,
        videos: videos.slice(0, actualCount).map(video => ({
          id: video.id,
          title: video.title,
          bvid: video.bvid,
          upper: video.upper?.name,
          duration: video.duration
        }))
      }
    });
  } catch (error) {
    console.error('移动视频失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;