import { useEffect, useId, useRef } from 'react';
import { BookOpen, Compass, Users } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import logo from '../../assets/logo.png';
import './flow-artwork.css';

type FlowArtworkProps = {
  paused?: boolean;
};

// Each contour is drawn in the same plane. Their shifting radii form one
// continuous, organic flow around the wordmark.
function makeContour(index: number) {
  const lane = (index - 20) / 20;
  const rotation = (-34 + lane * 8) * (Math.PI / 180);
  const points = Array.from({ length: 145 }, (_, step) => {
    const angle = (step / 144) * Math.PI * 2;
    const radiusX = 194 + lane * 29 + Math.sin(angle * 2) * 17;
    const radiusY = 143 + lane * 30 + Math.cos(angle * 3) * 8;
    const x = radiusX * Math.cos(angle) + Math.sin(angle * 2) * 28;
    const y = radiusY * Math.sin(angle) + Math.cos(angle * 2) * 28;
    const rotatedX = 300 + x * Math.cos(rotation) - y * Math.sin(rotation);
    const rotatedY = 305 + x * Math.sin(rotation) + y * Math.cos(rotation);
    return `${step === 0 ? 'M' : 'L'} ${rotatedX.toFixed(2)} ${rotatedY.toFixed(2)}`;
  });
  return `${points.join(' ')} Z`;
}

const contours = Array.from({ length: 41 }, (_, index) => makeContour(index));
const particles = [
  { path: 2, duration: '22s', begin: '-4s', radius: 2.3, x: 173, y: 247 },
  { path: 12, duration: '28s', begin: '-16s', radius: 1.5, x: 425, y: 373 },
  { path: 27, duration: '24s', begin: '-7s', radius: 2, x: 235, y: 454 },
  { path: 37, duration: '33s', begin: '-24s', radius: 1.3, x: 386, y: 133 },
];

