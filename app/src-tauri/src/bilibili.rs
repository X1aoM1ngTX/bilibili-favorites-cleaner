use serde::{Deserialize, Serialize};
use crate::config::AppConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FavoriteFolder {
    pub id: i64,
    pub fid: i64,
    pub mid: i64,
    pub title: String,
    #[serde(default)]
    pub cover: String,
    #[serde(default)]
    pub intro: String,
    pub attr: i32,
    pub fav_state: i32,
    pub media_count: i32,
    #[serde(default)]
    pub ctime: i64,
    #[serde(default)]
    pub mtime: i64,
    #[serde(default)]
    pub state: i32,
    #[serde(default)]
    pub is_top: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FavoriteResource {
    pub id: i64,
    #[serde(rename = "type")]
    pub resource_type: i32,
    pub title: String,
    #[serde(default)]
    pub cover: String,
    #[serde(default)]
    pub intro: String,
    pub duration: i32,
    #[serde(default)]
    pub uri: String,
    #[serde(rename = "bv_id")]
    #[serde(default)]
    pub bv_id: String,
    #[serde(rename = "bvid")]
    #[serde(default)]
    pub bvid: String,
    #[serde(default)]
    pub aid: Option<i64>,
    #[serde(default)]
    pub mid: Option<i64>,
    pub attr: i32,
    pub ctime: i64,
    pub pubtime: i64,
    pub fav_time: i64,
    #[serde(default)]
    pub state: Option<i32>,
    #[serde(default)]
    pub upper: Option<VideoUpper>,
    #[serde(default)]
    pub link: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoUpper {
    pub mid: i64,
    pub name: String,
    #[serde(default)]
    pub face: String,
    #[serde(default)]
    pub jump_link: String,
    #[serde(default)]
    pub followed: bool,
    #[serde(default)]
    pub vip_type: i32,
    #[serde(default)]
    pub vip_status: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FavoriteListResponse {
    pub code: i32,
    pub message: String,
    #[serde(default)]
    pub ttl: i32,
    pub data: Option<FavoriteListData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FavoriteListData {
    #[serde(default)]
    pub count: i32,
    pub list: Vec<FavoriteFolder>,
    #[serde(default)]
    pub season: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FavoriteDetailResponse {
    pub code: i32,
    pub message: String,
    #[serde(default)]
    pub ttl: i32,
    pub data: Option<FavoriteDetailData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FavoriteDetailData {
    pub info: FavoriteFolder,
    #[serde(default)]
    pub medias: Option<Vec<FavoriteResource>>,
    #[serde(default)]
    pub has_more: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanResponse {
    pub code: i32,
    pub message: String,
    pub data: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SortResponse {
    pub code: i32,
    pub message: String,
    #[serde(default)]
    pub ttl: i32,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveResponse {
    pub code: i32,
    pub message: String,
    #[serde(default)]
    pub ttl: i32,
    pub data: Option<i32>,
}

pub struct BilibiliClient {
    client: reqwest::Client,
}

impl BilibiliClient {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36")
                .build()
                .unwrap(),
        }
    }

    pub async fn get_favorite_folders(&self, config: &AppConfig) -> Result<Vec<FavoriteFolder>, String> {
        let url = format!("https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid={}", config.up_mid);
        
        let response = self.client
            .get(&url)
            .header("Referer", "https://www.bilibili.com/")
            .header("Origin", "https://www.bilibili.com")
            .header("Cookie", &config.cookie)
            .send()
            .await
            .map_err(|e| format!("请求失败: {}", e))?;

        let text = response.text().await
            .map_err(|e| format!("读取响应失败: {}", e))?;
        
        let result: FavoriteListResponse = serde_json::from_str(&text)
            .map_err(|e| format!("解析响应失败: {}", e))?;
        
        if result.code == 0 {
            Ok(result.data.map(|data| data.list).unwrap_or_default())
        } else {
            Err(format!("API错误: {}", result.message))
        }
    }

    pub async fn get_favorite_resources(&self, favorite_id: i64, config: &AppConfig) -> Result<FavoriteDetailData, String> {
        let url = format!("https://api.bilibili.com/x/v3/fav/resource/list?media_id={}&pn=1&ps=20&keyword=&order=mtime&type=0&tid=0&platform=web&web_location=333.1387", favorite_id);
        
        let response = self.client
            .get(&url)
            .header("Referer", "https://www.bilibili.com/")
            .header("Origin", "https://www.bilibili.com")
            .header("Cookie", &config.cookie)
            .send()
            .await
            .map_err(|e| format!("请求失败: {}", e))?;

        let text = response.text().await
            .map_err(|e| format!("读取响应失败: {}", e))?;
        
        let result: FavoriteDetailResponse = serde_json::from_str(&text)
            .map_err(|e| format!("解析响应失败: {}", e))?;
        
        if result.code == 0 {
            result.data.ok_or_else(|| "没有数据".to_string())
        } else {
            Err(format!("API错误: {}", result.message))
        }
    }

    pub async fn get_favorite_videos(&self, favorite_id: i64, count: i32, config: &AppConfig) -> Result<Vec<FavoriteResource>, String> {
        let page_size = 20;
        let total_pages = (count as f64 / page_size as f64).ceil() as i32;
        
        if total_pages == 1 {
            let actual_page_size = count.min(20);
            let url = format!("https://api.bilibili.com/x/v3/fav/resource/list?media_id={}&pn=1&ps={}&keyword=&order=mtime&type=0&tid=0&platform=web&web_location=333.1387", favorite_id, actual_page_size);
            
            let response = self.client
                .get(&url)
                .header("Referer", "https://www.bilibili.com/")
                .header("Origin", "https://www.bilibili.com")
                .header("Cookie", &config.cookie)
                .send()
                .await
                .map_err(|e| format!("请求失败: {}", e))?;

            let text = response.text().await
                .map_err(|e| format!("读取响应失败: {}", e))?;
            
            let result: FavoriteDetailResponse = serde_json::from_str(&text)
                .map_err(|e| format!("解析响应失败: {}", e))?;
            
            if result.code == 0 {
                Ok(result.data.and_then(|d| d.medias).unwrap_or_default())
            } else {
                Err(format!("API错误: {}", result.message))
            }
        } else {
            // 多页获取
            let mut all_videos = Vec::new();
            
            for page in 1..=total_pages {
                let url = format!("https://api.bilibili.com/x/v3/fav/resource/list?media_id={}&pn={}&ps={}&keyword=&order=mtime&type=0&tid=0&platform=web&web_location=333.1387", favorite_id, page, page_size);
                
                let response = self.client
                    .get(&url)
                    .header("Referer", "https://www.bilibili.com/")
                    .header("Origin", "https://www.bilibili.com")
                    .header("Cookie", &config.cookie)
                    .send()
                    .await
                    .map_err(|e| format!("请求失败: {}", e))?;

                let text = response.text().await
                    .map_err(|e| format!("读取响应失败: {}", e))?;
                
                let result: FavoriteDetailResponse = serde_json::from_str(&text)
                    .map_err(|e| format!("解析响应失败: {}", e))?;
                
                if result.code == 0 {
                    if let Some(medias) = result.data.and_then(|d| d.medias) {
                        all_videos.extend(medias);
                    }
                } else {
                    return Err(format!("获取第{}页失败: {}", page, result.message));
                }
            }
            
            // 按收藏时间倒序排序
            all_videos.sort_by(|a, b| b.fav_time.cmp(&a.fav_time));
            
            // 只返回请求的数量
            Ok(all_videos.into_iter().take(count as usize).collect())
        }
    }

    pub async fn clean_favorite_folder(&self, media_id: i64, config: &AppConfig) -> Result<i32, String> {
        let url = "https://api.bilibili.com/x/v3/fav/resource/clean";
        
        let mut params = std::collections::HashMap::new();
        params.insert("media_id", media_id.to_string());
        params.insert("platform", "web".to_string());
        params.insert("csrf", config.csrf_token.clone());
        
        let response = self.client
            .post(url)
            .header("Referer", "https://www.bilibili.com/")
            .header("Origin", "https://www.bilibili.com")
            .header("Cookie", &config.cookie)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("请求失败: {}", e))?;

        let text = response.text().await
            .map_err(|e| format!("读取响应失败: {}", e))?;
        
        let result: CleanResponse = serde_json::from_str(&text)
            .map_err(|e| format!("解析响应失败: {}", e))?;
        
        if result.code == 0 {
            Ok(result.data.unwrap_or(0))
        } else {
            Err(format!("API错误: {}", result.message))
        }
    }

    pub async fn sort_favorite_folders(&self, folder_ids: &[i64], config: &AppConfig) -> Result<(), String> {
        let url = "https://api.bilibili.com/x/v3/fav/folder/sort";
        
        let sort_param = folder_ids.iter().map(|id| id.to_string()).collect::<Vec<_>>().join(",");
        
        let mut params = std::collections::HashMap::new();
        params.insert("sort", sort_param);
        params.insert("csrf", config.csrf_token.clone());
        
        let response = self.client
            .post(url)
            .header("Referer", format!("https://space.bilibili.com/{}/favlist", config.up_mid))
            .header("Origin", "https://space.bilibili.com")
            .header("Cookie", &config.cookie)
            .header("Accept", "application/json, text/plain, */*")
            .header("Accept-Language", "zh-CN,zh-HK;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6")
            .header("Priority", "u=1, i")
            .header("Sec-Ch-Ua", "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"")
            .header("Sec-Ch-Ua-Mobile", "?0")
            .header("Sec-Ch-Ua-Platform", "\"Windows\"")
            .header("Sec-Fetch-Dest", "empty")
            .header("Sec-Fetch-Mode", "cors")
            .header("Sec-Fetch-Site", "same-site")
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("请求失败: {}", e))?;

        let text = response.text().await
            .map_err(|e| format!("读取响应失败: {}", e))?;
        
        let result: SortResponse = serde_json::from_str(&text)
            .map_err(|e| format!("解析响应失败: {}", e))?;
        
        if result.code == 0 {
            Ok(())
        } else {
            Err(format!("API错误: {}", result.message))
        }
    }

    pub async fn move_videos(&self, resource_ids: &[i64], src_media_id: i64, tar_media_id: i64, config: &AppConfig) -> Result<MoveResult, String> {
        let url = "https://api.bilibili.com/x/v3/fav/resource/move";
        
        // 格式：id:type,id:type,... (视频类型为2)
        let resources = resource_ids.iter().map(|id| format!("{}:2", id)).collect::<Vec<_>>().join(",");
        
        let mut params = std::collections::HashMap::new();
        params.insert("resources", resources);
        params.insert("src_media_id", src_media_id.to_string());
        params.insert("tar_media_id", tar_media_id.to_string());
        params.insert("mid", config.up_mid.to_string());
        params.insert("platform", "web".to_string());
        params.insert("csrf", config.csrf_token.clone());
        
        let response = self.client
            .post(url)
            .header("Referer", "https://www.bilibili.com/")
            .header("Origin", "https://www.bilibili.com")
            .header("Cookie", &config.cookie)
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("请求失败: {}", e))?;

        let text = response.text().await
            .map_err(|e| format!("读取响应失败: {}", e))?;
        
        let result: MoveResponse = serde_json::from_str(&text)
            .map_err(|e| format!("解析响应失败: {}", e))?;
        
        if result.code == 0 {
            Ok(MoveResult {
                src_media_id,
                tar_media_id,
                moved_count: resource_ids.len() as i32,
                success_count: resource_ids.len() as i32,
                fail_count: 0,
                message: Some(format!("成功移动 {} 个视频", resource_ids.len())),
                videos: None, // 这里不返回视频信息，因为我们在lib.rs中处理
            })
        } else {
            Err(format!("API错误: {}", result.message))
        }
    }

    pub fn is_default_folder(&self, folder: &FavoriteFolder) -> bool {
        folder.title == "默认收藏夹" || folder.title.contains("默认") || folder.attr == 0
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveResult {
    pub src_media_id: i64,
    pub tar_media_id: i64,
    pub moved_count: i32,
    pub success_count: i32,
    pub fail_count: i32,
    pub message: Option<String>,
    pub videos: Option<Vec<MoveVideoInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveVideoInfo {
    pub id: i64,
    pub title: String,
    pub bvid: String,
    pub upper: Option<String>,
    pub duration: i32,
}