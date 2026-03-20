import { useWeb3 } from "@/contexts/Web3Context";
import { formatEther } from "ethers";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Ticket, Users, Clock, Coins, Shield, CircleDot, Copy, Check, Wallet, TrendingUp } from "lucide-react";
import { LOTTERY_CONTRACT_ADDRESS, OM_TOKEN_ADDRESS } from "../../config/contract";

// ─── Animation variants ───────────────────────────────────
const statVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

// ─── Types ────────────────────────────────────────────────
type Accent = "primary" | "secondary" | "accent" | "success" | "warning";

interface StatCardProps {
  icon:       React.ReactNode;
  label:      string;
  value:      string;
  sub?:       string;
  index:      number;
  accent?:    Accent;
  copyable?:  string;
  highlight?: boolean;
  showWhen?:  boolean;
}

// ─── Accent styles ────────────────────────────────────────
const accentClasses: Record<Accent, string> = {
  primary:   "text-primary     bg-primary/10",
  secondary: "text-secondary   bg-secondary/10",
  accent:    "text-accent      bg-accent/10",
  success:   "text-emerald-400 bg-emerald-500/10",
  warning:   "text-amber-400   bg-amber-500/10",
};

// ─── StatCard ─────────────────────────────────────────────
function StatCard({ icon, label, value, sub, index, accent = "primary", copyable, highlight }: StatCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!copyable) return;
    navigator.clipboard.writeText(copyable);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      custom={index}
      variants={statVariants}
      initial="hidden"
      animate="visible"
      className={`glass rounded-xl p-4 hover:glow-primary transition-all duration-300
        ${highlight ? "border border-primary/30 bg-primary/5" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 shrink-0 mt-0.5 ${accentClasses[accent]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
          <p className={`font-bold truncate ${highlight ? "text-xl" : "text-base"}`}>
            {value}
          </p>
          {sub && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
          )}
        </div>

        {copyable && (
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-md p-1.5 hover:bg-muted/40 transition-colors mt-0.5"
            title={`Copy ${label}`}
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-emerald-400" />
              : <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            }
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Status config ────────────────────────────────────────
const STATUS_MAP: Record<number, { label: string; accent: Accent; dot: string }> = {
  0: { label: "🟢 OPEN",        accent: "success",   dot: "bg-emerald-400" },
  1: { label: "🔴 CLOSED",      accent: "accent",    dot: "bg-red-400"     },
  2: { label: "🔐 BLOCKED",     accent: "warning",   dot: "bg-orange-400"  },
  3: { label: "🔮 CALCULATING", accent: "secondary", dot: "bg-violet-400"  },
};

// ─── Main component ───────────────────────────────────────
export function LotteryStats() {
  const { lotteryData, account, lotteryContract } = useWeb3();

  if (!lotteryData || !account) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Connect your wallet to view lottery stats</p>
      </div>
    );
  }

  const poolEth = Number(formatEther(lotteryData.prizePool)).toFixed(4);


  // ── State flags ──────────────────────────────────────────
  const lotteryState  = lotteryData.lotteryState;
  const isOpen        = lotteryState === 0;
  const isCalculating = lotteryState === 3;
  const isActive      = isOpen || isCalculating;

  const hasStarted = Number(lotteryData.lastTimeStamp) > 0;
  const elapsed    = Math.floor(Date.now() / 1000) - Number(lotteryData.lastTimeStamp);
  const remaining  = Number(lotteryData.interval) - elapsed;

  // ✅ time is up but on-chain state is still OPEN — waiting for performUpkeep
  const isTimeUp   = isOpen && hasStarted && remaining <= 0;

  const status      = STATUS_MAP[lotteryState] ?? { label: "❓ UNKNOWN", accent: "primary" as Accent, dot: "bg-gray-400" };
  const priceEth    = formatEther(lotteryData.tokenPrice);
  const intervalMin = Number(lotteryData.interval) / 60;

  // ── Started ago ──────────────────────────────────────────
  const startedAgo = () => {
    if (!hasStarted)    return "Not started yet";
    if (remaining <= 0) return "⏳ Draw ready!";

    if (elapsed < 60)         return `${elapsed}s ago`;
    if (elapsed < 3600)       return `${Math.floor(elapsed / 60)}m ago`;
    if (elapsed < 86400)      return `${Math.floor(elapsed / 3600)}h ago`;
    if (elapsed < 86400 * 30) return `${Math.floor(elapsed / 86400)}d ago`;
    return `${Math.floor(elapsed / (86400 * 30))}mo ago`;
  };

  // ── Stats definition ─────────────────────────────────────
  const stats: Omit<StatCardProps, "index">[] = [

    // ── Highlighted key stats ────────────────────────────
     {
      icon:      <TrendingUp className="h-5 w-5" />,
      label:     "Prize Pool",
      value:     `${poolEth} ETH`,
      sub:       "from ticket sales only",  
      accent:    "success",
      highlight: true,
      showWhen:  isActive,
    },
    {
      icon:      <Ticket className="h-5 w-5" />,
      label:     "Tickets Sold",
      value:     lotteryData.totalTicketsSold.toString(),
      sub:       "this round",
      accent:    "primary",
      highlight: true,
      showWhen:  isActive,
    },
    {
      // ✅ override label + accent when time is up
      icon:      <CircleDot className="h-5 w-5" />,
      label:     "Status",
      value:     isTimeUp ? "⏳ Time's Up!"  : status.label,
      sub:       isTimeUp ? "Waiting for draw to be triggered" : undefined,
      accent:    isTimeUp ? "warning"        : status.accent,
      highlight: true,
      showWhen:  true,
    },

    // ── Draw info ────────────────────────────────────────
    {
      icon:     <Clock className="h-5 w-5" />,
      label:    "Round Started",
      value:    startedAgo(),
      sub:      hasStarted
                  ? new Date(Number(lotteryData.lastTimeStamp) * 1000).toLocaleString()
                  : undefined,
      accent:   isTimeUp ? "warning" : "primary",
      showWhen: isOpen && hasStarted,
    },
    {
      icon:     <Coins className="h-5 w-5" />,
      label:    "Token Price",
      value:    `${priceEth} ETH`,
      sub:      "per 1 OMTK",
      accent:   "accent",
      showWhen: isOpen,
    },
    {
      icon:     <Users className="h-5 w-5" />,
      label:    "Min Tickets",
      value:    lotteryData.minimumTickets.toString(),
      sub:      "to enter",
      accent:   "secondary",
      showWhen: isOpen,
    },

    // ── Addresses (always show) ──────────────────────────
    {
      icon:     <Shield className="h-5 w-5" />,
      label:    "Owner",
      value:    `${lotteryData.owner.slice(0, 6)}...${lotteryData.owner.slice(-4)}`,
      accent:   "secondary",
      copyable: lotteryData.owner,
    },
    {
      icon:     <Wallet className="h-5 w-5" />,
      label:    "Fee Wallet",
      value:    `${lotteryData.feeWallet.slice(0, 6)}...${lotteryData.feeWallet.slice(-4)}`,
      accent:   "secondary",
      copyable: lotteryData.feeWallet,
    },
    {
      icon:     <Shield className="h-5 w-5" />,
      label:    "Lottery Contract",
      value:    `${LOTTERY_CONTRACT_ADDRESS.slice(0, 6)}...${LOTTERY_CONTRACT_ADDRESS.slice(-4)}`,
      accent:   "secondary",
      copyable: LOTTERY_CONTRACT_ADDRESS,
    },
    {
      icon:     <Coins className="h-5 w-5" />,
      label:    "OM Token",
      value:    `${OM_TOKEN_ADDRESS.slice(0, 6)}...${OM_TOKEN_ADDRESS.slice(-4)}`,
      accent:   "accent",
      copyable: OM_TOKEN_ADDRESS,
    },
  ];

  const highlightedStats = stats.filter(s =>  s.highlight && s.showWhen !== false);
  const secondaryStats   = stats.filter(s => !s.highlight && !s.copyable && s.showWhen !== false);
  const addressStats     = stats.filter(s =>  s.copyable);

  return (
    <div className="space-y-3">

      {/* ── Highlighted key stats ─────────────────────── */}
      {highlightedStats.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {highlightedStats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} />
          ))}
        </div>
      )}

      {/* ── Secondary stats ───────────────────────────── */}
      {secondaryStats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {secondaryStats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i + 3} />
          ))}
        </div>
      )}

      {/* ── Address cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {addressStats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i + 6} />
        ))}
      </div>

    </div>
  );
}