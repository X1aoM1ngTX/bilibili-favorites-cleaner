# Bilibili 收藏夹清理工具 API 文档

本文档基于 bilibili-favorites-cleaner 项目逆向分析得出的所有 API 接口信息，包括本地后端接口和 Bilibili 原始 API。

## 目录

- [本地后端 API 接口](#本地后端-api-接口)
- [Bilibili 原始 API 接口](#bilibili-原始-api-接口)
- [通用请求头信息](#通用请求头信息)
- [错误处理说明](#错误处理说明)

---

## 本地后端 API 接口

### 1. 配置管理接口 (`/api/config`)

#### 获取配置信息
- **URL**: `GET /api/config`
- **功能**: 获取当前保存的用户配置信息
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "up_mid": "用户UID",
    "csrf_token": "CSRF令牌",
    "cookie": "完整Cookie字符串"
  }
}
```

#### 保存配置信息
- **URL**: `POST /api/config`
- **功能**: 保存用户配置信息
- **请求体**:
```json
{
  "up_mid": "用户UID",
  "csrf_token": "CSRF令牌",
  "cookie": "完整Cookie字符串"
}
```

#### 删除配置信息
- **URL**: `DELETE /api/config`
- **功能**: 删除当前配置信息

---

### 2. 收藏夹管理接口 (`/api/favorites`)

#### 获取收藏夹列表
- **URL**: `GET /api/favorites`
- **功能**: 获取用户所有的收藏夹列表
- **Bilibili API**: `GET https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid={uid}`

#### 获取收藏夹详情
- **URL**: `GET /api/favorites/:id`
- **功能**: 获取指定收藏夹的详细信息和视频列表
- **参数**: `id` - 收藏夹ID
- **Bilibili API**: `GET https://api.bilibili.com/x/v3/fav/resource/list?media_id={id}&pn=1&ps=20`

---

### 3. Cookie 转换接口 (`/api/convert`)

#### Cookie 格式转换
- **URL**: `POST /api/convert`
- **功能**: 将 Cookie 转换为 TinyDB 格式
- **请求体**:
```json
{
  "cookies": "Cookie字符串或Cookie数组"
}
```
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "_default": {
      "1": {
        "value": [
          {
            "name": "SESSDATA",
            "value": "值",
            "domain": ".bilibili.com",
            "path": "/",
            "expires": 时间戳,
            "httpOnly": true,
            "secure": true,
            "sameSite": "Lax"
          }
        ]
      }
    }
  }
}
```

---

### 4. 清理接口 (`/api/clean`)

#### 清理单个收藏夹
- **URL**: `POST /api/clean`
- **功能**: 清理指定收藏夹中的失效内容
- **请求体**:
```json
{
  "mediaId": "收藏夹ID"
}
```
- **Bilibili API**: `POST https://api.bilibili.com/x/v3/fav/resource/clean`

#### 批量清理收藏夹
- **URL**: `POST /api/clean/batch`
- **功能**: 批量清理多个收藏夹中的失效内容
- **请求体**:
```json
{
  "mediaIds": ["收藏夹ID1", "收藏夹ID2"]
}
```

---

### 5. 移动接口 (`/api/move`)

#### 获取收藏夹信息
- **URL**: `GET /api/move/info/:mediaId`
- **功能**: 获取指定收藏夹的详细信息（包括视频总数）
- **参数**: `mediaId` - 收藏夹ID

#### 计算可移动视频数量
- **URL**: `GET /api/move/calculate`
- **功能**: 计算可以从源收藏夹移动到目标收藏夹的视频数量
- **查询参数**:
  - `srcMediaId` - 源收藏夹ID
  - `tarMediaId` - 目标收藏夹ID
- **限制**: 每个收藏夹最多 1000 个视频

#### 获取收藏夹前N个视频
- **URL**: `GET /api/move/videos/:mediaId`
- **功能**: 获取指定收藏夹前N个视频（按收藏时间倒序）
- **参数**: `mediaId` - 收藏夹ID
- **查询参数**: `count` - 获取的视频数量

