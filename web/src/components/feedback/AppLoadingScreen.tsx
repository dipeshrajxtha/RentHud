/**
 * AppLoadingScreen
 *
 * Full-screen loading state during auth initialization.
 * Shown to prevent incorrect redirect flashes.
 */

import { RentHubIcon } from '@/components/common/RentHubLogo';

export function AppLoadingScreen() {
  return (
    <div
      className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50"
      role="status"
      aria-label="Loading RentHub"
    >
      {/* Logo mark */}
      <div className="mb-6 animate-pulse">
        <RentHubIcon variant="original" className="w-14 h-14" />
      </div>

      {/* Animated dot loader */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-brand-400"
            style={{
              animation: 'appLoadDot 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes appLoadDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%           { opacity: 1;   transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          span[style] { animation: none !important; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
