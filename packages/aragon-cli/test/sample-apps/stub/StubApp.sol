/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

pragma solidity *;

contract StubApp {
    bytes32 public constant FIRST_ROLE = keccak256("FIRST_ROLE");
    bytes32 public constant SECOND_ROLE = keccak256("SECOND_ROLE");
    bytes32 public constant NO_PARAMS_ROLE = keccak256("NO_PARAMS_ROLE");

    /**
     * @notice fallback function notive
     * @dev Some dev info
     */
    function () external payable {}

    /**
    * @notice Function with no auth modifier
    * @param _token description of _token
    * @param _amount description of _amount
    */
    function noAuthFunction(address _token, uint256 _amount) external payable {
        _token;
        _amount;
    }

    /**
    * @notice Function with auth modifier multiline
    * @dev Some dev info
    * @param _token description of _token
    * @param _amount description of _amount
    */
    function withAuthMultiline(address _token, uint256 _amount)
        external
        // Some comments
        authP(FIRST_ROLE, _arr(_token, _amount))
    {
        _token;
        _amount;
    }

    /**
    * @notice Function with auth modifier singleline
    * @dev Some dev info
    * @param _token description of _token
    * @param _amount description of _amount
    */
    function withAuthSingleline(address _token, uint256 _amount) external authP(SECOND_ROLE, _arr(_token, _amount)) returns (uint256 paymentId) {
        _token;
        _amount;
    }

    function withAuthNoParams(address _token) external auth(NO_PARAMS_ROLE) returns (bool) {
        _token;
        return false;
    }
}