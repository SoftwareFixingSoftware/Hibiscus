import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Helper: lighten or darken a hex color by a given percentage (0-100)
 */
function adjustColor(hex, percent) {
  // Strip the # if present
  let raw = hex.startsWith('#') ? hex.slice(1) : hex;
  // Handle 3‑digit shorthand
  if (raw.length === 3) {
    raw = raw.split('').map(c => c + c).join('');
  }
  if (raw.length !== 6) return hex; // fallback

  const num = parseInt(raw, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  // Adjust each channel
  r = Math.min(255, Math.max(0, r + (r * percent) / 100));
  g = Math.min(255, Math.max(0, g + (g * percent) / 100));
  b = Math.min(255, Math.max(0, b + (b * percent) / 100));

  return `#${((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)}`;
}

/**
 * AuthAvatar — headphones placed & styled like a real over-ear headset.
 *
 * Headphone geometry (all in 200×200 viewBox):
 *  - Head oval:  x=44..156, top y=26, ear level y≈88–108
 *  - Band arc:   M 46 80 C 46 8, 154 8, 154 80   (hugs crown, thick padded band)
 *  - Yoke arms:  thin rects sliding from band end down to cup top
 *  - Ear cups:   tall rounded rects, cx≈22 (left) / cx≈178 (right), cy≈98
 *                width=32, height=52, rx=10 — oval, spans brow→jaw
 *  - Z order:    band+yoke → head/face → ear cups (cups overlap head sides)
 *
 * Props:
 *  - username, eyesClosed (override boolean), state, emotion,
 *  - skinTone, headphoneColorLight, headphoneColorDark, theme, size, autoBlink, live
 */
export default function AuthAvatar({
  username = "",
  eyesClosed: eyesClosedProp,
  state = "idle",
  emotion = "neutral",
  skinTone = "#FFDBCB",
  // Headphone color props – now theme‑aware
  headphoneColorLight = "#222233",   // default for light mode (dark navy)
  headphoneColorDark = "#AAAAAA",    // default for dark mode (light grey)
  theme = "system",                   // 'light', 'dark', or 'system'
  size = 220,
  autoBlink = true,
  live = true,
}) {
  const svgRef = useRef(null);
  const mounted = useRef(true);

  // Detect system theme when theme="system"
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setSystemDark(e.matches);
    handler(mql); // set initial value
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  // Effective theme and headphone color
  const effectiveTheme = theme === "system"
    ? (systemDark ? "dark" : "light")
    : theme;
  const effectiveHeadphoneColor = effectiveTheme === "dark"
    ? headphoneColorDark
    : headphoneColorLight;

  // Lighter and darker variants for inner details (using the effective color)
  const hpLight = useMemo(() => adjustColor(effectiveHeadphoneColor, 20), [effectiveHeadphoneColor]); // 20% lighter
  const hpDark = useMemo(() => adjustColor(effectiveHeadphoneColor, -20), [effectiveHeadphoneColor]); // 20% darker
  const cushion = "#1a1008"; // dark leatherette cushion edge

  const [interactionState, setInteractionState] = useState("idle");
  const [eyesClosedAuto, setEyesClosedAuto] = useState(false);
  const eyesClosed =
    typeof eyesClosedProp === "boolean"
      ? eyesClosedProp
      : eyesClosedAuto || interactionState === "passwordFocus";

  const [gaze, setGaze] = useState({ x: 0.5, y: 0.5 });

  const mouthByEmotion = useMemo(
    () => ({
      neutral: "M72 142 Q100 148 128 142",
      happy: "M72 136 Q100 160 128 136",
      sad: "M72 150 Q100 138 128 150",
      surprised: "M92 138 Q100 164 108 138",
      angry: "M72 146 Q100 140 128 146",
    }),
    []
  );
  const browByEmotion = useMemo(
    () => ({ neutral: 78, happy: 74, sad: 84, surprised: 72, angry: 72 }),
    []
  );

  const avatarVariants = {
    idle: { rotate: 0, y: 0 },
    shake: {
      x: [0, -14, 14, -10, 10, 0],
      transition: { duration: 0.6, type: "spring", stiffness: 320, damping: 26 },
    },
    nod: {
      rotate: [0, 6, 0, -6, 0],
      transition: { duration: 0.9, type: "spring", stiffness: 260, damping: 20 },
    },
    walkAway: {
      x: 400,
      opacity: 0,
      transition: { duration: 0.45, ease: "easeIn" },
    },
    emailFocus: {
      rotate: -10,
      y: -6,
      transition: { duration: 0.26, type: "spring", stiffness: 220, damping: 20 },
    },
    passwordFocus: { rotate: 0, y: 0 },
  };

  // ── Auto-blink scheduler ──────────────────────────────────────────────────
  useEffect(() => {
    if (!autoBlink || !live || typeof eyesClosedProp === "boolean") return;
    let timer = null;
    mounted.current = true;

    const scheduleNext = () => {
      const slowChance = Math.random() < 0.12;
      const interval = slowChance
        ? 3500 + Math.random() * 4200
        : 2000 + Math.random() * 3700;
      timer = setTimeout(() => {
        if (!mounted.current) return;
        if (interactionState !== "passwordFocus") {
          const slow = Math.random() < 0.15 || slowChance;
          setEyesClosedAuto(true);
          setTimeout(() => {
            setEyesClosedAuto(false);
            if (!slow && Math.random() < 0.18) {
              setTimeout(() => setEyesClosedAuto(true), 120 + Math.random() * 80);
              setTimeout(() => setEyesClosedAuto(false), 220 + Math.random() * 80);
            }
            scheduleNext();
          }, slow ? 200 + Math.random() * 240 : 80 + Math.random() * 70);
        } else {
          scheduleNext();
        }
      }, interval);
    };

    scheduleNext();
    return () => {
      mounted.current = false;
      clearTimeout(timer);
    };
  }, [autoBlink, eyesClosedProp, interactionState, live]);

  // ── Gaze tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!live) return;
    const svg = svgRef.current;
    if (!svg) return;
    let raf = 0;

    const onMove = (e) => {
      const rect = svg.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const nx = (clientX - rect.left) / rect.width;
      const ny = (clientY - rect.top) / rect.height;
      const tx = Math.max(0, Math.min(1, nx));
      const ty = Math.max(0, Math.min(1, ny));
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setGaze({ x: 0.25 + tx * 0.5, y: 0.34 + ty * 0.4 });
      });
    };

    const onLeave = () => {
      if (interactionState === "emailFocus") setGaze({ x: 0.5, y: 0.18 });
      else setGaze({ x: 0.5, y: 0.5 });
    };

    svg.addEventListener("mousemove", onMove);
    svg.addEventListener("touchmove", onMove, { passive: true });
    svg.addEventListener("mouseleave", onLeave);
    svg.addEventListener("touchend", onLeave);
    return () => {
      svg.removeEventListener("mousemove", onMove);
      svg.removeEventListener("touchmove", onMove);
      svg.removeEventListener("mouseleave", onLeave);
      svg.removeEventListener("touchend", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [interactionState, live]);

  // ── DOM focus listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!live) return;

    const matchesEmail = (el) => {
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      if (tag !== "input" && tag !== "textarea") return false;
      const type = (el.getAttribute("type") || "").toLowerCase();
      const id = (el.id || "").toLowerCase();
      const name = (el.name || "").toLowerCase();
      return type === "email" || id.includes("email") || name.includes("email");
    };
    const matchesPassword = (el) => {
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      if (tag !== "input" && tag !== "textarea") return false;
      const type = (el.getAttribute("type") || "").toLowerCase();
      const id = (el.id || "").toLowerCase();
      const name = (el.name || "").toLowerCase();
      return (
        type === "password" ||
        id.includes("password") ||
        name.includes("password")
      );
    };

    const onFocusIn = (ev) => {
      const t = ev.target;
      if (matchesEmail(t)) {
        setInteractionState("emailFocus");
        setGaze({ x: 0.5, y: 0.18 });
      } else if (matchesPassword(t)) {
        setInteractionState("passwordFocus");
      }
    };
    const onFocusOut = (ev) => {
      const t = ev.target;
      if (matchesEmail(t) || matchesPassword(t)) {
        setInteractionState("idle");
        setGaze({ x: 0.5, y: 0.5 });
      }
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [live]);

  // ── Pupil offset ─────────────────────────────────────────────────────────
  const pupilOffset = () => {
    const dx = (gaze.x - 0.5) * 8;
    const dy = (gaze.y - 0.5) * 6;
    return { dx: Math.max(-5, Math.min(5, dx)), dy: Math.max(-4, Math.min(4, dy)) };
  };
  const p = pupilOffset();
  const leftBase = { x: 78, y: 96 };
  const rightBase = { x: 122, y: 96 };

  const displayEmotion =
    interactionState === "emailFocus" ? "happy" : emotion;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: size,
      }}
    >
      <motion.div
        initial="idle"
        animate={
          interactionState === "emailFocus"
            ? "emailFocus"
            : state in avatarVariants
            ? state
            : "idle"
        }
        variants={avatarVariants}
        style={{ transformOrigin: "50% 65%" }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          width={size}
          height={size}
          style={{
            display: "block",
            overflow: "visible",
            touchAction: "none",
          }}
          role="img"
          aria-label="User avatar"
        >
          <defs>
            <radialGradient id="skinGrad" cx="40%" cy="30%">
              <stop offset="0%" stopColor={skinTone} stopOpacity="1" />
              <stop offset="100%" stopColor={skinTone} stopOpacity="0.96" />
            </radialGradient>

            {/* Head shadow */}
            <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity="0.18" />
            </filter>

            {/* Ear-cup depth shadow */}
            <filter id="cupShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.45" />
            </filter>

            {/* Headband depth shadow */}
            <filter id="bandShadow" x="-20%" y="-40%" width="140%" height="180%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.35" />
            </filter>

            <clipPath id="faceClip">
              <path d="M100 26 C64 26 44 56 44 94 C44 132 64 162 100 162 C136 162 156 132 156 94 C156 56 136 26 100 26 Z" />
            </clipPath>

            {/* Cup face gradient — gives the oval a 3-D convex feel */}
            <radialGradient id="cupGradL" cx="38%" cy="35%" r="55%">
              <stop offset="0%"   stopColor={hpLight} stopOpacity="1" />
              <stop offset="100%" stopColor={hpDark}  stopOpacity="1" />
            </radialGradient>
            <radialGradient id="cupGradR" cx="62%" cy="35%" r="55%">
              <stop offset="0%"   stopColor={hpLight} stopOpacity="1" />
              <stop offset="100%" stopColor={hpDark}  stopOpacity="1" />
            </radialGradient>

            {/* Band top-face gradient — padded top highlight */}
            <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={hpLight} stopOpacity="1" />
              <stop offset="60%"  stopColor={effectiveHeadphoneColor} stopOpacity="1" />
              <stop offset="100%" stopColor={hpDark}  stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* ═══════════════════════════════════════════════════════
              LAYER 1 — HEADBAND + YOKE ARMS  (behind the head)
              Band arc:  M 46 82 C 46 4, 154 4, 154 82
              This puts the band crown at y≈4 (above viewBox top),
              endpoints at x=46/154, y=82 — mid-skull height.
              The thick stroke + filter gives a padded-cushion look.
          ═══════════════════════════════════════════════════════ */}

          {/* Padded headband — thick outer shell */}
          <path
            d="M 46 82 C 46 4, 154 4, 154 82"
            fill="none"
            stroke={effectiveHeadphoneColor}
            strokeWidth="16"
            strokeLinecap="round"
            filter="url(#bandShadow)"
          />
          {/* Band top highlight strip */}
          <path
            d="M 48 82 C 48 10, 152 10, 152 82"
            fill="none"
            stroke={hpLight}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.55"
          />
          {/* Band inner shadow strip */}
          <path
            d="M 50 82 C 50 14, 150 14, 150 82"
            fill="none"
            stroke={hpDark}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Left yoke arm — from band end (46,82) angling to left cup top-right corner ~(42,78) */}
          <path
            d="M 46 82 L 30 78"
            stroke={effectiveHeadphoneColor}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 46 82 L 30 78"
            stroke={hpLight}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />

          {/* Right yoke arm */}
          <path
            d="M 154 82 L 170 78"
            stroke={effectiveHeadphoneColor}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 154 82 L 170 78"
            stroke={hpLight}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />

          {/* ═══════════════════════════════════════════════════════
              LAYER 2 — HEAD & FACE
          ═══════════════════════════════════════════════════════ */}

          {/* Head base */}
          <path
            d="M100 26 C64 26 44 56 44 94 C44 132 64 162 100 162 C136 162 156 132 156 94 C156 56 136 26 100 26 Z"
            fill="url(#skinGrad)"
            stroke="#e0b497"
            strokeWidth="1"
            filter="url(#softShadow)"
          />

          {/* Nose */}
          <path
            d="M100 100 Q106 108 100 116"
            stroke="#d29a7e"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />

          {/* Cheek blush */}
          <ellipse cx="64"  cy="116" rx="9" ry="6" fill="#FFB6C1" opacity="0.22" />
          <ellipse cx="136" cy="116" rx="9" ry="6" fill="#FFB6C1" opacity="0.22" />

          {/* Ears (will be covered by cups) */}
          <path d="M36 94 C36 86 38 116 44 114 C44 102 42 100 40 94 Z" fill={skinTone} opacity="0.96" />
          <path d="M164 94 C164 86 162 116 156 114 C156 102 158 100 160 94 Z" fill={skinTone} opacity="0.96" />

          {/* Eyes */}
          <g clipPath="url(#faceClip)">
            {/* Eye whites */}
            <ellipse cx="78"  cy="96" rx="12" ry="8" fill="#fff" stroke="#334155" strokeWidth="1" />
            <ellipse cx="122" cy="96" rx="12" ry="8" fill="#fff" stroke="#334155" strokeWidth="1" />

            {/* Pupils */}
            <motion.circle
              r="4.2"
              fill="#0f172a"
              animate={{ cx: leftBase.x + p.dx, cy: leftBase.y + p.dy }}
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              cx={leftBase.x}
              cy={leftBase.y}
            />
            <motion.circle
              r="4.2"
              fill="#0f172a"
              animate={{ cx: rightBase.x + p.dx, cy: rightBase.y + p.dy }}
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              cx={rightBase.x}
              cy={rightBase.y}
            />

            {/* Highlights */}
            <motion.circle
              cx={leftBase.x + p.dx - 1}
              cy={leftBase.y + p.dy - 1}
              r="1.1"
              fill="#fff"
              animate={{ opacity: eyesClosed ? 0 : 0.9 }}
              transition={{ duration: 0.08 }}
            />
            <motion.circle
              cx={rightBase.x + p.dx - 1}
              cy={rightBase.y + p.dy - 1}
              r="1.1"
              fill="#fff"
              animate={{ opacity: eyesClosed ? 0 : 0.9 }}
              transition={{ duration: 0.08 }}
            />

            {/* Eyelid covers */}
            <motion.rect
              x="66" y="88" width="24" height="16" rx="8"
              fill={skinTone}
              style={{ transformOrigin: "78px 96px" }}
              animate={{ scaleY: eyesClosed ? 1 : 0 }}
              initial={false}
              transition={{ duration: 0.12 }}
            />
            <motion.rect
              x="110" y="88" width="24" height="16" rx="8"
              fill={skinTone}
              style={{ transformOrigin: "122px 96px" }}
              animate={{ scaleY: eyesClosed ? 1 : 0 }}
              initial={false}
              transition={{ duration: 0.12 }}
            />

            {/* Brows */}
            <path
              d={`M66 ${browByEmotion[displayEmotion] - (interactionState === "emailFocus" ? 2 : 0)} Q78 ${browByEmotion[displayEmotion] - 8} 90 ${browByEmotion[displayEmotion] - (interactionState === "emailFocus" ? 2 : 0)}`}
              stroke="#222" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.95"
            />
            <path
              d={`M110 ${browByEmotion[displayEmotion] - (interactionState === "emailFocus" ? 2 : 0)} Q122 ${browByEmotion[displayEmotion] - 8} 134 ${browByEmotion[displayEmotion] - (interactionState === "emailFocus" ? 2 : 0)}`}
              stroke="#222" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.95"
            />
          </g>

          {/* Mouth */}
          <motion.path
            d={mouthByEmotion[displayEmotion] || mouthByEmotion.neutral}
            stroke="#8B5E3C"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={false}
            animate={{ d: mouthByEmotion[displayEmotion] || mouthByEmotion.neutral }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          />

          {/* ═══════════════════════════════════════════════════════
              LAYER 3 — EAR CUPS  (in front of head, covering ears)

              Cups: width=28, height=44, rx=9
              Left cup:  x=14, y=75  (right edge=42, ~2px overlap onto face at x=44)
              Right cup: x=158, y=75 (left edge=158, ~2px overlap onto face at x=156)
              Vertical centre: y=75+22=97 — sits right over the ear anatomy
          ═══════════════════════════════════════════════════════ */}

          {/* ── LEFT EAR CUP ── */}
          <g filter="url(#cupShadow)">
            {/* Outer shell */}
            <rect
              x="14" y="75"
              width="28" height="44"
              rx="9"
              fill={effectiveHeadphoneColor}
            />
            {/* Face gradient overlay — 3-D convex look */}
            <rect
              x="14" y="75"
              width="28" height="44"
              rx="9"
              fill="url(#cupGradL)"
              opacity="0.75"
            />
            {/* Cushion ring — leatherette padding visible at edge */}
            <rect
              x="14" y="75"
              width="28" height="44"
              rx="9"
              fill="none"
              stroke={cushion}
              strokeWidth="4"
              opacity="0.8"
            />
            {/* Inner recessed driver housing */}
            <rect
              x="20" y="81"
              width="16" height="32"
              rx="5"
              fill={hpDark}
            />
            {/* Driver mesh — 3×3 dot grid scaled to housing */}
            {[0,1,2].map(row =>
              [0,1,2].map(col => (
                <circle
                  key={`L-${row}-${col}`}
                  cx={24 + col * 4}
                  cy={88 + row * 9}
                  r="1.2"
                  fill={hpLight}
                  opacity="0.55"
                />
              ))
            )}
            {/* Specular highlight — top-left glint */}
            <ellipse
              cx="21" cy="82"
              rx="4" ry="2.2"
              fill="#fff"
              opacity="0.11"
              transform="rotate(-15,21,82)"
            />
            {/* Bottom port detail */}
            <circle cx="28" cy="113" r="1.6" fill={hpLight} opacity="0.45" />
          </g>

          {/* ── RIGHT EAR CUP ── */}
          <g filter="url(#cupShadow)">
            {/* Outer shell */}
            <rect
              x="158" y="75"
              width="28" height="44"
              rx="9"
              fill={effectiveHeadphoneColor}
            />
            {/* Face gradient overlay */}
            <rect
              x="158" y="75"
              width="28" height="44"
              rx="9"
              fill="url(#cupGradR)"
              opacity="0.75"
            />
            {/* Cushion ring */}
            <rect
              x="158" y="75"
              width="28" height="44"
              rx="9"
              fill="none"
              stroke={cushion}
              strokeWidth="4"
              opacity="0.8"
            />
            {/* Inner recessed driver housing */}
            <rect
              x="164" y="81"
              width="16" height="32"
              rx="5"
              fill={hpDark}
            />
            {/* Driver mesh */}
            {[0,1,2].map(row =>
              [0,1,2].map(col => (
                <circle
                  key={`R-${row}-${col}`}
                  cx={168 + col * 4}
                  cy={88 + row * 9}
                  r="1.2"
                  fill={hpLight}
                  opacity="0.55"
                />
              ))
            )}
            {/* Specular highlight */}
            <ellipse
              cx="163" cy="82"
              rx="4" ry="2.2"
              fill="#fff"
              opacity="0.11"
              transform="rotate(15,163,82)"
            />
            {/* Bottom port detail */}
            <circle cx="172" cy="113" r="1.6" fill={hpLight} opacity="0.45" />
          </g>

          {/* ═══════════════════════════════════════════════════════
              LAYER 4 — STATE BADGES
          ═══════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {state === "happy" && (
              <motion.g
                initial={{ y: 0, opacity: 0, scale: 0.4 }}
                animate={{ y: -28, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
              >
                <rect x="72" y="8" rx="8" width="56" height="20" fill="#059669" />
                <text x="100" y="22" fontSize="10" textAnchor="middle" fill="#fff" fontWeight="600">
                  Success
                </text>
              </motion.g>
            )}
            {state === "shake" && (
              <motion.g
                initial={{ y: 0, opacity: 0, scale: 0.4 }}
                animate={{ y: -28, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
              >
                <rect x="72" y="8" rx="8" width="56" height="20" fill="#DC2626" />
                <text x="100" y="22" fontSize="10" textAnchor="middle" fill="#fff" fontWeight="600">
                  Invalid
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </motion.div>

      {/* Username label */}
      {username ? (
        <div style={{ marginTop: 10, textAlign: "center", width: size * 0.75 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)" }}>Hello,</div>
          <div
            style={{
              fontSize: 15,
              color: "#fff",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {username}
          </div>
        </div>
      ) : null}
    </div>
  );
}