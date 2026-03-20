import { useState, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { motion } from "framer-motion";
import { Users, Ticket, Crown } from "lucide-react";

interface PlayerInfo {
  address: string;
  tickets: number;
}

export function PlayersList() {
  const { lotteryContract, lotteryData, account } = useWeb3();
  const [players, setPlayers] = useState<PlayerInfo[]>([]);

  useEffect(() => {
    if (!lotteryContract || !lotteryData) return;
    const fetchPlayers = async () => {
      try {
        const [addrs, amounts]: [string[], bigint[]] =
          await lotteryContract.getAllCurrentPlayersWithAmount();

        const list: PlayerInfo[] = addrs.map((addr, i) => ({
          address: addr,
          tickets: Number(amounts[i]),
        }));

        setPlayers(list);
      } catch (err) {
        console.error("Failed to fetch players:", err);
      }
    };
    fetchPlayers();
  }, [lotteryContract, lotteryData]);

  // ── Split into me vs others ──────────────────────────────
  const myEntry   = players.find(p => p.address.toLowerCase() === account?.toLowerCase());
  const others    = players.filter(p => p.address.toLowerCase() !== account?.toLowerCase());
  const totalTickets = players.reduce((sum, p) => sum + p.tickets, 0);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass rounded-xl p-6"
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-secondary" />
        <h2 className="text-lg font-bold">Players</h2>
        <span className="ml-auto rounded-full bg-secondary/20 px-2 py-0.5 text-xs font-mono text-secondary">
          {players.length}
        </span>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No players yet. Be the first!
        </p>
      ) : (
        <div className="space-y-2">

          {/* ── My entry (pinned at top if I'm in) ──────── */}
          {myEntry && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <Crown className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-mono text-sm font-semibold text-primary">
                    {myEntry.address.slice(0, 6)}...{myEntry.address.slice(-4)}
                  </span>
                  <span className="text-xs text-muted-foreground">(you)</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* tickets */}
                  <div className="flex items-center gap-1 text-xs font-mono text-primary">
                    <Ticket className="h-3 w-3" />
                    <span>{myEntry.tickets}</span>
                  </div>
                 
                </div>
              </motion.div>

              {/* divider if there are others */}
              {others.length > 0 && (
                <div className="flex items-center gap-2 py-1 px-1">
                  <div className="h-px flex-1 bg-border/40" />
                  <span className="text-xs text-muted-foreground">other players</span>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
              )}
            </>
          )}

          {/* ── Others (address only) ────────────────────── */}
          {others.length > 0 && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {others.map((player, i) => (
                <motion.div
                  key={player.address}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span className="font-mono text-sm text-muted-foreground">
                    {player.address.slice(0, 6)}...{player.address.slice(-4)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Footer: total tickets ────────────────────── */}
          <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1 px-1">
            <span className="text-xs text-muted-foreground">Total tickets sold</span>
            <span className="font-mono text-sm font-semibold text-primary">{totalTickets}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}