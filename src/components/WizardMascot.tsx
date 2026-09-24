import { useEffect, useId, useRef } from 'react';
import { sample, type MascotState } from '../mascot/engine';

export type { MascotState };

interface WizardMascotProps {
  size?: number;
  className?: string;
  state?: MascotState;
}

function Sparkle({
  x,
  y,
  s,
  delay,
  fast = false,
}: {
  x: number;
  y: number;
  s: number;
  delay: string;
  fast?: boolean;
}) {
  return (
    <path
      d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`}
      fill="#ffc800"
      className={fast ? 'animate-sparkle-fast' : 'animate-sparkle'}
      style={{ animationDelay: delay, transformOrigin: `${x}px ${y}px` }}
    />
  );
}

const EYE_CENTER_Y = 99;
const EYE_HALF_H = 21;

/**
 * Sabio, la mascota búho. Detrás de la ilustración hay un pequeño motor de
 * animación propio (`src/mascot/`) adaptado del de bloub
 * (github.com/jeremy-prt/bloub): `sample(t, state)` es una función pura del
 * tiempo — sin reloj interno — que en cada frame calcula parpadeo (calendario
 * determinista, cierre rápido/apertura lenta), deriva de la mirada (ruido
 * periódico sin costuras) y una respiración casi imperceptible; un
 * `requestAnimationFrame` la muestrea y actualiza el SVG a mano (sin
 * re-render de React por frame). El cuerpo del búho no se recreó como una
 * silueta que muta entre siluetas — a diferencia del círculo de bloub, tiene
 * alas, sombrero y varita como piezas separadas — así que ahí la técnica se
 * queda en CSS (aleteo, rebote de celebración).
 *
 * `state` controla el matiz según el momento en que se usa:
 * - idle: mirada a la deriva + parpadeo, para cuando solo acompaña (navbar, login, dashboard).
 * - thinking: ojos fijos (sin parpadear) + varita pulsando más rápido, mientras Sabio "escribe".
 * - celebrate: rebote, alas agitándose y ráfaga de chispas, para momentos de logro (onboarding
 *   completo, respuesta correcta, clase iniciada).
 */
export default function WizardMascot({ size = 96, className = '', state = 'idle' }: WizardMascotProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const clipId = `mascot-eyelid-${rawId}`;

  const motionRef = useRef<SVGGElement>(null);
  const gazeRef = useRef<SVGGElement>(null);
  const lidRef = useRef<SVGRectElement>(null);
  const wandGlowRef = useRef<SVGCircleElement>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const t = (now - startRef.current) / 1000;
      const frame = sample(t, state);

      if (lidRef.current) {
        const h = EYE_HALF_H * 2 * frame.lid;
        lidRef.current.setAttribute('y', String(EYE_CENTER_Y - EYE_HALF_H * frame.lid));
        lidRef.current.setAttribute('height', String(h));
      }
      if (gazeRef.current) {
        gazeRef.current.style.transform = `translate(${frame.gazeX.toFixed(2)}px, ${frame.gazeY.toFixed(2)}px)`;
      }
      if (motionRef.current && state !== 'celebrate') {
        motionRef.current.style.transform = `scale(${frame.breathe.toFixed(4)}) rotate(${frame.lean.toFixed(2)}deg)`;
      }
      if (wandGlowRef.current) {
        const g = frame.wandGlow;
        wandGlowRef.current.style.opacity = (0.6 + 0.4 * g).toFixed(2);
        wandGlowRef.current.style.transform = `scale(${(0.85 + 0.3 * g).toFixed(3)})`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const wingAnimation = state === 'celebrate' ? 'animate-wing-flap-fast' : 'animate-float';
  const leftWingAnimation = state === 'celebrate' ? 'animate-wing-flap-fast' : 'animate-wing-sway';

  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      className={className}
      role="img"
      aria-label="Sabio, tu búho mago tutor"
    >
      <defs>
        <clipPath id={clipId}>
          <rect ref={lidRef} x="50" width="100" y={EYE_CENTER_Y - EYE_HALF_H} height={EYE_HALF_H * 2} />
        </clipPath>
      </defs>

      <g
        ref={motionRef}
        className={state === 'celebrate' ? 'animate-mascot-celebrate' : ''}
        style={{ transformOrigin: '50% 100%' }}
      >
        <ellipse cx="100" cy="207" rx="52" ry="7" fill="#0e1f38" opacity="0.08" />

        <Sparkle x={30} y={56} s={7} delay="0s" />
        <Sparkle x={172} y={80} s={5} delay="0.6s" />
        <Sparkle x={152} y={26} s={6} delay="1.1s" />
        {state === 'celebrate' && (
          <>
            <Sparkle x={50} y={30} s={6} delay="0s" fast />
            <Sparkle x={140} y={16} s={5} delay="0.15s" fast />
            <Sparkle x={20} y={110} s={6} delay="0.3s" fast />
            <Sparkle x={180} y={130} s={6} delay="0.1s" fast />
          </>
        )}

        {/* right wing (behind body, holds wand) */}
        <g className={wingAnimation} style={{ transformOrigin: '150px 150px' }}>
          <path d="M128 118 C158 116 176 138 178 172 C160 168 140 156 130 138 Z" fill="#1595d1" />
          <rect x="158" y="50" width="6" height="66" rx="3" fill="#ffc800" transform="rotate(24 161 116)" />
          <circle ref={wandGlowRef} cx="176" cy="52" r="9" fill="#ffde59" style={{ transformOrigin: '176px 52px' }} />
        </g>

        {/* left wing */}
        <path
          className={leftWingAnimation}
          style={{ transformOrigin: '48px 150px' }}
          d="M72 118 C42 116 24 140 24 174 C42 170 62 156 72 138 Z"
          fill="#1cb0f6"
        />

        {/* belly / robe */}
        <path
          d="M62 122 C58 96 76 78 100 78 C124 78 142 96 138 122 L148 192 C150 202 142 210 132 210 L68 210 C58 210 50 202 52 192 Z"
          fill="#eef7ff"
        />
        <path
          d="M78 130 C78 160 86 176 100 176 C114 176 122 160 122 130 L128 196 C129 203 124 208 117 208 L83 208 C76 208 71 203 72 196 Z"
          fill="#3ec1ff"
          opacity="0.55"
        />

        {/* feet */}
        <ellipse cx="84" cy="207" rx="9" ry="6" fill="#ffb020" />
        <ellipse cx="116" cy="207" rx="9" ry="6" fill="#ffb020" />

        {/* scarf */}
        <path
          d="M64 124 C80 136 120 136 136 124 L134 140 C118 150 82 150 66 140 Z"
          fill="#ffffff"
          stroke="#d9f1ff"
          strokeWidth="1.5"
        />

        {/* ear tufts */}
        <path d="M70 76 L62 52 L82 68 Z" fill="#1595d1" />
        <path d="M130 76 L138 52 L118 68 Z" fill="#1595d1" />

        {/* head */}
        <circle cx="100" cy="100" r="46" fill="#eef7ff" />
        <circle cx="100" cy="100" r="46" fill="none" stroke="#bfe6ff" strokeWidth="2" />

        {/* eyes: clipped by the eyelid rect above (blink), gaze drifts inside */}
        <g clipPath={`url(#${clipId})`}>
          <circle cx="80" cy="98" r="21" fill="#ffffff" />
          <circle cx="120" cy="98" r="21" fill="#ffffff" />
          <g ref={gazeRef} style={{ transformOrigin: '100px 99px' }}>
            <circle cx="80" cy="99" r="12" fill="#14213d" />
            <circle cx="120" cy="99" r="12" fill="#14213d" />
            <circle cx="83" cy="94" r="3.5" fill="#ffffff" />
            <circle cx="123" cy="94" r="3.5" fill="#ffffff" />
          </g>
        </g>
        <path d="M64 90 Q80 78 96 90" stroke="#1cb0f6" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M104 90 Q120 78 136 90" stroke="#1cb0f6" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* beak */}
        <path d="M94 112 L100 128 L106 112 Z" fill="#ffb020" />

        {/* blush */}
        <ellipse cx="66" cy="116" rx="7" ry="4.5" fill="#ff9d8a" opacity="0.55" />
        <ellipse cx="134" cy="116" rx="7" ry="4.5" fill="#ff9d8a" opacity="0.55" />

        {/* hat */}
        <path
          d="M64 68 C64 42 82 20 100 10 C118 20 136 42 136 68 C136 57 120 50 100 50 C80 50 64 57 64 68 Z"
          fill="#1cb0f6"
        />
        <ellipse cx="100" cy="68" rx="38" ry="9" fill="#1595d1" />
        <circle cx="100" cy="10" r="7" fill="#ffc800" />
        <Sparkle x={118} y={28} s={5} delay="0.5s" fast={state === 'thinking'} />
        <Sparkle x={84} y={40} s={4} delay="1s" fast={state === 'thinking'} />
      </g>
    </svg>
  );
}
