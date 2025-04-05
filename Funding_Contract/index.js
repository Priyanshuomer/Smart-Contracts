const express = require("express");
const path = require("path");
const {ethers} = require("ethers");
const { JsonRpcProvider, Wallet, Contract, parseEther } = require("ethers");
require("dotenv").config();

const app = express();
const PORT = 3000;

// Set up EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


// Smart contract config (Read from .env)
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.SEPOLIA_RPC_URL;

if (!contractAddress || !privateKey || !rpcUrl) {
  console.error("⚠️ ERROR: Please set CONTRACT_ADDRESS, PRIVATE_KEY, and LOCAL_RPC_URL in .env");
  process.exit(1);
}

// Smart contract ABI (Only necessary functions)
const contractABI = [
  "function fundEth() payable",
  "function getLatest() view returns (uint256)"
];

// Connect to the blockchain
const provider = new JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKey, provider);
const contract = new Contract(contractAddress, contractABI, wallet);

// 📌 Route: Home Page
app.get("/", async (req, res) => {
  try {
    const ethPrice = await contract.getLatest();
    res.render("home.ejs", {
      ethPriceUSD: (Number(ethPrice) / 1e18).toFixed(2),
      contractAddress,
    });
  } catch (err) {
    console.error("Error fetching ETH price:", err);
    res.render("home.ejs", { ethPriceUSD: "Error", contractAddress });
  }
});

  
// app.post("/",(req,res) => {
// let signer;

// document.addEventListener("DOMContentLoaded", () => {
//   const connectBtn = document.getElementById("connectBtn");

//   connectBtn.addEventListener("click", async () => {
//     if (typeof window.ethereum === "undefined") {
//       alert("MetaMask not found. Please install it.");
//       return;
//     }

//     try {
//         const provider = new ethers.providers.Web3Provider(window.ethereum)
//         await provider.send("eth_requestAccounts", []);
//         const signer = provider.getSigner();
//         const address = await signer.getAddress();

//       alert("Connected to wallet: " + address);
//       connectBtn.innerText = "Connected ✅";
//       connectBtn.disabled = true;
//     } catch (err) {
//       console.error("Error connecting wallet:", err);
//       alert("Failed to connect wallet.");
//     }
//   });
// });
// })
 

// 📌 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});











// const express = require("express");
// const path = require("path");
// const { JsonRpcProvider, Wallet, Contract, parseEther } = require("ethers");



// require("dotenv").config();

// const app = express();
// const PORT = 3000;



// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, "public")));

// // Smart contract config
// const contractAddress = 0x34A1D3fff3958843C43aD80F30b94c510645C316;
// const contractABI = [
//   "function fundEth() payable",
//   "function getLatest() view returns (uint256)",
//   "function getOwnerAddress() view returns (address)",
//   "function getFunderAmount(address funder) view returns (uint256)"
// ];

// const provider = new JsonRpcProvider("http://127.0.0.1:8545");

// const wallet = new ethers.Wallet(ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80, provider);
// const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// app.get("/", async (req, res) => {
//   const ethPrice = await contract.getLatest();
//   res.render("home.ejs", {
//     ethPriceUSD: (ethPrice / 1e18).toFixed(2),
//     contractAddress,
//   });
// });

// app.post("/", async (req, res) => {
//   const { ethAmount } = req.body;

//   try {
//     const tx = await contract.fundEth({ value: ethers.utils.parseEther(ethAmount) });
//     await tx.wait();
//     console.log("Success");
//     res.json({ success: true, txHash: tx.hash });
//   } catch (err) {
//     console.error("Funding error:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });




// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
//   });












// // const connection_button = getElementById("connect-wallet-button");

// // connection_button.onclick = connection_request;


// // async function connection_request(){
// //     if(window.ether)
// // }