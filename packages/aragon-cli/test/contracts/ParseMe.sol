pragma solidity ^0.5.0;

/*
    NOTE: This contract is not intended to compile and is not necessarily correct.
*/
contract ParseMe {

    uint256 public value;

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
}
