import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { BrowserProvider, Contract, JsonRpcSigner } from "ethers";
import {
  LOTTERY_CONTRACT_ADDRESS,
  OM_TOKEN_ADDRESS,
  LOTTERY_ABI,
  OM_TOKEN_ABI,
  SEPOLIA_CHAIN_ID,
} from "@/config/contract";

interface LotteryData {
  totalTicketsSold: bigint;
  minimumTickets: bigint;
  tokenPrice: bigint;
  interval: bigint;
  lastTimeStamp: bigint;
  owner: string;
  feeWallet: string;
  isOpen: boolean;
  lotteryState: number;
  prizePool: bigint;
}

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  lotteryContract: Contract | null;
  tokenContract: Contract | null;
  lotteryData: LotteryData | null;
  tokenBalance: bigint;
  isOwner: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToSepolia: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount]               = useState<string | null>(null);
  const [chainId, setChainId]               = useState<number | null>(null);
  const [isConnecting, setIsConnecting]     = useState(false);
  const [provider, setProvider]             = useState<BrowserProvider | null>(null);
  const [signer, setSigner]                 = useState<JsonRpcSigner | null>(null);
  const [lotteryContract, setLotteryContract] = useState<Contract | null>(null);
  const [tokenContract, setTokenContract]   = useState<Contract | null>(null);
  const [lotteryData, setLotteryData]       = useState<LotteryData | null>(null);
  const [tokenBalance, setTokenBalance]     = useState<bigint>(0n);

  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;
  const isOwner = !!(
    account &&
    lotteryData &&
    account.toLowerCase() === lotteryData.owner.toLowerCase()
  );

  // ── Setup contract instances ───────────────────────────
  const setupContracts = useCallback(async (signer: JsonRpcSigner) => {
    const lottery = new Contract(LOTTERY_CONTRACT_ADDRESS, LOTTERY_ABI, signer);
    const token   = new Contract(OM_TOKEN_ADDRESS, OM_TOKEN_ABI, signer);
    setLotteryContract(lottery);
    setTokenContract(token);
    return { lottery, token };
  }, []);

  // ── Fetch all on-chain data ────────────────────────────
  const fetchLotteryData = useCallback(async (
    lottery: Contract,
    token: Contract,
    userAddress: string,
  ) => {
    try {
      const [
        totalTickets,
        minTickets,
        tokenPrice,
        interval,
        owner,
        feeWallet,
        balance,
        lotteryState,
        lastTimeStamp,
        prizePool,
      ] = await Promise.all([
        lottery.s_totalTicketsSold(),
        lottery.getMinimumTicketsRequired(),
        lottery.getTokenPriceInWei(),
        lottery.getInterval(),
        lottery.getOwner(),
        lottery.getFeeWalletAddress(),
        token.balanceOf(userAddress),
        lottery.getLotteryState(),
        lottery.getLastTimeStamp(),
        lottery.getPrizePool(),
      ]);

      setLotteryData({
        totalTicketsSold: totalTickets,
        minimumTickets:   minTickets,
        tokenPrice:       tokenPrice,
        interval:         interval,
        lastTimeStamp:    lastTimeStamp,
        owner:            owner,
        feeWallet:        feeWallet,
        isOpen:           Number(lotteryState) === 0,
        lotteryState:     Number(lotteryState),
        prizePool:        prizePool,
      });

      setTokenBalance(balance);
    } catch (err) {
      console.error("Failed to fetch lottery data:", err);
    }
  }, []);

  // ── Shared connect logic (used by both auto-connect and manual connect) ──
  const initConnection = useCallback(async (
    browserProvider: BrowserProvider,
    address: string,
  ) => {
    const network        = await browserProvider.getNetwork();
    const signerInstance = await browserProvider.getSigner();
    const chain          = Number(network.chainId);

    setProvider(browserProvider);
    setSigner(signerInstance);
    setAccount(address);
    setChainId(chain);

    if (chain === SEPOLIA_CHAIN_ID) {
      const { lottery, token } = await setupContracts(signerInstance);
      await fetchLotteryData(lottery, token, address);
    }
  }, [setupContracts, fetchLotteryData]);

  // ── Auto-connect on page load ──────────────────────────
  // Uses eth_accounts (no popup) — only connects if wallet already authorized
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    const autoConnect = async () => {
      try {
        const browserProvider = new BrowserProvider(eth);
        const accounts: string[] = await browserProvider.send("eth_accounts", []);
        if (accounts.length === 0) return; // not previously connected — do nothing
        await initConnection(browserProvider, accounts[0]);
      } catch (err) {
        console.error("Auto-connect failed:", err);
      }
    };

    autoConnect();
  }, [initConnection]);

  // ── Manual connect (triggers MetaMask popup) ──────────
  const connectWallet = useCallback(async () => {
    if (!(window as any).ethereum) {
      alert("Please install MetaMask or another Web3 wallet!");
      return;
    }
    setIsConnecting(true);
    try {
      const browserProvider = new BrowserProvider((window as any).ethereum);
      const accounts: string[] = await browserProvider.send("eth_requestAccounts", []);
      await initConnection(browserProvider, accounts[0]);
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [initConnection]);

  // ── Disconnect ─────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setLotteryContract(null);
    setTokenContract(null);
    setLotteryData(null);
    setTokenBalance(0n);
  }, []);

  // ── Switch to Sepolia ──────────────────────────────────
  const switchToSepolia = useCallback(async () => {
    try {
      await (window as any).ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + SEPOLIA_CHAIN_ID.toString(16) }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        await (window as any).ethereum?.request({
          method: "wallet_addEthereumChain",
          params: [
          {
            chainId: "0xaa36a7",                         // ✅ Sepolia = 11155111
            chainName: "Sepolia Testnet",                // ✅ correct name
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],        // ✅ Sepolia public RPC
            blockExplorerUrls: ["https://sepolia.etherscan.io"], // ✅ added
          },
        ],
        });
      }
    }
  }, []);

  // ── Refresh data ───────────────────────────────────────
  const refreshData = useCallback(async () => {
    if (lotteryContract && tokenContract && account) {
      await fetchLotteryData(lotteryContract, tokenContract, account);
    }
  }, [lotteryContract, tokenContract, account, fetchLotteryData]);

  // ── Listen for account / chain changes ────────────────
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnectWallet();
      else setAccount(accounts[0]);
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
      window.location.reload();
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnectWallet]);

  // ── Auto-refresh every 30s ─────────────────────────────
  useEffect(() => {
    if (!lotteryContract || !tokenContract || !account) return;
    const id = setInterval(() => refreshData(), 30_000);
    return () => clearInterval(id);
  }, [lotteryContract, tokenContract, account, refreshData]);

  return (
    <Web3Context.Provider
      value={{
        account, chainId, isCorrectNetwork, isConnecting,
        provider, signer, lotteryContract, tokenContract,
        lotteryData, tokenBalance, isOwner,
        connectWallet, disconnectWallet, switchToSepolia, refreshData,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}