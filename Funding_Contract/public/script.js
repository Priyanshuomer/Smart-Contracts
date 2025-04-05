let signer, contract;

const abi = [
  "function fundEth() payable",
  "function getFunderAmount(address funder) view returns (uint256)",
  "function withdraw()",
  "function getOwnerAddress() view returns (address)"
];

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  const fundBtn = document.getElementById("fundBtn");
  const withdrawBtn = document.getElementById("withdrawBtn");
  const txStatus = document.getElementById("txStatus");

  connectBtn.addEventListener("click", async () => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not found. Please install it.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();
      const address = await signer.getAddress();

      contract = new ethers.Contract(contractAddress, abi, signer);
      const owner = await contract.getOwnerAddress();

      if (owner.toLowerCase() === address.toLowerCase()) {
        withdrawBtn.style.display = "block";
      }

      alert("Connected to wallet: " + address);
      connectBtn.innerText = "Connected ✅";
      connectBtn.disabled = true;
    } catch (err) {
      console.error("Error connecting wallet:", err);
      alert("Failed to connect wallet.");
    }
  });

  fundBtn.addEventListener("click", async () => {
    if (!signer) return alert("Connect your wallet first!");

    const ethAmount = document.getElementById("ethAmount").value;
    if (!ethAmount || isNaN(ethAmount) || Number(ethAmount) <= 0) {
      return alert("Enter a valid ETH amount!");
    }

    try {
      fundBtn.disabled = true;
      fundBtn.innerText = "Funding...";
      txStatus.innerText = "";

      const tx = await contract.fundEth({ value: ethers.parseEther(ethAmount) });
      await tx.wait();

      txStatus.innerHTML = `✅ Funded! <br> <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank">View on Etherscan</a>`;
    } catch (err) {
      console.error("Transaction failed:", err);
      txStatus.innerText = "❌ Error: " + err.message;
    } finally {
      fundBtn.disabled = false;
      fundBtn.innerText = "Fund";
    }
  });

  withdrawBtn.addEventListener("click", async () => {
    try {
      withdrawBtn.disabled = true;
      withdrawBtn.innerText = "Withdrawing...";
      txStatus.innerText = "";

      const tx = await contract.withdraw();
      await tx.wait();

      txStatus.innerHTML = `💸 Withdrawn! <br> <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank">View on Etherscan</a>`;
    } catch (err) {
      console.error("Withdraw failed:", err);
      txStatus.innerText = "❌ Error: " + err.message;
    } finally {
      withdrawBtn.disabled = false;
      withdrawBtn.innerText = "Withdraw";
    }
  });
});
