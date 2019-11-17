pragma solidity ^0.5.0;

/*
    NOTE: This contract is not intended to compile and is not necessarily correct.
*/

import "./IERC20.sol";

contract ParseMe is IERC20 {

    uint256 public value;

    uint256 private _totalSupply;

    mapping (address => uint256) private _balances;

    bytes32 public constant SAMPLE_ROLE_1 = keccak256("SAMPLE_ROLE_1");
    bytes32 public constant SAMPLE_ROLE_2 = keccak256("SAMPLE_ROLE_2");

    function multiplyByTwo(uint256 _value) public pure returns (uint256) {
        return _value * 2;
    }

    /**
     * @notice Update value.
     */
    function updateValue(uint256 _newValue) public auth(SAMPLE_ROLE_1) {
        value = _newValue;
    }

    function updateValueAlt(uint256 _newValue) public auth(SAMPLE_ROLE_2) {
        value = multiplyByTwo(_newValue);
    }

    // Implemented interfaces

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function transferFrom(
    address from,
    address to,
    uint256 value
    )
        public
        returns (bool)
    {
        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        _allowed[from][msg.sender] = _allowed[from][msg.sender].sub(value);
        return true;
    }
}
