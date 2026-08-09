import { useState } from 'react'
import { Music2, Cookie, Shield, ChevronRight } from 'lucide-react'

const OOBE_KEY = 'jerrymusic_oobe_accepted'

export function hasAcceptedOOBE(): boolean {
  return localStorage.getItem(OOBE_KEY) === 'true'
}

interface OOBEProps {
  onAccept: () => void
}

export default function OOBE({ onAccept }: OOBEProps) {
  const [step, setStep] = useState(0)

  const handleAccept = () => {
    localStorage.setItem(OOBE_KEY, 'true')
    onAccept()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Frosted glass background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.25) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(37, 99, 235, 0.2) 0%, transparent 60%), #0a0a14',
        }}
      />

      {/* Floating decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -left-20 h-80 w-80 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
            animation: 'blobFloat 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.5) 0%, transparent 70%)',
            animation: 'blobFloat 15s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Main card */}
      <div className="relative z-10 mx-4 w-full max-w-md">
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            animation: 'cardEnter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
          }}
        >
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <Music2 size={36} className="text-primary-400" />
            </div>
          </div>

          {/* Title */}
          <h1
            className="mb-2 text-center text-2xl font-bold text-white"
            style={{ animation: 'fadeSlideUp 0.5s 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) both' }}
          >
            欢迎来到 JerryMusic
          </h1>
          <p
            className="mb-8 text-center text-sm text-white/50"
            style={{ animation: 'fadeSlideUp 0.5s 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both' }}
          >
            高品质音乐，随时聆听
          </p>

          {/* Step indicators */}
          <div className="mb-6 flex justify-center gap-2">
            {[0, 1].map((i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: step === i ? '24px' : '8px',
                  background: step === i ? 'rgba(96, 165, 250, 0.8)' : 'rgba(255, 255, 255, 0.15)',
                }}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="mb-8 min-h-[120px]">
            {step === 0 && (
              <div
                className="space-y-4"
                style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both' }}
              >
                <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                  <Cookie size={20} className="mt-0.5 flex-shrink-0 text-primary-400" />
                  <div>
                    <h3 className="text-sm font-medium text-white">Cookie 和本地存储</h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/45">
                      我们使用浏览器的本地存储来保存您的偏好设置（主题、音量等）和播放进度，以提供更好的使用体验。这些数据仅存储在您的设备上，不会上传到服务器。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div
                className="space-y-4"
                style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both' }}
              >
                <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                  <Shield size={20} className="mt-0.5 flex-shrink-0 text-primary-400" />
                  <div>
                    <h3 className="text-sm font-medium text-white">隐私保护</h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/45">
                      我们重视您的隐私。所有本地存储的数据仅用于提升您的个人使用体验，您可以随时在浏览器设置中清除这些数据。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {step < 1 ? (
              <button
                onClick={() => setStep(1)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
              >
                了解更多
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleAccept}
                className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
              >
                同意并继续
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-white/25">
            点击「同意并继续」即表示您同意我们使用本地存储来保存您的偏好和播放进度
          </p>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 10px) scale(0.95); }
        }
        @keyframes cardEnter {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}