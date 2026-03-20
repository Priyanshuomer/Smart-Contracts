import { useWeb3 } from "@/contexts/Web3Context";
import { Wallet, LogOut, AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

export function Header() {
  const { account, isCorrectNetwork, isConnecting, connectWallet, disconnectWallet, switchToSepolia } = useWeb3();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-strong sticky top-0 z-50 px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <span className="text-xl">🎰</span>
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text sm:text-xl">OmniLotto</h1>
            <p className="text-xs text-muted-foreground">Decentralized Lottery</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {account && !isCorrectNetwork && (
            <Button
              onClick={switchToSepolia}
              size="sm"
              variant="destructive"
              className="gap-2 text-xs"
            >
              <AlertTriangle className="h-3 w-3" />
              Switch to Sepolia
            </Button>
          )}

          {/* ✅ Network badge — only show when connected and on correct network */}
          {account && isCorrectNetwork && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400">Sepolia</span>
              <span className="text-xs text-muted-foreground font-mono">#{11155111}</span>
            </div>
          )}

          {!account ? (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold"
            >
              <Wallet className="h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="text-xs font-mono text-primary">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="Copy address"
                >
                  {copied
                    ? <Check className="h-3 w-3 text-emerald-400" />
                    : <Copy className="h-3 w-3" />
                  }
                </button>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={disconnectWallet}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
 