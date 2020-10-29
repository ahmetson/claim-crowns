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
	stakingAddress:"", //Address of Smartcontract (Miniapp) on blockchain
	stakingAbi:"",      //Path to Abi in resources folder
	lpTokenAddress:"",
	crownsAddress:"",
	lpTokenAbi:""
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
	let network = {id: 4, name: "rinkeby"};
	// let network = {id: 1, name: "mainnet"};
	cc.walletConnect.connectToMetaMask("", {id: 4, name: "rinkeby"}, onSuccess, onError);
    },

    onLoadContracts(state, address) {
	if (this.walletAddress == undefined) {
	    this.progressLabel.string = "Please unlock wallet first!";
	    return;
	}

	// LP Mining (aka Staking game smartcontract
	cc.ethereumContract
	    .loadContract(this.stakingAddress, this.stakingAbi, this.walletAddress)
	    .then(function(contract){
		cc.stakingContract = contract;

		// LP Token that would be deposited by player
		cc.ethereumContract.loadContract(this.lpTokenAddress, this.lpTokenAbi, this.walletAddress)
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
        this.progressLabel.string = "Approve was not implemented yet. Yell at Medet";
    },

    onDeposit(event) {
	this.progressLabel.string = "Deposit was not implemented yet. Yell at Medet";
    }
});