#### 执行视频移动
- **URL**: `POST /api/move/execute`
- **功能**: 将视频从源收藏夹移动到目标收藏夹
- **请求体**:
```json
{
  "srcMediaId": "源收藏夹ID",
  "tarMediaId": "目标收藏夹ID"
}
```
- **Bilibili API**: `POST https://api.bilibili.com/x/v3/fav/resource/move`

---

### 6. 排序接口 (`/api/sort`)

#### 获取可排序的收藏夹列表
- **URL**: `GET /api/sort/folders`
- **功能**: 获取用户所有的收藏夹列表，用于排序
- **Bilibili API**: `GET https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid={uid}`

#### 执行收藏夹排序
- **URL**: `POST /api/sort/execute`
- **功能**: 按照指定的顺序重新排列收藏夹
- **请求体**:
```json
{
  "folderIds": ["收藏夹ID1", "收藏夹ID2"]
}
```
- **规则**: 默认收藏夹必须在第一位（如果存在）
- **Bilibili API**: `POST https://api.bilibili.com/x/v3/fav/folder/sort`

---

## Bilibili 原始 API 接口

### 1. 收藏夹列表获取

#### 获取所有创建的收藏夹
- **URL**: `GET https://api.bilibili.com/x/v3/fav/folder/created/list-all`
- **方法**: GET

**请求参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `up_mid` | string | ✅ | 用户UID，即B站用户唯一标识 |

**请求头要求**:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
Referer: https://www.bilibili.com/
Origin: https://www.bilibili.com
Cookie: [用户完整Cookie]
```

**响应字段详解**:
```json
{
  "code": 0,
  "message": "0",
  "ttl": 1,
  "data": {
    "count": 62, //一个多少个收藏夹
    "list": [
      {
        "id": 1234567890,           // 收藏夹ID（media_id）
        "fid": 12345678,          // 文件夹ID，观察到是id去掉后2位数字,比如id是1234567890，fid是12345678
        "mid": 98765432,          // 收藏夹创建者UID
        "title": "我的收藏夹",   // 收藏夹标题
        "attr": 0,              // 属性：0-默认收藏夹，2或者22-普通收藏夹，3-私密收藏夹
        "fav_state": 0,             // 状态：0-正常，1-删除
        "media_count": 100,     // 收藏夹内视频数量
      },
      {
        "id": 1296746589,
        "fid": 12967465,
        "mid": 35291489,
        "attr": 22,
        "title": "😍姐姐仔 I",
        "fav_state": 0,
        "media_count": 999
      }
    ],
    "season": null
  }
}
```

### 2. 收藏夹内容获取

#### 获取收藏夹资源列表
- **URL**: `GET https://api.bilibili.com/x/v3/fav/resource/list`
- **方法**: GET

**请求参数详解**:
| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `media_id` | number | ✅ | - | 收藏夹ID |
| `pn` | number | ❌ | 1 | 页码，从1开始 |
| `ps` | number | ❌ | 40 | 每页数量，最大40 |
| `keyword` | string | ❌ | "" | 搜索关键词，支持标题和UP主搜索 |
| `order` | string | ❌ | "mtime" | 排序方式：mtime-最近收藏，pubtime-最近投稿，view-最多播放 |
| `type` | number | ❌ | 0 | 0-在当前收藏夹中搜索，1-在全部收藏夹中搜索 |
| `tid` | number | ❌ | 0 | ？ |
| `platform` | string | ❌ | "web" | 平台标识 |
| `web_location` | string | ❌ | "333.1387" | 网页位置标识符 |

