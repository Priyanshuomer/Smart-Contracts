import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Loader2, Clock, Ticket, Coins,
  Wallet, UserCog, ShieldAlert, RefreshCw,
  RotateCcw, BadgeDollarSign, ChevronRight,
  ShieldBan, ShieldCheck, UserX, Timer,
  ChevronDown, ChevronUp, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
interface AdminAction {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  fn: string;
  type: "input" | "select";
  options?: { label: string; value: string }[];
  transform?: (v: string) => any;
  description?: string;
}

interface DangerAction {
  label: string;
  icon: React.ReactNode;
  description: string;
  fn: string;
  confirmText: string;
}

// ─── State Config ─────────────────────────────────────────
const STATE_CONFIG: Record<
  string,
  { emoji: string; color: string; bg: string; border: string; shortLabel: string }
> = {
  "0": { emoji: "🟢", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/40", shortLabel: "OPEN"     },
  "1": { emoji: "🔴", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/40",     shortLabel: "CLOSED"   },
  "2": { emoji: "🔐", color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/40",  shortLabel: "BLOCKED"  },
  "3": { emoji: "🔮", color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/40",  shortLabel: "CALC..."  },
};

// ─── Action Definitions ───────────────────────────────────
const actions: AdminAction[] = [
  {
    label: "Interval",
    icon: <Clock className="h-4 w-4" />,
    placeholder: "Seconds e.g. 3600",
    fn: "changeInterval",
    type: "input",
    description: "Time between each lottery draw",
    transform: (v) => BigInt(v),
  },
  {
    label: "Min Entry Tickets",
    icon: <Ticket className="h-4 w-4" />,
    placeholder: "e.g. 5",
    fn: "changeMinimumEntryTickets",
    type: "input",
    description: "Minimum tickets required to enter",
    transform: (v) => BigInt(v),
  },
  {
    label: "Token Price (wei)",
    icon: <Coins className="h-4 w-4" />,
    placeholder: "e.g. 10000000000000000",
    fn: "changeTokenPrice",
    type: "input",
    description: "Price of 1 token in wei (1e16 = 0.01 ETH)",
    transform: (v) => BigInt(v),
  },
  {
    label: "Fee Wallet",
    icon: <Wallet className="h-4 w-4" />,
    placeholder: "0x...",
    fn: "changeFeeWalletAddress",
    type: "input",
    description: "Address that receives the 5% fee",
  },
  {
    label: "Transfer Ownership",
    icon: <UserCog className="h-4 w-4" />,
    placeholder: "New owner 0x...",
    fn: "transferOwnerShip",
    type: "input",
    description: "Transfer contract ownership to a new address",
  },
  {
    label: "Lottery State",
    icon: <ShieldAlert className="h-4 w-4" />,
    placeholder: "Select state",
    fn: "changeState",
    type: "select",
    description: "Manually set the lottery state",
    options: [
      { label: "🟢 OPEN",        value: "0" },
      { label: "🔴 CLOSED",      value: "1" },
      { label: "🔐 BLOCKED",     value: "2" },
      { label: "🔮 CALCULATING", value: "3" },
    ],
    transform: (v) => Number(v),
  },
];

const dangerActions: DangerAction[] = [
  {
    label: "Restart Timer",
    icon: <RefreshCw className="h-4 w-4" />,
    description: "Reset the lottery interval timer to now",
    fn: "restartTimer",
    confirmText: "Yes, Restart",
  },
  {
    label: "Reset Lottery",
    icon: <RotateCcw className="h-4 w-4" />,
    description: "Wipe all players and send ETH to fee wallet",
    fn: "resetLottery",
    confirmText: "Yes, Reset",
  },
  {
    label: "Withdraw All Funds",
    icon: <BadgeDollarSign className="h-4 w-4" />,
    description: "Send all ETH in contract to fee wallet",
    fn: "withdrawAllFunds",
    confirmText: "Yes, Withdraw",
  },
];

// ─── Interval Display Helper ──────────────────────────────
function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// ─── Blocked Address Row ──────────────────────────────────
function BlockedAddressRow({
  address,
  onUnblock,
  loading,
}: {
  address: string;
  onUnblock: (addr: string) => void;
  loading: boolean;
}) {
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center justify-between gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2"
    >
      <div className="flex items-center gap-2 min-w-0">
        <UserX className="h-3.5 w-3.5 text-orange-400 shrink-0" />
        <span className="font-mono text-xs text-orange-300 truncate" title={address}>
          {short}
        </span>
      </div>
      <Button
        size="sm"
        onClick={() => onUnblock(address)}
        disabled={loading}
        className="shrink-0 h-6 px-2 text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Unblock"}
      </Button>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────
export function AdminPanel() {
  const { lotteryContract, isOwner, lotteryData, refreshData } = useWeb3();
  const [values, setValues]           = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState<string | null>(null);
  const [confirm, setConfirm]         = useState<string | null>(null);

  // Block/Unblock state
  const [blockInput, setBlockInput]   = useState("");
  const [blockedList, setBlockedList] = useState<string[]>([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Interval display
  const [intervalSecs, setIntervalSecs] = useState<number | null>(null);

  if (!isOwner) return null;

  const currentStateStr = lotteryData ? String(lotteryData.lotteryState) : null;

  // ── Fetch interval & blocked list ─────────────────────
  useEffect(() => {
    if (!lotteryContract) return;
    fetchInterval();
    fetchBlockedList();
  }, [lotteryContract]);

  const fetchInterval = async () => {
    try {
      const val = await (lotteryContract as any).getInterval();
      setIntervalSecs(Number(val));
    } catch {}
  };

  const fetchBlockedList = async () => {
    setLoadingBlocked(true);
    try {
      const list: string[] = await (lotteryContract as any).getBlockedAddresses();
      setBlockedList(list);
    } catch {
      setBlockedList([]);
    } finally {
      setLoadingBlocked(false);
    }
  };

  // ── Regular action handler ─────────────────────────────
  const handleAction = async (action: AdminAction) => {
    if (!lotteryContract) return;
    const val = values[action.fn];
    if (val === undefined || val === "") return;

    setLoading(action.fn);
    try {
      const arg = action.transform ? action.transform(val) : val;
      const tx  = await (lotteryContract as any)[action.fn](arg);
      toast.info(`Updating ${action.label}...`);
      await tx.wait();
      toast.success(`✅ ${action.label} updated!`);
      setValues((prev) => ({ ...prev, [action.fn]: "" }));
      await refreshData();
      if (action.fn === "changeInterval") fetchInterval();
    } catch (err: any) {
      toast.error(err?.reason || err?.message || "Transaction failed");
    } finally {
      setLoading(null);
    }
  };

  // ── Danger action handler ──────────────────────────────
  const handleDangerAction = async (action: DangerAction) => {
    if (!lotteryContract) return;
    setLoading(action.fn);
    try {
      const tx = await (lotteryContract as any)[action.fn]();
      toast.info(`${action.label}...`);
      await tx.wait();
      toast.success(`✅ ${action.label} done!`);
      await refreshData();
    } catch (err: any) {
      toast.error(err?.reason || err?.message || "Transaction failed");
    } finally {
      setLoading(null);
      setConfirm(null);
    }
  };

  // ── Block address ──────────────────────────────────────
  const handleBlock = async () => {
    if (!lotteryContract || !blockInput) return;
    setLoading("blockAddress");
    try {
      const tx = await (lotteryContract as any).blockAddress(blockInput);
      toast.info("Blocking address...");
      await tx.wait();
      toast.success(`🚫 Address blocked!`);
      setBlockInput("");
      await fetchBlockedList();
    } catch (err: any) {
      toast.error(err?.reason || err?.message || "Transaction failed");
    } finally {
      setLoading(null);
    }
  };

  // ── Unblock address ────────────────────────────────────
  const handleUnblock = async (addr: string) => {
    if (!lotteryContract) return;
    setLoading(`unblock_${addr}`);
    try {
      const tx = await (lotteryContract as any).unblockAddress(addr);
      toast.info("Unblocking address...");
      await tx.wait();
      toast.success(`✅ Address unblocked!`);
      await fetchBlockedList();
    } catch (err: any) {
      toast.error(err?.reason || err?.message || "Transaction failed");
    } finally {
      setLoading(null);
    }
  };

  const stateLabel = () => {
    if (!lotteryData) return "—";
    const map: Record<number, string> = {
      0: "🟢 OPEN", 1: "🔴 CLOSED", 2: "🔐 BLOCKED", 3: "🔮 CALCULATING",
    };
    return map[lotteryData.lotteryState] ?? "Unknown";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass rounded-xl p-6 border border-secondary/30"
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-secondary" />
          <h2 className="text-lg font-bold gradient-text-accent">Admin Panel</h2>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-muted/40 border border-border font-mono">
          {stateLabel()}
        </span>
      </div>

      {/* ── NEW: Interval Info Card ────────────────────── */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 py-3">
        <Timer className="h-4 w-4 text-sky-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Current Draw Interval</p>
          <p className="text-sm font-bold font-mono text-sky-300">
            {intervalSecs !== null
              ? `${formatInterval(intervalSecs)} (${intervalSecs}s)`
              : "Loading..."}
          </p>
        </div>
        <button
          onClick={fetchInterval}
          className="text-sky-400 hover:text-sky-300 transition-colors"
          title="Refresh interval"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Regular Actions ────────────────────────────── */}
      <div className="space-y-4">
        {actions.map((action) => (
          <div key={action.fn} className="rounded-lg bg-muted/10 border border-border/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-secondary">{action.icon}</span>
              <span className="text-sm font-semibold">{action.label}</span>
              {action.description && (
                <span className="text-xs text-muted-foreground">— {action.description}</span>
              )}
            </div>

            <div className="flex gap-2">
              {action.type === "select" ? (
                <div className="flex-1 flex flex-col gap-2">
                  <AnimatePresence>
                    {values[action.fn] && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono
                          ${values[action.fn] === currentStateStr
                            ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                            : `${STATE_CONFIG[values[action.fn]]?.bg} ${STATE_CONFIG[values[action.fn]]?.border} ${STATE_CONFIG[values[action.fn]]?.color}`
                          }`}
                      >
                        <span>{STATE_CONFIG[values[action.fn]]?.emoji}</span>
                        <span>{STATE_CONFIG[values[action.fn]]?.shortLabel}</span>
                        <span className="ml-auto opacity-60">
                          {values[action.fn] === currentStateStr
                            ? "⚠️ already active on-chain"
                            : "→ will be applied on Set"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {action.options?.map((opt) => {
                      const cfg                  = STATE_CONFIG[opt.value];
                      const isSelected           = values[action.fn] === opt.value;
                      const isCurrent            = opt.value === currentStateStr;
                      const isSelectedAndCurrent = isSelected && isCurrent;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setValues((prev) => ({ ...prev, [action.fn]: opt.value }))}
                          className={`
                            relative flex flex-col items-center justify-center gap-1
                            rounded-lg border px-2 py-2.5 text-xs font-mono
                            transition-all duration-200 cursor-pointer select-none
                            ${isSelectedAndCurrent
                              ? `${cfg.bg} ${cfg.border} ${cfg.color} opacity-60 scale-[1.03]`
                              : isSelected
                              ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm scale-[1.03]`
                              : isCurrent
                              ? `${cfg.bg} ${cfg.border} ${cfg.color} opacity-40`
                              : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40 hover:border-border"
                            }
                          `}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="state-active-dot"
                              className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full
                                ${{ "0": "bg-emerald-400", "1": "bg-red-400", "2": "bg-orange-400", "3": "bg-violet-400" }[opt.value]}`}
                            />
                          )}
                          {isCurrent && !isSelected && (
                            <span className="absolute top-1 right-1 text-[9px] font-bold opacity-70 tracking-wider">
                              LIVE
                            </span>
                          )}
                          <span className="text-base leading-none">{cfg.emoji}</span>
                          <span className="tracking-wide">{cfg.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Input
                  placeholder={action.placeholder}
                  value={values[action.fn] || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [action.fn]: e.target.value }))
                  }
                  className="flex-1 bg-muted/50 border-border font-mono text-sm"
                />
              )}

              <Button
                size="sm"
                onClick={() => handleAction(action)}
                disabled={loading === action.fn || !values[action.fn]}
                className="bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/30 min-w-[60px] self-end"
              >
                {loading === action.fn
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <span className="flex items-center gap-1">Set <ChevronRight className="h-3 w-3" /></span>
                }
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ── NEW: Block / Unblock Section ───────────────── */}
      <div className="mt-6 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldBan className="h-3.5 w-3.5" /> Address Management
          </p>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full border border-border/40">
            {blockedList.length} blocked
          </span>
        </div>

        {/* Block input */}
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="0x... address to block"
            value={blockInput}
            onChange={(e) => setBlockInput(e.target.value)}
            className="flex-1 bg-muted/50 border-border font-mono text-sm"
          />
          <Button
            size="sm"
            onClick={handleBlock}
            disabled={loading === "blockAddress" || !blockInput}
            className="shrink-0 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/30"
          >
            {loading === "blockAddress"
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <span className="flex items-center gap-1"><ShieldBan className="h-3.5 w-3.5" /> Block</span>
            }
          </Button>
        </div>

        {/* Blocked list toggle */}
        <button
          onClick={() => { setShowBlocked((p) => !p); if (!showBlocked) fetchBlockedList(); }}
          className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <span className="flex items-center gap-1.5">
            <UserX className="h-3.5 w-3.5 text-orange-400" />
            {showBlocked ? "Hide" : "Show"} blocked addresses
            {blockedList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-mono text-[10px]">
                {blockedList.length}
              </span>
            )}
          </span>
          {showBlocked ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        <AnimatePresence>
          {showBlocked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {loadingBlocked ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : blockedList.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    No blocked addresses
                  </div>
                ) : (
                  <AnimatePresence>
                    {blockedList.map((addr) => (
                      <BlockedAddressRow
                        key={addr}
                        address={addr}
                        onUnblock={handleUnblock}
                        loading={loading === `unblock_${addr}`}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {blockedList.length > 0 && (
                <button
                  onClick={fetchBlockedList}
                  className="mt-2 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh list
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Danger Zone ────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <p className="mb-3 text-xs font-bold text-red-400 uppercase tracking-widest">
          ⚠ Danger Zone
        </p>
        <div className="space-y-2">
          {dangerActions.map((action) => (
            <div
              key={action.fn}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-muted/10 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-red-400 shrink-0">{action.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {confirm === action.fn ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex gap-1.5 shrink-0"
                  >
                    <Button
                      size="sm"
                      onClick={() => handleDangerAction(action)}
                      disabled={loading === action.fn}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs"
                    >
                      {loading === action.fn
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : action.confirmText
                      }
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirm(null)}
                      disabled={loading === action.fn}
                      className="text-xs text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="trigger"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <Button
                      size="sm"
                      onClick={() => setConfirm(action.fn)}
                      disabled={loading !== null}
                      className="shrink-0 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs"
                    >
                      {action.label}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}