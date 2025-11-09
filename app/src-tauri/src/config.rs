use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use dirs::home_dir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub up_mid: String,
    pub csrf_token: String,
    pub cookie: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            up_mid: String::new(),
            csrf_token: String::new(),
            cookie: String::new(),
        }
    }
}

pub fn get_config_path() -> PathBuf {
    let mut path = home_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push(".bilibili-fav-cleaner");
    path.push("config.json");
    path
}

pub fn load_config() -> Result<Option<AppConfig>, String> {
    let config_path = get_config_path();
    
    if !config_path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("读取配置文件失败: {}", e))?;
    
    let config: AppConfig = serde_json::from_str(&content)
        .map_err(|e| format!("解析配置文件失败: {}", e))?;
    
    Ok(Some(config))
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path();
    
    // 确保目录存在
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("创建配置目录失败: {}", e))?;
    }
    
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    
    fs::write(&config_path, content)
        .map_err(|e| format!("写入配置文件失败: {}", e))?;
    
    Ok(())
}

pub fn delete_config() -> Result<(), String> {
    let config_path = get_config_path();
    
    if config_path.exists() {
        fs::remove_file(&config_path)
            .map_err(|e| format!("删除配置文件失败: {}", e))?;
    }
    
    Ok(())
}