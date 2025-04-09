import { CONTRACT_ADDRESS, abi } from "./constants.js";

let provider = null, signer = null, contract = null;

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const withdrawButton = document.getElementById("withdrawButton");
const balanceButton = document.getElementById("balanceButton");
// const fetchUsersButton = document.querySelector('.fetchUsersButton');

connectButton.onclick = connect_metamask;
fundButton.onclick = fund_amount;
withdrawButton.onclick = withdraw_amount;
balanceButton.onclick = getCurrentBalance;
// fetchUsersButton.onclick = fetchFunders;

function cleaner() {
    document.getElementById("curr-balance").innerText = "";
    document.getElementById("tx-status").innerText = "";
    document.getElementById("connect-status").innerText = "";
    document.getElementById("fund-status").innerText = "";
    document.getElementById("amount").value = "";
    document.getElementById("fundersList").innerHTML = "";
    return;
}

document.addEventListener("click", yourFundings);


async function connect_metamask() {
  cleaner();
    if (typeof window.ethereum !== "undefined") {
       try{
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        const currWalletAddress = (await signer.getAddress());
        contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        const ownerAddress = (await contract.getOwnerAddress()).toLowerCase();
        document.getElementById("connect-status");

        if (currWalletAddress.toLowerCase() === ownerAddress) {
            withdrawButton.style.display = "block";
            withdrawButton.disabled = false;
        } else {
            withdrawButton.style.display = "none";
        }

        connectButton.innerText = "Connected";
        console.log("Connected");

        const currEthAmount = Number(await contract.getLatest()) / 1e18;
        const minimumETHRequired = 1.0 / currEthAmount;


        document.getElementById("price-info").innerHTML = `
        <div style="text-align: left; background-color: #f8faff; padding: 0.3rem; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
          <p style="margin-bottom: 0.3rem; font-weight: bold; color: #333;">
            <i class="fas fa-wallet" style="color: #6c5ce7; margin-right: 6px;"></i>
            Current Wallet: <span style="font-family: monospace; font-size: 0.99rem;"><b>${currWalletAddress}<b></span>
          </p>

      
          <p style="margin: 0.5rem 0;">
            <i class="fas fa-chart-line" style="color: #1e90ff; margin-right: 6px;"></i>
            <strong>ETH/USD Price:</strong>
            <span style="color: #2c3e50;">$${currEthAmount.toFixed(5)}</span>
          </p>
      
          <p style="margin: 0.5rem 0;">
            <i class="fas fa-hand-holding-usd" style="color: #28a745; margin-right: 6px;"></i>
            <strong>Minimum ETH Required:</strong>
            <span style="color: #2c3e50;">${minimumETHRequired.toFixed(7)} ETH</span>
          </p>
        </div>
      `;
       } catch(error){
        console.log(error);
        document.getElementById("connect-status").innerHTML = `
        <div style="padding: 1rem; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 10px; color: #721c24; margin-top: 1rem;">
          <i class="fas fa-times-circle" style="margin-right: 8px; color: #dc3545;"></i>
          <strong>It seems like you have rejected a requet to connect or your request is pending , check your MetaMask </strong>
        </div>
      `;
       }
      
    } else {
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
    yourFundings();
}

async function yourFundings() {
  if (!contract) return;

  const currWalletAddress = await signer.getAddress();
  const valInWEI = await contract.getAmountFundedByAddress(currWalletAddress);
  const fundedByUserInETH = ethers.formatEther(valInWEI);
  const fundedByUserInUSD = await contract.getInUsd(valInWEI);

  // Inject enhanced CSS
  if (!document.getElementById("funding-style")) {
    const style = document.createElement("style");
    style.id = "funding-style";
    style.innerHTML = `
      .ccc {
        background: #f9fbff;
        border: 1px solid #d1e3ff;
        border-radius: 12px;
        padding: 10px;
        max-width: 420px;
        margin: 1px 0;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        font-family: 'Segoe UI', sans-serif;
        color: #2c3e50;
        text-align: center;
        transition: all 0.3s ease-in-out;
      }

      .ccc #hed {
        font-size: 17px;
        margin-bottom: 12px;
        color: #1a237e;
      }

      .ccc p {
        font-size: 16px;
        margin: 0;
      }

      .ccc .eth {
        color: #1565c0;
        font-weight: bold;
        font-size: 16px;
      }

      .ccc .usd {
        color: #2e7d32;
        font-weight: bold;
        font-size: 16px;
        margin-left: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  document.getElementById("your-fundings").innerHTML = 
  `
    <div class="ccc">
      <span id="hed">Your Total Fundings : </span>
        <span class="eth">${fundedByUserInETH} ETH</span> 
        <span class="usd">($${fundedByUserInUSD})</span>
     
    </div>
  `;
}




async function fund_amount() {
    if (!provider || !signer) {
        document.getElementById("fund-status").innerHTML = `
        <div style="padding: 1rem; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 10px; color: #856404; margin-top: 1rem;">
          <i class="fas fa-plug" style="margin-right: 8px; color: #ffc107;"></i>
          <strong>Connect Wallet Required</strong><br>
          Please connect your MetaMask wallet to fund the smart contract.
        </div>
      `;
        return;
    }

    const ethAmount = document.getElementById("amount").value.trim();
    const amountInWei = ethers.parseEther(ethAmount ? ethAmount : "0");

    if (!amountInWei || isNaN(ethAmount) || Number(ethAmount) <= 0 || (await contract.getInUsd(amountInWei)) < (await contract.getMinimumAmountRequired())) {
        document.getElementById("fund-status").innerHTML = `
        <div style="padding: 0.75rem; background-color: #f8d7da; border: 1px solid #dc3545; border-radius: 8px; color: #721c24;">
          <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i>
          <strong>Insufficient Amount</strong> – please enter a valid ETH value.
        </div>
      `;
        return;
    }

    const tx_status = document.getElementById("tx-status");

    try {
        let tx = await signer.sendTransaction({
            to: CONTRACT_ADDRESS,
            value: amountInWei
        });
        await tx.wait();

        tx_status.innerHTML = `
        <div style="padding: 1rem; background-color: #e6f4ea; border: 1px solid #28a745; border-radius: 10px; color: #155724; margin-top: 1rem;">
          <i class="fas fa-check-circle" style="margin-right: 8px; color: #28a745;"></i>
          <strong>Transaction Successful!</strong><br>
          You’ve sent <strong>${ethAmount}</strong> ETH successfully.
          <br>
          <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank" style="color: #1e90ff;">🔗 View Transaction Receipt</a>
        </div>
      `;
    } catch (error) {
        tx_status.innerHTML = `
        <div style="padding: 1rem; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 10px; color: #721c24; margin-top: 1rem;">
          <i class="fas fa-times-circle" style="margin-right: 8px; color: #dc3545;"></i>
          <strong>Transaction Failed</strong><br>
          An error occurred or the transaction was cancelled. No ETH was debited.
        </div>
      `;
    }

    document.getElementById("amount").value = "";

}

async function withdraw_amount() {
    if (!provider || !signer) {
        document.getElementById("fund-status").innerHTML = `
        <div style="padding: 1rem; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 10px; color: #856404; margin-top: 1rem;">
          <i class="fas fa-exclamation-triangle" style="margin-right: 8px; color: #ffc107;"></i>
          <strong>Wallet Not Connected</strong><br>
          Please connect MetaMask to fund the smart contract.
        </div>
      `;
        return;
    }

    let currBalance = await provider.getBalance(CONTRACT_ADDRESS);
    currBalance = ethers.formatEther(currBalance);

    const tx_status = document.getElementById("tx-status");

    if (currBalance <= 0) {
        tx_status.innerHTML = `
        <div style="padding: 0.75rem; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; color: #856404;">
          <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
          <strong>Insufficient Amount:</strong> <b>0 ETH</b>.
        </div>
      `;
        return;
    }

    try {
        let tx = await contract.withdraw();
        await tx.wait();

        tx_status.innerHTML = `
        <div style="padding: 1rem; background-color: #e6f4ea; border: 1px solid #28a745; border-radius: 10px; color: #155724; margin-top: 1rem;">
          <i class="fas fa-check-circle" style="margin-right: 8px; color: #28a745;"></i>
          <strong>Withdrawal Successful!</strong><br>
          All balances have been withdrawn successfully.
          <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank" style="color: #1e90ff;">🔗 View Withdrawal Receipt</a>
        </div>
      `;
    } catch (error) {
        tx_status.innerHTML = `
        <div style="padding: 1rem; background-color: #f8d7da; border: 1px solid #dc3545; border-radius: 10px; color: #721c24; margin-top: 1rem;">
          <i class="fas fa-times-circle" style="margin-right: 8px; color: #dc3545;"></i>
          <strong>Transaction Failed!</strong><br>
          An error occurred or the transaction was cancelled.
        </div>
      `;
    }

   
}

async function getCurrentBalance() {
    cleaner();
    yourFundings();
    if (!provider || !signer) {
        document.getElementById("curr-balance").innerHTML = `
        <div style="padding: 1rem; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 10px; color: #856404; margin-top: 1rem;">
          <i class="fas fa-exclamation-circle" style="margin-right: 8px; color: #ffc107;"></i>
          <strong>MetaMask Not Connected</strong><br>
          Please connect MetaMask to interact with the smart contract features.
        </div>
      `;
        return;
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

async function fetchFunders() {
    cleaner();
    if (!contract) {
        document.getElementById("fundersList").innerHTML = `
        <div style="padding: 1rem; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 10px; color: #856404;">
          <strong>Wallet Not Connected</strong><br>
          Please connect MetaMask first to fetch funders.
        </div>
      `;
        return;
    }

    try {
        const funders = await contract.getFundersList();

        if (funders.length === 0) {
            document.getElementById("fundersList").innerHTML = `
            <div style="padding: 1rem; background-color: #e2e3e5; border: 1px solid #d6d8db; border-radius: 10px; color: #383d41;">
              <i class="fas fa-user-slash"></i> No funders yet.
            </div>
          `;
            return;
        }

        let listHtml = `
        <style>
          .funders-table-container {
            overflow-x: auto;
            margin-top: 1.5rem;
            border-radius: 12px;
          }
      
          .funders-table {
            min-width: 600px; /* Wider minimum width */
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid #ddd;
            border-radius: 12px;
            overflow: hidden;
            font-size: 1rem;
          }
      
          .funders-table thead {
            background-color: #4f73ff;
            color: white;
          }
      
          .funders-table th,
          .funders-table td {
            padding: 16px 20px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
      
          .funders-table tbody tr:hover {
            background-color: #f1f5ff;
          }
      
          .funders-table td.address {
            font-family: monospace;
            color: #333;
            word-break: break-all;
          }
      
          .funders-table td.amount {
            font-weight: 600;
            color: #2c3e50;
          }
        </style>
      
        <div class="funders-table-container">
          <table class="funders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Address</th>
                <th>Amount (ETH / USD)</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      let index = 1;
      for (const user of funders) {
        const inUSD = await contract.getInUsd(user.val);
        const formattedEth = ethers.formatEther(user.val);
        // const formattedUSD = ethers.formatUnits(inUSD, 18);
      
        listHtml += `
          <tr>
            <td>${index++}</td>
            <td class="address">${user.addr}</td>
            <td class="amount">${formattedEth} ETH ($${inUSD})</td>
          </tr>
        `;
      }
      
      listHtml += `</tbody></table></div>`;
      
      

      
        document.getElementById("fundersList").innerHTML = listHtml;

    } catch (error) {
        console.error("Error fetching funders list:", error);
        document.getElementById("fundersList").innerHTML = `
        <div style="padding: 1rem; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 10px; color: #721c24;">
          Failed to fetch funders list. Please try again later.
        </div>
      `;
    }
}


window.fetchFunders = fetchFunders;
window.connect_metamask = connect_metamask;
window.yourFundings = yourFundings;