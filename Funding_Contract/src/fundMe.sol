// SPDX-License-Identifier:MIT

pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract Funds{

    address public immutable i_owner ;
     uint256 constant minimumAmountinUSD = 2;

     AggregatorV3Interface s_priceFeed;

    constructor(address priceFeed) {
      i_owner = msg.sender;
      s_priceFeed = AggregatorV3Interface(priceFeed);
    }

    address[] public listOfFunders;
    mapping(address => uint256) public senders;
    // to fund 
// event Funded(address indexed funder, uint256 amount);

function fundEth() public payable {
    uint256 amount = getInUsd(msg.value);
    require(amount >= minimumAmountinUSD, "Minimum USD amount not met");
    
    listOfFunders.push(msg.sender);
    senders[msg.sender] = amount;

    // emit Funded(msg.sender, amo);
}


     function getLatest() public view returns(uint256)
     {
         (
            , int256 answer , , ,
         ) =  s_priceFeed.latestRoundData();
        return uint256(answer*1e10);
     }

     function getDecimals() public view returns(uint8){
      uint8 deci =  s_priceFeed.decimals();
        return deci;
     }

     function getInUsd(uint256 amount) public view returns(uint256){
        uint256 USDperEthinWei = getLatest();
        // uint256 USDperEthinWei = 2000000000000000000;
        return (USDperEthinWei*amount)/(1e36);
     }

     function withdraw() isOwner public {

         //  for(uint256 i=0; i<listOfFunders.length; i++)
         // senders[listOfFunders[i]] = 0;

         // delete listOfFunders;

        (bool isSuccess, ) = payable(msg.sender).call{value : address(this).balance}("");
         require(isSuccess,"Txn Failed.........");

     }

      receive() external payable{
           fundEth();
      }

      fallback() external payable{
         fundEth();
      }

     modifier isOwner(){
       require(msg.sender == i_owner);
       _;
     }
}