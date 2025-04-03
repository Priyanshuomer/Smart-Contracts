// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Script} from "../lib/forge-std/src/Script.sol";
import {Vm} from "../lib/forge-std/src/Vm.sol";
import {Funds} from "../src/fundMe.sol";
import {helperConfig} from "./helperConfig.s.sol";

contract deployFundsContract is Script
{
    function run() external returns(Funds) {
        helperConfig newHelperConfig = new helperConfig();
        vm.startBroadcast();
        Funds fundNew = new Funds(newHelperConfig.currNetwork());
        vm.stopBroadcast();
        return fundNew;
    }
}