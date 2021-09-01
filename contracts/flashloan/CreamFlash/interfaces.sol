pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

interface DSAInterface {
    function flashCallback(
        address sender,
        address token,
        uint256 amount,
        string[] calldata _targetNames,
        bytes[] calldata _datas,
        address _origin
    ) external;
}

interface IndexInterface {
    function master() external view returns (address);
}

interface ListInterface {
    function accountID(address) external view returns (uint64);
}

interface TokenInterface {
    function approve(address, uint256) external;

    function transfer(address, uint256) external;

    function transferFrom(
        address,
        address,
        uint256
    ) external;

    function deposit() external payable;

    function withdraw(uint256) external;

    function balanceOf(address) external view returns (uint256);

    function decimals() external view returns (uint256);
}

interface ERC3156FlashBorrowerInterface {
    function onFlashLoan(
        address _initiator,
        address _token,
        uint256 _amount,
        uint256 _fee,
        bytes calldata data
    ) external returns (bytes32);
}

interface ERC3156FlashLenderInterface {
    function flashLoan(
        ERC3156FlashBorrowerInterface receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bool);

    //function underlyingToCToken(address token) external;
}
