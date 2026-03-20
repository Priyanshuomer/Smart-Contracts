// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "../lib/forge-std/src/Script.sol";
import {
    VRFCoordinatorV2_5Mock
} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract HelperConfig is Script {
    error NotSupportedChain(uint256 chainId);

    struct NetworkConfig {
        uint256 minimumEntryFees;
        uint256 interval;
        address vrfCoordinator;
        bytes32 keyHash;
        uint256 subId;
        uint32 callbackGasLimit;
    }

    // ✅ Store config in memory only — not as public state variable
    //    Public state variable adds getter bytecode, pushing size over limit
    NetworkConfig private s_config;

    constructor(address vrfCoordinator) {
        if (block.chainid == 31337) {
            s_config = NetworkConfig({
                minimumEntryFees: 1,
                interval: 1800,
                vrfCoordinator: vrfCoordinator,
                keyHash: 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae,
                subId: 0,
                callbackGasLimit: 500_000
            });
        } else if (block.chainid == 11155111) {
            s_config = NetworkConfig({
                minimumEntryFees: 1,
                interval: 3600,
                vrfCoordinator: 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B,
                keyHash: 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae,
                subId: 3272138949838361085709098852573534870680370935267877269539404994954813442783,
                callbackGasLimit: 500_000
            });
        } else {
            revert NotSupportedChain(block.chainid);
        }
    }

    function getConfig() public view returns (NetworkConfig memory) {
        return s_config;
    }
}
