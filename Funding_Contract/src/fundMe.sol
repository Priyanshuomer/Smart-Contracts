// SPDX-License-Identifier:MIT

pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract Funds{

     address private immutable i_owner ;
     uint256 constant MINIMUM_AMOUNT_IN_USD = 1;

     AggregatorV3Interface s_priceFeed;

    constructor(address priceFeed) {
      i_owner = msg.sender;
      s_priceFeed = AggregatorV3Interface(priceFeed);
    }

    address[] private listOfFunders;
    mapping(address => uint256) private senders;


function fundEth() public payable {
    uint256 amount = getInUsd(msg.value);
    require(amount >= MINIMUM_AMOUNT_IN_USD, "Minimum USD amount not met");
    
    listOfFunders.push(msg.sender);
    senders[msg.sender] += amount;
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

          for(uint256 i=0; i<listOfFunders.length; i++)
         senders[listOfFunders[i]] = 0;

         delete listOfFunders;

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


     function getOwnerAddress() public view returns(address){
        return i_owner;
     }

     struct Users{
       address addr;
       uint256 val;

     }

     function getFundersList() public view returns(Users[] memory){

         uint256 len = listOfFunders.length;
           Users[] memory users = new Users[](len);

         for(uint256 i=0; i < len ; i++)
         users[i] = Users({addr : listOfFunders[i] , val : senders[listOfFunders[i]]});

         return users;
     }


     function getMinimumAmountRequired() public pure returns(uint256) {
       return MINIMUM_AMOUNT_IN_USD;
     }

     function getAmountFundedByAddress(address funder) public view returns(uint256) {
         return senders[funder];
     }


}