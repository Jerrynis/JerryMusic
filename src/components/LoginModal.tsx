import { useState, useEffect, useRef, useCallback } from 'react'
import { X, RefreshCw, Loader2, QrCode, Smartphone } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { cn } from '@/lib/utils'

interface LoginModalProps {
  onClose: () => void
}

type QrStatus = 'loading' | 'waiting' | 'scanned' | 'success' | 'expired'

const statusTextMap: Record<QrStatus, string> = {
  loading: '正在生成二维码...',
  waiting: '请使用网易云音乐 App 扫码登录',
  scanned: '已扫描，请在手机上确认登录',
  success: '登录成功',
  expired: '二维码已过期',
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const qrLogin = useUserStore((s) => s.qrLogin)
  const checkQrStatus = useUserStore((s) => s.checkQrStatus)
  const phoneLogin = useUserStore((s) => s.phoneLogin)

  const [activeTab, setActiveTab] = useState<'qr' | 'phone'>('qr')

  // QR login state
  const [qrImg, setQrImg] = useState<string>('')
  const [qrKey, setQrKey] = useState<string>('')
  const [qrStatus, setQrStatus] = useState<QrStatus>('loading')

  // Phone login state
  const [countryCode, setCountryCode] = useState('86')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  // Fetch a fresh QR code
  const fetchQrCode = useCallback(async () => {
    setQrStatus('loading')
    setQrImg('')
    setQrKey('')
    const result = await qrLogin()
    if (result) {
      setQrKey(result.key)
      setQrImg(result.qrimg)
      setQrStatus('waiting')
    } else {
      setQrStatus('expired')
    }
  }, [qrLogin])

  // Fetch QR code on mount or when switching to QR tab
  useEffect(() => {
    if (activeTab === 'qr' && !qrKey) {
      fetchQrCode()
    }
  }, [activeTab, qrKey, fetchQrCode])

  // Poll QR status every 2s
  useEffect(() => {
    if (activeTab !== 'qr' || !qrKey) return

    let interval: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      const res = await checkQrStatus(qrKey)
      if (cancelled) return

      if (res.status === 'success') {
        setQrStatus('success')
        if (interval) clearInterval(interval)
        setTimeout(() => onClose(), 800)
      } else if (res.status === 'expired') {
        setQrStatus('expired')
        if (interval) clearInterval(interval)
      } else if (res.status === 'scanned') {
        setQrStatus('scanned')
      }
    }

    poll()
    interval = setInterval(poll, 2000)

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [qrKey, activeTab, checkQrStatus, onClose])

  // Handle phone login
  const handlePhoneLogin = async () => {
    if (!phone.trim()) {
      setPhoneError('请输入手机号')
      return
    }
    if (!password) {
      setPhoneError('请输入密码')
      return
    }

    setPhoneLoading(true)
    setPhoneError('')
    const success = await phoneLogin(phone, password, Number(countryCode))
    setPhoneLoading(false)

    if (success) {
      onClose()
    } else {
      setPhoneError('登录失败，请检查手机号和密码')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-strong relative w-full max-w-md rounded-2xl p-6 shadow-glass-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="btn-icon absolute right-4 top-4 z-10 h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-white">
          登录 Music Station
        </h2>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-lg bg-black/5 p-1 dark:bg-white/5">
          <button
            onClick={() => setActiveTab('qr')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors',
              activeTab === 'qr'
                ? 'bg-white/80 text-primary-600 shadow-sm dark:bg-white/10 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            <QrCode size={16} />
            扫码登录
          </button>
          <button
            onClick={() => setActiveTab('phone')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors',
              activeTab === 'phone'
                ? 'bg-white/80 text-primary-600 shadow-sm dark:bg-white/10 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            <Smartphone size={16} />
            手机登录
          </button>
        </div>

        {/* QR Tab */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center">
            <div className="relative">
              {qrStatus === 'loading' ? (
                <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5">
                  <Loader2 className="animate-spin text-primary-500" size={32} />
                </div>
              ) : (
                <img
                  src={qrImg}
                  alt="登录二维码"
                  className={cn(
                    'h-48 w-48 rounded-xl border border-black/10 dark:border-white/10',
                    qrStatus === 'expired' && 'opacity-30',
                  )}
                />
              )}

              {/* Expired overlay with refresh button */}
              {qrStatus === 'expired' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <button
                    onClick={fetchQrCode}
                    className="btn-icon flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600"
                    aria-label="刷新二维码"
                  >
                    <RefreshCw size={22} />
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">点击刷新二维码</span>
                </div>
              )}
            </div>

            {/* Status text */}
            <p
              className={cn(
                'mt-4 text-sm font-medium',
                qrStatus === 'success' && 'text-green-500',
                qrStatus === 'expired' && 'text-red-500',
                qrStatus !== 'success' && qrStatus !== 'expired' && 'text-gray-500 dark:text-gray-400',
              )}
            >
              {statusTextMap[qrStatus]}
            </p>
          </div>
        )}

        {/* Phone Tab */}
        {activeTab === 'phone' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex w-24 items-center rounded-lg border border-black/10 bg-white/50 px-3 dark:border-white/10 dark:bg-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">+</span>
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent py-3 text-sm text-gray-900 outline-none dark:text-white"
                  placeholder="86"
                  maxLength={4}
                />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 rounded-lg border border-black/10 bg-white/50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary-400"
                placeholder="手机号"
              />
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePhoneLogin()
              }}
              className="w-full rounded-lg border border-black/10 bg-white/50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-primary-400"
              placeholder="密码"
            />

            {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}

            <button
              onClick={handlePhoneLogin}
              disabled={phoneLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {phoneLoading && <Loader2 size={16} className="animate-spin" />}
              {phoneLoading ? '登录中...' : '登录'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
