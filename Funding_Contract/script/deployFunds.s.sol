// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Script} from "../lib/forge-std/src/Script.sol";
import {Vm} from "../lib/forge-std/src/Vm.sol";
import {Funds} from "../src/fundMe.sol";
import {helperConfig} from "./helperConfig.s.sol";

contract deployFundsContract is Script {
    uint256 deployerPrivateKey = uint256(vm.envBytes32("LOCAL_PRIVATE_KEY"));
    // vm.startBroadcast(privateKey);

    function run() external returns (Funds) {
        helperConfig newHelperConfig = new helperConfig();
        vm.startBroadcast(deployerPrivateKey);
        Funds fundNew = new Funds(newHelperConfig.currNetwork());
        vm.stopBroadcast();
        return fundNew;
    }
}
