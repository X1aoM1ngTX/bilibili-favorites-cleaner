'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { extractCsrfToken, extractDedeuserid } from '@/lib/utils';
import { CheckCircle2, LogIn } from 'lucide-react';

type LoginMode = 'qr' | 'cookie';

type QrStatus =
  | 'idle'
  | 'loading'
  | 'waiting'
  | 'scanned'
  | 'expired'
  | 'success'
  | 'error';

const QR_STATUS_TEXT: Record<QrStatus, string> = {
  idle: '',
  loading: '正在生成二维码...',
  waiting: '请使用哔哩哔哩 APP 扫描二维码',
  scanned: '已扫码，请在手机上确认登录',
  expired: '二维码已过期，请刷新后重新扫码',
  success: '登录成功',
  error: '二维码加载失败',
};

export function LoginPanel() {
  const { userConfig, setUserConfig, logout, isLoggedIn } = useAppStore();
  const [cookie, setCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<LoginMode>('qr');

  const [qrUrl, setQrUrl] = useState('');
  const [qrKey, setQrKey] = useState('');
  const [qrStatus, setQrStatus] = useState<QrStatus>('idle');

  useEffect(() => {
    if (userConfig?.cookie) {
      setCookie(userConfig.cookie);
    }
  }, [userConfig]);

  const applyCookie = useCallback(
    (cookieString: string) => {
      const csrf = extractCsrfToken(cookieString);
      const upMid = extractDedeuserid(cookieString);

      if (!csrf || !upMid) {
        setError('Cookie 格式无效，请确保包含 bili_jct 和 DedeUserID');
        return false;
      }

      setUserConfig({
        up_mid: upMid,
        csrf_token: csrf,
        cookie: cookieString,
      });
      setError('');
      return true;
    },
    [setUserConfig]
  );

  const startQrLogin = useCallback(async () => {
    setQrStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/login/qrcode');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '生成二维码失败');
      }

      setQrUrl(result.data.url);
      setQrKey(result.data.qrcode_key);
      setQrStatus('waiting');
    } catch (err) {
      setQrStatus('error');
      setError(err instanceof Error ? err.message : '生成二维码失败');
    }
  }, []);

  // 轮询扫码状态：等扫码 / 等确认 / 成功 / 过期
  useEffect(() => {
    if (!qrKey) return;
    if (qrStatus === 'success' || qrStatus === 'expired' || qrStatus === 'error') {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const response = await fetch('/api/login/qrcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrcode_key: qrKey }),
        });
        const result = await response.json();

        if (cancelled) return;

        if (!result.success) {
          setQrStatus('error');
          setError(result.error || '查询扫码状态失败');
          return;
        }

        const status = result.data?.status as QrStatus;
        const message: string = result.data?.message || '';
        const loginCookie: string | undefined = result.data?.cookie;

        if (status === 'success' && loginCookie) {
          setQrStatus('success');
          setQrKey('');
          applyCookie(loginCookie);
          return;
        }

        if (status === 'expired') {
          setQrStatus('expired');
          return;
        }

        if (status === 'waiting' || status === 'scanned') {
          setQrStatus(status);
        } else {
          setQrStatus('error');
          setError(message || '扫码登录失败');
          return;
        }
      } catch {
        // 网络抖动不中断轮询
      } finally {
        if (!cancelled) {
          timer = setTimeout(poll, 2000);
        }
      }
    };

    timer = setTimeout(poll, 600);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [qrKey, qrStatus, applyCookie]);

  const resetQr = () => {
    setQrKey('');
    setQrUrl('');
    setQrStatus('idle');
  };

  const handleSaveCookie = async () => {
    if (!cookie.trim()) {
      setError('请输入 Cookie');
      return;
    }

    setLoading(true);
    try {
      applyCookie(cookie.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCookie('');
    resetQr();
  };

  if (isLoggedIn && userConfig) {
    return (
      <Card className="mx-auto my-auto max-h-full w-full max-w-xl overflow-y-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle>登录成功</CardTitle>
              <p className="mt-0.5 hidden text-sm text-gray-600 sm:block">
                登录信息已保存在本地浏览器
              </p>
            </div>
          </div>
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
    <Card className="mx-auto my-auto max-h-full w-full max-w-xl overflow-y-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bili-pink-50">
            <LogIn className="h-5 w-5 text-bili-pink" />
          </div>
          <div>
            <CardTitle>登录配置</CardTitle>
            <p className="mt-0.5 hidden text-sm text-gray-600 sm:block">
              扫码或粘贴 Cookie 登录 B 站账号
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">请选择登录方式：</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setLoginMode('qr');
              setError('');
            }}
            variant={loginMode === 'qr' ? 'default' : 'outline'}
          >
            扫码登录
          </Button>
          <Button
            onClick={() => {
              setLoginMode('cookie');
              setError('');
            }}
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
              variant="bili"
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

            {qrStatus === 'idle' || qrStatus === 'error' ? (
              <div className="space-y-4">
                <Alert variant="info">
                  点击下方按钮获取登录二维码，使用哔哩哔哩 APP 扫码即可登录。
                </Alert>
                <Button onClick={startQrLogin} variant="bili" className="w-full">
                  生成登录二维码
                </Button>
              </div>
            ) : qrStatus === 'loading' ? (
              <div className="flex items-center justify-center gap-2 py-12 text-gray-600">
                <Spinner className="h-5 w-5" />
                <span className="text-sm">正在生成二维码...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <QRCodeSVG
                    value={qrUrl}
                    size={200}
                    level="M"
                    className={qrStatus === 'expired' ? 'opacity-30' : ''}
                  />
                </div>

                <p
                  className={`text-sm ${
                    qrStatus === 'scanned'
                      ? 'font-medium text-bili-pink'
                      : 'text-gray-600'
                  }`}
                >
                  {QR_STATUS_TEXT[qrStatus]}
                </p>

                <div className="flex gap-2">
                  {qrStatus === 'expired' ? (
                    <Button onClick={startQrLogin}>刷新二维码</Button>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetQr();
                      setError('');
                    }}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
