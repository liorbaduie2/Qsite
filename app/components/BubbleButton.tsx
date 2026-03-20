"use client";

interface BubbleButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export default function BubbleButton({
  children = "Click Me",
  onClick,
  size = "md",
  disabled = false,
}: BubbleButtonProps) {
  const sizeMap = {
    sm: { px: "px-4", py: "py-2", text: "text-base", size: "w-auto h-auto" },
    md: { px: "px-9", py: "py-4", text: "text-base", size: "w-auto h-auto" },
    lg: { px: "px-12", py: "py-6", text: "text-lg", size: "w-auto h-auto" },
  };

  const s = sizeMap[size];

  return (
    <>
      <style>{`
        .bubble-btn {
          position: relative;
          margin-top: 3px;
          font-family: Assistant, system-ui, sans-serif;
          font-weight: 500;
          letter-spacing: 0.02em;
          border: none;
          outline: none;
          cursor: pointer;
          border-radius: 25px;
          overflow: visible;
          background: transparent;
          padding: 0;
          color: #1f2937;
        }
        .bubble-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
        .dark .bubble-btn {
          color: #f3f4f6;
        }

        /* Outer bubble skin */
        .bubble-skin {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          padding: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;

          /* LIGHT MODE BASE */
          background-color: rgba(255, 255, 255, 0.85);
          background-image:
            radial-gradient(ellipse at 30% 35%, rgba(255,255,255,0.9) 0%, transparent 55%),
            radial-gradient(ellipse at 70% 70%, rgba(210, 200, 245, 0.21) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(200,180,255,0.175) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, rgba(190, 175, 255, 0.175) 0%, transparent 50%),
            linear-gradient(
              135deg,
              rgba(180, 160, 220, 0.105) 0%,
              rgba(200, 165, 235, 0.105) 25%,
              rgba(215, 195, 250, 0.105) 50%,
              rgba(195, 175, 235, 0.105) 75%,
              rgba(175, 155, 225, 0.105) 100%
            );
          box-shadow:
            inset 0 5px 26px rgba(255, 255, 255, 0.54),
            inset 0 -3px 18px rgba(210, 180, 240, 0.1),
            inset 0 -3px 14px rgba(65, 52, 95, 0.09),
            inset 0 -1px 8px rgba(15, 23, 42, 0.08),
            0 4px 10px rgba(180, 160, 220, 0.075);
        }

        .bubble-btn:hover:not(:disabled) .bubble-skin {
          transform: scale(1.03);
          box-shadow:
            inset 0 5px 28px rgba(255, 255, 255, 0.62),
            inset 0 -3px 20px rgba(210, 180, 240, 0.135),
            inset 0 -4px 15px rgba(55, 42, 88, 0.095),
            inset 0 -1px 9px rgba(15, 23, 42, 0.1),
            0 4px 12px rgba(139, 92, 246, 0.12);
          filter: brightness(1.02);
        }

        /* Outline fading to nothing at bottom */
        .bubble-skin::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1px solid rgba(210, 180, 240, 0.26);
          mask-image: linear-gradient(to bottom, black 30%, transparent 85%);
          -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 85%);
          pointer-events: none;
        }

        /* DARK MODE OVERRIDES for skin */
        .dark .bubble-skin {
          background-color: transparent;
          background-image:
            radial-gradient(ellipse at 30% 35%, rgba(255,255,255,0.4) 0%, transparent 55%),
            radial-gradient(ellipse at 70% 70%, rgba(210, 200, 245, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(200,180,255,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, rgba(190, 175, 255, 0.1) 0%, transparent 50%),
            linear-gradient(
              135deg,
              rgba(180, 160, 220, 0.08) 0%,
              rgba(200, 165, 235, 0.09) 25%,
              rgba(215, 195, 250, 0.09) 50%,
              rgba(195, 175, 235, 0.08) 75%,
              rgba(175, 155, 225, 0.08) 100%
            );
          box-shadow:
            inset 0 5px 26px rgba(248, 235, 252, 0.14),
            inset 0 -3px 18px rgba(230, 200, 248, 0.09);
        }

        .dark .bubble-btn:hover:not(:disabled) .bubble-skin {
          box-shadow:
            inset 0 5px 28px rgba(248, 235, 252, 0.22),
            inset 0 -3px 20px rgba(230, 200, 248, 0.13),
            0 2px 8px rgba(139, 92, 246, 0.08);
          filter: brightness(1.08);
        }

        .dark .bubble-skin::before {
          border: 1.25px solid rgba(245, 225, 250, 0.36);
        }

        /* Primary highlight blob */
        .bubble-skin::after {
          content: '';
          position: absolute;
          top: 8%;
          left: 14%;
          width: 42%;
          height: 36%;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 40%, transparent 70%);
          filter: blur(2px);
          pointer-events: none;
        }

        .dark .bubble-skin::after {
          background: radial-gradient(ellipse, rgba(255,248,250,0.32) 0%, rgba(250,235,255,0.14) 40%, transparent 70%);
        }

        /* Secondary small specular highlight */
        .bubble-specular {
          position: absolute;
          top: 12%;
          right: 18%;
          width: 14%;
          height: 10%;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(255,255,255,0.8) 0%, transparent 70%);
          filter: blur(1px);
          pointer-events: none;
        }

        .dark .bubble-specular {
          background: radial-gradient(ellipse, rgba(252,242,255,0.24) 0%, transparent 70%);
        }

        /* Bottom rim gleam */
        .bubble-rim {
          position: absolute;
          bottom: 10%;
          left: 25%;
          width: 50%;
          height: 10%;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(230, 225, 250, 0.31) 0%, transparent 70%);
          filter: blur(3px);
          pointer-events: none;
        }

        .dark .bubble-rim {
          background: radial-gradient(ellipse, rgba(230, 225, 250, 0.32) 0%, transparent 70%);
        }

        /* Purple point glow - subtle */
        .bubble-purple-glow {
          position: absolute;
          top: -20%;
          left: 50%;
          width: 60%;
          height: 60%;
          transform: translate(-50%, 0);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(167, 139, 250, 0.245) 0%,
            rgba(139, 92, 246, 0.12) 40%,
            transparent 70%
          );
          filter: blur(8px);
          pointer-events: none;
        }

        .dark .bubble-purple-glow {
          background: radial-gradient(
            circle,
            rgba(167, 139, 250, 0.35) 0%,
            rgba(139, 92, 246, 0.2) 40%,
            transparent 70%
          );
        }

        /* Button text */
        .bubble-text {
          position: relative;
          z-index: 2;
          color: #1f2937;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        }
        .dark .bubble-text {
          color: #f3f4f6;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        /* Lucide icons inside label: clockwise hover tilt from center */
        .bubble-text svg {
          transform-origin: center center;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bubble-btn:not(:disabled):hover .bubble-text svg {
          transform: rotate(18deg);
        }

        /* Floating bubbles */
        .float-bubble {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), rgba(180,220,255,0.2));
          border: 1px solid rgba(255,255,255,0.5);
          box-shadow: inset 0 0 6px rgba(255,255,255,0.4);
          animation: float-up var(--dur, 1.5s) ease-out forwards;
          pointer-events: none;
        }

        @keyframes float-up {
          0%   { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(calc(-60px - var(--rand, 30px))) scale(0.3); opacity: 0; }
        }
      `}</style>

      <button
        type="button"
        className={`bubble-btn ${s.px} ${s.py} ${s.text}`}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="bubble-skin">
          {/* Specular highlights */}
          <div className="bubble-specular" />
          <div className="bubble-rim" />
          <div className="bubble-purple-glow" />

          {/* Label */}
          <span className={`bubble-text ${s.px} ${s.py} ${s.text} block`}>
            {children}
          </span>
        </div>
      </button>
    </>
  );
}
