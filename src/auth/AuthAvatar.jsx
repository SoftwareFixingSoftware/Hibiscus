import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import '../auth/styles/auth.css';

export default function AuthAvatar({ 
  username = '', 
  eyesClosed = false, 
  state = 'idle',
  emotion = 'neutral'
}) {
  const eyeOffset = Math.min(6, Math.max(-6, (username.length - 6) / 2));
  const [mouthPath, setMouthPath] = useState("M80 112 Q100 125 120 112");

  useEffect(() => {
    switch(emotion) {
      case 'happy':
        setMouthPath("M80 105 Q100 120 120 105");
        break;
      case 'sad':
        setMouthPath("M80 120 Q100 110 120 120");
        break;
      default:
        setMouthPath("M80 112 Q100 125 120 112");
    }
  }, [emotion]);

  const avatarVariants = {
    idle: { x: 0, opacity: 1 },
    shake: { 
      x: [0, -15, 15, -15, 15, 0],
      transition: { duration: 0.6, type: 'spring' }
    },
    nod: {
      rotate: [0, 5, 0, -5, 0],
      transition: { duration: 0.8, type: 'spring' }
    },
    walkAway: { 
      x: 400, 
      opacity: 0,
      transition: { duration: 0.5, ease: "easeInOut" }
    }
  };

  const eyeVariants = {
    open: { scaleY: 1 },
    closed: { scaleY: 0.1 }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        className="relative"
        initial="idle"
        animate={state}
        variants={avatarVariants}
      >
        <AnimatePresence>
          {state === 'happy' && (
            <motion.div
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={{ y: -20, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-6 left-1/2 transform -translate-x-1/2"
            >
              <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap border border-green-400/20">
                ✓ Success!
              </div>
            </motion.div>
          )}
          {state === 'shake' && (
            <motion.div
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={{ y: -20, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-6 left-1/2 transform -translate-x-1/2"
            >
              <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap border border-red-400/20">
                ✗ Invalid
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <svg viewBox="0 0 200 200" width="140" height="140" className="drop-shadow-xl">
          <defs>
            <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFDBCB" />
              <stop offset="100%" stopColor="#FFC9AD" />
            </linearGradient>
          </defs>
          
          <circle cx="100" cy="90" r="54" fill="url(#headGradient)" stroke="#E8B89B" strokeWidth="2" />
          
          <path d="M45 70 C40 30, 160 20, 155 70 Z" fill="#5A2727" />
          
          <g transform={`translate(${eyeOffset},0)`}>
            <g>
              <ellipse cx="78" cy="90" rx="10" ry="7" fill="white" stroke="#374151" strokeWidth="1" />
              {!eyesClosed && (
                <>
                  <circle cx="78" cy="90" r="3.5" fill="#1F2937" />
                  <circle cx="78" cy="89" r="1" fill="white" />
                </>
              )}
              <motion.rect 
                x="70" 
                y="88" 
                width="16" 
                height="4" 
                rx="2" 
                fill="#1F2937"
                variants={eyeVariants}
                animate={eyesClosed ? "closed" : "open"}
                transition={{ duration: 0.2 }}
              />
            </g>
            
            <g>
              <ellipse cx="122" cy="90" rx="10" ry="7" fill="white" stroke="#374151" strokeWidth="1" />
              {!eyesClosed && (
                <>
                  <circle cx="122" cy="90" r="3.5" fill="#1F2937" />
                  <circle cx="122" cy="89" r="1" fill="white" />
                </>
              )}
              <motion.rect 
                x="114" 
                y="88" 
                width="16" 
                height="4" 
                rx="2" 
                fill="#1F2937"
                variants={eyeVariants}
                animate={eyesClosed ? "closed" : "open"}
                transition={{ duration: 0.2 }}
              />
            </g>
          </g>

          <path 
            d={mouthPath} 
            stroke="#8B5E3C" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
          
          <circle cx="65" cy="100" r="8" fill="#FFB6C1" opacity="0.3" />
          <circle cx="135" cy="100" r="8" fill="#FFB6C1" opacity="0.3" />
        </svg>
      </motion.div>
      
      <AnimatePresence>
        {username && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 text-center"
          >
            <p className="text-sm text-gray-400">Hello,</p>
            <p className="font-medium text-white truncate max-w-[120px]">
              {username || 'Guest'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