**请求头要求**:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
Referer: https://www.bilibili.com/
Origin: https://www.bilibili.com
Cookie: [用户完整Cookie]
```

**响应字段详解**:
```json
{
  "code": 0,
  "message": "0",
  "ttl": 1,
  "data": {
    "info": {
      "id": 3120664789, // 收藏夹ID
      "fid": 31206647, // 文件夹ID，观察到是id去掉后2位数字
      "mid": 35291489, // 收藏夹创建者UID
      "attr": 3, // 收藏夹类型
      "title": "人,哲学,政治,社会", // 收藏夹标题
      "cover": "http://i2.hdslb.com/bfs/archive/6b6a2ac6c7fbae2b9ad140e830dc15aa4ae5b6b5.jpg", // 收藏夹封面，如果没有手动设置，默认为收藏夹第一个视频的封面
      "upper": {
        "mid": 35291489, //  用户UID
        "name": "千夜の詩", // 用户昵称
        "face": "https://i2.hdslb.com/bfs/face/d9eb65858b67558cec4520b08a4a6eaa02cfba8f.jpg", // 用户头像地址
        "followed": false,
        "vip_type": 2, // 1大会员 2年度大会员
        "vip_statue": 1 // 大会员状态 1是 0否
      },
      "cover_type": 2,
      "cnt_info": {
        "collect": 0,
        "play": 0,
        "thumb_up": 0,
        "share": 0
      },
      "type": 11,
      "intro": "",
      "ctime": 1713105444,
      "mtime": 1724399325,
      "state": 0,
      "fav_state": 0,
      "like_state": 0,
      "media_count": 82,
      "is_top": false
    },
    "medias": [
      {
        "id": 115462914445096, // 视频BV号对应的数字ID
        "type": 2, 
        "title": "1小时40分钟会谈，美国三次让步，到底都谈了什么",// 视频标题
        "cover": "http://i1.hdslb.com/bfs/archive/60c8f34b6445920e895c6b0c2e601a88ddeec552.jpg", // 视频封面图片
        "intro": "",// 视频简介
        "page": 1,
        "duration": 655,// 视频时长（秒
        "upper": {
          "mid": 2495818,
          "name": "江平舟",
          "face": "https://i1.hdslb.com/bfs/face/b251cdccf2ec14f453f5d1e07248d48aa0c23204.jpg",
          "jump_link": ""
        },
        "attr": 0,
        "cnt_info": {
          "collect": 7849,
          "play": 1399656,
          "danmaku": 5111,
          "vt": 0,
          "play_switch": 0,
          "reply": 0,
          "view_text_1": "139.9万"
        },
        "link": "bilibili://video/115462914445096",
        "ctime": 1761824347,
        "pubtime": 1761824347,// 发布时间戳
        "fav_time": 1761840565,// 收藏时间戳
        "bv_id": "BV1WeyYB5ENH",// 视频BV号
        "bvid": "BV1WeyYB5ENH",// 视频BV号
        "season": null,
        "ogv": null,
        "ugc": {
          "first_cid": 33530709358
        },
        "media_list_link": "bilibili://music/playlist/playpage/3155956189?page_type=3&oid=115462914445096&otype=2"
      },
    ],
    "has_more": true,
    "ttl": 1762661206
  }
}
```

### 3. 收藏夹清理

#### 清理失效资源
- **文件位置**: [clean.js:21](new/backend/routes/clean.js#L21)
- **URL**: `POST https://api.bilibili.com/x/v3/fav/resource/clean`
- **方法**: POST

**请求参数详解**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `media_id` | number | ✅ | 收藏夹ID |
| `platform` | string | ✅ | 固定值："web" |
| `csrf` | string | ✅ | CSRF令牌，从Cookie中的bili_jct获取 |

**请求头要求**:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
Referer: https://www.bilibili.com/
Origin: https://www.bilibili.com
Cookie: [用户完整Cookie，必须包含bili_jct]
Content-Type: application/x-www-form-urlencoded
```

**POST 请求体格式**:
```
media_id=123456&platform=web&csrf=abc123def456
```

**响应字段详解**:
```json
{
  "code": 0,                    // 状态码：0-成功，非0-失败
  "message": "success",         // 状态消息
  "data": 5                     // 清理的失效资源数量
}
```

**常见错误响应**:
```json
{
  "code": -111,                 // 错误代码：-111表示csrf校验失败
  "message": "csrf校验失败"      // 错误信息
}
```

### 4. 收藏夹移动

#### 移动视频到其他收藏夹
- **URL**: `POST https://api.bilibili.com/x/v3/fav/resource/move`
- **方法**: POST

