let ethereumWalletConnect = require('ethereum-wallet-connect');
let ethereumContract = require('ethereum-contract');

cc.Class({
    extends: cc.Component,

    properties: {
        unlockButton:cc.Button,
        loadContractButton:cc.Button,
        approveButton:cc.Button,
	depositButton:cc.Button,
	progressLabel:cc.Label,
	depositAmount:'5',                 // this number should be in String format
    },


    onLoad () {
        this.unlockButton.node.on('click',this.onUnlockWallet,this);
        this.loadContractButton.node.on('click',this.onLoadContracts,this);
        this.approveButton.node.on('click',this.onApprove,this);
	this.depositButton.node.on('click',this.onDeposit,this);

	this.progressLabel.string = "";

	cc.walletConnect = new ethereumWalletConnect();
	cc.ethereumContract = ethereumContract;
    },

    onUnlockWallet(event) {
	this.progressLabel.string = "Unlocking wallet...";
	
	let onError = function(err){
	    this.progressLabel.string = err.toString();
	}.bind(this);
	let onSuccess = function(state, address){
	    if (state === "UNLOCKED") {
		this.walletAddress = address;
		this.progressLabel.string = "Connected as: "+address;
	    } else {
		this.progressLabel.string = "Not expected state from metamask: "+state;
	    }
	}.bind(this);

	let expectedAccount = "";
	let network = {id: cc.networkId, name: cc.networkName};
	cc.walletConnect.connectToMetaMask(expectedAccount, network, onSuccess, onError);
    },

    onLoadContracts(state, address) {
	if (this.walletAddress == undefined) {
	    this.progressLabel.string = "Please unlock wallet first!";
	    return;
	}

	// LP Mining (aka Staking game smartcontract
	cc.ethereumContract
	    .loadContract(cc.stakingAddress, cc.stakingAbi, this.walletAddress)
	    .then(function(contract){
		cc.stakingContract = contract;

		// LP Token that would be deposited by player
		cc.ethereumContract.loadContract(cc.lpTokenAddress, cc.erc20Abi, this.walletAddress)
		    .then(function(token){
			this.progressLabel.string = "Game is ready!";
			cc.lpToken = token;
		    }.bind(this))
		    .catch(function(errToken){
			this.progressLabel.string = errToken.toString();
			cc.error(errToken);
		    }.bind(this));
	    }.bind(this))
	    .catch(function(err){
		this.progressLabel.string = err.toString();
		cc.error(err);
	    }.bind(this));

	// To retrieve data from blockchain
		    // https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#id23
		    //cc.stakingContract.methods.owner().call()...
		    
	// To change contract state
		    // https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#id23
		    //cc.stakingContract.methods.startSession(stakingToken, totalReward, period, startTime, generation).send()...;
    },

    onApprove(event) {
        this.progressLabel.string = "Approve "+this.depositAmount+" LP Tokens...";

	let depositAmount = web3.utils.toWei(this.depositAmount.toString(), 'ether');

	cc.lpToken.methods.approve(cc.stakingAddress, depositAmount)
	    .send()
	    .on('transactionHash', function(hash){
		this.progressLabel.string = "Please wait tx confirmation...";
	    }.bind(this))
	    .on('receipt', function(receipt){
		this.progressLabel.string = "Approved. You can deposit now!";
	    }.bind(this))
	    .on('error', function(err){
		this.progressLabel.string = err.toString();
		cc.error(err);
	    }.bind(this));
    },

    onDeposit(event) {
	this.progressLabel.string = "Deposit "+this.depositAmount+" LP Tokens...";
	let depositAmount = web3.utils.toWei(this.depositAmount.toString(), 'ether');
	
	cc.stakingContract.methods.deposit(cc.lpTokenAddress, depositAmount)
	    .send({from: this.walletAddress})
	    .on('transactionHash', function(hash){
		this.progressLabel.string = "Please wait tx confirmation...";
	    }.bind(this))
	    .on('receipt', function(receipt){
		this.progressLabel.string = "Deposit succeed, check your balance in the wallet!";
	    }.bind(this))
	    .on('error', function(err){
		this.progressLabel.string = err.toString();
		cc.error(err);
	    }.bind(this));
    }
});
