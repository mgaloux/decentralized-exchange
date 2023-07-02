// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;
    uint256 public orderCount;

    event Deposit(
        address token,
        address user, 
        uint256 amount,
        uint256 balance
    );

    event Withdrawal(
        address token,
        address user, 
        uint256 amount,
        uint256 balance
    );

    event Order(
        uint256 id,
        address user,
        address tokenGet, 
        uint256 amountGet,
        address tokenGive, 
        uint256 amountGive,
        uint256 timestamp
    );

    event Cancel(
        uint256 id,
        address user,
        address tokenGet, 
        uint256 amountGet,
        address tokenGive, 
        uint256 amountGive,
        uint256 timestamp
    );

    event Trade(
        uint256 id,
        address user,
        address tokenGet, 
        uint256 amountGet,
        address tokenGive, 
        uint256 amountGive,
        address creator,
        uint256 timestamp
    );

    struct _Order {
        uint256 id;
        address user;
        address tokenGet; 
        uint256 amountGet;
        address tokenGive; 
        uint256 amountGive;
        uint256 timestamp;
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // -------------------------------
    // DEPOSIT AND WITHDRAW

    function depositToken(address _token, uint256 _amount) public {
        // Transfer Tokens to exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));

        // update user balance
        tokens[_token][msg.sender] += _amount;

        // emit event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(tokens[_token][msg.sender] >= _amount);

        // transfer tokens to user
        Token(_token).transfer(msg.sender, _amount);

        // update user balance
        tokens[_token][msg.sender] -= _amount;

        //emit event
        emit Withdrawal(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user)
        public
        view
        returns (uint256)
    {
        return tokens[_token][_user];
    }

    // ----------------------------
    // MAKE & CANCEL ORDERS

    function makeOrder (
        address _tokenGet, 
        uint256 _amountGet,
        address _tokenGive, 
        uint256 _amountGive
    ) public 
    {
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

        orderCount++;
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );

        emit Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp);
    }

    function cancelOrder(uint256 _id) public {
        // fetch
        _Order storage _order = orders[_id];

        require(_order.id == _id, 'invalid id');
        require(address(_order.user) == msg.sender, 'invalid user');

        orderCancelled[_id] = true;

        // cancel
        emit Cancel(
            orderCount,
            msg.sender,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            block.timestamp);
    }

    // ---------------------
    // EXECUTING ORDERS
    function fillOrder(uint256 _id) public {
        require(!orderCancelled[_id]);
        require(!orderFilled[_id]);
        require(_id > 0 && _id <= orderCount, 'Order does not exist');

        // fetch 
        _Order storage _order = orders[_id];

        // trade
        _trade(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive
        );

        // mark as filled
        orderFilled[_order.id] = true;
    }

    function _trade(
        uint256 _orderId,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) internal {
        uint256 _feeAmount = (_amountGet * feePercent) / 100;

        // process trade
        tokens[_tokenGet][msg.sender] -= _amountGet + _feeAmount;
        tokens[_tokenGet][_user] += _amountGet;

        // charge fee
        tokens[_tokenGet][feeAccount] += _feeAmount;

        tokens[_tokenGive][_user] -= _amountGive;
        tokens[_tokenGive][msg.sender] += _amountGive;

        // emit event
        emit Trade(
            _orderId,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            _user,
            block.timestamp
        );
    }
}