
// import { formatEther } from "ethers";
import {CONTRACT_ADDRESS , abi} from "./constants.js"
// import {ethers} from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";



let provider = null , signer = null , contract = null;

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const withdrawButton = document.getElementById("withdrawButton");
const balanceButton = document.getElementById("balanceButton");

connectButton.onclick = connect_metamask;
fundButton.onclick = fund_amount;
withdrawButton.onclick = withdraw_amount;
balanceButton.onclick = getCurrentBalance;


function cleaner(){
    document.getElementById("curr-balance").innerText = "";
    document.getElementById("tx-status").innerText = "";
    document.getElementById("connect-status").innerText = "";
    document.getElementById("fund-status").innerText = "";
    document.getElementById("amount").value = "";
    return;
}


async function connect_metamask(){
     cleaner();
   if(typeof window.ethereum !== "undefined")
   {
        provider = new ethers.BrowserProvider(window.ethereum);

        signer = await provider.getSigner();
        const currWalletAddress = (await signer.getAddress()).toLowerCase();
        contract = new ethers.Contract(CONTRACT_ADDRESS,abi,signer);
        const ownerAddress = (await contract.getOwnerAddress()).toLowerCase();
        // console.log(currWalletAddress);
        // console.log(ownerAddress);

        if(currWalletAddress === ownerAddress)
          {
            withdrawButton.style.display = "block";
            withdrawButton.disabled = false;
          }
          else  
          withdrawButton.style.display = "none";

          connectButton.innerText = "Connected";
        //   connectButton.onclick = withdraw_amount;



          const currEthAmount = Number((await contract.getLatest())) / 1e18;
          const price_info_section = document.getElementById("price-info");
          const minimumETHRequired = 1.0/currEthAmount;
          price_info_section.innerHTML = `
          <div style="text-align: left;">
            <p style="margin: 0.5rem 0;">
              <i class="fas fa-chart-line" style="color: #1e90ff;"></i>
              <strong> ETH/USD Price:</strong> 
              <span style="color: #2c3e50;">${currEthAmount.toFixed(5)}</span>
            </p>
            <p style="margin: 0.5rem 0;">
              <i class="fas fa-hand-holding-usd" style="color: #28a745;"></i>
              <strong> Minimum ETH Required:</strong> 
              <span style="color: #2c3e50;">${minimumETHRequired.toFixed(7)}</span>
            </p>
          </div>
        `;
                 
           
        //   price_info_section.innerHTML = `ETH/USD : ${currEthAmount}`;

   }
   else
   {
    document.getElementById("connect-status").innerHTML = `
    <div style="padding: 1rem; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 10px; color: #856404; margin-top: 1rem;">
      <i class="fas fa-exclamation-triangle" style="margin-right: 8px; color: #ffc107;"></i>
      <strong>MetaMask Not Detected</strong><br>
      <span style="display: block; margin-top: 0.5rem;">
        Please install <a href="https://metamask.io/download.html" target="_blank" style="color: #007bff;">MetaMask</a> to continue using this DApp.
      </span>
    </div>
  `;
  
   }

}

