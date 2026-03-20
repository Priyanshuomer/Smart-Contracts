// src/components/lottery/WinnersList.tsx
import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";

export function WinnersList() {
  const { lotteryContract, lotteryData } = useWeb3();
  const [winners, setWinners] = useState<[string, string][]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!lotteryContract) return;
    const fetchWinners = async () => {
      try {
        const data: [string, string][] = await lotteryContract.viewAllWinners();
        setWinners(data); // ✅ keep original order, last index = most recent
      } catch (err) {
        console.error("Failed to fetch winners:", err);
      }
    };
    fetchWinners();
  }, [lotteryContract, lotteryData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass rounded-xl p-6"
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <Trophy className="h-5 w-5 text-yellow-400" />
        <h2 className="text-lg font-bold flex-1">All Winners</h2>
        <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-mono text-yellow-400">
          {winners.length} rounds
        </span>
        {isExpanded
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {winners.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground text-center py-4">
                No winners yet — be part of the first draw!
              </p>
            ) : (
              <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
                {[...winners].reverse().map((pair, roundIndex) => {
                  const round = winners.length - roundIndex; // ✅ Round 1 = oldest, highest = latest
                  const isLatest = roundIndex === 0;          // ✅ first displayed = most recent

                  return (
                    <motion.div
                      key={roundIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: roundIndex * 0.05 }}
                      className={`rounded-lg border px-3 py-2 transition-all
                        ${isLatest
                          ? "border-yellow-400/40 bg-yellow-400/10 shadow-[0_0_12px_rgba(250,204,21,0.15)]"
                          : "border-yellow-400/10 bg-yellow-400/5"
                        }`}
                    >
                      {/* Round label */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold tracking-widest uppercase
                          ${isLatest ? "text-yellow-400" : "text-yellow-400/50"}`}>
                          Round #{round}
                        </span>
                        {isLatest && (
                          <motion.span
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-400/25 text-yellow-300 font-bold tracking-wide border border-yellow-400/30"
                          >
                            ✨ LATEST
                          </motion.span>
                        )}
                      </div>

                      {/* Two winners */}
                      <div className="flex flex-col gap-1">
                        {pair.map((addr, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-sm">{i === 0 ? "🥇" : "🥈"}</span>
                            <span className={`font-mono text-xs
                              ${isLatest ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                              {addr.slice(0, 8)}...{addr.slice(-6)}
                            </span>
                            {isLatest && (
                              <span className="ml-auto text-[9px] text-yellow-400/60 font-mono">winner</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}