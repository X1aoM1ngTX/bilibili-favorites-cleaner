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

module.exports = {
  loadConfig,
  saveConfig
};