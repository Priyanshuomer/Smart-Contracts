// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "../lib/forge-std/src/Script.sol";
import {Lottery} from "../src/Lottery.sol";
import {OmToken} from "../src/OmToken.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {
    VRFCoordinatorV2_5Mock
} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

import {console} from "../lib/forge-std/src/console.sol";

contract deployLottery is Script {
    /**
     * Some constants
     */
    uint96 private baseFee = 0.25 ether;
    uint96 private gasPrice = 1e9;
    int256 private weiPerUnitLink = 4e15;

    function deployLotteryContract() public returns (Lottery, OmToken, HelperConfig.NetworkConfig memory) {

        // ✅ Deploy mock first — small standalone deployment
        address vrfCoordinator;
        if (block.chainid == 31337) {
             vm.startBroadcast();
            VRFCoordinatorV2_5Mock mock = new VRFCoordinatorV2_5Mock(baseFee, gasPrice, weiPerUnitLink);
            vrfCoordinator = address(mock);
            vm.stopBroadcast();
        } else {
            vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
        }

        // ✅ HelperConfig is now small — no mock deployment inside it
        HelperConfig helperConfig = new HelperConfig(vrfCoordinator);
        HelperConfig.NetworkConfig memory cfg = helperConfig.getConfig();
        
        vm.startBroadcast();
        OmToken tokenContract = new OmToken(10_000_000_000_000_000_000);

        uint256 subId = cfg.subId;
        if (block.chainid == 31337) {
            subId = VRFCoordinatorV2_5Mock(cfg.vrfCoordinator).createSubscription();
            VRFCoordinatorV2_5Mock(cfg.vrfCoordinator).fundSubscription(subId, 1000 ether);
        }

        Lottery lottery = new Lottery(
            cfg.minimumEntryFees,
            cfg.interval,
            cfg.vrfCoordinator,
            cfg.keyHash,
            subId,
            cfg.callbackGasLimit,
            tokenContract
        );

        if (block.chainid == 31337) {
            VRFCoordinatorV2_5Mock(cfg.vrfCoordinator).addConsumer(subId, address(lottery));
        }

        tokenContract.setLotteryContract(address(lottery));

        cfg.subId = subId;

        vm.stopBroadcast();

        // Print addresses for easy copy-paste into frontend
        console.log("VRFMock:  ", cfg.vrfCoordinator);
        console.log("OmToken:  ", address(tokenContract));
        console.log("Lottery:  ", address(lottery));
        console.log("SubId:    ", subId);

        return (lottery, tokenContract, cfg);
    }

    function run() external {
        deployLotteryContract();
    }
}