**请求参数详解**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `resources` | string | ✅ | 资源列表，格式：`视频ID1:2,视频ID2:2`（ID:类型，视频类型为2） |
| `src_media_id` | number | ✅ | 源收藏夹ID |
| `tar_media_id` | number | ✅ | 目标收藏夹ID |
| `mid` | string | ✅ | 用户UID |
| `platform` | string | ✅ | 固定值："web" |
| `csrf` | string | ✅ | CSRF令牌，从Cookie中的bili_jct获取 |

**请求头要求**:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
Referer: https://www.bilibili.com/
Origin: https://www.bilibili.com
Cookie: [用户完整Cookie，必须包含bili_jct]
Content-Type: application/x-www-form-urlencoded
```

**POST 请求体示例**:
```
resources=987654321:2,123456789:2&src_media_id=111111&tar_media_id=222222&mid=123456789&platform=web&csrf=abc123def456
```

**resources 参数格式说明**:
- 单个资源：`视频ID:2`（2 表示视频类型）
- 多个资源：`视频ID1:2,视频ID2:2,视频ID3:2`（用逗号分隔）
- 示例：`987654321:2,123456789:2` 表示移动两个视频

**响应字段详解**:
```json
{
  "code": 0,                    // 状态码：0-成功，非0-失败
  "message": "success",         // 状态消息
  "ttl": 1,
  "data": 0                    // 0表示成功
}
```

**限制说明**:
- 每个收藏夹最多容纳 1000 个视频
- 移动前需要检查目标收藏夹容量
- 一次移动 20 个资源（建议值）最多40

### 5. 收藏夹排序

#### 排序收藏夹
- **URL**: `POST https://api.bilibili.com/x/v3/fav/folder/sort`
- **方法**: POST

**请求参数详解**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `sort` | string | ✅ | 收藏夹ID排序列表，用逗号分隔 |
| `csrf` | string | ✅ | CSRF令牌，从Cookie中的bili_jct获取 |

