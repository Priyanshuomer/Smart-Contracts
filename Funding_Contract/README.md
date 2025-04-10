# Features

This decentralized funding smart contract provides the following capabilities:

- 📥 **Funding**: Allows users to contribute ETH to the contract.
- 🔐 **Withdrawals**: Restricted to the contract owner.
- 💸 **Price Feed Integration**: Uses Chainlink to convert ETH to USD in real time.
- 📃 **Funders List**: Displays all funders along with the amount they've contributed.

---

### You can see contract at [https://sepolia.etherscan.io/address/0x6c86df0c8331c16275295f39a189de2d16be5251](https://sepolia.etherscan.io/address/0x6c86df0c8331c16275295f39a189de2d16be5251)



# Installation
### Prerequisites:

- `curl` or `wget`
- A Unix-like shell (Linux/macOS/WSL or Git Bash on Windows)

### Install Foundry

Using `curl`:
```bash
curl -L https://foundry.paradigm.xyz | bash
```

Or using `wget`:
```bash
wget -qO- https://foundry.paradigm.xyz | bash
```

After installation, source your shell configuration:

```bash
source ~/.bashrc
```

Or if using Zsh:

```bash
source ~/.zshrc
```

Then run:

```bash
foundryup
```

### Verify Installation:

```bash
forge --version
cast --version
anvil --version
chisel --version
```

---

## Project Setup

```bash
git clone https://github.com/priyanshuomer/Smart-Contracts/Funding_Contract.git
cd Funding_Contract
```

### 📦 Install Dependencies

```bash
forge install
```

### 🔐 Environment Configuration

Create a `.env` file and add the following variables:

```env
PRIVATE_KEY=<your_wallet_private_key>
RPC_URL=<your_rpc_url>
```

---

Run 
```shell
export $(grep -v '^#' .env | xargs)

```

## 🚀 Interacting with the Contract

You can interact with the Funding smart contract in two ways:

### 🔧 Option 1: Already Deployed

Just switch to Sepolia Testnet in your MetaMask and run the web server locally and 

Then , open : 

[http://127.0.0.1:5500/Funding_Contract/index.html](http://127.0.0.1:5500/Funding_Contract/index.html)

---

### 🔧 Option 2: Deploy and Interact (Using Anvil)

#### Compile the Contract

```bash
forge compile -vvvv
```

#### Start Local Blockchain

```bash
anvil
```

#### Deploy the Contract

Update your `.env` file:

```env
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=<Anvil_Rich_Account_Private_Key>
```

In a new terminal, run:

```bash
forge script script/deployFunds.s.sol:deployFundsContract --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

After deployment:

- Update `CONTRACT_ADDRESS` in `constants.js` with the deployed contract address.
- Replace the ABI with contents from `out/fundMe.sol/Funds.json`.
- Add one of Anvil's rich account to your metamask and switch to Anvil network .
- Run the web server locally and 

Then open:

[http://127.0.0.1:5500/Funding_Contract/index.html](http://127.0.0.1:5500/Funding_Contract/index.html)

---

## 🧪 Testing

Run tests with:

```bash
forge test -vvvv
```

---

## ⛽ Gas Snapshots

Generate gas snapshots:

```bash
forge snapshot
```

---

## 🔧 Cast Commands

Interact using:

```bash
cast <subcommand>
```

---

## 🆘 Help Commands

```bash
forge --help
anvil --help
cast --help
```
