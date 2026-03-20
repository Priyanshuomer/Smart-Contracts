import { useState, useEffect, useRef } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "lucide-react";

export function CountdownTimer() {
  const { lotteryData, lotteryContract, refreshData } = useWeb3();

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [drawing, setDrawing] = useState(false);
  const [waitingForVRF, setWaitingForVRF] = useState(false);

  const triggeredRef = useRef(false);
  const lotteryDataRef = useRef(lotteryData);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    lotteryDataRef.current = lotteryData;
  }, [lotteryData]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  // ✅ 4 states: 0=OPEN, 1=CLOSED, 2=BLOCKED, 3=CALCULATING
  const lotteryState = lotteryData?.lotteryState;
  const isOpen = lotteryState === 0;

  const triggerLottery = async () => {
     setWaitingForVRF(true);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!lotteryData || !isOpen) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      if (lotteryState === 0) {
        setWaitingForVRF(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
      return;
    }

    triggeredRef.current = false;

    const tick = setInterval(() => {
      const intervalSeconds = Number(lotteryData.interval);
      const lastTimeStamp = Number(lotteryData.lastTimeStamp);
      const now = Math.floor(Date.now() / 1000);
      const remaining = intervalSeconds - (now - lastTimeStamp);

      if (remaining <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!triggeredRef.current) {
          triggeredRef.current = true;
          triggerLottery();
        }
        return;
      }

      setTimeLeft({
        days: Math.floor(remaining / 86400),
        hours: Math.floor((remaining % 86400) / 3600),
        minutes: Math.floor((remaining % 3600) / 60),
        seconds: remaining % 60,
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [lotteryData, isOpen]);

  const timeBlocks = [
    { value: pad(timeLeft.days), label: "DAYS" },
    { value: pad(timeLeft.hours), label: "HOURS" },
    { value: pad(timeLeft.minutes), label: "MINUTES" },
    { value: pad(timeLeft.seconds), label: "SECONDS" },
  ];

  // ✅ Status for each state
  const statusContent = () => {
    if (drawing)
      return {
        emoji: "🎲",
        msg: "Requesting Randomness...",
        sub: "Waiting for transaction confirmation",
        pulse: true,
      };
    if (waitingForVRF)
      return {
        emoji: "⏳",
        msg: "Summoning the Winners",
        sub: "Chainlink VRF is conjuring random numbers on-chain",
        pulse: true,
      };

    switch (lotteryState) {
      case 1: // CLOSED
        return {
          emoji: "🚫",
          msg: "Ticket Sales Closed",
          sub: "This round is no longer accepting entries",
          pulse: false,
        };
      case 2: // BLOCKED
        return {
          emoji: "🔐",
          msg: "Lottery Blocked by Owner",
          sub: "The owner has temporarily paused this lottery",
          pulse: false,
        };
      case 3: // CALCULATING
        return {
          emoji: "🔮",
          msg: "Calculating Winners...",
          sub: "The oracle is picking the lucky ones — stay tuned!",
          pulse: true,
        };
      default:
        return null;
    }
  };

  const status = statusContent();
  const showStatus = !isOpen || drawing || waitingForVRF;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 text-center shadow-xl"
    >
      <div className="mb-5 flex items-center justify-center gap-2">
        <Timer className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold">Lottery Ends In</h2>
      </div>

      {showStatus && status ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-2 py-4"
        >
          {/* Spinning emoji for active states, static for passive */}
          {status.pulse ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-4xl mb-2"
            >
              {status.emoji}
            </motion.div>
          ) : (
            <div className="text-4xl mb-2">{status.emoji}</div>
          )}

          <p className="text-xl font-semibold text-primary">{status.msg}</p>
          <p className="text-sm text-muted-foreground">{status.sub}</p>

          {/* Pulsing dots only for active/waiting states */}
          {status.pulse && (
            <div className="flex gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        // ✅ Timer shown only when OPEN
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {timeBlocks.map((item, i) => (
            <div key={item.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="bg-muted/40 backdrop-blur-lg rounded-xl px-5 py-4 min-w-[70px] shadow-inner">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={item.value}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="block text-3xl font-mono font-bold gradient-text"
                    >
                      {item.value}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <span className="mt-2 text-xs tracking-widest text-muted-foreground">
                  {item.label}
                </span>
              </div>
              {i < timeBlocks.length - 1 && (
                <span className="mx-2 text-2xl font-bold text-muted-foreground pb-5">:</span>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}