export default function FlowArtwork({ paused = false }: FlowArtworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();
  const still = paused || Boolean(reducedMotion);
  const uniqueId = useId().replace(/:/g, '');
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 65, damping: 22, mass: 0.7 });
  const smoothY = useSpring(y, { stiffness: 65, damping: 22, mass: 0.7 });

  useEffect(() => {
    const svg = svgRef.current;
    if (still) svg?.pauseAnimations();
    else svg?.unpauseAnimations();
  }, [still]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || still) {
      x.set(0);
      y.set(0);
      return;
    }

    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const bounds = container.getBoundingClientRect();
      x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 19);
      y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 19);
    };
    const reset = () => {
      x.set(0);
      y.set(0);
    };

    container.addEventListener('pointermove', move);
    container.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    return () => {
      container.removeEventListener('pointermove', move);
      container.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
    };
  }, [still, x, y]);

  return (
    <div
      ref={containerRef}
      className="flow-art"
      data-still={still ? 'true' : 'false'}
      aria-hidden="true"
    >
      <div className="flow-art-field" />
      <motion.div className="flow-art-plane" style={{ x: smoothX, y: smoothY }}>
        <svg ref={svgRef} className="flow-art-svg" viewBox="0 0 600 620" fill="none">
          <defs>
            <linearGradient id={`${uniqueId}-thread`} x1="90" y1="90" x2="490" y2="480" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#f4f3ee" stopOpacity="0.13" />
              <stop offset="0.28" stopColor="#f4f3ee" stopOpacity="0.88" />
              <stop offset="0.55" stopColor="#f4f3ee" stopOpacity="0.24" />
              <stop offset="0.78" stopColor="#f4f3ee" stopOpacity="0.66" />
              <stop offset="1" stopColor="#f4f3ee" stopOpacity="0.09" />
            </linearGradient>
            <linearGradient id={`${uniqueId}-orbit`} x1="30" y1="150" x2="520" y2="470" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f4f3ee" stopOpacity="0" />
              <stop offset="0.35" stopColor="#f4f3ee" stopOpacity="0.27" />
              <stop offset="0.72" stopColor="#f4f3ee" stopOpacity="0.04" />
              <stop offset="1" stopColor="#f4f3ee" stopOpacity="0.28" />
            </linearGradient>
          </defs>

          <g className="flow-art-coordinates" stroke="#f4f3ee" strokeOpacity="0.12" strokeWidth="0.6">
            <path d="M300 39V65 M300 546V571 M34 305H60 M542 305H568" />
            <path d="M84 91h9m-4.5-4.5v9M507 506h9m-4.5-4.5v9M81 511h9m-4.5-4.5v9M509 98h9m-4.5-4.5v9" />
            <circle cx="300" cy="305" r="249" strokeDasharray="1 9" strokeOpacity="0.11" />
          </g>

          <g className="flow-art-orbits">
            <ellipse cx="300" cy="305" rx="271" ry="107" transform="rotate(-34 300 305)" stroke={`url(#${uniqueId}-orbit)`} strokeWidth="0.7" />
            <ellipse cx="300" cy="305" rx="243" ry="203" transform="rotate(25 300 305)" stroke={`url(#${uniqueId}-orbit)`} strokeWidth="0.6" />
            <path d="M128 480C19 385 88 174 218 122" stroke="#f4f3ee" strokeOpacity="0.1" strokeWidth="0.7" />
          </g>

          <g className="flow-art-contours" stroke={`url(#${uniqueId}-thread)`} strokeWidth="0.7">
            {contours.map((path, index) => (
              <path key={index} id={`${uniqueId}-contour-${index}`} d={path} opacity={0.42 + (index % 5) * 0.1} />
            ))}
            {particles.map((particle, index) => (
              <circle key={index} r={particle.radius} cx={reducedMotion ? particle.x : 0} cy={reducedMotion ? particle.y : 0} fill="#f4f3ee" stroke="none" opacity={0.9}>
                {!reducedMotion && (
                  <animateMotion dur={particle.duration} begin={particle.begin} repeatCount="indefinite" rotate="auto">
                    <mpath href={`#${uniqueId}-contour-${particle.path}`} />
                  </animateMotion>
                )}
              </circle>
            ))}
          </g>

          <g className="flow-art-connections" stroke="#f4f3ee" strokeOpacity="0.19" strokeWidth="0.6">
            <path d="M170 163L148 137H105" />
            <path d="M442 251L476 227H519" />
            <path d="M197 446L175 471H112" />
            <circle cx="170" cy="163" r="3" fill="#f4f3ee" stroke="none" />
            <circle cx="442" cy="251" r="3" fill="#f4f3ee" stroke="none" />
            <circle cx="197" cy="446" r="3" fill="#f4f3ee" stroke="none" />
          </g>

          <g className="flow-art-center-rings" stroke="#f4f3ee">
            <circle cx="300" cy="305" r="77" strokeOpacity="0.045" strokeWidth="0.6" />
            <circle cx="300" cy="305" r="64" strokeOpacity="0.12" strokeWidth="0.6" />
            <path d="M294 225h12m-6-6v12" strokeOpacity="0.3" strokeWidth="0.8" />
          </g>
          <circle className="flow-art-dot flow-art-dot-one" cx="300" cy="56" r="1.5" fill="#f4f3ee" />
          <circle className="flow-art-dot flow-art-dot-two" cx="540" cy="368" r="1.2" fill="#f4f3ee" />
          <circle className="flow-art-dot flow-art-dot-three" cx="74" cy="353" r="1.1" fill="#f4f3ee" />
        </svg>

        <div className="flow-art-core">
          <span className="flow-art-wordmark"><img src={logo} alt="" draggable={false} /></span>
          <span className="flow-art-core-caption">tudo se conecta.</span>
        </div>

        <div className="flow-art-label flow-art-label-word">
          <BookOpen size={13} strokeWidth={1.5} />
          <span>Palavra</span>
          <i />
        </div>
        <div className="flow-art-label flow-art-label-purpose">
          <Compass size={13} strokeWidth={1.5} />
          <span>Propósito</span>
        </div>
        <div className="flow-art-label flow-art-label-connection">
          <Users size={13} strokeWidth={1.5} />
          <span>Conexão</span>
        </div>

        <div className="flow-art-footnote"><span>01 — UM NOVO FLUXO</span><span>∞</span></div>
      </motion.div>
    </div>
  );
}
