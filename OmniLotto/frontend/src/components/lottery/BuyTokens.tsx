import { useState } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { parseEther, formatEther } from "ethers";
import { motion } from "framer-motion";
import { Coins, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function BuyTokens() {
  const { lotteryContract, lotteryData, refreshData } = useWeb3();
  const [ethAmount, setEthAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const ethValue = parseFloat(ethAmount);
  const isValidAmount = ethAmount && !isNaN(ethValue) && ethValue > 0;

  const estimatedTokens =
    isValidAmount && lotteryData
      ? (ethValue / parseFloat(formatEther(lotteryData.tokenPrice))).toFixed(0)
      : "0";

  const handleBuy = async () => {
    if (!lotteryContract || !isValidAmount) return;
    setIsLoading(true);
    try {
      const tx = await lotteryContract.takeTokensFromEth({ value: parseEther(ethAmount) });
      toast.info("Transaction submitted! Waiting for confirmation...");
      await tx.wait();
      toast.success(`Successfully purchased ~${estimatedTokens} OM tokens! 🎉`);
      setEthAmount("");
      await refreshData();
    } catch (err: any) {
      toast.error(err?.reason || err?.message || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-xl p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <Coins className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold">Buy OM Tokens</h2>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Purchase OM tokens with ETH to enter the lottery.
        {lotteryData && (
          <span className="ml-1 text-accent font-mono">
            1 token = {formatEther(lotteryData.tokenPrice)} ETH
          </span>
        )}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Input
            type="number"
            placeholder="ETH amount"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            className="bg-muted/50 border-border pr-12 font-mono"
            step="0.001"
            min="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            ETH
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowRight className="h-4 w-4 hidden sm:block" />
          <span className="font-mono text-primary font-semibold">~{estimatedTokens} OM</span>
        </div>

        <Button
          onClick={handleBuy}
          disabled={isLoading || !isValidAmount}
          className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-semibold gap-2"
        >
          {isLoading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Buying...</>
            : <><Coins className="h-4 w-4" /> Buy Tokens</>
          }
        </Button>
      </div>

      {/* Cost summary */}
      {isValidAmount && (
        <p className="mt-3 text-xs text-muted-foreground text-right">
          Paying <span className="text-accent font-semibold">{ethAmount} ETH</span> for{" "}
          <span className="text-primary font-semibold">~{estimatedTokens} OM</span>
        </p>
      )}
    </motion.div>
  );
}