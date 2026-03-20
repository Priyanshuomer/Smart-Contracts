# 🎰 OmniLotto

> **Decentralized. Fair. Unstoppable.**

OmniLotto is a fully decentralized lottery system built on Ethereum, powered by **Chainlink VRF** for provably fair randomness and **Chainlink Automation** for trustless execution. Players buy tickets using **OmToken (OM)**, enter draws, and winners are selected on-chain with zero human intervention.

---

## ✨ Features

- 🎲 **Provably Fair** — Chainlink VRF ensures tamper-proof random winner selection
- ⚙️ **Fully Automated** — Chainlink Automation triggers draws automatically when conditions are met
- 🏆 **Two Winners Per Round** — 1st place gets 50%, 2nd place gets 45%, 5% goes to fee wallet
- 🪙 **ERC20 Token Tickets** — Players purchase OmToken (OM) with ETH to enter
- 🔐 **Address Blocking** — Owner can block malicious addresses from participating
- 📜 **Winner History** — All past winners stored on-chain and publicly viewable
- 🌐 **Frontend dApp** — Full React/TypeScript UI with MetaMask integration

---

## 🏗️ Architecture

```
Player
  │
  ├─ sends ETH ──► takeTokensFromEth() ──► mints OmToken (OM)
  │
  └─ approves & calls enterIntoGame(tickets)
                          │
                          ▼
                   Lottery Contract
                   (tracks ticket ranges)
                          │
              ┌───────────┴───────────┐
              │                       │
    Chainlink Automation        Chainlink VRF
    calls performUpkeep()    fulfills random words
              │                       │
              └───────────┬───────────┘
                          │
                  Winners Declared
                  50% → Winner 1
                  45% → Winner 2
                   5% → Fee Wallet
                          │
                   OmTokens Burned
```

---

## 📦 Contracts

| Contract | Description |
|---|---|
| `Lottery.sol` | Core lottery logic, VRF consumer, Automation compatible |
| `OmToken.sol` | ERC20 ticket token, mintable by Lottery contract only |

### Lottery State Machine

```
OPEN → CALCULATING → CLOSED → OPEN (after restartTimer)
              ↑
          BLOCKED (owner can pause anytime)
```

---

## 🌐 Deployments

### Sepolia Testnet

| Contract | Address |
|---|---|
| Lottery | `0x27Cac012848e79feB8d74F6A9028A3f0CA5F4211` |
| OmToken | `0xFEC00AD65dCCf090319d79Ef80c7DaaF065C5Da1` |
| VRF Coordinator | `0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B` |

🔍 [View Lottery on Etherscan](https://sepolia.etherscan.io/address/0x27cac012848e79feb8d74f6a9028a3f0ca5f4211)
🔍 [View OmToken on Etherscan](https://sepolia.etherscan.io/address/0xfec00ad65dccf090319d79ef80c7daaf065c5da1)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity `^0.8.13`, Foundry |
| Randomness | Chainlink VRF V2 Plus |
| Automation | Chainlink Automation |
| Frontend | React, TypeScript, Vite, TailwindCSS |
| Web3 | ethers.js v6 |
| UI Components | shadcn/ui, framer-motion |
| Package Manager | Bun |

---

## 🚀 Local Setup

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Bun](https://bun.sh) >= 1.0
- Git

### 1. Clone the repo

```sh
git clone 
cd 
```

### 2. Install frontend dependencies

```sh
bun install
```

### 3. Start the development server

```sh
bun run dev
```

### 4. Install contract dependencies

```sh
cd contracts
forge install
```

### 5. Set up environment variables

```sh
cp .env.example .env
```

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_KEY>
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
```

---

## 🧪 Testing Locally (Anvil)

### Start local node

```sh
anvil
```

### Deploy locally

```sh
forge script script/DeployLottery.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

### Buy tokens

```sh
cast send <LOTTERY_ADDRESS> \
  "takeTokensFromEth()" \
  --value 0.05ether \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY>
```

### Approve tokens

```sh
cast send <TOKEN_ADDRESS> \
  "approve(address,uint256)" \
  <LOTTERY_ADDRESS> 5000000000000000000 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY>
```

### Enter game

```sh
cast send <LOTTERY_ADDRESS> \
  "enterIntoGame(uint256)" 5 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY>
```

### Trigger draw manually

```sh
# 1. Perform upkeep
cast send <LOTTERY_ADDRESS> \
  "performUpkeep(bytes)" "0x" \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY>

# 2. Fulfill random words via VRF Mock
cast send <VRF_MOCK_ADDRESS> \
  "fulfillRandomWords(uint256,address)" 1 <LOTTERY_ADDRESS> \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY>
```

---

## 🚢 Deploy to Sepolia

```sh
source .env

forge script script/DeployLottery.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

### Post-deploy checklist

```
✅ Add Lottery as consumer in Chainlink VRF subscription
   → https://vrf.chain.link

✅ Register Chainlink Automation upkeep
   → https://automation.chain.link
   → Target: <LOTTERY_ADDRESS>
   → Gas Limit: 500000
   → Fund with LINK

✅ Set fee wallet to your EOA address
✅ Update frontend contract addresses
```

---

## 🎮 How to Play

1. Connect MetaMask to Sepolia testnet
2. Buy OmTokens by sending ETH
3. Approve OmTokens for the Lottery contract
4. Enter the lottery by choosing ticket count
5. Wait for the draw — Chainlink Automation triggers it automatically
6. Winners receive ETH directly to their wallet

### Prize Distribution

| Place | Share |
|---|---|
| 🥇 1st Winner | 50% of prize pool |
| 🥈 2nd Winner | 45% of prize pool |
| 🏦 Fee Wallet | 5% of prize pool |

---

## 🔐 Admin Functions

| Function | Description |
|---|---|
| `changeInterval(uint256)` | Set draw interval in seconds |
| `changeMinimumEntryTickets(uint256)` | Set minimum tickets to enter |
| `changeTokenPrice(uint256)` | Set price per token in wei |
| `changeFeeWalletAddress(address)` | Update fee wallet |
| `blockAddress(address)` | Block a player |
| `unblockAddress(address)` | Unblock a player |
| `resetLottery()` | Emergency reset — sends funds to fee wallet |
| `withdrawAllFunds()` | Withdraw all ETH to fee wallet |
| `restartTimer()` | Restart draw timer and open lottery |
| `changeState(uint8)` | Manually set lottery state |

---

## 📁 Project Structure

```
omnilotto/
├── contracts/
│   ├── src/
│   │   ├── Lottery.sol
│   │   └── OmToken.sol
│   ├── script/
│   │   ├── DeployLottery.s.sol
│   │   └── HelperConfig.s.sol
│   ├── test/
│   └── foundry.toml
└── frontend/
    ├── src/
    │   ├── components/lottery/
    │   ├── contexts/Web3Context.tsx
    │   ├── constants/
    │   │   ├── lotteryAbi.ts
    │   │   └── omTokenAbi.ts
    │   └── pages/Index.tsx
    ├── package.json
    └── bun.lockb
```

---

## ⚠️ Disclaimer

OmniLotto is deployed on Sepolia **testnet** for demonstration purposes. Do not use real funds. Smart contracts have not been professionally audited.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.
