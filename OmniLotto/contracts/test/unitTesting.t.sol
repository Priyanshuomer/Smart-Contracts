// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "../lib/forge-std/src/Test.sol";
import {deployLottery} from "../script/DeployLottery.s.sol";
import {Lottery} from "../src/Lottery.sol";
import {OmToken} from "../src/OmToken.sol";
import {HelperConfig} from "../script/HelperConfig.s.sol";
import {
    VRFCoordinatorV2_5Mock
} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract testLottery is Test {
    Lottery lottery;
    // HelperConfig.NetworkConfig helperConfig;
    OmToken token;
    HelperConfig.NetworkConfig config;
    address testPlayer1;
    address testPlayer2;
    address owner;

    function setUp() public {
        testPlayer1 = makeAddr("player1");
        testPlayer2 = makeAddr("player2");
        owner = makeAddr("owner");

        // vm.startPrank(owner);
        deployLottery deployer = new deployLottery();
        (lottery, token, config) = deployer.deployLotteryContract();
        // vm.stopPrank();

        vm.deal(testPlayer1, 3 ether);
        vm.deal(testPlayer2, 3 ether);
        owner = lottery.getOwner();

        // config = helperConfig.getConfig();
    }

    function testDeployLottery() public {
        /**
         * Address of contract is Valid
         */
        assert(address(lottery) != address(0));

        /**
         * Check helperConfigValues
         */

        uint256 minimumEntryFees = config.minimumEntryFees;
        uint256 interval = config.interval;
        address vrfCoordinator = config.vrfCoordinator;
        bytes32 keyHash = config.keyHash;
        uint256 subId = config.subId;
        uint32 callbackGasLimit = config.callbackGasLimit;

        console.log(subId);

        assertEq(minimumEntryFees, 1);
        assertEq(keyHash, 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae);
        assertNotEq(subId, 0);
        assertEq(callbackGasLimit, 500000);
        assertNotEq(vrfCoordinator, address(0), "VRFCoordinatorMock Address is NULL ( not valid )");
    }

    function test_TakeTokensFromEth() public {
        vm.startPrank(testPlayer1);
        lottery.takeTokensFromEth{value: 1 ether}();
        vm.stopPrank();

        // if 1 ETH = 100 tokens, 1 ether should give 100 tokens
        assertEq(token.balanceOf(testPlayer1), 100 * 1e18);
    }

    function test_RevertIf_NotEnoughEth() public {
        vm.startPrank(testPlayer1);
        vm.expectRevert(Lottery.NotEnoughBalance.selector);
        lottery.takeTokensFromEth{value: 0.00001 ether}(); // below s_oneTokenPrice
        vm.stopPrank();
    }

    function testPerformUpkeep() public {
        vm.startPrank(testPlayer1);
        lottery.takeTokensFromEth{value: 1 ether}();
        token.approve(address(lottery), 2 * 1e18);
        lottery.enterIntoGame(2);
        vm.stopPrank();
        // vm.expectRevert();
        // vm.warp(block.timestamp + 60);
        // lottery.performUpkeep("");
        vm.startPrank(testPlayer2);
        lottery.takeTokensFromEth{value: 1 ether}();
        token.approve(address(lottery), 2 * 1e18);
        lottery.enterIntoGame(2);
        vm.stopPrank();

        vm.warp(block.timestamp + 3600);
        lottery.performUpkeep("");
    }

    function testIfLotteryIsNotOpenThenNoTokenPurchase() public {
        vm.prank(owner);
        lottery.changeState(Lottery.LotteryState.BLOCKED);

        vm.startPrank(testPlayer1);
        vm.expectRevert(Lottery.LotteryIsNotOpen.selector);
        lottery.takeTokensFromEth{value: 1 ether}();
        vm.stopPrank();
    }

    function testIfLotteryIsNotOpenThenNoEnetrInGame() public {
        vm.startPrank(testPlayer1);
        lottery.takeTokensFromEth{value: 1 ether}();
        vm.stopPrank();

        vm.prank(owner);
        lottery.changeState(Lottery.LotteryState.BLOCKED);

        vm.startPrank(testPlayer1);
        token.approve(address(lottery), 2 * 1e18);
        vm.expectRevert(Lottery.LotteryIsNotOpen.selector);
        lottery.enterIntoGame(2);
        vm.stopPrank();
    }

    function testIfLotteryIsNotOpenThenNoPerformUpkeep() public {
        vm.startPrank(testPlayer1);
        lottery.takeTokensFromEth{value: 1 ether}();
        token.approve(address(lottery), 2 * 1e18);
        lottery.enterIntoGame(2);
        vm.stopPrank();
        // vm.expectRevert();
        // vm.warp(block.timestamp + 60);
        // lottery.performUpkeep("");
        vm.startPrank(testPlayer2);
        lottery.takeTokensFromEth{value: 1 ether}();
        token.approve(address(lottery), 2 * 1e18);
        lottery.enterIntoGame(2);
        vm.stopPrank();

        vm.warp(block.timestamp + 3600);

        vm.prank(owner);
        lottery.changeState(Lottery.LotteryState.BLOCKED);

        vm.expectRevert(Lottery.LotteryIsNotOpen.selector);
        lottery.performUpkeep("");
    }

    function testNoPlayerEnterIfLotteryIsClosed() public {
        vm.startPrank(testPlayer2);
        lottery.takeTokensFromEth{value: 1 ether}();
        token.approve(address(lottery), 2 * 1e18);
        vm.stopPrank();

        vm.prank(owner);
        lottery.changeState(Lottery.LotteryState.CLOSED);

        vm.startPrank(testPlayer2);
        vm.expectRevert(Lottery.LotteryIsNotOpen.selector);
        lottery.enterIntoGame(2);
        vm.stopPrank();
    }

    function testNoPlayerEnterIfLotteryIsCalculating() public {
        vm.prank(owner);
        lottery.changeState(Lottery.LotteryState.CALCULATING);

        vm.startPrank(testPlayer2);
        vm.expectRevert(Lottery.LotteryIsNotOpen.selector);
        lottery.takeTokensFromEth{value: 1 ether}();
        vm.stopPrank();
    }

    function testNotOwnerCanNotCallOwnerFunctions() public {
        vm.startPrank(testPlayer1);
        vm.expectRevert(abi.encodeWithSelector(Lottery.onlyOwnerIsAllowed.selector, testPlayer1));
        lottery.changeFeeWalletAddress(testPlayer2);

        vm.expectRevert(abi.encodeWithSelector(Lottery.onlyOwnerIsAllowed.selector, testPlayer1));
        lottery.changeInterval(123);

        vm.expectRevert(abi.encodeWithSelector(Lottery.onlyOwnerIsAllowed.selector, testPlayer1));
        lottery.changeMinimumEntryTickets(3);

        vm.expectRevert(abi.encodeWithSelector(Lottery.onlyOwnerIsAllowed.selector, testPlayer1));
        lottery.changeTokenPrice(1e19);

        vm.expectRevert(abi.encodeWithSelector(Lottery.onlyOwnerIsAllowed.selector, testPlayer1));
        lottery.transferOwnerShip(testPlayer2);

        vm.expectRevert(abi.encodeWithSelector(Lottery.onlyOwnerIsAllowed.selector, testPlayer1));
        lottery.resetLottery();

        vm.expectRevert(abi.encodeWithSelector(Lottery.onlyOwnerIsAllowed.selector, testPlayer1));
        lottery.restartTimer();

        vm.stopPrank();
    }


}
