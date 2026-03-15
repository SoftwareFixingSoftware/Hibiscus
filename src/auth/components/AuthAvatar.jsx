import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AuthAvatar — focused update
 * - head tilts naturally on email focus (correct pivot)
 * - pupils move upward when email focused (looks up)
 * - advanced blink: micro-blinks + occasional slow blinks (professional + entertaining)
 * - password focus still forces eyes closed
 *
 * Props:
 *  - username, eyesClosed (override boolean), state, emotion,
 *  - skinTone, hairColor, size, autoBlink, hairStyle
 */
export default function AuthAvatar({
  username = "",
  eyesClosed: eyesClosedProp,
  state = "idle",
  emotion = "neutral",
  skinTone = "#FFDBCB",
  hairColor = "#2C1F14",
  size = 220,
  autoBlink = true,
  hairStyle = "short",
}) {
  const svgRef = useRef(null);
  const mounted = useRef(true);

  // interaction: idle | emailFocus | passwordFocus
  const [interactionState, setInteractionState] = useState("idle");

  // auto blink state (internal). If eyesClosedProp is provided boolean, it overrides internal logic.
  const [eyesClosedAuto, setEyesClosedAuto] = useState(false);
  const eyesClosed = typeof eyesClosedProp === "boolean" ? eyesClosedProp : eyesClosedAuto || interactionState === "passwordFocus";

  // gaze target (0..1)
  const [gaze, setGaze] = useState({ x: 0.5, y: 0.5 });

  // mouth & brow maps
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
  const browByEmotion = useMemo(() => ({ neutral: 78, happy: 74, sad: 84, surprised: 72, angry: 72 }), []);

  // head tilt pivot: originY pushed downward so tilt looks natural
  const avatarVariants = {
    idle: { rotate: 0, y: 0 },
    shake: { x: [0, -14, 14, -10, 10, 0], transition: { duration: 0.6, type: "spring", stiffness: 320, damping: 26 } },
    nod: { rotate: [0, 6, 0, -6, 0], transition: { duration: 0.9, type: "spring", stiffness: 260, damping: 20 } },
    walkAway: { x: 400, opacity: 0, transition: { duration: 0.45, ease: "easeIn" } },
    emailFocus: { rotate: -10, y: -6, transition: { duration: 0.26, type: "spring", stiffness: 220, damping: 20 } }, // natural lean left
    passwordFocus: { rotate: 0, y: 0 },
  };

  // hair tiny sway for life
  const hairSway = {
    animate: { rotate: [0, -1.2, 0, 1.0, 0] },
    transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
    initial: { rotate: 0 },
  };

  // advanced blink scheduler (micro + occasional slow blink)
  useEffect(() => {
    if (!autoBlink || typeof eyesClosedProp === "boolean") return;
    let timer = null;
    mounted.current = true;

    const scheduleNext = () => {
      // choose interval: mostly 2.5-5s, occasionally longer (slow blink chance)
      const slowChance = Math.random() < 0.12; // 12% chance slow blink
      const interval = slowChance ? 3500 + Math.random() * 4200 : 2000 + Math.random() * 3700;
      timer = setTimeout(() => {
        if (!mounted.current) return;
        if (interactionState !== "passwordFocus") {
          const slow = Math.random() < 0.15 || slowChance; // sometimes a slow blink
          setEyesClosedAuto(true);
          // slow = longer closed time; micro-blink = very short
          setTimeout(() => {
            setEyesClosedAuto(false);
            // sometimes chain a quick micro-blink right after for "entertaining" effect
            if (!slow && Math.random() < 0.18) {
              setTimeout(() => setEyesClosedAuto(true), 120 + Math.random() * 80);
              setTimeout(() => setEyesClosedAuto(false), 220 + Math.random() * 80);
            }
            scheduleNext();
          }, slow ? (200 + Math.random() * 240) : (80 + Math.random() * 70));
        } else {
          // if password focused remain open state handled elsewhere; reschedule quickly
          scheduleNext();
        }
      }, interval);
    };

    scheduleNext();
    return () => {
      mounted.current = false;
      clearTimeout(timer);
    };
  }, [autoBlink, eyesClosedProp, interactionState]);

  // gaze tracking and interaction-based overrides
  useEffect(() => {
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
        // subtle mapping base
        setGaze({ x: 0.25 + tx * 0.5, y: 0.34 + ty * 0.4 });
      });
    };

    const onLeave = () => {
      // if email focused keep eyes elevated and centered horizontally
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
  }, [interactionState]);

  // DOM focus listener for form inputs (email/password)
  useEffect(() => {
    const matchesEmail = (el) => {
      if (!el) return false;
      const tag = el.tagName && el.tagName.toLowerCase();
      if (tag !== "input" && tag !== "textarea") return false;
      const type = (el.getAttribute("type") || "").toLowerCase();
      const id = (el.id || "").toLowerCase();
      const name = (el.name || "").toLowerCase();
      if (type === "email") return true;
      if (id.includes("email") || name.includes("email")) return true;
      return false;
    };
    const matchesPassword = (el) => {
      if (!el) return false;
      const tag = el.tagName && el.tagName.toLowerCase();
      if (tag !== "input" && tag !== "textarea") return false;
      const type = (el.getAttribute("type") || "").toLowerCase();
      const id = (el.id || "").toLowerCase();
      const name = (el.name || "").toLowerCase();
      if (type === "password") return true;
      if (id.includes("password") || name.includes("password")) return true;
      return false;
    };

    const onFocusIn = (ev) => {
      const t = ev.target;
      if (matchesEmail(t)) {
        setInteractionState("emailFocus");
        // immediate upward gaze for email focus
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
  }, []);

  // compute pupil offset (clamped)
  const pupilOffset = () => {
    // normalize from gaze 0..1: center 0.5 -> -1..1
    const dx = (gaze.x - 0.5) * 8; // horizontal displacement (px)
    const dy = (gaze.y - 0.5) * 6; // vertical displacement (px)
    return { dx: Math.max(-5, Math.min(5, dx)), dy: Math.max(-4, Math.min(4, dy)) };
  };
  const p = pupilOffset();
  const leftBase = { x: 78, y: 96 };
  const rightBase = { x: 122, y: 96 };

  // hair component (kept simple)
  const Hair = ({ styleType = hairStyle, color = hairColor }) => {
    const common = { fill: color, opacity: 1 };
    switch (styleType) {
      case "long":
        return (
          <g transform="translate(0,-8)">
            <path d="M40 72 C40 40 64 22 100 22 C136 22 160 40 160 72 L160 132 C160 150 142 170 100 170 C58 170 40 150 40 132 Z" {...common} />
          </g>
        );
      case "bun":
        return (
          <g>
            <path d="M60 40 C72 26 92 20 100 20 C108 20 128 26 140 40 C126 36 116 34 100 34 C84 34 74 36 60 40 Z" {...common} />
            <circle cx="100" cy="18" r="16" {...common} />
            <path d="M36 72 C36 44 60 26 100 26 C140 26 164 44 164 72 L164 110 C164 126 148 140 102 148 C62 140 44 126 36 110 Z" fill={color} />
          </g>
        );
      case "curly":
        return (
          <g transform="translate(0,-6)">
            <path d="M42 72 C42 38 64 22 100 22 C136 22 158 38 158 72 C158 110 142 138 102 152 C62 138 46 110 42 72 Z" {...common} />
          </g>
        );
      default:
        return (
          <g transform="translate(0,-6)">
            <path d="M44 68 C54 44 78 30 100 30 C122 30 146 44 156 68 C142 58 118 50 100 50 C82 50 58 58 44 68 Z" {...common} />
          </g>
        );
    }
  };

  // label displayEmotion: when emailFocus force happy; otherwise use prop
  const displayEmotion = interactionState === "emailFocus" ? "happy" : emotion;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: size }}>
      <motion.div
        initial="idle"
        animate={interactionState === "emailFocus" ? "emailFocus" : state in avatarVariants ? state : "idle"}
        variants={avatarVariants}
        style={{ transformOrigin: "50% 65%" }} // pivot around lower head for correct tilt
      >
        <svg ref={svgRef} viewBox="0 0 200 200" width={size} height={size} style={{ display: "block", overflow: "visible", touchAction: "none" }} role="img" aria-label="User avatar">
          <defs>
            <radialGradient id="skinGrad" cx="40%" cy="30%">
              <stop offset="0%" stopColor={skinTone} stopOpacity="1" />
              <stop offset="100%" stopColor={skinTone} stopOpacity="0.96" />
            </radialGradient>
            <linearGradient id="hairGrad" x1="0" x2="1">
              <stop offset="0%" stopColor={hairColor} stopOpacity="1" />
              <stop offset="100%" stopColor="#111" stopOpacity="0.85" />
            </linearGradient>
            <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity="0.18" />
            </filter>
            <clipPath id="faceClip">
              <path d="M100 26 C64 26 44 56 44 94 C44 132 64 162 100 162 C136 162 156 132 156 94 C156 56 136 26 100 26 Z" />
            </clipPath>
          </defs>

          {/* hair behind head with subtle sway */}
          <motion.g style={{ transformOrigin: "100px 80px" }} initial="initial" animate="animate" {...hairSway}>
            <Hair styleType={hairStyle} color={hairColor} />
          </motion.g>

          {/* head base */}
          <g>
            <path d="M100 26 C64 26 44 56 44 94 C44 132 64 162 100 162 C136 162 156 132 156 94 C156 56 136 26 100 26 Z" fill="url(#skinGrad)" stroke="#e0b497" strokeWidth="1" filter="url(#softShadow)" />
            <path d="M100 100 Q106 108 100 116" stroke="#d29a7e" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.85" />
            <ellipse cx="64" cy="116" rx="9" ry="6" fill="#FFB6C1" opacity="0.22" />
            <ellipse cx="136" cy="116" rx="9" ry="6" fill="#FFB6C1" opacity="0.22" />
          </g>

          {/* ears */}
          <path d="M36 94 C36 86 38 116 44 114 C44 102 42 100 40 94 Z" fill={skinTone} opacity="0.96" />
          <path d="M164 94 C164 86 162 116 156 114 C156 102 158 100 160 94 Z" fill={skinTone} opacity="0.96" />

          {/* eyes group (pupils animate according to gaze; when email focus gaze is upward) */}
          <g clipPath="url(#faceClip)">
            <ellipse cx="78" cy="96" rx="12" ry="8" fill="#fff" stroke="#334155" strokeWidth="1" />
            <ellipse cx="122" cy="96" rx="12" ry="8" fill="#fff" stroke="#334155" strokeWidth="1" />

            {/* pupils */}
            <motion.circle
              r="4.2"
              fill="#0f172a"
              animate={{ cx: leftBase.x + p.dx, cy: leftBase.y + p.dy }}
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              // render initial coords to avoid flicker
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

            {/* highlights */}
            <motion.circle cx={leftBase.x + p.dx - 1} cy={leftBase.y + p.dy - 1} r="1.1" fill="#fff" animate={{ opacity: eyesClosed ? 0 : 0.9 }} transition={{ duration: 0.08 }} />
            <motion.circle cx={rightBase.x + p.dx - 1} cy={rightBase.y + p.dy - 1} r="1.1" fill="#fff" animate={{ opacity: eyesClosed ? 0 : 0.9 }} transition={{ duration: 0.08 }} />

            {/* eyelid covers (blink / close) */}
            <motion.rect
              x="66"
              y="88"
              width="24"
              height="16"
              rx="8"
              fill={skinTone}
              style={{ transformOrigin: "78px 96px" }}
              animate={{ scaleY: eyesClosed ? 1 : 0 }}
              initial={false}
              transition={{ duration: 0.12 }}
            />
            <motion.rect
              x="110"
              y="88"
              width="24"
              height="16"
              rx="8"
              fill={skinTone}
              style={{ transformOrigin: "122px 96px" }}
              animate={{ scaleY: eyesClosed ? 1 : 0 }}
              initial={false}
              transition={{ duration: 0.12 }}
            />

            {/* brows: subtle change for email focus (slightly raised) */}
            <path d={`M66 ${browByEmotion[displayEmotion] - (interactionState === "emailFocus" ? 2 : 0)} Q78 ${browByEmotion[displayEmotion] - 8} 90 ${browByEmotion[displayEmotion] - (interactionState === "emailFocus" ? 2 : 0)}`} stroke="#222" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.95" />
            <path d={`M110 ${browByEmotion[displayEmotion] - (interactionState === "emailFocus" ? 2 : 0)} Q122 ${browByEmotion[displayEmotion] - 8} 134 ${browByEmotion[displayEmotion] - (interactionState === "emailFocus" ? 2 : 0)}`} stroke="#222" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.95" />
          </g>

          {/* mouth */}
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

          {/* state badges */}
          <AnimatePresence>
            {state === "happy" && (
              <motion.g initial={{ y: 0, opacity: 0, scale: 0.4 }} animate={{ y: -28, opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                <rect x="72" y="8" rx="8" width="56" height="20" fill="#059669" />
                <text x="100" y="22" fontSize="10" textAnchor="middle" fill="#fff" fontWeight="600">Success</text>
              </motion.g>
            )}
            {state === "shake" && (
              <motion.g initial={{ y: 0, opacity: 0, scale: 0.4 }} animate={{ y: -28, opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                <rect x="72" y="8" rx="8" width="56" height="20" fill="#DC2626" />
                <text x="100" y="22" fontSize="10" textAnchor="middle" fill="#fff" fontWeight="600">Invalid</text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </motion.div>

      {/* username label */}
      {username ? (
        <div style={{ marginTop: 10, textAlign: "center", width: size * 0.75 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)" }}>Hello,</div>
          <div style={{ fontSize: 15, color: "#fff", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</div>
        </div>
      ) : null}
    </div>
  );
}