**请求头要求**:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36
Referer: https://space.bilibili.com/[用户UID]/favlist
Origin: https://space.bilibili.com
Cookie: [用户完整Cookie，必须包含bili_jct]
Content-Type: application/x-www-form-urlencoded
Accept: application/json, text/plain, */*
Accept-Language: zh-CN,zh-HK;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6
Priority: u=1, i
Sec-Ch-Ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "Windows"
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-site
```

**POST 请求体示例**:
```
sort=111111,222222,333333&csrf=abc123def456
```

**sort 参数格式说明**:
- 收藏夹ID按目标排序顺序排列，用逗号分隔
- 默认收藏夹必须排在第一位（如果存在）
- 示例：原来是`222222,111111,333333` 改成 `111111,222222,333333` 表示按`111111,222222,333333`的顺序排列三个收藏夹

**响应字段详解**:
```json
{
  "code": 0,                    // 状态码：0-成功，非0-失败
  "message": "success",         // 状态消息
  "ttl": 1,
  "data": {}                    // 空对象表示排序成功
}
```

**排序规则说明**:
- 默认收藏夹（attr=0）必须位于第一位
- 用户创建的收藏夹可以任意排序
- 一次排序最多支持 20 个收藏夹
- 排序后立即生效，前端需要重新获取列表

**常见错误响应**:
```json
{
  "code": -111,                 // 错误代码：-111表示csrf校验失败
  "message": "csrf校验失败"      // 错误信息
}
```

```json
{
  "code": -101,                 // 错误代码：-101表示未登录
  "message": "账号未登录"         // 错误信息
}
```

---

## 通用请求头信息

### 所有 Bilibili API 调用都需要包含以下通用请求头：

```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
Referer: https://www.bilibili.com/
Origin: https://www.bilibili.com
Cookie: [完整的用户Cookie]
```

### 对于某些特定接口，还可能需要额外的请求头：

```
Accept: application/json, text/plain, */*
Accept-Language: zh-CN,zh-HK;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6
Priority: u=1, i
Sec-Ch-Ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "Windows"
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-site
```

---

## 错误处理说明

### Bilibili API 标准响应格式：

```json
{
  "code": 0,                    // int, 状态码：0-成功，负数-错误，正数-警告
  "message": "success",         // string, 状态消息描述
  "data": {}                    // object/array/string/number, 实际数据内容
}
```

**响应字段详解**:
- `code`: 状态码
  - `0`: 操作成功
  - `-101`: 账号未登录或Cookie失效
  - `-111`: csrf校验失败，通常是由于bili_jct令牌错误或过期
  - `-112`: 访问权限不足，可能无权访问该收藏夹
  - `-113`: 账号被封禁
  - `-404`: 资源不存在，收藏夹ID或视频ID无效
  - `-400`: 请求参数错误，参数格式或值不正确
  - `-500`: B站服务器内部错误
  - `-509`: 请求过于频繁，被限流

- `message`: 状态消息，提供错误或成功的详细信息
- `data`: 响应数据，根据不同的API返回不同的数据结构

### 通用错误处理策略：

#### 1. 认证相关错误 (-101, -111)
```json
{
  "code": -101,
  "message": "账号未登录",
  "data": null
}
```

**处理建议**:
- 检查Cookie是否过期
- 重新登录获取新的Cookie
- 验证SESSDATA是否有效

```json
{
  "code": -111,
  "message": "csrf校验失败",
  "data": null
}
```

**处理建议**:
- 从Cookie中重新提取bili_jct值
- 检查Cookie格式是否正确
- 确保所有POST请求都包含csrf参数

#### 2. 权限相关错误 (-112)
```json
{
  "code": -112,
  "message": "访问权限不足",
  "data": null
}
```

**处理建议**:
- 确认是否有该收藏夹的访问权限
- 检查收藏夹是否为私密收藏夹
- 验证用户身份是否正确

#### 3. 参数相关错误 (-400, -404)
```json
{
  "code": -400,
  "message": "请求参数错误",
  "data": null
}
```

**处理建议**:
- 检查所有必需参数是否提供
- 验证参数类型和格式是否正确
- 确认参数值是否在有效范围内

```json
{
  "code": -404,
  "message": "资源不存在",
  "data": null
}
```

**处理建议**:
- 验证media_id是否有效
- 检查收藏夹是否已删除
- 确认视频ID是否存在

### HTTP 状态码对应关系：

| HTTP状态码 | B站API code | 说明 |
|-----------|-------------|------|
| 200 | 0 | 请求成功 |
| 200 | -101 ~ -113 | 业务错误，但HTTP请求成功 |
| 400 | -400 | 请求参数错误 |
| 401 | -101 | 未认证 |
| 403 | -112 | 权限不足 |
| 404 | -404 | 资源不存在 |
| 429 | -509 | 请求过于频繁 |
| 500 | -500 | 服务器内部错误 |

### 本地后端错误响应格式：

```json
{
  "success": false,             // boolean, 操作是否成功
  "error": "错误描述信息"        // string, 本地后端返回的错误信息
}
```

**常见本地后端错误**:
- 配置缺失错误
- Cookie验证失败
- 参数验证错误
- 网络请求超时
- 数据解析失败

### 建议的错误处理流程：

1. **首先检查HTTP状态码**
2. **解析B站API响应中的code字段**
3. **根据不同错误类型采取相应措施**
4. **记录错误日志用于调试**
5. **向用户显示友好的错误提示**

---

### 6. QR 码登录

#### 生成登录二维码
- **URL**: `GET https://api.bilibili.com/x/passport-login/web/qrcode/generate`
- **方法**: GET

**请求头要求**:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
Referer: https://www.bilibili.com/
Origin: https://www.bilibili.com
```

**响应字段详解**:
```json
{
  "code": 0,
  "message": "0",
  "data": {
    "url": "https://passport.bilibili.com/h5-app/passport/login/scan?navhide=1&qrcode_key=xxx",
    "qrcode_key": "xxx"
  }
}
```

**说明**: 前端使用 `url` 字段生成二维码图片，使用 `qrcode_key` 轮询扫码状态。

#### 轮询扫码状态
- **URL**: `GET https://api.bilibili.com/x/passport-login/web/qrcode/poll`
- **方法**: GET

