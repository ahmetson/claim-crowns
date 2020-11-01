let ethereumWalletConnect = require('ethereum-wallet-connect');
let ethereumContract = require('ethereum-contract');

cc.Class({
    extends: cc.Component,

    properties: {
        unlockButton:cc.Button,
        loadContractButton:cc.Button,
        approveButton:cc.Button,
	depositButton:cc.Button,
	claimButton:cc.Button,
	withdrawButton:cc.Button,
	progressLabel:cc.Label,
	depositAmount:'5',                 // this number should be in String format
	depositLabel:cc.Label,
	earnedLabel:cc.Label,
	claimableLabel:cc.Label,
	contractBalanceLabel:cc.Label,
	sharesLabel:cc.Label,
	apyLabel:cc.Label,
	updateInfoButton:cc.Button,
    },


    onLoad () {
        this.unlockButton.node.on('click',this.onUnlockWallet,this);
        this.loadContractButton.node.on('click',this.onLoadContracts,this);
        this.approveButton.node.on('click',this.onApprove,this);
	this.depositButton.node.on('click',this.onDeposit,this);
	this.updateInfoButton.node.on('click',this.onUpdateInfo,this);
	this.claimButton.node.on('click',this.onClaim,this);
	this.withdrawButton.node.on('click',this.onWithdraw,this);

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
    },

    onClaim(event) {
        this.progressLabel.string = "Claim "+this.claimable+" CWS...";

	cc.stakingContract.methods.claim(cc.lpTokenAddress)
	    .send()
	    .on('transactionHash', function(hash){
		this.progressLabel.string = "Please wait tx confirmation...";
	    }.bind(this))
	    .on('receipt', function(receipt){
		this.progressLabel.string = "Claimed. Update the stats!";
	    }.bind(this))
	    .on('error', function(err){
		this.progressLabel.string = err.toString();
		cc.error(err);
	    }.bind(this));
    },

    onWithdraw(event) {
        this.progressLabel.string = "Withdraw "+this.depositAmount+" LP tokens...";

	let depositAmount = web3.utils.toWei(this.depositAmount.toString(), 'ether');

	cc.stakingContract.methods.withdraw(cc.lpTokenAddress, depositAmount)
	    .send()
	    .on('transactionHash', function(hash){
		this.progressLabel.string = "Please wait tx confirmation...";
	    }.bind(this))
	    .on('receipt', function(receipt){
		this.progressLabel.string = "Withdrawn. Update the stats!";
	    }.bind(this))
	    .on('error', function(err){
		this.progressLabel.string = err.toString();
		cc.error(err);
	    }.bind(this));
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
    },

    onUpdateInfo(event) {
	if (this.walletAddress == undefined) {
	    this.progressLabel.string = "Please unlock wallet first";
	    return;
	}
	if (cc.stakingContract == undefined) {
	    this.progressLabel.string = "Please load contracts first";
	    return;
	}


	// Deposit amount made by player
	cc.stakingContract.methods.stakedBalanceOf(
	    cc.lpTokenAddress, this.walletAddress)
	    .call()
	    .then(function(balance){
		this.deposited = parseFloat(web3.utils.fromWei(balance));
		this.depositLabel.string = this.deposited.toFixed(4) + " LP Token";
	    }.bind(this))
	    .catch(function(err){
		cc.error(err);
	    }.bind(this));

	// Claimed amount of tokens by player
	cc.stakingContract.methods.earned(
	    cc.lpTokenAddress, this.walletAddress)
	    .call()
	    .then(function(balance){
		this.earned = parseFloat(web3.utils.fromWei(balance));
		this.earnedLabel.string = this.earned.toFixed(4) + " LP Token";
	    }.bind(this))
	    .catch(function(err){
		cc.error(err);
	    }.bind(this));

	// Amount that player could claim
	cc.stakingContract.methods.claimable(
	    cc.lpTokenAddress, this.walletAddress)
	    .call()
	    .then(function(balance){
		this.claimable = parseFloat(web3.utils.fromWei(balance));
		this.claimableLabel.string = this.claimable.toFixed(4) + " LP Token";
	    }.bind(this))
	    .catch(function(err){
		cc.error(err);
	    }.bind(this));

	// 1. All player's deposit sum,
	// 2. Shares that player has (in %)
	cc.stakingContract.methods.stakedBalance(cc.lpTokenAddress)
	    .call()
	    .then(function(balance){
		this.totalDeposited = parseFloat(web3.utils.fromWei(balance));
		this.contractBalanceLabel.string = this.totalDeposited.toFixed(4) + " LP Token";

		// Portion of deposited that player shares
		this.shares = (100*(this.deposited/this.totalDeposited));
		this.sharesLabel.string = this.shares.toFixed(4) + " %";

		// APY: it depends on shares and claimed token amount
		this.setApy();
	    }.bind(this))
	    .catch(function(err){
		cc.error(err);
	    }.bind(this));

    },

    setApy() {
	cc.stakingContract.methods.sessions(cc.lpTokenAddress)
	    .call()
	    .then(function(session) {
		let amount = parseFloat(web3.utils.fromWei(session.amount));
		let claimed = parseFloat(web3.utils.fromWei(session.claimed));

		if (claimed >= amount) {
		    this.apyLabel.string = "0 %";
		    return;
		}

		let startUnix = parseInt(session.startTime);
		let period = parseInt(session.period)
		let endUnix = period + startUnix;
		let startTime = new Date(startUnix * 1000);
		// Event didn't start yet
		if (startTime > Date.now()) {
		    this.apyLabel.string = "0 %";
		    return;
		}

		let endTime = new Date(endUnix * 1000);
		// Event finished
		if (endTime < Date.now()) {
		    this.apyLabel.string = "0 %";
		    return;
		}

		//--------------------
		// APY Calculation
		//--------------------

		let cwsSupply = parseFloat(web3.utils.fromWei(session.totalReward));
		let cwsPrice = 1; // in WETH.
		
		// Reward per second:
		let rewardUnit = cwsSupply/period;
		// interest per second.
		let interest = rewardUnit*(this.shares*0.01); // shares in %

		// units per year, units are seconds
		let annualUnits = 31556952;
		let annualInterest = interest * annualUnits * cwsPrice;
		let apy = (annualInterest/cwsSupply)*100;

		this.apyLabel.string = apy + " %";
	    }.bind(this))
	    .catch(function(err){
		console.error(err);
	    }.bind(this));
    }
});
