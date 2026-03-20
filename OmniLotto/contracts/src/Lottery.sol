// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {
    VRFConsumerBaseV2Plus
} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {
    VRFV2PlusClient
} from "../lib/chainlink-brownie-contracts/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

import {OmToken} from "./OmToken.sol";

/**
 * @title Lottery
 * @dev A simple lottery contract where users can buy tickets and a winner is randomly selected.
 */

contract Lottery is VRFConsumerBaseV2Plus {
    /**
     * EVENTS
     */
    event playerEnterIntoGame(address indexed player, uint256 tokens);
    event purchaseTokens(address indexed player, uint256 amount);
    event winnersAreDeclared(address indexed winner1, address indexed winner2);
    event RequestIdGenerated(uint256 indexed reqId);
    event SecondWinnerSentFailed(address indexed secondWinner);
   

    /**
     * ERRORS
     */
    error NotEnoughTicketsToEnterIntoGame(uint256 tickets, uint256 minimumRequired);
    error NotEnoughBalance();
    error Winner_Transaction_Failed();
    error UpKeepCheckFailed(uint256 players, uint256 balance, uint256 timePassed);
    error onlyOwnerIsAllowed(address player);
    error TicketNotExists(uint256 ticketNumber);
    error LotteryIsNotOpen();
    error NotMultipleOfTokenPrice(uint256 userEnteredValue, uint256 singleTokenPrice);
    error ResetLotteryFailed();
    error WithdrawFailed();
    error LotteryIsBlocked();
    error AddressWasBlocked(address player);
    error AddressAlreadyBlocked(address player);
    error AddressNotAlreadyBlocked(address player);
    

    /**
     * IMMUTABLES
     */
    bytes32 private immutable i_keyHash;
    uint256 private immutable i_subId;
    uint32 private immutable i_callbackGasLimit;
    uint32 private immutable WINNERS_COUNT = 2;
    uint16 private immutable REQUEST_CONFIRMATIONS = 4;
    
    /**
     * STRUCT
     */

    struct PlayerStruct {
        /**
         * suppose A -> purchased from 3 to 8 ticket numbers
         */
        address payable playerAddress; // address(A)
        uint256 ticketStart; // 3
        uint256 ticketEnd; // 8
    }

    PlayerStruct[] private s_players;
    mapping(address => uint256) private s_playerToAmount;
    mapping(address => bool) private s_isAlreadyBuyTickets;
    mapping(address => bool) private s_blockedAddressMap;
    address[] private s_uniquePlayerAddress;
    address[] private s_blockedAddress;

    uint256 private s_interval;
    uint256 private s_lastTimeStamp;
    uint256 public s_totalTicketsSold = 0;
    address private s_FEE_WALLET_ADDRESS = 0x17521f186Fd06aDC1eb83E35c5606E473f1FfA0f;
    address private s_owner;
    uint256 private s_prizePool;


    /**
    * Store all winners pair
    */
    address[2][] public s_allWinners; 


    uint256 private s_minimumEntryTickets;
    uint256 private s_oneTokenPrice = 1e16; // in wei
    OmToken tokenContract;

    enum LotteryState {
        OPEN,
        CLOSED,
        BLOCKED,
        CALCULATING
    }

    LotteryState private s_currentState;

    constructor(
        uint256 _minimumEntryTickets,
        uint256 _interval,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subId,
        uint32 _callbackGasLimit,
        OmToken _tokenContract
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        s_minimumEntryTickets = _minimumEntryTickets;
        s_interval = _interval;
        s_lastTimeStamp = block.timestamp;
        i_keyHash = _keyHash;
        i_callbackGasLimit = _callbackGasLimit;
        i_subId = _subId;
        s_currentState = LotteryState.OPEN;
        s_owner = msg.sender;
        tokenContract = _tokenContract;
        s_prizePool = 0;
    }

    /**
    *  MODIFIERS
    */

    modifier isOwner() {
        if (msg.sender != s_owner) {
            revert onlyOwnerIsAllowed(msg.sender);
        }
        _;
    }

    modifier isNotBlocked()
    {
        if(s_currentState == LotteryState.BLOCKED)
         {
            revert LotteryIsBlocked();
         }

         _;
    }


    modifier isAddressNotBlocked()
    {
        if(s_blockedAddressMap[msg.sender])
        {
            revert AddressWasBlocked(msg.sender);
        }

        _;
    }

    modifier isLotteryOpen() {
        if (s_currentState != LotteryState.OPEN) {
            revert LotteryIsNotOpen();
        }

        _;
    }

    function findWinnerByTicket(uint256 ticketNumber) internal view returns (address payable) {
        for (uint256 i = 0; i < s_players.length; i++) {
            if (ticketNumber >= s_players[i].ticketStart && ticketNumber <= s_players[i].ticketEnd) {
                return s_players[i].playerAddress;
            }
        }
        revert TicketNotExists(ticketNumber);
    }


    function enterIntoGame(uint256 tickets) public isLotteryOpen isAddressNotBlocked {
        if (tickets < s_minimumEntryTickets) {
            revert NotEnoughTicketsToEnterIntoGame(tickets, s_minimumEntryTickets);
        }

        tokenContract.transferFrom(msg.sender, address(this), tickets * 1e18);

        s_players.push(PlayerStruct(payable(msg.sender), s_totalTicketsSold + 1, s_totalTicketsSold + tickets));

        s_totalTicketsSold = s_totalTicketsSold + tickets;
        s_playerToAmount[msg.sender] += tickets;

        if(!s_isAlreadyBuyTickets[msg.sender])
        {
            s_isAlreadyBuyTickets[msg.sender] = true;
            s_uniquePlayerAddress.push(msg.sender);
        }

        s_prizePool += tickets * s_oneTokenPrice;

        emit playerEnterIntoGame(msg.sender, tickets);
    }

    function takeTokensFromEth() public payable isLotteryOpen isAddressNotBlocked {

        if (msg.value < s_oneTokenPrice) {
            revert NotEnoughBalance();
        }

        if (msg.value % s_oneTokenPrice != 0) {
            revert NotMultipleOfTokenPrice(msg.value, s_oneTokenPrice);
        }

        // Calculate tokens: if 1 ETH = 100 tokens
        // msg.value is in wei (1 ETH = 1e18 wei)
        uint256 tokens = msg.value / s_oneTokenPrice;

        // Mint tokens to buyer
        tokenContract.mint(msg.sender, tokens * 1e18);
        emit purchaseTokens(msg.sender, msg.value);
    }

    function checkUpkeep(bytes memory data)
        public
        view
        isLotteryOpen
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = (block.timestamp - s_lastTimeStamp >= s_interval) && (s_totalTicketsSold > 0)
            && (s_uniquePlayerAddress.length > 1) && (s_prizePool > 0);
        performData = "0x";
    }

    function performUpkeep(bytes calldata performData) public isLotteryOpen {
        (bool upKeepUdated,) = checkUpkeep(bytes(""));
        if (!upKeepUdated) {
            revert UpKeepCheckFailed(s_players.length, s_prizePool, block.timestamp - s_lastTimeStamp);
        }

        s_currentState = LotteryState.CALCULATING;

        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: i_keyHash,
            subId: i_subId,
            requestConfirmations: REQUEST_CONFIRMATIONS,
            callbackGasLimit: i_callbackGasLimit,
            numWords: uint32(WINNERS_COUNT),
            extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
        });

        uint256 requestId = s_vrfCoordinator.requestRandomWords(req);

        emit RequestIdGenerated(requestId);
    }


    function findNonBlockedWinner(uint256 randomWord, uint256 salt) internal view returns (address payable) {
    uint256 attempts = 0;
    uint256 totalAttempts = s_totalTicketsSold;

    while (attempts < totalAttempts) {
        // Generate new ticket number using salt to avoid same result
        uint256 ticketNumber = (uint256(keccak256(abi.encodePacked(randomWord, salt, attempts))) % s_totalTicketsSold) + 1;

        address payable candidate = findWinnerByTicket(ticketNumber);

        // ✅ If not blocked — return this winner
        if (!s_blockedAddressMap[candidate]) {
            return candidate;
        }

        attempts++;
    }

    // All players are blocked — fallback to fee wallet
    return payable(s_FEE_WALLET_ADDRESS);
}



    function fulfillRandomWords(uint256 , uint256[] calldata randomWords) internal override isNotBlocked {
        /*
        *   50% -> FIRST WINNER  (in ETH)
        *   45% -> SECOND WINNER (in ETH)
        *    5% -> FEEWALLET     (in ETH)
        */

        // ── 1. Find which player owns the winning ticket number ──────────────
        address payable firstWinner = findNonBlockedWinner(randomWords[0], 0);
        address payable secondWinner;
        uint256 salt = 1;

        uint256 maxAttempts = s_totalTicketsSold;  
        uint256 attempt = 0;

        do {
            secondWinner = findNonBlockedWinner(randomWords[1], salt);
            salt++;
            attempt++;
        } while (
            secondWinner == firstWinner &&  // still same as first winner
            attempt < maxAttempts           // haven't tried all players yet
        );

        // ✅ If truly no different winner found — give prize to fee wallet
        if (secondWinner == firstWinner) {
            secondWinner = payable(s_FEE_WALLET_ADDRESS);
        }

        // ── 2. Total ETH held by contract ────────────────────────────────────

        uint256 totalPoolEth = s_prizePool;
       

        // ── 3. Calculate shares (integer math only — no decimals in Solidity)
        uint256 firstWinnerAmount = (totalPoolEth * 50) / 100; // 50%
        uint256 secondWinnerAmount = (totalPoolEth * 45) / 100; // 45%
        uint256 remainingAmount = totalPoolEth - firstWinnerAmount - secondWinnerAmount; // 5%

        /**
         * SEND ETH TO WINNERS
         */
        (bool sentFirst,) = firstWinner.call{value: firstWinnerAmount}("");
        if (!sentFirst) {
            revert Winner_Transaction_Failed();
        }
        (bool sentSecond,) = secondWinner.call{value: secondWinnerAmount}("");
         if (!sentSecond) {
           payable(s_FEE_WALLET_ADDRESS).call{value: secondWinnerAmount}("");
             emit SecondWinnerSentFailed(secondWinner);
        }

        (bool sentFeeWallet, ) = payable(s_FEE_WALLET_ADDRESS).call{value: remainingAmount}("");

          /**
         * RESET STATE
         */
        for (uint256 i = 0; i < s_uniquePlayerAddress.length; i++) {
            delete s_playerToAmount[s_uniquePlayerAddress[i]];
            delete s_isAlreadyBuyTickets[s_uniquePlayerAddress[i]];
        }


        delete s_players;
        s_totalTicketsSold = 0;
        s_lastTimeStamp = block.timestamp;
        s_currentState = LotteryState.CLOSED;
        delete s_uniquePlayerAddress;
        s_prizePool = 0;

        s_allWinners.push([firstWinner, secondWinner]);

        /** Burn tokens */
        tokenContract.burn(tokenContract.balanceOf(address(this)));

        emit winnersAreDeclared(firstWinner, secondWinner);
    }

    /**
     * ONLY OWNER FUNCTIONS
     */

    function changeInterval(uint256 _interval) external isOwner {
        s_interval = _interval;
    }

    function changeMinimumEntryTickets(uint256 newMinimum) external isOwner {
        s_minimumEntryTickets = newMinimum;
    }

    function changeTokenPrice(uint256 newTokenPrice) external isOwner {
        s_oneTokenPrice = newTokenPrice;
    }

    function withdrawAllFunds() external isOwner {
        uint256 totalPoolEth = address(this).balance;

        (bool success, ) = payable(s_FEE_WALLET_ADDRESS).call{value: totalPoolEth}("");

        if(!success)
        {
           revert WithdrawFailed();
        }
    }

    function changeFeeWalletAddress(address feeWalletAddress) external isOwner {
        s_FEE_WALLET_ADDRESS = feeWalletAddress;
    }

    function transferOwnerShip(address newOwner) external isOwner {
        s_owner = newOwner;
    }

    function changeState(LotteryState _newState) external isOwner {
        s_currentState = _newState;
    }

    function restartTimer() external isOwner {
        s_lastTimeStamp = block.timestamp;
        s_currentState = LotteryState.OPEN;
    }

    function resetLottery() external isOwner {
        uint256 totalPoolEth = address(this).balance;

        (bool success, ) = payable(s_FEE_WALLET_ADDRESS).call{value: totalPoolEth}("");

        if(!success)
        {
           revert ResetLotteryFailed();
        }


         /**
         * RESET STATE
         */
        for (uint256 i = 0; i < s_uniquePlayerAddress.length; i++) {
            delete s_playerToAmount[s_uniquePlayerAddress[i]];
            delete s_isAlreadyBuyTickets[s_uniquePlayerAddress[i]];
        }


        delete s_players;
        s_totalTicketsSold = 0;
        s_lastTimeStamp = block.timestamp;
        s_currentState = LotteryState.CLOSED;
        delete s_uniquePlayerAddress;
        s_prizePool = 0;
    }

    function blockAddress(address player) external isOwner {
        if(s_blockedAddressMap[player])
        {
            revert AddressAlreadyBlocked(player);
        }

        s_blockedAddressMap[player] = true;
        s_blockedAddress.push(player);
    }

    function unblockAddress(address player) external isOwner {
         if(!s_blockedAddressMap[player])
        {
            revert AddressNotAlreadyBlocked(player);
        }

        s_blockedAddressMap[player] = false;
        uint256 len = s_blockedAddress.length;
        for(uint256 i = 0; i < len; i++)
        {
            if(s_blockedAddress[i] == player)
            {
                s_blockedAddress[i] = s_blockedAddress[len-1];
                s_blockedAddress.pop();
                return ;
            }
        }
    }

    receive() external payable {}

    /**
     * GETTER FUNCTIONS
     */

    function getPlayerByIndex(uint256 idx) public view returns (address) {
        if (idx >= s_players.length) {
            return (address(0));
        } else {
            return s_players[idx].playerAddress;
        }
    }

    function getAllCurrentPlayersWithAmount() external view returns(address[] memory, uint256[] memory)
    {
        uint256 len = s_uniquePlayerAddress.length;
        address[] memory players = new address[](len);
        uint256[] memory amounts = new uint256[](len);

        for(uint256 idx = 0; idx < len; idx++)
        {
            players[idx] = s_uniquePlayerAddress[idx];
            amounts[idx] = s_playerToAmount[s_uniquePlayerAddress[idx]];
        }

        return (players, amounts);
    }


    function getMinimumTicketsRequired() public view returns (uint256) {
        return s_minimumEntryTickets;
    }

    function getInterval() public view returns (uint256) {
        return s_interval; // in seconds
    }

    function getTokenPriceInWei() public view returns (uint256) {
        return s_oneTokenPrice;
    }

    function getOwner() public view returns (address) {
        return s_owner;
    }

    function getFeeWalletAddress() public view returns (address) {
        return s_FEE_WALLET_ADDRESS;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_currentState;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function viewAllWinners() public view returns(address[2][] memory)
    {
        return s_allWinners;
    }

    function getPrizePool() public view returns (uint256) {
    return s_prizePool;
       }

     function addressBlockStatus(address player) public view returns (bool)
       {
           return s_blockedAddressMap[player];
       }

      function getBlockedAddresses() public view returns (address[] memory) {
    return s_blockedAddress;
   }
}
