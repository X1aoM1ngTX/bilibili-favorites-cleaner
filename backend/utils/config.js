const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../data/config.json');

/**
 * 读取配置文件
 */
function loadConfig() {
  try {
    console.log('[Config] 配置文件路径:', CONFIG_FILE);
    console.log('[Config] 检查配置文件是否存在...');
    
    if (fs.existsSync(CONFIG_FILE)) {
      console.log('[Config] 配置文件存在，正在读取...');
      const fileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
      console.log('[Config] 文件内容:', fileContent);
      const config = JSON.parse(fileContent);
      console.log('[Config] 解析后的配置:', config);
      return config;
    } else {
      console.log('[Config] 配置文件不存在');
    }
  } catch (error) {
    console.error('[Config] 读取配置文件失败:', error.message);
    console.error('[Config] 错误堆栈:', error.stack);
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