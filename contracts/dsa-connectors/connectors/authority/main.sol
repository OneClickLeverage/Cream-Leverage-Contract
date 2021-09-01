pragma solidity ^0.7.0;

import {AccountInterface} from "../../common/interfaces.sol";
import {Helpers} from "./helpers.sol";

abstract contract AuthorityResolver is Helpers {
    function add(address authority) external payable {
        require(authority != address(0), "Not-valid-authority");
        AccountInterface _dsa = AccountInterface(address(this));
        if (_dsa.isAuth(authority)) {
            authority = address(0);
        } else {
            _dsa.enable(authority);
        }
    }

    function remove(address authority) external payable {
        require(checkAuthCount() > 1, "Removing-all-authorities");
        require(authority != address(0), "Not-valid-authority");
        AccountInterface _dsa = AccountInterface(address(this));
        if (_dsa.isAuth(authority)) {
            _dsa.disable(authority);
        } else {
            authority = address(0);
        }
    }
}

contract ConnectV2Auth is AuthorityResolver {
    string public constant name = "Auth";
}
