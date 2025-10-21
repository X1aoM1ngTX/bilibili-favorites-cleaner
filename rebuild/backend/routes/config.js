const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../data/config.json');

/**
 * 读取配置文件
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
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
    // 确保数据目录存在
    const dataDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('保存配置文件失败:', error.message);
    return false;
  }
}

// GET /api/config - 获取配置
router.get('/', (req, res) => {
  try {
    const config = loadConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
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