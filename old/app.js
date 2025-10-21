/**
 * 哔哩哔哩收藏夹清理工具 - 前端应用
 */

class BilibiliFavCleaner {
    constructor() {
        this.config = null;
        this.favorites = [];
        this.selectedFavorites = new Set();
        this.qrcodeKey = null;
        this.eventSource = null;
        this.isIframeOpen = false;
        this.originalCounts = new Map(); // 存储清理前的视频数量
        
        // 配置 - 使用线上服务和本地API
        this.SERVICE_URL = 'https://login.bilibili.bi';
        this.API_URL = '/api/convert-cookies';
        
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        this.bindEvents();
        this.bindBatchEvents();
        this.setupMessageListener();
        await this.checkConfig();
        this.showTab('login');
        
        // 自动显示iframe登录
        this.autoShowIframe();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 选项卡切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.showTab(tab);
            });
        });


        // Cookie展示和复制
        document.getElementById('copyCookieBtn').addEventListener('click', () => {
            this.copyCookie();
        });

        document.getElementById('refreshCookieBtn').addEventListener('click', () => {
            this.refreshCookie();
        });

        // 手动配置
        document.getElementById('manualConfigBtn').addEventListener('click', () => {
            this.toggleManualForm();
        });

        document.getElementById('saveCookieBtn').addEventListener('click', () => {
            this.saveManualCookie();
        });
    }

    /**
     * 设置消息监听器
     */
    setupMessageListener() {
        // 监听登录消息
        window.addEventListener('message', (event) => {
            // 验证消息来源（主要来自线上服务）
            if (event.origin !== this.SERVICE_URL) {
                console.warn('[App] 收到非预期来源的消息:', event.origin, '预期:', this.SERVICE_URL);
                return;
            }
            
            console.log('[App] 收到登录消息:', event.data);
            
            const { type, mode, data } = event.data;
            if (type === 'success') {
                this.showLoginStatus(`✅ ${mode}模式登录成功！Cookie已获取`, 'success');
                
                // 显示Cookie
                this.displayCookie(data);
                
                // 解析Cookie并保存配置
                this.extractAndSaveCookie(data);
                
                // 如果是iframe模式，2秒后自动关闭
                if (mode === 'iframe') {
                    setTimeout(() => {
                        const container = document.getElementById('iframeContainer');
                        container.style.display = 'none';
                        this.isIframeOpen = false;
                    }, 2000);
                }
            }
        });
    }

    /**
     * 提取并保存Cookie
     */
    async extractAndSaveCookie(cookieString) {
        try {
            // 解析Cookie获取用户信息
            const parsedCookies = this.parseCookieString(cookieString);
            const config = {
                up_mid: parsedCookies.DedeUserID,
                csrf_token: parsedCookies.bili_jct,
                cookie: cookieString
            };

            // 保存配置
            const response = await this.apiRequest('/api/config', 'POST', config);
            if (response.success) {
                this.config = config;
                this.updateConfigStatus(true);
                this.showToast('登录成功！配置已保存', 'success');
                
                setTimeout(() => {
                    this.showTab('clean');
                }, 2000);
            }
        } catch (error) {
            console.error('保存Cookie失败:', error);
            this.showToast('保存配置失败', 'error');
        }
    }

    /**
     * 自动显示iframe登录
     */
    autoShowIframe() {
        const container = document.getElementById('iframeContainer');
        container.innerHTML = '';
        container.style.display = 'block';
        
        const iframe = document.createElement('iframe');
        iframe.src = `${this.SERVICE_URL}/?mode=iframe&targetOrigin=${encodeURIComponent(window.location.origin)}`;
        container.appendChild(iframe);
        
        this.isIframeOpen = true;
        this.showLoginStatus('iframe登录已打开，请扫码登录', 'info');
        
        // 检查并显示当前配置的Cookie
        this.refreshCookie();
    }

    /**
     * 绑定批量操作事件
     */
    bindBatchEvents() {
        // 批量操作
        document.getElementById('selectAllBtn').addEventListener('click', () => {
            this.selectAllFavorites();
        });

        document.getElementById('deselectAllBtn').addEventListener('click', () => {
            this.deselectAllFavorites();
        });

        document.getElementById('cleanSelectedBtn').addEventListener('click', () => {
            this.cleanSelectedFavorites();
        });

        document.getElementById('cleanAllBtn').addEventListener('click', () => {
            this.cleanAllFavorites();
        });
    }

    /**
     * 显示选项卡
     */
    showTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新面板显示
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}Panel`).classList.add('active');

        // 如果切换到清理面板，加载收藏夹
        if (tabName === 'clean') {
            this.loadFavorites();
        }
    }

    /**
     * 检查配置状态
     */
    async checkConfig() {
        try {
            const response = await this.apiRequest('/api/config');
            if (response.success) {
                this.config = response.data;
                this.updateConfigStatus();
            }
        } catch (error) {
            console.error('检查配置失败:', error);
            this.updateConfigStatus(false);
        }
    }

    /**
     * 更新配置状态显示
     */
    updateConfigStatus(isConfigured = null) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const userInfo = document.getElementById('userInfo');
        const userId = document.getElementById('userId');

        if (isConfigured === null) {
            statusDot.className = 'status-dot checking';
            statusText.textContent = '检查中...';
            userInfo.style.display = 'none';
        } else if (isConfigured && this.config && this.config.up_mid) {
            statusDot.className = 'status-dot configured';
            statusText.textContent = '已配置';
            userId.textContent = this.config.up_mid;
            userInfo.style.display = 'block';
        } else {
            statusDot.className = 'status-dot';
            statusText.textContent = '未配置';
            userInfo.style.display = 'none';
        }
    }

    /**
     * 嵌入式登录 - iframe模式
     */
    openIframe() {
        const container = document.getElementById('iframeContainer');
        const btn = event.target;
        
        if (!this.isIframeOpen) {
            container.innerHTML = '';
            container.style.display = 'block';
            
            const iframe = document.createElement('iframe');
            iframe.src = `${this.SERVICE_URL}/?mode=iframe&targetOrigin=${encodeURIComponent(window.location.origin)}`;
            container.appendChild(iframe);
            
            btn.textContent = '❌ 关闭iframe';
            this.isIframeOpen = true;
            
            this.showLoginStatus('iframe登录已打开，请扫码登录', 'info');
        } else {
            container.style.display = 'none';
            container.innerHTML = '';
            btn.textContent = '📱 iframe模式';
            this.isIframeOpen = false;
            this.hideLoginStatus();
        }
    }

    /**
     * 嵌入式登录 - 弹窗模式
     */
    openWindow() {
        const popup = window.open(
            `${this.SERVICE_URL}/?mode=window&targetOrigin=${encodeURIComponent(window.location.origin)}`,
            'bili_login',
            'width=420,height=610,resizable=no,scrollbars=no'
        );
        
        if (!popup) {
            this.showLoginStatus('弹窗被阻止，请允许弹窗后重试', 'error');
            return;
        }
        
        this.showLoginStatus('登录窗口已打开，请在弹窗中完成登录', 'info');
    }

    /**
     * 显示Cookie
     */
    displayCookie(cookieString) {
        const placeholder = document.getElementById('cookiePlaceholder');
        const cookieText = document.getElementById('cookieText');
        const cookieValue = document.getElementById('cookieValue');
        
        if (cookieString) {
            placeholder.style.display = 'none';
            cookieText.style.display = 'block';
            cookieValue.textContent = cookieString;
        } else {
            placeholder.style.display = 'block';
            cookieText.style.display = 'none';
        }
    }

    /**
     * 复制Cookie
     */
    async copyCookie() {
        const cookieValue = document.getElementById('cookieValue').textContent;
        
        if (!cookieValue || cookieValue === '请先登录获取Cookie') {
            this.showCopyStatus('没有可复制的Cookie', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(cookieValue);
            this.showCopyStatus('✅ Cookie已复制到剪贴板', 'success');
        } catch (error) {
            // 降级方案：使用传统方法
            const textArea = document.createElement('textarea');
            textArea.value = cookieValue;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showCopyStatus('✅ Cookie已复制到剪贴板', 'success');
            } catch (error) {
                this.showCopyStatus('❌ 复制失败，请手动复制', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    /**
     * 刷新Cookie显示
     */
    refreshCookie() {
        if (this.config && this.config.cookie) {
            this.displayCookie(this.config.cookie);
        } else {
            this.displayCookie('');
        }
    }

    /**
     * 显示复制状态
     */
    showCopyStatus(message, type = 'info') {
        const status = document.getElementById('copyStatus');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * 显示登录状态信息
     */
    showLoginStatus(message, type = 'info') {
        const status = document.getElementById('loginStatus');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        if (type === 'info') {
            setTimeout(() => this.hideLoginStatus(), 3000);
        }
    }

    /**
     * 隐藏登录状态信息
     */
    hideLoginStatus() {
        const status = document.getElementById('loginStatus');
        status.style.display = 'none';
    }


    /**
     * 切换手动配置表单
     */
    toggleManualForm() {
        const form = document.getElementById('manualForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }

    /**
     * 保存手动输入的Cookie
     */
    async saveManualCookie() {
        const input = document.getElementById('manualCookieInput');
        const cookieString = input.value.trim();
        
        if (!cookieString) {
            this.showToast('请输入Cookie', 'warning');
            return;
        }

        try {
            const parsedCookies = this.parseCookieString(cookieString);
            
            if (!parsedCookies.SESSDATA || !parsedCookies.bili_jct || !parsedCookies.DedeUserID) {
                this.showToast('Cookie格式不正确，缺少必要字段', 'error');
                return;
            }

            const config = {
                up_mid: parsedCookies.DedeUserID,
                csrf_token: parsedCookies.bili_jct,
                cookie: cookieString
            };

            const response = await this.apiRequest('/api/config', 'POST', config);
            if (response.success) {
                this.config = config;
                this.updateConfigStatus(true);
                this.showToast('配置保存成功', 'success');
                input.value = '';
                this.toggleManualForm();
            }
        } catch (error) {
            this.showToast('保存配置失败: ' + error.message, 'error');
        }
    }

    /**
     * 解析Cookie字符串
     */
    parseCookieString(cookieString) {
        const cookies = {};
        cookieString.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = value;
            }
        });
        return cookies;
    }

    /**
     * 加载收藏夹列表
     */
    async loadFavorites() {
        const loading = document.getElementById('favoritesLoading');
        const list = document.getElementById('favoritesList');
        
        loading.style.display = 'block';
        list.style.display = 'none';

        try {
            const response = await this.apiRequest('/api/favorites');
            if (response.success) {
                this.favorites = response.data;
                this.renderFavorites();
            } else {
                throw new Error(response.error || '获取收藏夹失败');
            }
        } catch (error) {
            this.showToast('获取收藏夹失败: ' + error.message, 'error');
        } finally {
            loading.style.display = 'none';
        }
    }

    /**
     * 渲染收藏夹列表
     */
    renderFavorites() {
        const list = document.getElementById('favoritesList');
        
        if (this.favorites.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #7f8c8d;">暂无收藏夹</p>';
            list.style.display = 'block';
            return;
        }

        list.innerHTML = this.favorites.map(favorite => `
            <div class="favorite-item" data-id="${favorite.id}">
                <input type="checkbox" class="favorite-checkbox" data-id="${favorite.id}">
                <div class="favorite-info">
                    <div class="favorite-name">${this.escapeHtml(favorite.title)}</div>
                    <div class="favorite-meta">
                        ID: ${favorite.id} | 视频数: ${favorite.media_count || 0}
                    </div>
                </div>
                <div class="favorite-status" data-id="${favorite.id}">待处理</div>
            </div>
        `).join('');

        // 显示列表
        list.style.display = 'block';

        // 绑定复选框事件
        list.querySelectorAll('.favorite-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const item = e.target.closest('.favorite-item');
                
                if (e.target.checked) {
                    this.selectedFavorites.add(id);
                    item.classList.add('selected');
                } else {
                    this.selectedFavorites.delete(id);
                    item.classList.remove('selected');
                }
            });
        });
    }

    /**
     * 全选收藏夹
     */
    selectAllFavorites() {
        document.querySelectorAll('.favorite-checkbox').forEach(checkbox => {
            checkbox.checked = true;
            const id = checkbox.dataset.id;
            this.selectedFavorites.add(id);
            checkbox.closest('.favorite-item').classList.add('selected');
        });
    }

    /**
     * 取消全选收藏夹
     */
    deselectAllFavorites() {
        document.querySelectorAll('.favorite-checkbox').forEach(checkbox => {
            checkbox.checked = false;
            const id = checkbox.dataset.id;
            this.selectedFavorites.delete(id);
            checkbox.closest('.favorite-item').classList.remove('selected');
        });
    }

    /**
     * 清理选中的收藏夹
     */
    async cleanSelectedFavorites() {
        if (this.selectedFavorites.size === 0) {
            this.showToast('请选择要清理的收藏夹', 'warning');
            return;
        }

        const ids = Array.from(this.selectedFavorites);
        await this.cleanFavorites(ids);
    }

    /**
     * 清理所有收藏夹
     */
    async cleanAllFavorites() {
        if (this.favorites.length === 0) {
            this.showToast('没有可清理的收藏夹', 'warning');
            return;
        }

        const ids = this.favorites.map(f => f.id);
        await this.cleanFavorites(ids);
    }

    /**
     * 清理收藏夹
     */
    async cleanFavorites(ids) {
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressContainer.style.display = 'block';
        let successCount = 0;
        let failedCount = 0;

        // 记录清理前的视频数量
        await this.recordOriginalCounts(ids);

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const favorite = this.favorites.find(f => f.id == id);
            const statusEl = document.querySelector(`.favorite-status[data-id="${id}"]`);
            
            try {
                progressText.textContent = `正在清理: ${favorite.title} (${i + 1}/${ids.length})`;
                progressFill.style.width = `${((i + 1) / ids.length) * 100}%`;
                
                statusEl.textContent = '清理中...';
                statusEl.className = 'favorite-status cleaning';

                const response = await this.apiRequest('/api/clean', 'POST', { mediaId: id });
                
                if (response.success) {
                    successCount++;
                    statusEl.textContent = '清理完成，正在统计...';
                    statusEl.className = 'favorite-status success';
                } else {
                    throw new Error(response.error || '清理失败');
                }
            } catch (error) {
                failedCount++;
                statusEl.textContent = '清理失败';
                statusEl.className = 'favorite-status error';
                console.error(`清理收藏夹 ${id} 失败:`, error);
            }

            // 添加延迟避免请求过快
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 清理完成后，重新获取收藏夹列表并计算清理数量
        progressText.textContent = '正在统计清理结果...';
        await this.calculateCleanedCounts(ids);

        progressText.textContent = `清理完成！成功: ${successCount}，失败: ${failedCount}`;
        this.showToast(`清理完成！成功清理 ${successCount} 个收藏夹，失败 ${failedCount} 个`, 'success');
    }

    /**
     * 记录清理前的视频数量
     */
    async recordOriginalCounts(ids) {
        for (const id of ids) {
            const favorite = this.favorites.find(f => f.id == id);
            if (favorite) {
                this.originalCounts.set(id, favorite.media_count || 0);
            }
        }
    }

    /**
     * 计算清理后的视频数量差值
     */
    async calculateCleanedCounts(ids) {
        try {
            // 重新获取收藏夹列表
            const response = await this.apiRequest('/api/favorites');
            if (response.success) {
                this.favorites = response.data;
                
                // 计算每个收藏夹的清理数量
                let totalCleaned = 0;
                for (const id of ids) {
                    const favorite = this.favorites.find(f => f.id == id);
                    const statusEl = document.querySelector(`.favorite-status[data-id="${id}"]`);
                    
                    if (favorite && statusEl) {
                        const originalCount = this.originalCounts.get(id) || 0;
                        const newCount = favorite.media_count || 0;
                        const cleanedCount = originalCount - newCount;
                        totalCleaned += cleanedCount;
                        
                        if (cleanedCount > 0) {
                            statusEl.textContent = `已清理 ${cleanedCount} 个视频 (${originalCount}→${newCount})`;
                        } else if (cleanedCount === 0) {
                            statusEl.textContent = `无失效视频 (${originalCount}→${newCount})`;
                        } else {
                            statusEl.textContent = `视频数量异常 (${originalCount}→${newCount})`;
                        }
                    }
                }
                
                // 重新渲染收藏夹列表以更新显示的视频数量
                this.renderFavorites();
                
                // 更新进度文本显示总清理数量
                const progressText = document.getElementById('progressText');
                const successCount = ids.length - failedCount; // 重新计算成功数量
                progressText.textContent = `清理完成！成功: ${successCount}，失败: ${failedCount}，总计清理: ${totalCleaned} 个失效内容`;
            }
        } catch (error) {
            console.error('获取清理后的收藏夹列表失败:', error);
        }
    }

    /**
     * 发送API请求
     */
    async apiRequest(url, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && method === 'POST') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        return await response.json();
    }

    /**
     * 显示消息提示
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const content = document.getElementById('toastContent');
        
        content.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new BilibiliFavCleaner();
});