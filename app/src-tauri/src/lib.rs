mod config;
mod bilibili;

use config::{AppConfig, load_config, save_config, delete_config};
use bilibili::{BilibiliClient, FavoriteFolder, FavoriteDetailData, FavoriteResource, MoveResult, MoveVideoInfo};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CleanResult {
    pub media_id: i64,
    pub success: bool,
    pub cleaned_count: i32,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchCleanResult {
    pub results: Vec<CleanResult>,
    pub summary: CleanSummary,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CleanSummary {
    pub total: usize,
    pub success: usize,
    pub failure: usize,
    pub total_cleaned: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SortResult {
    pub success: bool,
    pub message: String,
    pub sorted_count: usize,
    pub folder_ids: Vec<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MoveExecuteResult {
    pub src_media_id: i64,
    pub tar_media_id: i64,
    pub moved_count: i32,
    pub message: String,
    pub videos: Vec<MoveVideoInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MoveCalculateResult {
    pub src_folder: FavoriteFolder,
    pub tar_folder: FavoriteFolder,
    pub movable_count: i32,
    pub can_move: bool,
}

// 配置相关命令
#[tauri::command]
async fn get_config() -> Result<Option<AppConfig>, String> {
    load_config()
}

#[tauri::command]
async fn save_config_command(config: AppConfig) -> Result<(), String> {
    save_config(&config)
}

#[tauri::command]
async fn delete_config_command() -> Result<(), String> {
    delete_config()
}

// 收藏夹相关命令
#[tauri::command]
async fn get_favorites() -> Result<Vec<FavoriteFolder>, String> {
    let config = load_config()?;
    match config {
        Some(config) => {
            let client = BilibiliClient::new();
            client.get_favorite_folders(&config).await
        }
        None => Err("请先配置Cookie".to_string())
    }
}

#[tauri::command]
async fn get_favorite_details(favorite_id: i64) -> Result<FavoriteDetailData, String> {
    let config = load_config()?;
    match config {
        Some(config) => {
            let client = BilibiliClient::new();
            client.get_favorite_resources(favorite_id, &config).await
        }
        None => Err("请先配置Cookie".to_string())
    }
}

// 清理相关命令
#[tauri::command]
async fn clean_favorite(media_id: i64) -> Result<CleanResult, String> {
    let config = load_config()?;
    match config {
        Some(config) => {
            let client = BilibiliClient::new();
            match client.clean_favorite_folder(media_id, &config).await {
                Ok(cleaned_count) => Ok(CleanResult {
                    media_id,
                    success: true,
                    cleaned_count,
                    error: None,
                }),
                Err(error) => Ok(CleanResult {
                    media_id,
                    success: false,
                    cleaned_count: 0,
                    error: Some(error),
                }),
            }
        }
        None => Err("请先配置Cookie".to_string())
    }
}

#[tauri::command]
async fn clean_multiple_favorites(media_ids: Vec<i64>) -> Result<BatchCleanResult, String> {
    let config = load_config()?;
    match config {
        Some(config) => {
            let client = BilibiliClient::new();
            let mut results = Vec::new();
            let mut total_cleaned = 0;
            let mut success_count = 0;
            
            for media_id in media_ids {
                match client.clean_favorite_folder(media_id, &config).await {
                    Ok(cleaned_count) => {
                        total_cleaned += cleaned_count;
                        success_count += 1;
                        results.push(CleanResult {
                            media_id,
                            success: true,
                            cleaned_count,
                            error: None,
                        });
                    }
                    Err(error) => {
                        results.push(CleanResult {
                            media_id,
                            success: false,
                            cleaned_count: 0,
                            error: Some(error),
                        });
                    }
                }
            }
            
            let total = results.len();
            let failure_count = total - success_count;
            
            Ok(BatchCleanResult {
                results,
                summary: CleanSummary {
                    total,
                    success: success_count,
                    failure: failure_count,
                    total_cleaned,
                },
            })
        }
        None => Err("请先配置Cookie".to_string())
    }
}

// 移动视频相关命令
#[tauri::command]
async fn get_move_favorites() -> Result<Vec<FavoriteFolder>, String> {
    get_favorites().await
}

#[tauri::command]
async fn get_move_videos(source_id: i64, target_id: i64) -> Result<Vec<FavoriteResource>, String> {
    let config = load_config()?;
    match config {
        Some(config) => {
            let client = BilibiliClient::new();
            
            // 获取源收藏夹信息
            let src_info = client.get_favorite_resources(source_id, &config).await?;
            let src_count = src_info.info.media_count;
            
            // 获取目标收藏夹信息
            let tar_info = client.get_favorite_resources(target_id, &config).await?;
            let tar_count = tar_info.info.media_count;
            
            // 计算可移动的视频数量
            let max_favorites_limit = 1000;
            let available_space = max_favorites_limit - tar_count;
            
            if available_space <= 0 {
                return Ok(vec![]); // 目标收藏夹已满
            }
            
            let movable_count = std::cmp::min(available_space, src_count);
            
            // 获取源收藏夹前N个视频
            client.get_favorite_videos(source_id, movable_count, &config).await
        }
        None => Err("请先配置Cookie".to_string())
    }
}

#[tauri::command]
async fn move_videos(source_id: i64, target_id: i64, video_ids: Vec<i64>) -> Result<MoveResult, String> {
    let config = load_config()?;
    match config {
        Some(config) => {
            let client = BilibiliClient::new();
            
            // 获取源收藏夹信息
            let src_info = client.get_favorite_resources(source_id, &config).await?;
            
            // 获取目标收藏夹信息
            let tar_info = client.get_favorite_resources(target_id, &config).await?;
            
            // 计算可移动的视频数量
            let max_favorites_limit = 1000;
            let available_space = max_favorites_limit - tar_info.info.media_count;
            
            if available_space <= 0 {
                return Ok(MoveResult {
                    src_media_id: source_id,
                    tar_media_id: target_id,
                    moved_count: 0,
                    success_count: 0,
                    fail_count: 0,
                    message: Some("目标收藏夹已满（1000个视频上限）".to_string()),
                    videos: Some(vec![]),
                });
            }
            
            let movable_count = std::cmp::min(available_space, src_info.info.media_count);
            let actual_count = std::cmp::min(movable_count, video_ids.len() as i32);
            
            if actual_count == 0 {
                return Ok(MoveResult {
                    src_media_id: source_id,
                    tar_media_id: target_id,
                    moved_count: 0,
                    success_count: 0,
                    fail_count: 0,
                    message: Some("源收藏夹中没有视频".to_string()),
                    videos: Some(vec![]),
                });
            }
            
            // 使用前端传递的视频ID列表
            let actual_video_ids = video_ids.iter().take(actual_count as usize).cloned().collect::<Vec<_>>();
            
            // 获取这些视频的详细信息
            let mut video_infos = Vec::new();
            for video_id in &actual_video_ids {
                // 获取源收藏夹的所有视频，找到匹配的视频
                let all_videos = client.get_favorite_videos(source_id, src_info.info.media_count, &config).await?;
                if let Some(video) = all_videos.iter().find(|v| v.id == *video_id) {
                    video_infos.push(MoveVideoInfo {
                        id: video.id,
                        title: video.title.clone(),
                        bvid: video.bvid.clone(),
                        upper: video.upper.as_ref().map(|u| u.name.clone()),
                        duration: video.duration,
                    });
                }
            }
            
            // 移动视频
            match client.move_videos(&actual_video_ids, source_id, target_id, &config).await {
                Ok(_) => {
                    Ok(MoveResult {
                        src_media_id: source_id,
                        tar_media_id: target_id,
                        moved_count: actual_count,
                        success_count: actual_count,
                        fail_count: 0,
                        message: Some(format!("成功移动 {} 个视频", actual_count)),
                        videos: Some(video_infos),
                    })
                }
                Err(error) => Ok(MoveResult {
                    src_media_id: source_id,
                    tar_media_id: target_id,
                    moved_count: 0,
                    success_count: 0,
                    fail_count: actual_count,
                    message: Some(error),
                    videos: Some(vec![]),
                }),
            }
        }
        None => Err("请先配置Cookie".to_string())
    }
}

// 排序相关命令
#[tauri::command]
async fn get_sort_folders() -> Result<Vec<FavoriteFolder>, String> {
    get_favorites().await
}

#[tauri::command]
async fn execute_sort(folder_ids: Vec<i64>) -> Result<SortResult, String> {
    let config = load_config()?;
    match config {
        Some(config) => {
            let client = BilibiliClient::new();
            
            // 获取所有收藏夹信息
            let all_folders = client.get_favorite_folders(&config).await?;
            
            // 验证排序参数
            let default_folder = all_folders.iter().find(|f| client.is_default_folder(f));
            let user_folders: Vec<_> = all_folders.iter().filter(|f| !client.is_default_folder(f)).collect();
            let user_folder_ids: Vec<i64> = user_folders.iter().map(|f| f.id).collect();
            
            if let Some(default) = default_folder {
                // 如果有默认收藏夹，确保它在第一位
                if folder_ids.is_empty() || folder_ids[0] != default.id {
                    return Ok(SortResult {
                        success: false,
                        message: "默认收藏夹必须位于排序列表的第一位".to_string(),
                        sorted_count: 0,
                        folder_ids: vec![],
                    });
                }
                
                // 验证其余ID都是用户收藏夹
                let submitted_user_ids = &folder_ids[1..];
                let invalid_folders: Vec<_> = submitted_user_ids.iter().filter(|id| !user_folder_ids.contains(id)).collect();
                
                if !invalid_folders.is_empty() {
                    return Ok(SortResult {
                        success: false,
                        message: "排序列表包含无效的收藏夹ID".to_string(),
                        sorted_count: 0,
                        folder_ids: vec![],
                    });
                }
            } else {
                // 没有默认收藏夹，直接验证所有ID
                let invalid_folders: Vec<_> = folder_ids.iter().filter(|id| !user_folder_ids.contains(id)).collect();
                
                if !invalid_folders.is_empty() {
                    return Ok(SortResult {
                        success: false,
                        message: "排序列表包含无效的收藏夹ID".to_string(),
                        sorted_count: 0,
                        folder_ids: vec![],
                    });
                }
            }
            
            // 执行排序
            match client.sort_favorite_folders(&folder_ids, &config).await {
                Ok(_) => Ok(SortResult {
                    success: true,
                    message: format!("成功排序 {} 个收藏夹", folder_ids.len()),
                    sorted_count: folder_ids.len(),
                    folder_ids: folder_ids.clone(),
                }),
                Err(error) => Ok(SortResult {
                    success: false,
                    message: error,
                    sorted_count: 0,
                    folder_ids: vec![],
                }),
            }
        }
        None => Err("请先配置Cookie".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // 配置相关
            get_config,
            save_config_command,
            delete_config_command,
            // 收藏夹相关
            get_favorites,
            get_favorite_details,
            // 清理相关
            clean_favorite,
            clean_multiple_favorites,
            // 移动相关
            get_move_favorites,
            get_move_videos,
            move_videos,
            // 排序相关
            get_sort_folders,
            execute_sort,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
