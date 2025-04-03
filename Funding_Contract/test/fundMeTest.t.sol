// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Test} from "../lib/forge-std/src/Test.sol";
import {console} from "../lib/forge-std/src/console.sol";
import {Funds} from "../src/fundMe.sol";
import {deployFundsContract} from "../script/deployFunds.s.sol";

contract FundsTest is Test{
    Funds newContract;
    function setUp() public{
        deployFundsContract deployScript = new deployFundsContract();
        newContract = deployScript.run();
    }

     function testOwnerAddress() public view{
        address ownerFromContract = newContract.i_owner();
        assertEq(ownerFromContract,msg.sender);
     }

    function testgetDecimals() public view{
        uint8 amount = newContract.getDecimals();
        console.log("Decomals : ",amount);
        assertEq(amount,8);
    }
}