
export const CONTRACT_ADDRESS = "0x6C86df0c8331c16275295f39a189DE2d16be5251";

export const abi = 
[{"type":"constructor","inputs":[{"name":"priceFeed","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"fallback","stateMutability":"payable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"fundEth","inputs":[],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"getAmountFundedByAddress","inputs":[{"name":"funder","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getFundersList","inputs":[],"outputs":[{"name":"","type":"tuple[]","internalType":"struct Funds.Users[]","components":[{"name":"addr","type":"address","internalType":"address"},{"name":"val","type":"uint256","internalType":"uint256"}]}],"stateMutability":"view"},{"type":"function","name":"getInUsd","inputs":[{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getLatest","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getMinimumAmountRequired","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"getOwnerAddress","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"withdraw","inputs":[],"outputs":[],"stateMutability":"nonpayable"}]