/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff", 100: "#d9ecff", 200: "#bcdcff", 300: "#8ec7ff",
          400: "#59aaff", 500: "#2e8bff", 600: "#1567f5", 700: "#0e50d8",
          800: "#1242af", 900: "#143b89", 950: "#0f2454",
        },
        surface: {
          0: "#020408", 1: "#080d14", 2: "#0d1520", 3: "#111c2b", 4: "#162233", 5: "#1c2c40",
        },
        accent: {
          violet: "#7c3aed", cyan: "#06b6d4", amber: "#f59e0b", rose: "#f43f5e", emerald: "#10b981",
        },
      },
      fontFamily: {
        display: ["Space Grotesk","Outfit","Inter","-apple-system","BlinkMacSystemFont","\"Segoe UI\"","Roboto","sans-serif"],
        sans: ["Inter","-apple-system","BlinkMacSystemFont","\"Segoe UI\"","Roboto","sans-serif"],
        outfit: ["Outfit","sans-serif"],
      },
      fontSize: {
        "display-2xl": ["4.5rem",  { lineHeight: "1.05", letterSpacing: "-0.04em"  }],
        "display-xl":  ["3.75rem", { lineHeight: "1.08", letterSpacing: "-0.035em" }],
        "display-lg":  ["3rem",    { lineHeight: "1.1",  letterSpacing: "-0.03em"  }],
        "display-md":  ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        "display-sm":  ["1.875rem",{ lineHeight: "1.2",  letterSpacing: "-0.02em"  }],
        "heading-xl":  ["1.5rem",  { lineHeight: "1.25", letterSpacing: "-0.018em" }],
        "heading-lg":  ["1.25rem", { lineHeight: "1.3",  letterSpacing: "-0.015em" }],
        "heading-md":  ["1.125rem",{ lineHeight: "1.35", letterSpacing: "-0.01em"  }],
        "heading-sm":  ["1rem",    { lineHeight: "1.4",  letterSpacing: "-0.008em" }],
      },
      boxShadow: {
        "brand-sm":    "0 0 12px rgba(46,139,255,0.25), 0 2px 8px rgba(46,139,255,0.15)",
        "brand-md":    "0 0 24px rgba(46,139,255,0.35), 0 0 48px rgba(46,139,255,0.15)",
        "card":        "0 4px 24px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.35)",
        "auth":        "0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(46,139,255,0.08)",
        "glow-blue":   "0 0 30px rgba(46,139,255,0.4), 0 0 60px rgba(46,139,255,0.2)",
        "glow-violet": "0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.2)",
        "inner-glow":  "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 20px rgba(46,139,255,0.05)",
      },
      keyframes: {
        shimmer:         { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        pulseRing:       { "0%, 100%": { opacity: "0.6", transform: "scale(1)" }, "50%": { opacity: "1", transform: "scale(1.06)" } },
        fadeUp:          { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn:          { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        floatUpDown:     { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        scaleIn:         { "0%": { opacity: "0", transform: "scale(0.92)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        slideInLeft:     { "0%": { opacity: "0", transform: "translateX(-24px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        slideInRight:    { "0%": { opacity: "0", transform: "translateX(24px)" },  "100%": { opacity: "1", transform: "translateX(0)" } },
        shimmerProgress: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
      },
      animation: {
        "shimmer":           "shimmer 1.8s infinite linear",
        "pulse-ring":        "pulseRing 2.4s ease-in-out infinite",
        "fade-up":           "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":           "fadeIn 0.4s ease both",
        "float":             "floatUpDown 4s ease-in-out infinite",
        "scale-in":          "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        "slide-left":        "slideInLeft 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "slide-right":       "slideInRight 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "shimmer-progress":  "shimmerProgress 2s linear infinite",
      },
      transitionTimingFunction: {
        "expo-out":    "cubic-bezier(0.16,1,0.3,1)",
        "spring":      "cubic-bezier(0.34,1.56,0.64,1)",
        "expo-in-out": "cubic-bezier(0.19,1,0.22,1)",
      },
      aspectRatio: { "16/10": "16/10", "16/9": "16/9", "21/9": "21/9", "4/3": "4/3" },
    },
  },
  plugins: [],
}
