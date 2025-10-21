#!/usr/bin/env node

const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const readline = require('readline');
const { exec, spawn } = require('child_process');
const os = require('os');

/**
 * 哔哩哔哩Cookie获取助手
 * 提供多种方式获取Cookie信息
 */

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * 备用浏览器打开方法
 */
function openUrlFallback(url) {
    console.log('尝试备用方法打开浏览器...');
    
    // 尝试使用不同的方法打开浏览器
    const methods = [
        // Windows方法
        () => {
            if (process.platform === 'win32') {
                return spawn('cmd', ['/c', 'start', '', url], { detached: true });
            }
            return null;
        },
        // macOS方法
        () => {
            if (process.platform === 'darwin') {
                return spawn('open', [url], { detached: true });
            }
            return null;
        },
        // Linux方法
        () => {
            if (process.platform !== 'win32' && process.platform !== 'darwin') {
                return spawn('xdg-open', [url], { detached: true });
            }
            return null;
        },
        // 通用方法 - 使用PowerShell (Windows)
        () => {
            if (process.platform === 'win32') {
                return spawn('powershell', ['-Command', `Start-Process "${url}"`], { detached: true });
            }
            return null;
        }
    ];
    
    for (const method of methods) {
        try {
            const child = method();
            if (child) {
                child.unref();
                console.log('✅ 使用备用方法成功打开浏览器');
                return true;
            }
        } catch (error) {
            console.log('备用方法失败:', error.message);
        }
    }
    
    return false;
}

/**
 * 显示菜单
 */
function showMenu() {
    console.log('\n=== 哔哩哔哩Cookie获取助手 ===');
    console.log('请选择获取Cookie的方式：');
    console.log('1. 打开哔哩哔哩登录页面（手动获取）');
    console.log('2. 使用在线二维码登录工具');
    console.log('3. 手动输入Cookie');
    console.log('4. 查看当前配置');
    console.log('5. 退出');
}

/**
 * 打开哔哩哔哩登录页面
 */
function openBilibiliLogin() {
    console.log('\n正在打开哔哩哔哩登录页面...');
    
    // 根据操作系统打开浏览器
    const url = 'https://passport.bilibili.com/login';
    let command;
    
    if (process.platform === 'darwin') { // macOS
        command = `open "${url}"`;
    } else if (process.platform === 'win32') { // Windows
        command = `cmd /c start "" "${url}"`;
    } else { // Linux
        command = `xdg-open "${url}"`;
    }
    
    console.log('正在执行命令:', command);
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log('主要方法失败，错误信息:', error.message);
            console.log('尝试备用方法...');
            
            const fallbackSuccess = openUrlFallback(url);
            if (!fallbackSuccess) {
                console.log('❌ 所有自动打开方法都失败了');
                console.log('请手动访问：', url);
                console.log('或者复制以下链接到浏览器地址栏：');
                console.log(url);
            }
        } else {
            console.log('✅ 已打开浏览器，请登录后按回车继续...');
            console.log('如果浏览器没有自动打开，请手动访问：', url);
        }
        
        rl.question('\n按回车键继续...', () => {
            showManualCookieInstructions();
        });
    });
}

/**
 * 显示手动获取Cookie的说明
 */
function showManualCookieInstructions() {
    console.log('\n=== 手动获取Cookie步骤 ===');
    console.log('1. 在已登录的页面按F12打开开发者工具');
    console.log('2. 切换到Network标签');
    console.log('3. 刷新页面或随便点击一个链接');
    console.log('4. 找到任意一个bilibili.com的请求');
    console.log('5. 查看Request Headers中的Cookie字段');
    console.log('6. 复制完整的Cookie值');
    
    rl.question('\n请输入Cookie值（或输入back返回菜单）: ', (cookie) => {
        if (cookie.toLowerCase() === 'back') {
            main();
            return;
        }
        
        if (cookie && cookie.includes('SESSDATA')) {
            saveCookie(cookie);
        } else {
            console.log('❌ Cookie格式不正确，请确保包含SESSDATA');
            showManualCookieInstructions();
        }
    });
}

/**
 * 使用在线二维码登录工具
 */
function useOnlineQRTool() {
    console.log('\n=== 在线二维码登录工具 ===');
    console.log('推荐使用以下在线工具：');
    console.log('https://login.bilibili.bi/ - 专门的B站Cookie获取工具');
    
    rl.question('\n选择工具 1 或输入 2 返回菜单: ', (choice) => {
        if (choice.toLowerCase() === 'back') {
            main();
            return;
        }
        
        let url;
        if (choice === '1') {
            url = 'https://login.bilibili.bi/';
        } else {
            console.log('❌ 无效选择');
            useOnlineQRTool();
            return;
        }
        
        let command;
        if (process.platform === 'darwin') {
            command = `open "${url}"`;
        } else if (process.platform === 'win32') {
            command = `cmd /c start "" "${url}"`;
        } else {
            command = `xdg-open "${url}"`;
        }
        
        console.log('正在执行命令:', command);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log('主要方法失败，错误信息:', error.message);
                console.log('尝试备用方法...');
                
                const fallbackSuccess = openUrlFallback(url);
                if (!fallbackSuccess) {
                    console.log('❌ 所有自动打开方法都失败了');
                    console.log('请手动访问：', url);
                    console.log('或者复制以下链接到浏览器地址栏：');
                    console.log(url);
                }
            } else {
                console.log('✅ 已打开工具页面，请扫码登录后复制Cookie');
                console.log('如果浏览器没有自动打开，请手动访问：', url);
            }
            
            rl.question('\n请输入获取到的Cookie值（或输入back返回菜单）: ', (cookie) => {
                if (cookie.toLowerCase() === 'back') {
                    main();
                    return;
                }
                
                if (cookie && cookie.includes('SESSDATA')) {
                    saveCookie(cookie);
                } else {
                    console.log('❌ Cookie格式不正确，请确保包含SESSDATA');
                    useOnlineQRTool();
                }
            });
        });
    });
}

