// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Script} from "../lib/forge-std/src/Script.sol";
import {MockV3Aggregator} from "../test/Mocks/mockV3Aggregator.sol";

contract helperConfig is Script {
    struct Networks {
        address priceFeed;
    }

    Networks public currNetwork;

    constructor() {
        if (block.chainid == 11155111) {
            currNetwork = sepoliaNetwork();
        } else {
            currNetwork = localNetwork();
        }
    }

    function sepoliaNetwork() public pure returns (Networks memory) {
        Networks memory addresses = Networks({priceFeed: 0x694AA1769357215DE4FAC081bf1f309aDC325306});

        return addresses;
    }

    function localNetwork() public returns (Networks memory) {
        vm.startBroadcast();
        MockV3Aggregator newMockContract = new MockV3Aggregator(8, 2000e10);
        vm.stopBroadcast();
        Networks memory addresses = Networks({priceFeed: address(newMockContract)});

        return addresses;
    }
}
