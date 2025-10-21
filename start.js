#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');
const readline = require('readline');

/**
 * 哔哩哔哩收藏夹清理工具启动器
 * 提供友好的启动界面和配置检查
 */

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * 检查配置文件状态
 */
function checkConfigStatus() {
    try {
        if (!fs.existsSync('config.json')) {
            return 'missing';
        }
        
        const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        
        if (!config.up_mid || !config.csrf_token || !config.cookie) {
            return 'incomplete';
        }
        
        if (!config.cookie.includes('SESSDATA') || !config.cookie.includes('bili_jct') || !config.cookie.includes('DedeUserID')) {
            return 'invalid';
        }
        
        return 'valid';
    } catch (error) {
        return 'error';
    }
}

/**
 * 显示欢迎信息
 */
function showWelcome() {
    console.log('\n=== 哔哩哔哩收藏夹清理工具 ===');
    console.log('版本: 2.0');
    console.log('功能: 一键清理所有收藏夹中的失效内容');
}

/**
 * 显示主菜单
 */
function showMenu() {
    const configStatus = checkConfigStatus();
    
    console.log('\n=== 主菜单 ===');
    
    // 显示配置状态
    switch (configStatus) {
        case 'valid':
            console.log('✅ 配置状态: 已配置，可以使用');
            break;
        case 'missing':
            console.log('❌ 配置状态: 未找到配置文件');
            break;
        case 'incomplete':
            console.log('❌ 配置状态: 配置不完整');
            break;
        case 'invalid':
            console.log('❌ 配置状态: Cookie格式不正确');
            break;
        case 'error':
            console.log('❌ 配置状态: 配置文件读取失败');
            break;
    }
    
    console.log('\n请选择操作：');
    console.log('1. 开始清理收藏夹');
    console.log('2. 配置Cookie信息');
    console.log('3. 查看当前配置');
    console.log('4. 查看使用说明');
    console.log('5. 退出');
}

/**
 * 开始清理收藏夹
 */
function startCleaning() {
    const configStatus = checkConfigStatus();
    
    if (configStatus !== 'valid') {
        console.log('\n❌ 配置无效，请先配置Cookie信息');
        rl.question('按回车键继续...', () => {
            main();
        });
        return;
    }
    
    console.log('\n正在启动收藏夹清理工具...');
    console.log('---');
    
    // 运行清理工具
    const child = exec('node bilibili_fav_cleaner_with_config.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`执行错误: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`错误输出: ${stderr}`);
            return;
        }
    });
    
    // 实时显示输出
    child.stdout.on('data', (data) => {
        process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
        process.stderr.write(data);
    });
    
    child.on('close', (code) => {
        console.log(`\n清理工具执行完成，退出码: ${code}`);
        rl.question('按回车键返回主菜单...', () => {
            main();
        });
    });
}

/**
 * 配置Cookie信息
 */
function configureCookie() {
    console.log('\n正在启动Cookie获取助手...');
    console.log('---');
    
    const child = exec('node cookie_helper.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`执行错误: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`错误输出: ${stderr}`);
            return;
        }
    });
    
    // 实时显示输出
    child.stdout.on('data', (data) => {
        process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
        process.stderr.write(data);
    });
    
    child.on('close', (code) => {
        console.log(`\nCookie获取助手执行完成，退出码: ${code}`);
        rl.question('按回车键返回主菜单...', () => {
            main();
        });
    });
}

/**
 * 查看当前配置
 */
function showCurrentConfig() {
    console.log('\n=== 当前配置 ===');
    
    const configStatus = checkConfigStatus();
    
    if (configStatus === 'missing') {
        console.log('❌ 未找到配置文件');
    } else if (configStatus === 'error') {
        console.log('❌ 配置文件读取失败');
    } else {
        try {
            const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
            console.log(`用户ID: ${config.up_mid || '未设置'}`);
            console.log(`CSRF令牌: ${config.csrf_token ? '已设置' : '未设置'}`);
            console.log(`Cookie: ${config.cookie ? '已设置' : '未设置'}`);
            
            if (config.cookie) {
                console.log('\nCookie完整性检查：');
                console.log(`SESSDATA: ${config.cookie.includes('SESSDATA') ? '✅' : '❌'}`);
                console.log(`bili_jct: ${config.cookie.includes('bili_jct') ? '✅' : '❌'}`);
                console.log(`DedeUserID: ${config.cookie.includes('DedeUserID') ? '✅' : '❌'}`);
            }
        } catch (error) {
            console.log('❌ 解析配置文件失败:', error.message);
        }
    }
    
    rl.question('\n按回车键返回主菜单...', () => {
        main();
    });
}

/**
 * 查看使用说明
 */
function showHelp() {
    console.log('\n=== 使用说明 ===');
    console.log('');
    console.log('1. 首次使用：');
    console.log('   - 选择"配置Cookie信息"获取登录凭证');
    console.log('   - 推荐使用二维码扫码登录，安全便捷');
    console.log('');
    console.log('2. 清理收藏夹：');
    console.log('   - 确保配置正确后选择"开始清理收藏夹"');
    console.log('   - 工具会自动获取所有收藏夹并清理失效内容');
    console.log('');
    console.log('3. 注意事项：');
    console.log('   - Cookie有效期有限，过期后需重新获取');
    console.log('   - 清理操作不可逆，请谨慎使用');
    console.log('   - 建议定期清理失效内容保持收藏夹整洁');
    console.log('');
    console.log('4. 文件说明：');
    console.log('   - start.js: 启动器（当前文件）');
    console.log('   - bilibili_fav_cleaner_with_config.js: 主清理工具');
    console.log('   - cookie_helper.js: Cookie获取助手');
    console.log('   - config.json: 配置文件');
    console.log('   - README.md: 详细说明文档');
    
    rl.question('\n按回车键返回主菜单...', () => {
        main();
    });
}

/**
 * 主函数
 */
function main() {
    showWelcome();
    showMenu();
    
    rl.question('\n请输入选择 (1-5): ', (choice) => {
        switch (choice) {
            case '1':
                startCleaning();
                break;
            case '2':
                configureCookie();
                break;
            case '3':
                showCurrentConfig();
                break;
            case '4':
                showHelp();
                break;
            case '5':
                console.log('\n感谢使用，再见！');
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