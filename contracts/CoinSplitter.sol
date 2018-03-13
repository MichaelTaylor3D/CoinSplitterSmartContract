/**
  Contract: Split
  Description: This contract provides functions that allow the creator
  of the contract to maintain a collection of coin addresses and their weights.
  Once established, any eth that is sent to this contract will be automatically 
  split up by their weights and send to each address.
 
  When paired with exchange services like shapeshift.io and coinbase recurring transactions,
  This can be used as a means to automatically invest accross a broad spectrum of crypto.     
 */
pragma solidity ^0.4.0;


contract CoinSplitter {
    address public creator;
    mapping(uint8 => address) public addresses;
    
    // As whole numbers that add up to 100
    mapping(uint8 => uint8) public weights;
    
    // Running count of current weights, used to prevent going past 100.
    uint8 public currentTotalWeight;

    // By keeping an index of how many coins we want are using
    // We can just ignore the indexes we are no longer using
    // and just overwrite indexes that we want to add.
    // This is much cheaper in gas cost, then deleting mapping elements.
    uint8 public numCoins;

    // We need a minDeposit, because if we send amounts to small,
    // they might not be accepted as inputs at exchanges.
    uint256 public minDepositInWei;

    function CoinSplitter() public {
        numCoins = 0;
        // Equivalent to 0.1 Ether
        minDepositInWei = 100000000000000000;
        currentTotalWeight = 0;
        creator = msg.sender;
    }

    function () public payable {
        address thisContract = this;
        if (thisContract.balance >= minDepositInWei) {
            splitBalance();
        }        
    }

    modifier onlyOwner() {
        require(msg.sender == creator);
        _;
    }

    function addSplitAddr(uint8 weight, address addr) public onlyOwner {
        require((currentTotalWeight + weight) <= 100);
        addresses[numCoins] = addr;
        weights[numCoins] = weight;
        currentTotalWeight += weight;
        numCoins++;
    }

    function removeLastAddr() public onlyOwner {
        require(numCoins != 0);
        currentTotalWeight -= weights[numCoins];
        numCoins--;
    }

    function clearAllAddr() public onlyOwner {
        currentTotalWeight = 0;
        numCoins = 0;
    }

    function changeRequiredMinDeposit(uint256 value) public onlyOwner {
        minDepositInWei = value;
    }

    // Use this to empty the contract of any residual funds
    // That have not met the minimum threshold needed to initiate the autosplit
    function withdrawlAll() public onlyOwner {
        address thisContract = this;
        creator.transfer(thisContract.balance);
    }

    function splitBalance() public {
        uint myBalance = this.balance;
        for (uint8 i = 0; i < numCoins; ++i) {
            uint sendAmount = (myBalance * weights[i]) / 100;
            if ((myBalance - sendAmount) > 0) {
                addresses[i].transfer(sendAmount);
            }
        }
    }

    // No self destruct method, if your done with the contract just call withdrawlAll()
    // And forget about it.
}