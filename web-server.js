#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
const https = require('https');

/**
 * 哔哩哔哩收藏夹清理工具 - Web服务器
 * 集成二维码登录和收藏夹清理功能
 */

// 配置
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

/**
 * 获取文件的MIME类型
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 读取配置文件
 */
function loadConfig() {
  try {
    if (fs.existsSync('config.json')) {
      return JSON.parse(fs.readFileSync('config.json', 'utf8'));
    }
  } catch (error) {
    console.error('读取配置文件失败:', error.message);
  }
  return null;
}

/**
 * 保存配置文件
 */
function saveConfig(config) {
  try {
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('保存配置文件失败:', error.message);
    return false;
  }
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
 * 解析Cookie过期时间
 */
function parseCookieExpiry(cookieValue) {
  // 尝试从SESSDATA中解析过期时间
  if (cookieValue.includes('%2C')) {
    const parts = cookieValue.split('%2C');
    if (parts.length >= 2) {
      const timestamp = parseInt(parts[1]);
      if (!isNaN(timestamp)) {
        return timestamp;
      }
    }
  }
  
  // 默认设置为30天后过期
  return Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
}


/**
 * 处理API请求
 */
async function handleAPI(req, res, pathname, query) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  try {
    switch (pathname) {

      case '/api/config':
        if (req.method === 'GET') {
          const config = loadConfig();
          res.writeHead(200, corsHeaders);
          res.end(JSON.stringify({
            success: true,
            data: config
          }));
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const config = JSON.parse(body);
              if (saveConfig(config)) {
                res.writeHead(200, corsHeaders);
                res.end(JSON.stringify({
                  success: true,
                  message: '配置保存成功'
                }));
              } else {
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({
                  success: false,
                  error: '保存配置失败'
                }));
              }
            } catch (error) {
              res.writeHead(400, corsHeaders);
              res.end(JSON.stringify({
                success: false,
                error: '无效的JSON数据'
              }));
            }
          });
        }
        break;

      case '/api/favorites':
        if (req.method === 'GET') {
          const config = loadConfig();
          if (!config || !config.cookie) {
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({
              success: false,
              error: '请先配置Cookie'
            }));
            return;
          }

          try {
            const folders = await getFavoriteFolders(config);
            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify({
              success: true,
              data: folders
            }));
          } catch (error) {
            res.writeHead(500, corsHeaders);
            res.end(JSON.stringify({
              success: false,
              error: error.message
            }));
          }
        }
        break;

      case '/api/clean':
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { mediaId } = JSON.parse(body);
              const config = loadConfig();

              if (!config || !config.cookie) {
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({
                  success: false,
                  error: '请先配置Cookie'
                }));
                return;
              }

              cleanFavoriteFolder(mediaId, config).then(result => {
                res.writeHead(200, corsHeaders);
                res.end(JSON.stringify({
                  success: true,
                  data: result
                }));
              }).catch(error => {
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({
                  success: false,
                  error: error.message
                }));
              });
            } catch (error) {
              res.writeHead(400, corsHeaders);
              res.end(JSON.stringify({
                success: false,
                error: '无效的请求数据'
              }));
            }
          });
        }
        break;

      case '/api/convert-cookies':
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { cookies } = JSON.parse(body);
              
              if (!cookies) {
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({
                  success: false,
                  error: '请提供Cookie数据'
                }));
                return;
              }

              // 解析Cookie字符串
              let cookieArray = [];
              if (typeof cookies === 'string') {
                // 标准格式：key=value; key2=value2
                cookieArray = cookies.split(';').map(cookie => {
                  const [name, value] = cookie.trim().split('=');
                  return { name: name.trim(), value: value ? value.trim() : '' };
                }).filter(cookie => cookie.name && cookie.value);
              } else if (Array.isArray(cookies)) {
                // JSON数组格式：[{"name":"key","value":"value"}]
                cookieArray = cookies;
              }

              // 转换为TinyDB格式
              const tinyDbFormat = {
                "_default": {
                  "1": {
                    "value": cookieArray.map(cookie => {
                      // 根据Cookie名称设置属性
                      const isImportant = ['SESSDATA', 'bili_jct'].includes(cookie.name);
                      const expires = parseCookieExpiry(cookie.value);
                      
                      return {
                        name: cookie.name,
                        value: cookie.value,
                        domain: ".bilibili.com",
                        path: "/",
                        expires: expires,
                        httpOnly: isImportant,
                        secure: true,
                        sameSite: "Lax"
                      };
                    })
                  }
                }
              };

              res.writeHead(200, corsHeaders);
              res.end(JSON.stringify({
                success: true,
                data: tinyDbFormat
              }));
            } catch (error) {
              res.writeHead(500, corsHeaders);
              res.end(JSON.stringify({
                success: false,
                error: '转换失败: ' + error.message
              }));
            }
          });
        }
        break;

      default:
        res.writeHead(404, corsHeaders);
        res.end(JSON.stringify({
          success: false,
          error: 'API接口不存在'
        }));
    }
  } catch (error) {
    res.writeHead(500, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: '服务器内部错误'
    }));
  }
}

