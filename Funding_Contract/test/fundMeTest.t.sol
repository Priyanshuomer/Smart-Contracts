// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Test} from "../lib/forge-std/src/Test.sol";
import {console} from "../lib/forge-std/src/console.sol";
import {Funds} from "../src/fundMe.sol";
import {deployFundsContract} from "../script/deployFunds.s.sol";

contract FundsTest is Test {
    Funds newContract;

    function setUp() public {
        deployFundsContract deployScript = new deployFundsContract();
        newContract = deployScript.run();
    }

    function testOwnerAddress() public view {
        address ownerFromContract = newContract.getOwnerAddress();
        address expectedDeployer = vm.addr(vm.envUint("LOCAL_PRIVATE_KEY"));
        assertEq(ownerFromContract, expectedDeployer);
    }

    address public tempAccount = makeAddr("OM");

    function fundContractFromTempAccount(string memory name) internal {
        tempAccount = makeAddr(name);
        vm.deal(tempAccount, 1 ether);
        vm.prank(tempAccount); // sets msg.sender for the next call
        newContract.fundEth{value: 0.4 * 1e18}(); // assuming fundEth is payable
    }

    function testcheckSendingHistorySaved() public {
        fundContractFromTempAccount("RAM");
        uint256 val = newContract.getAmountFundedByAddress(tempAccount);
        // uint256 am = newContract.getInUsd(0.4 * 1e18);
        assertEq(val, 0.4 * 1e18);
        fundContractFromTempAccount("RAM");
        val = newContract.getAmountFundedByAddress(tempAccount);
        assertEq(val, 0.8 * 1e18);
        val = newContract.getAmountFundedByAddress(makeAddr("HARI_OM"));
        assertEq(val, 0);
    }

    function testWithdraw() public {
        fundContractFromTempAccount("RAM");

        address ownerFromContract = newContract.getOwnerAddress();
        vm.prank(ownerFromContract);
        newContract.withdraw();

        uint256 val = newContract.getAmountFundedByAddress(tempAccount);
        assertEq(address(newContract).balance, 0);

        fundContractFromTempAccount("RAM");

        vm.prank(makeAddr("hello"));
        vm.expectRevert("Owner is not matched with current user !!");
        newContract.withdraw();

        val = newContract.getAmountFundedByAddress(tempAccount);
        assertEq(val, 0.8 * 1e18);
    }
}
