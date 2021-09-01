pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

interface CreamFlashInterface {
    function initiateFlashLoan(
        address _token,
        uint256 _amount,
        uint256 _route,
        bytes calldata _data
    ) external;
}

interface AccountInterface {
    function enable(address) external;

    function disable(address) external;
}