/**
 * 手动输入Cookie
 */
function manualInputCookie() {
    console.log('\n=== 手动输入Cookie ===');
    console.log('请输入完整的Cookie字符串，应包含：');
    console.log('- SESSDATA');
    console.log('- bili_jct');
    console.log('- DedeUserID');
    
    rl.question('\nCookie值（或输入back返回菜单）: ', (cookie) => {
        if (cookie.toLowerCase() === 'back') {
            main();
            return;
        }
        
        if (cookie && cookie.includes('SESSDATA')) {
            saveCookie(cookie);
        } else {
            console.log('❌ Cookie格式不正确，请确保包含SESSDATA');
            manualInputCookie();
        }
    });
}

/**
 * 解析Cookie并保存到配置文件
 */
function saveCookie(cookieString) {
    try {
        // 解析Cookie
        const cookies = {};
        cookieString.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = value;
            }
        });
        
        // 提取必要字段
        const sessdata = cookies.SESSDATA;
        const biliJct = cookies.bili_jct;
        const dedeUserID = cookies.DedeUserID;
        
        if (!sessdata || !biliJct || !dedeUserID) {
            console.log('❌ Cookie缺少必要字段，请确保包含SESSDATA、bili_jct、DedeUserID');
            return;
        }
        
        // 读取现有配置
        let config = {};
        if (fs.existsSync('config.json')) {
            config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        }
        
        // 更新配置
        config.up_mid = dedeUserID;
        config.csrf_token = biliJct;
        config.cookie = cookieString;
        
        // 保存配置
        fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
        
        console.log('\n✅ Cookie保存成功！');
        console.log(`用户ID: ${dedeUserID}`);
        console.log('现在可以运行收藏夹清理工具了。');
        
        rl.question('\n按回车键返回主菜单...', () => {
            main();
        });
        
    } catch (error) {
        console.log('❌ 保存Cookie失败:', error.message);
        main();
    }
}

/**
 * 查看当前配置
 */
function showCurrentConfig() {
    try {
        if (fs.existsSync('config.json')) {
            const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
            console.log('\n=== 当前配置 ===');
            console.log(`用户ID: ${config.up_mid || '未设置'}`);
            console.log(`CSRF令牌: ${config.csrf_token ? '已设置' : '未设置'}`);
            console.log(`Cookie: ${config.cookie ? '已设置' : '未设置'}`);
            
            // 检查Cookie是否包含必要字段
            if (config.cookie) {
                const hasSessdata = config.cookie.includes('SESSDATA');
                const hasBiliJct = config.cookie.includes('bili_jct');
                const hasDedeUserID = config.cookie.includes('DedeUserID');
                
                console.log('\nCookie完整性检查：');
                console.log(`SESSDATA: ${hasSessdata ? '✅' : '❌'}`);
                console.log(`bili_jct: ${hasBiliJct ? '✅' : '❌'}`);
                console.log(`DedeUserID: ${hasDedeUserID ? '✅' : '❌'}`);
                
                if (hasSessdata && hasBiliJct && hasDedeUserID) {
                    console.log('\n✅ 配置完整，可以使用收藏夹清理工具');
                } else {
                    console.log('\n❌ 配置不完整，请重新获取Cookie');
                }
            }
        } else {
            console.log('\n❌ 未找到配置文件，请先获取Cookie');
        }
    } catch (error) {
        console.log('\n❌ 读取配置文件失败:', error.message);
    }
    
    rl.question('\n按回车键返回主菜单...', () => {
        main();
    });
}

/**
 * 主函数
 */
function main() {
    showMenu();
    
    rl.question('\n请输入选择 (1-5): ', (choice) => {
        switch (choice) {
            case '1':
                openBilibiliLogin();
                break;
            case '2':
                useOnlineQRTool();
                break;
            case '3':
                manualInputCookie();
                break;
            case '4':
                showCurrentConfig();
                break;
            case '5':
                console.log('\n再见！');
                rl.close();
                process.exit(0);
                break;
            default:
                console.log('❌ 无效选择，请重新输入');
                main();
        }
    });
}

// 处理程序中断
process.on('SIGINT', () => {
    console.log('\n\n程序被用户中断');
    rl.close();
    process.exit(0);
});

// 启动程序
if (require.main === module) {
    main();
}

module.exports = {
    saveCookie,
    showCurrentConfig
};