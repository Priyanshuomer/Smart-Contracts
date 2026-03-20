import { useWeb3 } from "@/contexts/Web3Context";
import { Header } from "@/components/lottery/Header";
import { LotteryStats } from "@/components/lottery/LotteryStats";
import { CountdownTimer } from "@/components/lottery/CountdownTimer";
import { BuyTokens } from "@/components/lottery/BuyTokens";
import { EnterLottery } from "@/components/lottery/EnterLottery";
import { PlayersList } from "@/components/lottery/PlayersList";
import { OM_TOKEN_ADDRESS, LOTTERY_CONTRACT_ADDRESS } from "@/config/contract";
import { WinnersList  } from "@/components/lottery/WinnersList";
import { AdminPanel } from "@/components/lottery/AdminPanel";
import { motion } from "framer-motion";
import { Wallet, ShieldX, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// ─── Blocked Screen ───────────────────────────────────────
function BlockedScreen({
  account,
  ownerAddress,
  contractAddress,
  tokenAddress,
}: {
  account: string;
  ownerAddress: string;
  contractAddress: string;
  tokenAddress: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const AddressRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/10 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="font-mono text-sm text-foreground truncate">{value}</p>
      </div>
      <button
        onClick={() => copy(label, value)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        title="Copy"
      >
        {copied === label
          ? <CheckCheck className="h-4 w-4 text-emerald-400" />
          : <Copy className="h-4 w-4" />
        }
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-[70vh] flex-col items-center justify-center"
    >
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30">
            <ShieldX className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Access Restricted</h2>
          <p className="text-muted-foreground text-sm">
            Your address has been blocked by the contract owner.
            You cannot participate in this lottery.
          </p>
        </div>

        {/* Address info */}
        <div className="glass rounded-xl border border-red-500/20 p-4 space-y-2.5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Contract Info
          </p>

          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
            <p className="text-xs text-red-400 mb-0.5">Your Blocked Address</p>
            <p className="font-mono text-sm text-red-300 break-all">{account}</p>
          </div>

          <AddressRow label="Contract Owner"       value={ownerAddress}     />
          <AddressRow label="Lottery Address"   value={contractAddress} />
          <AddressRow label="OmToken Address"      value={tokenAddress}     />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          To appeal this decision, contact the contract owner directly.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────
const Index = () => {
  const { account, isCorrectNetwork, connectWallet, isConnecting, lotteryContract } = useWeb3();

  const [isBlocked, setIsBlocked]           = useState(false);
  const [ownerAddress, setOwnerAddress]     = useState("");
  const [contractAddress, setContractAddress]           = useState("");
  const [tokenAddress, setTokenAddress]     = useState("");
  const [checkingBlock, setCheckingBlock]   = useState(false);

  // Check block status + fetch addresses whenever account or contract changes
  useEffect(() => {
    if (!lotteryContract || !account) {
      setIsBlocked(false);
      return;
    }
    checkBlockStatus();
  }, [lotteryContract, account]);

  const checkBlockStatus = async () => {
    if (!lotteryContract || !account) return;
    setCheckingBlock(true);
    try {
      const [blocked, owner, contract, token] = await Promise.all([
        (lotteryContract as any).addressBlockStatus(account),
        (lotteryContract as any).getOwner(),
        (LOTTERY_CONTRACT_ADDRESS),
        (OM_TOKEN_ADDRESS),
      ]);
      setIsBlocked(blocked);
      setOwnerAddress(owner);
      setContractAddress(contract);
      setTokenAddress(token);
    } catch {
      setIsBlocked(false);
    } finally {
      setCheckingBlock(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Ambient glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

          {/* ── Not connected ──────────────────────────── */}
          {!account ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex min-h-[60vh] flex-col items-center justify-center text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 animate-float">
                <span className="text-5xl">🎰</span>
              </div>
              <h1 className="mb-3 text-4xl font-bold sm:text-5xl">
                <span className="gradient-text">OmLottery</span>
              </h1>
              <p className="mb-8 max-w-md text-muted-foreground">
                A decentralized lottery on Sepolia. Buy tokens, enter draws, and win ETH prizes.
                Fair, transparent, and powered by Chainlink VRF.
              </p>
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg px-8 glow-primary"
              >
                <Wallet className="h-5 w-5" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            </motion.div>

          /* ── Wrong network ─────────────────────────── */
          ) : !isCorrectNetwork ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-[60vh] flex-col items-center justify-center text-center"
            >
              <p className="mb-4 text-xl font-bold text-destructive">Wrong Network</p>
              <p className="text-muted-foreground">Please switch to Sepolia testnet to use this dApp.</p>
            </motion.div>

          /* ── Checking block status ─────────────────── */
          ) : checkingBlock ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <p className="text-sm">Verifying access...</p>
              </div>
            </div>

          /* ── Blocked ───────────────────────────────── */
          ) : isBlocked ? (
            <BlockedScreen
              account={account}
              ownerAddress={ownerAddress}
              contractAddress={contractAddress}
              tokenAddress={tokenAddress}
            />

          /* ── Normal view ───────────────────────────── */
          ) : (
            <div className="space-y-6">
              <LotteryStats />
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <CountdownTimer />
                  <BuyTokens />
                  <EnterLottery />
                  <AdminPanel />
                </div>
                <div>
                  <PlayersList />
                  <WinnersList />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Index;