/**
 * 处理SSE请求
 */
async function handleSSE(req, res, query) {
  const qrcodeKey = query.qrcode_key;

  if (!qrcodeKey) {
    res.writeHead(400);
    res.end();
    return;
  }

  // 设置SSE响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  let pollCount = 0;
  const maxPolls = 60; // 最多轮询60次（5分钟）

  const poll = async () => {
    if (pollCount >= maxPolls) {
      sendSSE(res, 'error', { message: '二维码已过期，请重新生成' });
      res.end();
      return;
    }

    try {
      const result = await pollQRStatus(qrcodeKey);
      pollCount++;

      switch (result.code) {
        case 0: // 登录成功
          sendSSE(res, 'success', {
            message: '登录成功',
            cookie: result.data.url
          });
          res.end();
          break;
        case 86038: // 二维码已过期
          sendSSE(res, 'expired', { message: '二维码已过期' });
          res.end();
          break;
        case 86090: // 已扫码未确认
          sendSSE(res, 'scanned', { message: '已扫码，请确认登录' });
          setTimeout(poll, 2000);
          break;
        case 86101: // 未扫码
          sendSSE(res, 'waiting', { message: '等待扫码' });
          setTimeout(poll, 2000);
          break;
        default:
          sendSSE(res, 'error', { message: result.message || '未知错误' });
          res.end();
      }
    } catch (error) {
      sendSSE(res, 'error', { message: error.message });
      res.end();
    }
  };

  // 开始轮询
  poll();

  // 处理客户端断开连接
  req.on('close', () => {
    res.end();
  });
}

/**
 * 处理静态文件请求
 */
function handleStatic(req, res, pathname) {
  const filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // 安全检查，防止目录遍历攻击
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, {
        'Content-Type': getMimeType(filePath),
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
}

/**
 * 创建HTTP服务器
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);

  // 处理SSE请求
  if (pathname === '/api/qr-poll') {
    handleSSE(req, res, query);
    return;
  }

  // 处理API请求
  if (pathname.startsWith('/api/')) {
    handleAPI(req, res, pathname, query);
    return;
  }

  // 处理静态文件
  handleStatic(req, res, pathname);
});

/**
 * 启动服务器
 */
server.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 哔哩哔哩收藏夹清理工具 Web服务器启动成功');
  console.log('='.repeat(50));
  console.log(`🌐 访问地址: http://${HOST}:${PORT}`);
  console.log(`🔧 运行环境: ${process.env.NODE_ENV || 'development'}`);
  console.log('💡 按 Ctrl+C 停止服务器');
  console.log('='.repeat(50) + '\n');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = {
  getFavoriteFolders,
  cleanFavoriteFolder,
  loadConfig,
  saveConfig
};