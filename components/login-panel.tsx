'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import {
  extractCsrfToken,
  extractDedeuserid,
} from '@/lib/utils';

const LOGIN_SERVICE_URL = 'https://login.bilibili.bi';

type LoginMode = 'iframe' | 'cookie';

interface LoginMessage {
  type: string;
  mode: string;
  data: string;
}

export function LoginPanel() {
  const { userConfig, setUserConfig, logout, isLoggedIn } = useAppStore();
  const [cookie, setCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<LoginMode>('iframe');
  const [iframeVisible, setIframeVisible] = useState(false);

  const handleMessage = useCallback((event: MessageEvent<LoginMessage>) => {
    if (event.origin !== LOGIN_SERVICE_URL) return;

    const { type, data } = event.data;
    if (type === 'success') {
      const csrf = extractCsrfToken(data);
      const upMid = extractDedeuserid(data);

      if (csrf && upMid) {
        setUserConfig({
          up_mid: upMid,
          csrf_token: csrf,
          cookie: data,
        });
        setIframeVisible(false);
      } else {
        setError('Cookie 格式无效，请确保包含 bili_jct 和 DedeUserID');
      }
    }
  }, [setUserConfig]);

  useEffect(() => {
    if (userConfig?.cookie) {
      setCookie(userConfig.cookie);
    }
  }, [userConfig]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const handleSaveCookie = async () => {
    if (!cookie.trim()) {
      setError('请输入 Cookie');
      return;
    }

    const csrf = extractCsrfToken(cookie);
    const upMid = extractDedeuserid(cookie);

    if (!csrf || !upMid) {
      setError('Cookie 格式无效，请确保包含 bili_jct 和 DedeUserID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setUserConfig({
        up_mid: upMid,
        csrf_token: csrf,
        cookie,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCookie('');
    setIframeVisible(false);
  };

  if (isLoggedIn && userConfig) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>登录成功</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success">
            已成功登录，UID: {userConfig.up_mid}
          </Alert>
          <Button onClick={handleLogout} variant="destructive">
            退出登录
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>登录配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">请选择登录方式：</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => { setLoginMode('iframe'); setIframeVisible(false); }}
            variant={loginMode === 'iframe' ? 'default' : 'outline'}
          >
            扫码登录
          </Button>
          <Button
            onClick={() => { setLoginMode('cookie'); setIframeVisible(false); }}
            variant={loginMode === 'cookie' ? 'default' : 'outline'}
          >
            Cookie 登录
          </Button>
        </div>

        {loginMode === 'cookie' ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cookie
              </label>
              <Textarea
                placeholder="粘贴完整的 Cookie 字符串"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                rows={4}
              />
              <p className="mt-2 text-xs text-gray-500">
                在浏览器中访问 B 站，按 F12 打开开发者工具，在 Network
                中找到任意请求，复制 Cookie
              </p>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            <Button
              onClick={handleSaveCookie}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  保存中...
                </>
              ) : (
                '保存 Cookie'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            {iframeVisible ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full max-w-[420px] overflow-hidden rounded-lg border">
                  <iframe
                    src={`${LOGIN_SERVICE_URL}/?mode=iframe`}
                    className="h-[550px] w-full border-none"
                    title="B站登录"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  请使用哔哩哔哩 APP 扫描二维码登录
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIframeVisible(false)}
                >
                  关闭
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="info">
                  点击下方按钮打开登录页面，使用哔哩哔哩 APP 扫码即可登录。
                </Alert>
                <Button
                  onClick={() => { setError(''); setIframeVisible(true); }}
                  className="w-full"
                >
                  打开扫码登录
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