**请求参数**:
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `qrcode_key` | string | ✅ | 生成二维码时返回的 key |

**请求头要求**:
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36
Referer: https://www.bilibili.com/
Origin: https://www.bilibili.com
```

**响应字段详解**:
```json
{
  "code": 0,
  "message": "0",
  "data": {
    "code": 86101,
    "message": "未扫码",
    "url": ""
  }
}
```

**data.code 状态码说明**:
| 状态码 | 含义 |
|--------|------|
| 86101 | 未扫码 |
| 86090 | 已扫码，等待确认 |
| 86038 | 二维码已失效 |
| 0 | 登录成功，`url` 中包含 Cookie 信息 |

**登录成功时**: 响应头 `Set-Cookie` 中会包含 `SESSDATA`、`bili_jct`、`DedeUserID` 等关键 Cookie。

---

## TypeScript 类型定义

```typescript
// B站 API 标准响应
interface BilibiliResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// 本地 API 标准响应
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 收藏夹信息
interface FavoriteFolder {
  id: number;           // 收藏夹ID（media_id）
  fid: number;          // 文件夹ID
  mid: number;          // 创建者UID
  attr: number;         // 属性：0-默认，2/22-普通，3-私密
  title: string;        // 收藏夹标题
  fav_state: number;    // 状态：0-正常，1-删除
  media_count: number;  // 视频数量
}

// 收藏夹详情中的视频
interface FavoriteVideo {
  id: number;           // 视频数字ID
  type: number;         // 类型（2=视频）
  title: string;        // 标题
  cover: string;        // 封面URL
  duration: number;     // 时长（秒）
  upper: {
    mid: number;        // UP主UID
    name: string;       // UP主昵称
    face: string;       // 头像URL
  };
  bv_id: string;        // BV号
  bvid: string;         // BV号（同上）
  fav_time: number;     // 收藏时间戳
  pubtime: number;      // 发布时间戳
  ctime: number;        // 创建时间戳
}

// 收藏夹详情响应
interface FavoriteDetail {
  info: {
    id: number;
    title: string;
    media_count: number;
    attr: number;
    upper: {
      mid: number;
      name: string;
      face: string;
    };
  };
  medias: FavoriteVideo[];
  has_more: boolean;
}

// 用户配置
interface UserConfig {
  up_mid: string;       // 用户UID
  csrf_token: string;   // CSRF令牌（bili_jct）
  cookie: string;       // 完整Cookie字符串
}
```

---

## 排序接口特别说明

排序接口的请求头与其他接口**不同**，注意区分：

| 接口 | Referer | Origin |
|------|---------|--------|
| 收藏夹列表、内容、清理、移动 | `https://www.bilibili.com/` | `https://www.bilibili.com` |
| **收藏夹排序** | `https://space.bilibili.com/{uid}/favlist` | `https://space.bilibili.com` |

排序接口需要额外包含以下请求头：
```
Accept: application/json, text/plain, */*
Accept-Language: zh-CN,zh-HK;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-site
```

---

## 重要说明

1. **认证要求**: 所有 Bilibili API 调用都需要有效的用户 Cookie
2. **CSRF 保护**: 涉及数据修改的操作需要提供 CSRF token (bili_jct)
3. **频率限制**: 建议控制 API 调用频率，避免被限制
4. **数据安全**: Cookie 包含敏感信息，请妥善保管
5. **收藏夹限制**: 每个收藏夹最多可容纳 1000 个视频
6. **请求头差异**: 排序接口使用 `space.bilibili.com` 作为 Referer/Origin，其他接口使用 `www.bilibili.com`

---

*本文档基于 bilibili-favorites-cleaner 项目全版本分析生成，最后更新时间：2026年4月3日*