import { useState } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { motion } from "framer-motion";
import { Ticket, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { parseEther } from "ethers";
import { LOTTERY_CONTRACT_ADDRESS } from "@/config/contract";

export function EnterLottery() {
  const { lotteryContract, tokenContract, lotteryData, tokenBalance, account, refreshData } = useWeb3();
  const [tickets, setTickets] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const ticketCount = parseInt(tickets) || 0;
  const minTickets = lotteryData ? Number(lotteryData.minimumTickets) : 0;

  // ✅ only OPEN (0) allows entry
  const isLotteryOpen = lotteryData?.lotteryState === 0;
  const isLoading = isApproving || isEntering;

  const handleEnter = async () => {
    if (!lotteryContract || !tokenContract || !account || ticketCount < minTickets || !isLotteryOpen) return;

    const requiredAmount = parseEther(ticketCount.toString());

    // Step 1 — Approve
    setIsApproving(true);
    try {
      const allowance = await tokenContract.allowance(account, LOTTERY_CONTRACT_ADDRESS);
      if (allowance < requiredAmount) {
        const approveTx = await tokenContract.approve(LOTTERY_CONTRACT_ADDRESS, requiredAmount);
        toast.info("Approving tokens... Please wait.");
        await approveTx.wait();
        toast.success("Tokens approved!");
      }
    } catch (err: any) {
      toast.error(err?.reason || "Approval failed");
      setIsApproving(false);
      return;
    }
    setIsApproving(false);

    // Step 2 — Enter Game
    setIsEntering(true);
    try {
      const tx = await lotteryContract.enterIntoGame(BigInt(ticketCount));
      toast.info("Entering lottery... Waiting for confirmation.");
      await tx.wait();
      toast.success(`Successfully entered with ${ticketCount} tickets! 🎉`);
      setTickets("");
      await refreshData();
    } catch (err: any) {
      toast.error(err?.reason || err?.message || "Failed to enter lottery");
    } finally {
      setIsEntering(false);
    }
  };

  // ✅ message per state when not open
  const closedMessage: Record<number, string> = {
    1: "🔴 Lottery is closed — not accepting tickets",
    2: "🔐 Lottery is blocked by the owner",
    3: "🔮 Draw in progress — please wait",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-xl p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <Ticket className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Enter Lottery</h2>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2">
        <span className="text-sm text-muted-foreground">Your OM Balance</span>
        <span className="font-mono font-bold text-primary">
          {(Number(tokenBalance) / 1e18).toFixed(2)} OM
        </span>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Minimum <span className="text-primary font-semibold">{minTickets}</span> tickets required to enter.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Input
            type="number"
            placeholder={`Min ${minTickets} tickets`}
            value={tickets}
            onChange={(e) => setTickets(e.target.value)}
            className="bg-muted/50 border-border font-mono"
            min={minTickets}
            disabled={!isLotteryOpen}   
          />
        </div>
        <Button
          onClick={handleEnter}
          disabled={isLoading || ticketCount < minTickets || !isLotteryOpen}   
          className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold gap-2"
        >
          {isApproving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Approving...</>
          ) : isEntering ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Entering...</>
          ) : !isLotteryOpen ? (
            <><Ticket className="h-4 w-4" /> Lottery Not Open</>   
          ) : (
            <><Check className="h-4 w-4" /> Enter Lottery</>
          )}
        </Button>
      </div>

      {/* ✅ show reason when not open */}
      {!isLotteryOpen && lotteryData && (
        <p className="mt-3 text-xs text-center text-destructive">
          {closedMessage[lotteryData.lotteryState] ?? "Lottery is unavailable"}
        </p>
      )}

      {/* Cost preview — only when open and valid ticket count */}
      {isLotteryOpen && ticketCount >= minTickets && (
        <p className="mt-3 text-xs text-muted-foreground text-right">
          Cost: <span className="text-primary font-semibold">{ticketCount} OM</span> tokens
        </p>
      )}
    </motion.div>
  );
}