async function fund_amount(){
    cleaner();
    if(provider == null || signer == null)
        {
            document.getElementById("fund-status").innerHTML = `
            <div style="padding: 1rem; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 10px; color: #856404; margin-top: 1rem;">
              <i class="fas fa-plug" style="margin-right: 8px; color: #ffc107;"></i>
              <strong>Connect Wallet Required</strong><br>
              <span style="display: block; margin-top: 0.5rem;">
                Please connect your MetaMask wallet to fund the smart contract.
              </span>
            </div>
          `;
          
          return ;
        }

  const ethAmount = document.getElementById("amount").value;
  const amountInWei = ethers.parseEther(ethAmount || "0");

  if(!amountInWei || isNaN(ethAmount) || Number(ethAmount) <= 0 || (await contract.getInUsd(amountInWei)) < (await contract.getMinimumAmountRequired()))
  {
    document.getElementById("fund-status").innerHTML = `
    <div style="padding: 0.75rem; background-color: #f8d7da; border: 1px solid #dc3545; border-radius: 8px; color: #721c24;">
      <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i>
      <strong>Insufficient Amount</strong> – please enter a valid ETH value.
    </div>
  `;
    return ;
  }

  const tx_status = document.getElementById("tx-status");

  try {
    let tx = await signer.sendTransaction({
        to: CONTRACT_ADDRESS,
        value: amountInWei
      });
      await tx.wait();

    //   console.log(`Successfully send your transaction of ${ethAmount} eth , Thanks for funding ..`);
     
    tx_status.innerHTML = `
    <div style="padding: 1rem; background-color: #e6f4ea; border: 1px solid #28a745; border-radius: 10px; color: #155724; margin-top: 1rem;">
      <i class="fas fa-check-circle" style="margin-right: 8px; color: #28a745;"></i>
      <strong>Transaction Successful!</strong><br>
      <span style="display: block; margin-top: 0.5rem;">
        You’ve sent <strong>${ethAmount}</strong> ETH successfully.
      </span>
      <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank" style="display: inline-block; margin-top: 0.5rem; color: #1e90ff; text-decoration: none;">
        🔗 View Transaction Receipt
      </a>
    </div>
  `;
  
    
  } catch(error){
    tx_status.innerHTML = `
    <div style="padding: 1rem; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 10px; color: #721c24; margin-top: 1rem;">
      <i class="fas fa-times-circle" style="margin-right: 8px; color: #dc3545;"></i>
      <strong>Transaction Failed</strong><br>
      <span style="display: block; margin-top: 0.5rem;">
        An error occurred or the transaction was cancelled.<br>
        <b>No ETH was debited</b>. Please try again.
      </span>
    </div>
  `;
  
  }

  return ;
}

async function withdraw_amount(){
    cleaner();
    if(provider == null || signer == null)
        {
            document.getElementById("fund-status").innerHTML = `
            <div style="padding: 1rem; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 10px; color: #856404; margin-top: 1rem;">
              <i class="fas fa-exclamation-triangle" style="margin-right: 8px; color: #ffc107;"></i>
              <strong>Wallet Not Connected</strong><br>
              <span style="display: block; margin-top: 0.5rem;">
                Please connect MetaMask to fund the smart contract.
              </span>
            </div>
          `;
          
          return ;
        }

        let currBalance = await provider.getBalance(CONTRACT_ADDRESS);
        currBalance = ethers.formatEther(currBalance);

        const tx_status = document.getElementById("tx-status");

        if(currBalance <= 0)
        {
            tx_status.innerHTML = `
            <div style="padding: 0.75rem; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; color: #856404;">
              <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
              <strong>Insufficient Amount:</strong> <b>0 ETH</b>. Please enter a valid amount to proceed.
            </div>
          `;
            return ;
        } 

        try{
            let tx = await contract.withdraw();
            await tx.wait();
      
            tx_status.innerHTML = `
            <div style="padding: 1rem; background-color: #e6f4ea; border: 1px solid #28a745; border-radius: 10px; color: #155724; margin-top: 1rem;">
              <i class="fas fa-check-circle" style="margin-right: 8px; color: #28a745;"></i>
              <strong>Withdrawal Successful!</strong><br>
              <span style="display: block; margin-top: 0.5rem;">
                All balances have been withdrawn successfully.
              </span>
              <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank" style="display: inline-block; margin-top: 0.5rem; color: #1e90ff; text-decoration: none;">
                🔗 View Withdrawal Receipt
              </a>
            </div>
          `;
          
        } catch(error){
            tx_status.innerHTML = `
            <div style="padding: 1rem; background-color: #f8d7da; border: 1px solid #dc3545; border-radius: 10px; color: #721c24; margin-top: 1rem;">
              <i class="fas fa-times-circle" style="margin-right: 8px; color: #dc3545;"></i>
              <strong>Transaction Failed!</strong><br>
              <span style="display: block; margin-top: 0.5rem;">
                Some error occurred or you may have cancelled the transaction.<br>
                No ETH was credited. Please try again.
              </span>
            </div>
          `;
          
        }
    
      return ;

}


