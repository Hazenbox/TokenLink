/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/ui/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        "border-subtle": "hsl(var(--border-subtle))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-canvas": "hsl(var(--background-canvas))",
        foreground: "hsl(var(--foreground))",
        "foreground-secondary": "hsl(var(--foreground-secondary))",
        "foreground-tertiary": "hsl(var(--foreground-tertiary))",
        "foreground-disabled": "hsl(var(--foreground-disabled))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          pressed: "hsl(var(--primary-pressed))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          elevated: "hsl(var(--surface-elevated))",
        },
        interactive: {
          DEFAULT: "hsl(var(--interactive))",
          hover: "hsl(var(--interactive-hover))",
          pressed: "hsl(var(--interactive-pressed))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        info: "hsl(var(--info))",
        // Handle colors
        handle: {
          bg: "hsl(var(--handle-bg))",
          border: "hsl(var(--handle-border))",
          hover: "hsl(var(--handle-hover))",
          active: "hsl(var(--handle-active))",
          icon: "hsl(var(--handle-icon))",
        },
        // Edge colors
        edge: {
          default: "hsl(var(--edge-default))",
          hover: "hsl(var(--edge-hover))",
          selected: "hsl(var(--edge-selected))",
          alias: "hsl(var(--edge-alias))",
          error: "hsl(var(--edge-error))",
        },
        // Node colors
        node: {
          bg: "hsl(var(--node-bg))",
          border: "hsl(var(--node-border))",
          "border-selected": "hsl(var(--node-border-selected))",
          "border-hover": "hsl(var(--node-border-hover))",
        },
        // Tooltip colors
        tooltip: {
          bg: "hsl(var(--tooltip-bg))",
          border: "hsl(var(--tooltip-border))",
          text: "hsl(var(--tooltip-text))",
        },
        // Menu colors
        menu: {
          bg: "hsl(var(--menu-bg))",
          border: "hsl(var(--menu-border))",
          "item-hover": "hsl(var(--menu-item-hover))",
          divider: "hsl(var(--menu-divider))",
        },
        // Scrollbar colors
        scrollbar: {
          track: "hsl(var(--scrollbar-track))",
          thumb: "hsl(var(--scrollbar-thumb))",
          "thumb-hover": "hsl(var(--scrollbar-thumb-hover))",
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "12px", // Node radius
      },
      transitionDuration: {
        instant: "var(--duration-instant)",
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        snappy: "var(--ease-snappy)",
        smooth: "var(--ease-smooth)",
      },
      boxShadow: {
        none: "none",
        "glow-subtle": "0 0 0 1px rgba(255, 255, 255, 0.05)",
        "glow-primary": "0 0 0 1px rgba(100, 150, 255, 0.2), 0 0 12px rgba(100, 150, 255, 0.15)",
        "glow-node": "0 0 0 1px rgba(255, 255, 255, 0.05)",
        "glow-node-selected": "0 0 0 1px rgba(100, 150, 255, 0.2), 0 0 12px rgba(100, 150, 255, 0.15)",
      },
    },
  },
  plugins: [],
}
