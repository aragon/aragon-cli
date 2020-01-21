pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";


contract Counter is AragonApp {
    using SafeMath for uint256;

    event Increment(address indexed entity, uint256 step);
    event Decrement(address indexed entity, uint256 step);

    uint256 public value;

    bytes32 constant public INCREMENT_ROLE = keccak256("INCREMENT_ROLE");
    bytes32 constant public DECREMENT_ROLE = keccak256("DECREMENT_ROLE");

    function initialize() public onlyInit {
        initialized();
    }

    function increment(uint256 step) external auth(INCREMENT_ROLE) {
        value = value.add(step);
        emit Increment(msg.sender, step);
    }

    function decrement(uint256 step) external auth(DECREMENT_ROLE) {
        value = value.sub(step);
        emit Decrement(msg.sender, step);
    }

    function getVersion() public pure returns (string) {
        return "0";
    }
}
