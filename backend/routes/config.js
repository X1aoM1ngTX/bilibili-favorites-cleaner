const express = require('express');
const router = express.Router();
const { loadConfig, saveConfig } = require('../utils/config');

// GET /api/config - 获取配置
router.get('/', (req, res) => {
  try {
    // 设置缓存控制头，防止浏览器缓存这个API响应
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString()
    });
    
    console.log('[API] 正在读取配置文件...');
    const config = loadConfig();
    console.log('[API] 读取到的配置:', config);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('[API] 获取配置失败:', error);
    res.status(500).json({
      success: false,
      error: '获取配置失败'
    });
  }
});

// POST /api/config - 保存配置
router.post('/', (req, res) => {
  try {
    const config = req.body;
    
    // 验证必要字段
    if (!config.up_mid || !config.csrf_token || !config.cookie) {
      return res.status(400).json({
        success: false,
        error: '配置缺少必要字段'
      });
    }
    
    if (saveConfig(config)) {
      res.json({
        success: true,
        message: '配置保存成功'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '保存配置失败'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: '无效的JSON数据'
    });
  }
});

// DELETE /api/config - 删除配置
router.delete('/', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    res.json({
      success: true,
      message: '配置删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除配置失败'
    });
  }
});

module.exports = router;