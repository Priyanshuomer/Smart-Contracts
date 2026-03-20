// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract OmToken is ERC20 {
    /**
     * STATE VARIABLES
     */
    address private s_lotteryContract;

    /**
     * ERRORS
     */
    error NotValidLotteryContract(address lottery);
    error AlreadyLotteryAddressSet(address lottery);
    error onlyOwnerIsAllowed(address sender);

    address public s_owner;

    constructor(uint256 initialSupply) ERC20("OmToken", "OMTK") {
        _mint(msg.sender, initialSupply);
        s_owner = msg.sender;
    }

     modifier isOwner() {
        if (msg.sender != s_owner) {
            revert onlyOwnerIsAllowed(msg.sender);
        }
        _;
    }

    function setLotteryContract(address lotteryAddress) external isOwner {
        s_lotteryContract = lotteryAddress;
    }


    // Only Lottery contract can mint
    function mint(address to, uint256 amount) external {
        if (msg.sender != s_lotteryContract) {
            revert NotValidLotteryContract(msg.sender);
        }

        _mint(to, amount);
    }

      function burn(uint256 amount) external {
            if (msg.sender != s_lotteryContract) {
                revert NotValidLotteryContract(msg.sender);
            }

            _burn(msg.sender, amount); // burns from Lottery's balance
        }

    function getLotteryContract() public view isOwner returns (address) {
        return s_lotteryContract;
    }
}
