// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface WETH {
    function withdraw(uint256 wad) external;
    function transferFrom(address src, address dst, uint256 wad)
        external
        returns (bool);
}

interface PirexEth {
    function deposit(
        address receiver,
        bool shouldCompound
    )
        external
        payable
        returns (uint256 postFeeAmount, uint256 feeAmount);
}

contract WethToPirex is Ownable, ReentrancyGuard {
    uint256 private constant DENOMINATOR = 10000;

    address public feeRecipient;
    uint256 public fee = 0;
    WETH public weth;
    PirexEth public pirexEth;

    constructor(uint256 _fee, address _weth, address _pirexEth)
        Ownable(msg.sender)
    {
        feeRecipient = msg.sender;
        fee = _fee;
        weth = WETH(_weth);
        pirexEth = PirexEth(_pirexEth);
    }

    /**
     * This is the address that will receive fees on conversion.
     */
    function setFeeRecipient(address _feeRecipient) public onlyOwner {
        feeRecipient = _feeRecipient;
    }

    /**
     * Set the fee, in basis points.
     * 
     * IE, passing "5" will set the fee to 0.05%
     */
    function setFee(uint256 _fee) public onlyOwner {
        fee = _fee;
    }

    /**
     * Convert WETH to pxETH.
     * 
     * Transfers WETH from msg.sender to this contract, withdraws it to ETH,
     * and deposits that ETH into Pirex on behalf of the provided receiver.
     */
    function convert(address receiver, uint256 amount, bool shouldCompound) public nonReentrant returns (uint256 depositedAmount) {
        require(amount > 0, "amount must be greater than 0");

        // this contract takes the WETH from the caller
        bool transferred = weth.transferFrom(msg.sender, address(this), amount);
        require(transferred, "failed to transfer WETH");

        // withdraw the WETH
        weth.withdraw(amount);

        // determine fee amount
        uint256 feeAmount = (amount * fee) / DENOMINATOR;

        // first the fee is deposited to Pirex (always compounding) on behalf of the feeRecipient
        if (feeAmount > 0) {
            pirexEth.deposit{value: feeAmount}(feeRecipient, true);
        }

        // then the balance, on behalf of the receiver
        uint256 remainingAmount = amount - feeAmount;
        (depositedAmount, ) = pirexEth.deposit{value: remainingAmount}(receiver, shouldCompound);

        return depositedAmount;
    }

    receive() external payable {
        // WETH.withdraw() calls this method, so it must exist even if it's empty
    }
}