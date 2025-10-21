#!/usr/bin/env node

const https = require('https');
const querystring = require('querystring');
const fs = require('fs');

/**
 * 哔哩哔哩收藏夹失效内容清理工具
 * 一键清理所有收藏夹中的失效内容
 */

// 配置文件路径
const CONFIG_FILE = 'config.json';

// 默认配置
const DEFAULT_CONFIG = {
    up_mid: "35291489",
    csrf_token: "6dbe786df983c8e75f7c51b53580b786",
    cookie: "SESSDATA=your_sessdata_here; bili_jct=6dbe786df983c8e75f7c51b53580b786; DedeUserID=35291489"
};

/**
 * 读取配置文件
 */
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
            const config = JSON.parse(configData);
            
            // 检查配置是否完整
            if (!config.up_mid || !config.csrf_token || !config.cookie) {
                console.log('❌ 配置文件不完整，请使用Cookie获取助手重新配置');
                console.log('运行命令: node cookie_helper.js');
                return null;
            }
            
            // 检查Cookie是否包含必要字段
            if (!config.cookie.includes('SESSDATA') || !config.cookie.includes('bili_jct') || !config.cookie.includes('DedeUserID')) {
                console.log('❌ Cookie格式不正确，请使用Cookie获取助手重新配置');
                console.log('运行命令: node cookie_helper.js');
                return null;
            }
            
            return config;
        } else {
            // 创建默认配置文件
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
            console.log(`❌ 未找到配置文件 ${CONFIG_FILE}`);
            console.log('请使用Cookie获取助手进行配置:');
            console.log('运行命令: node cookie_helper.js');
            console.log('\n或者手动编辑配置文件，填入正确的Cookie信息');
            return null;
        }
    } catch (error) {
        console.error(`读取配置文件失败: ${error.message}`);
        console.log('请使用Cookie获取助手重新配置: node cookie_helper.js');
        return null;
    }
}

/**
 * 发送HTTPS请求
 * @param {string} url - 请求URL
 * @param {string} method - 请求方法
 * @param {string} data - POST数据
 * @param {Object} headers - 请求头
 * @returns {Promise} 返回Promise对象
 */
function makeRequest(url, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            headers: headers
        };

        const req = https.request(url, options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`JSON解析失败: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`请求失败: ${error.message}`));
        });

        if (data && method === 'POST') {
            req.write(data);
        }

        req.end();
    });
}

/**
 * 获取收藏夹列表
 * @param {Object} config - 配置对象
 * @returns {Promise<Array>} 收藏夹列表
 */
async function getFavoriteFolders(config) {
    try {
        const url = `https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${config.up_mid}`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.bilibili.com/',
            'Origin': 'https://www.bilibili.com',
            'Cookie': config.cookie
        };

        const data = await makeRequest(url, 'GET', null, headers);

        if (data.code !== 0) {
            throw new Error(`获取收藏夹失败: ${data.message}`);
        }

        return data.data.list || [];
    } catch (error) {
        console.error(`获取收藏夹列表失败: ${error.message}`);
        return null;
    }
}

/**
 * 清理指定收藏夹的失效内容
 * @param {string} mediaId - 收藏夹ID
 * @param {Object} config - 配置对象
 * @returns {Promise} 清理操作结果
 */
async function cleanFavoriteFolder(mediaId, config) {
    try {
        const postData = querystring.stringify({
            media_id: mediaId,
            platform: 'web',
            csrf: config.csrf_token
        });

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.bilibili.com/',
            'Origin': 'https://www.bilibili.com',
            'Cookie': config.cookie,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        };

        return new Promise((resolve, reject) => {
            const req = https.request('https://api.bilibili.com/x/v3/fav/resource/clean', {
                method: 'POST',
                headers: headers
            }, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(responseData);
                        if (jsonData.code === 0) {
                            resolve();
                        } else {
                            reject(new Error(`清理失败: ${jsonData.message}`));
                        }
                    } catch (error) {
                        reject(new Error(`JSON解析失败: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`请求失败: ${error.message}`));
            });

            req.write(postData);
            req.end();
        });
    } catch (error) {
        console.error(`清理收藏夹 ${mediaId} 失败: ${error.message}`);
        throw error;
    }
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 清理所有收藏夹的失效内容
 */
async function cleanAllFavorites() {
    console.log('=== 哔哩哔哩收藏夹失效内容清理工具 ===');

    // 加载配置
    const config = loadConfig();
    if (!config) {
        console.log('\n请按照以下步骤配置Cookie信息：');
        console.log('1. 打开浏览器，登录哔哩哔哩');
        console.log('2. 按F12打开开发者工具');
        console.log('3. 切换到Network标签');
        console.log('4. 刷新页面');
        console.log('5. 找到任意一个bilibili.com的请求，查看Request Headers');
        console.log('6. 复制完整的Cookie值');
        console.log('7. 编辑config.json文件，将Cookie填入');
        console.log('8. 重新运行程序');
        return;
    }

    console.log(`用户ID: ${config.up_mid}`);
    console.log('开始获取收藏夹列表...');

    // 获取收藏夹列表
    const folders = await getFavoriteFolders(config);
    if (!folders) {
        console.log('无法获取收藏夹列表，程序终止');
        return;
    }

    console.log(`获取到 ${folders.length} 个收藏夹`);

    // 清理每个收藏夹
    let successCount = 0;
    let failedCount = 0;

    for (const folder of folders) {
        const folderId = folder.id;
        const folderTitle = folder.title || '未知收藏夹';
        const mediaCount = folder.media_count || 0;

        console.log(`\n正在清理收藏夹: ${folderTitle} (ID: ${folderId}, 视频数: ${mediaCount})`);

        try {
            await cleanFavoriteFolder(folderId, config);
            console.log(`✓ 清理完成`);
            successCount++;
        } catch (error) {
            console.log(`✗ 清理失败: ${error.message}`);
            failedCount++;
        }

        // 添加延迟避免请求过快
        await sleep(1000);
    }

    console.log('\n=== 清理完成 ===');
    console.log(`成功清理: ${successCount} 个收藏夹`);
    console.log(`清理失败: ${failedCount} 个收藏夹`);
}

// 主函数
async function main() {
    try {
        await cleanAllFavorites();
    } catch (error) {
        console.error(`\n程序运行出错: ${error.message}`);
        process.exit(1);
    }
}

// 处理程序中断
process.on('SIGINT', () => {
    console.log('\n\n程序被用户中断');
    process.exit(0);
});

// 运行主函数
main();