async function getCurrentBalance(){
    cleaner();
    if(provider == null || signer == null)
        {
            document.getElementById("curr-balance").innerHTML = `
            <div style="padding: 1rem; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 10px; color: #856404; margin-top: 1rem;">
              <i class="fas fa-exclamation-circle" style="margin-right: 8px; color: #ffc107;"></i>
              <strong>MetaMask Not Connected</strong><br>
              <span style="display: block; margin-top: 0.5rem;">
                Please connect MetaMask to interact with the smart contract features.
              </span>
            </div>
          `;
          
          return ;
        }

     let currBalance = await provider.getBalance(CONTRACT_ADDRESS);
     currBalance = ethers.formatEther(currBalance);

     document.getElementById("curr-balance").innerHTML = `
     <div style="padding: 0.9rem; background-color: #eaf4ff; border: 1px solid #1e90ff; border-radius: 10px; color: #004085; margin-top: 1rem;">
       <i class="fas fa-wallet" style="margin-right: 8px; color: #1e90ff;"></i>
       <strong>Current Balance:</strong> <b>${currBalance} ETH</b>
     </div>
   `;
   
}



// document.addEventListener("DOMContentLoaded", () => {
//   const connectBtn = document.getElementById("connectBtn");
//   const fundBtn = document.getElementById("fundBtn");
//   const withdrawBtn = document.getElementById("withdrawBtn");
//   const txStatus = document.getElementById("txStatus");

//   connectBtn.addEventListener("click", async () => {
//     if (typeof window.ethereum === "undefined") {
//       alert("MetaMask not found. Please install it.");
//       return;
//     }

//     try {
//       const provider = new ethers.BrowserProvider(window.ethereum);
//       await provider.send("eth_requestAccounts", []);
//       signer = await provider.getSigner();
//       const address = await signer.getAddress();

//       contract = new ethers.Contract(contractAddress, abi, signer);
//       const owner = await contract.getOwnerAddress();

//       if (owner.toLowerCase() === address.toLowerCase()) {
//         withdrawBtn.style.display = "block";
//       }

//       alert("Connected to wallet: " + address);
//       connectBtn.innerText = "Connected ✅";
//       connectBtn.disabled = true;
//     } catch (err) {
//       console.error("Error connecting wallet:", err);
//       alert("Failed to connect wallet.");
//     }
//   });

//   fundBtn.addEventListener("click", async () => {
//     if (!signer) return alert("Connect your wallet first!");

//     const ethAmount = document.getElementById("ethAmount").value;
//     if (!ethAmount || isNaN(ethAmount) || Number(ethAmount) <= 0) {
//       return alert("Enter a valid ETH amount!");
//     }

//     try {
//       fundBtn.disabled = true;
//       fundBtn.innerText = "Funding...";
//       txStatus.innerText = "";

//       const tx = await contract.fundEth({ value: ethers.parseEther(ethAmount) });
//       await tx.wait();

//       txStatus.innerHTML = `✅ Funded! <br> <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank">View on Etherscan</a>`;
//     } catch (err) {
//       console.error("Transaction failed:", err);
//       txStatus.innerText = "❌ Error: " + err.message;
//     } finally {
//       fundBtn.disabled = false;
//       fundBtn.innerText = "Fund";
//     }
//   });

//   withdrawBtn.addEventListener("click", async () => {
//     try {
//       withdrawBtn.disabled = true;
//       withdrawBtn.innerText = "Withdrawing...";
//       txStatus.innerText = "";

//       const tx = await contract.withdraw();
//       await tx.wait();

//       txStatus.innerHTML = `💸 Withdrawn! <br> <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank">View on Etherscan</a>`;
//     } catch (err) {
//       console.error("Withdraw failed:", err);
//       txStatus.innerText = "❌ Error: " + err.message;
//     } finally {
//       withdrawBtn.disabled = false;
//       withdrawBtn.innerText = "Withdraw";
//     }
//   });
// });
