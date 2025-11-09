const express = require('express');
const router = express.Router();
const https = require('https');
const querystring = require('querystring');
const zlib = require('zlib');
const { loadConfig } = require('../utils/config');

/**
 * 从Cookie中提取CSRF token
 */
function extractCsrfFromCookie(cookie) {
  if (!cookie) return null;

  const cookies = cookie.split(';');
  for (const c of cookies) {
    const [name, value] = c.trim().split('=');
    if (name === 'bili_jct') {
      return value;
    }
  }
  return null;
}

/**
 * 排序收藏夹（使用POST请求，参数在body中）
 */
async function sortFavoriteFolders(folderIds, config) {
  return new Promise((resolve, reject) => {
    // 尝试从配置中获取CSRF token，如果没有则从Cookie中提取
    let csrfToken = config.csrf_token;
    if (!csrfToken) {
      csrfToken = extractCsrfFromCookie(config.cookie);
    }

    if (!csrfToken) {
      reject(new Error('CSRF token未找到，请确保配置中包含csrf_token或Cookie中包含bili_jct'));
      return;
    }

    // 构建排序参数：将收藏夹ID用逗号连接
    const sortParam = folderIds.join(',');
    console.log('排序收藏夹，ID列表:', sortParam);

    // 构建POST数据（即使看起来参数在URL中，可能B站API还是期望POST）
    const postData = querystring.stringify({
      sort: sortParam,
      csrf: csrfToken
    });

    console.log('发送排序请求，CSRF:', csrfToken ? '已设置' : '未设置');
    console.log('请求数据:', postData);

    const options = {
      hostname: 'api.bilibili.com',
      port: 443,
      path: '/x/v3/fav/folder/sort',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Referer': `https://space.bilibili.com/${config.up_mid}/favlist`,
        'Origin': 'https://space.bilibili.com',
        'Cookie': config.cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh-HK;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6',
        'Priority': 'u=1, i',
        'Sec-Ch-Ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
      },
      timeout: 30000 // 30秒超时
    };

    const req = https.request(options, (res) => {
      const encoding = res.headers['content-encoding'];
      let data = [];

      console.log('B站API响应状态码:', res.statusCode);
      console.log('响应头:', res.headers);
      console.log('内容编码:', encoding);

      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log('检测到重定向:', res.headers.location);
      }

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        try {
          const buffer = Buffer.concat(data);
          let decompressedData;

          // 根据编码方式解压数据
          if (encoding === 'gzip') {
            decompressedData = zlib.gunzipSync(buffer);
          } else if (encoding === 'deflate') {
            decompressedData = zlib.inflateSync(buffer);
          } else if (encoding === 'br') {
            decompressedData = zlib.brotliDecompressSync(buffer);
          } else {
            decompressedData = buffer;
          }

          const dataStr = decompressedData.toString('utf8');
          console.log('B站API响应内容:', dataStr);
          console.log('原始响应数据长度:', buffer.length, '解压后长度:', dataStr.length);

          // 检查是否是HTML错误页面
          if (dataStr.includes('<!DOCTYPE') || dataStr.includes('<html')) {
            console.error('接收到HTML响应，可能API路径不正确或服务器返回错误页面');
            reject(new Error('API路径不正确或服务器返回错误页面'));
            return;
          }

          // 检查是否是纯文本错误
          if (dataStr.includes('Method Not Allowed') || dataStr.includes('Not Found') || !dataStr.trim().startsWith('{')) {
            console.error('接收到非JSON响应:', dataStr);
            reject(new Error(`B站API错误: ${dataStr.trim()}`));
            return;
          }

          const result = JSON.parse(dataStr);
          if (result.code === 0) {
            resolve(result.data);
          } else {
            reject(new Error(`B站API错误: ${result.message} (code: ${result.code})`));
          }
        } catch (error) {
          console.error('解析响应失败:', error);
          console.error('原始响应数据:', data);
          reject(new Error('解析响应失败: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      console.error('请求失败:', error);
      if (error.code === 'ECONNRESET') {
        reject(new Error('连接被重置，请检查网络或稍后重试'));
      } else if (error.code === 'ETIMEDOUT') {
        reject(new Error('请求超时，请稍后重试'));
      } else if (error.code === 'ENOTFOUND') {
        reject(new Error('DNS解析失败，请检查网络连接'));
      } else {
        reject(new Error('请求失败: ' + error.message));
      }
    });

    req.on('timeout', () => {
      console.error('请求超时');
      req.destroy();
      reject(new Error('请求超时，请稍后重试'));
    });

    // 发送POST数据
    req.write(postData);
    req.end();
  });
}

/**
 * 获取收藏夹列表
 */
async function getFavoriteFolders(config) {
  return new Promise((resolve, reject) => {
    const url = `https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${config.up_mid}`;

    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Referer': 'https://space.bilibili.com/',
        'Origin': 'https://space.bilibili.com',
        'Cookie': config.cookie
      }
    };

    const req = https.request(url, options, (res) => {
      const encoding = res.headers['content-encoding'];
      let data = [];

      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        try {
          const buffer = Buffer.concat(data);
          let decompressedData;

          // 根据编码方式解压数据
          if (encoding === 'gzip') {
            decompressedData = zlib.gunzipSync(buffer);
          } else if (encoding === 'deflate') {
            decompressedData = zlib.inflateSync(buffer);
          } else if (encoding === 'br') {
            decompressedData = zlib.brotliDecompressSync(buffer);
          } else {
            decompressedData = buffer;
          }

          const dataStr = decompressedData.toString('utf8');
          console.log('获取收藏夹列表响应:', dataStr.substring(0, 200) + '...');

          const result = JSON.parse(dataStr);
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

// GET /api/sort/folders - 获取可排序的收藏夹列表
router.get('/folders', async (req, res) => {
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
      data: folders.map(folder => ({
        id: folder.id,
        title: folder.title,
        media_count: folder.media_count,
        fid: folder.fid,
        mid: folder.mid,
        attr: folder.attr,
        state: folder.state
      }))
    });
  } catch (error) {
    console.error('获取收藏夹列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 判断是否为默认收藏夹
function isDefaultFolder(folder) {
  return folder.title === '默认收藏夹' || folder.title.includes('默认') || folder.attr === 0;
}

// POST /api/sort/execute - 执行收藏夹排序
router.post('/execute', async (req, res) => {
  try {
    const { folderIds } = req.body;

    if (!folderIds || !Array.isArray(folderIds) || folderIds.length === 0) {
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

    // 获取所有收藏夹信息
    const allFolders = await getFavoriteFolders(config);
    const defaultFolder = allFolders.find(folder => isDefaultFolder(folder));
    const userFolders = allFolders.filter(folder => !isDefaultFolder(folder));
    const userFolderIds = userFolders.map(folder => folder.id);

    // 验证排序参数
    if (defaultFolder) {
      // 如果有默认收藏夹，确保它在第一位
      const expectedFirstId = defaultFolder.id;
      if (folderIds[0] !== expectedFirstId) {
        return res.status(400).json({
          success: false,
          error: '默认收藏夹必须位于排序列表的第一位'
        });
      }

      // 验证其余ID都是用户收藏夹
      const submittedUserIds = folderIds.slice(1);
      const invalidFolders = submittedUserIds.filter(id => !userFolderIds.includes(id));
      if (invalidFolders.length > 0) {
        return res.status(400).json({
          success: false,
          error: '排序列表包含无效的收藏夹ID'
        });
      }
    } else {
      // 没有默认收藏夹，直接验证所有ID
      const invalidFolders = folderIds.filter(id => !userFolderIds.includes(id));
      if (invalidFolders.length > 0) {
        return res.status(400).json({
          success: false,
          error: '排序列表包含无效的收藏夹ID'
        });
      }
    }

    // 执行排序
    await sortFavoriteFolders(folderIds, config);

    res.json({
      success: true,
      data: {
        sortedCount: folderIds.length,
        folderIds: folderIds,
        message: `成功排序 ${folderIds.length} 个收藏夹`
      }
    });
  } catch (error) {
    console.error('排序收藏夹失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;