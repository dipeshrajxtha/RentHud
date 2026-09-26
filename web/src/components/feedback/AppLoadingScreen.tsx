/**
 * AppLoadingScreen
 *
 * Full-screen loading state during auth initialization.
 * Shown to prevent incorrect redirect flashes.
 */

export function AppLoadingScreen() {
  return (
    <div
      className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50"
      role="status"
      aria-label="Loading RentHub"
    >
      {/* Logo mark */}
      <div className="mb-6">
        <RentHubLogoMark className="w-12 h-12 text-brand-600" />
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

/** Minimal RentHub logo mark SVG (home + key motif) */
function RentHubLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* House silhouette */}
      <path
        d="M24 4L6 18V44H20V32H28V44H42V18L24 4Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M24 4L6 18V44H20V32H28V44H42V18L24 4Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Key hole */}
      <circle cx="24" cy="22" r="3" fill="currentColor" />
      <path d="M22 25V29H26V25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
