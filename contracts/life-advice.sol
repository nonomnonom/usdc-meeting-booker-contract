// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymentContract is Initializable, OwnableUpgradeable {
    // USDC contract address di Base Chain
    address public constant USDC = 0x833615562852909e079C1304892587943d2879bC; // mock  token test 
    
    struct Payment {
        string fid;
        string name;
        string email;
        string additionalNotes;
        uint256 date;
        address payer;
        uint256 amount;
        string[] guestEmails;
    }
    
    Payment[] public payments;
    
    event PaymentReceived(
        uint256 indexed paymentId,
        address indexed payer,
        string fid,
        string name,
        uint256 amount,
        string[] guestEmails
    );
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize() public initializer {
        __Ownable_init(_msgSender());
    }
    
    function makeUSDCPayment(
        string memory _fid,
        string memory _name,
        string memory _email,
        string memory _additionalNotes,
        uint256 _date,
        uint256 _amount,
        string[] memory _guestEmails
    ) external payable {
        require(msg.value == 0, "counter for native ETH");
        require(_amount > 0, "Payment amount must be greater than 0");
        
        IERC20 usdcToken = IERC20(USDC);
        require(usdcToken.transferFrom(msg.sender, address(this), _amount), "USDC transfer failed");
        
        payments.push(Payment({
            fid: _fid,
            name: _name,
            email: _email,
            additionalNotes: _additionalNotes,
            date: _date,
            payer: msg.sender,
            amount: _amount,
            guestEmails: _guestEmails
        }));
        
        emit PaymentReceived(
            payments.length - 1,
            msg.sender,
            _fid,
            _name,
            _amount,
            _guestEmails
        );
    }
    
    function getPayment(uint256 _paymentId) external view returns (
        string memory name,
        string memory email,
        string memory additionalNotes,
        uint256 date,
        address payer,
        uint256 amount,
        string memory fid,
        string[] memory guestEmails
    ) {
        require(_paymentId < payments.length, "Payment does not exist");
        Payment memory payment = payments[_paymentId];
        return (
            payment.name,
            payment.email,
            payment.additionalNotes,
            payment.date,
            payment.payer,
            payment.amount,
            payment.fid,
            payment.guestEmails
        );
    }
    
    function withdrawUSDC() external onlyOwner {
        IERC20 usdcToken = IERC20(USDC);
        uint256 balance = usdcToken.balanceOf(address(this));
        require(usdcToken.transfer(owner(), balance), "USDC transfer failed");
    }
}