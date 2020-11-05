let ethereumWalletConnect = require('ethereum-wallet-connect');
let ethereumContract = require('ethereum-contract');

cc.Class({
    extends: cc.Component,

    properties: {
        unlockButton:cc.Button,
        loadContractButton:cc.Button,
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

			this.setSessionId();
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

    isStartedFor(session) {
	let totalReward = parseFloat(web3.utils.fromWei(session.totalReward));

	if (totalReward == 0) {
	    return false;
	}

	let now = Math.floor(Date.now()/1000);

	let startTime = parseInt(session.startTime);
	let period = parseInt(session.period);

	return now < (startTime + period);
    },

    calculateInterest(session, balance) {
	let balanceAmount = parseInt(balance.amount);
	let sessionAmount = parseInt(session.amount);

	if (balanceAmount == 0 || sessionAmount == 0) {
	    return 0;
	}
	
	let rewardUnit    = parseInt(session.rewardUnit);
	let portion = balanceAmount / sessionAmount;
	let interest = rewardUnit * portion;

	let claimedTime   = parseInt(balance.claimedTime);
	let sessionCap    = Math.floor(Date.now()/1000);
	if (this.isStartedFor(session) == false) {
	    sessionCap    = parseInt(session.startTime) + parseInt(session.period);
	}
	let earnPeriod    = sessionCap - claimedTime;
	return parseFloat(web3.utils.fromWei((interest * earnPeriod).toString()));
    },

    setSessionId() {
	cc.stakingContract.methods.lastSessionIds(cc.lpToken._address).call().then(function(sessionId){
	    if (sessionId == undefined) {
		cc.error("No session was found");
	    } else {
		cc.sessionId = parseInt(sessionId);

		this.updateInfo(sessionId);
	    }
	}.bind(this));
    },

    updateInfo(sessionId) {
	cc.stakingContract.methods.sessions(sessionId).call().then(function(session){
	    cc.session = session;
	    cc.stakingContract.methods.balances(sessionId, this.walletAddress).call().then(function(balance){
		cc.balance = balance;
		
		this.deposited = parseFloat(web3.utils.fromWei(balance.amount));
		this.depositLabel.string = this.deposited.toFixed(4) + " LP Token";

		this.claimable = this.calculateInterest(session, balance);
		this.claimableLabel.string = this.claimable.toFixed(4) + " LP Token";
			    
		this.earned = this.claimable + parseFloat(web3.utils.fromWei(balance.claimed));
		this.earnedLabel.string = this.earned.toFixed(4) + " LP Token";

		this.totalDeposited = parseFloat(web3.utils.fromWei(session.amount));
		this.contractBalanceLabel.string = this.totalDeposited.toFixed(4) + " LP Token";

		// Portion of deposited that player shares
		if (this.totalDeposited == 0) {
		    this.shares = 0;
		    this.sharesLabel.string = "0 %";
		} else {
		    this.shares = (100*(this.deposited/this.totalDeposited));
		    this.sharesLabel.string = this.shares.toFixed(4) + " %";
		}

		// APY: it depends on shares and claimed token amount
		this.setApy(session, balance);
	    }.bind(this))
	}.bind(this))
    },

    listenContractEvents() {
	cc.stakingContract.events.allEvents({})
	    .on('data', async function(data){
		if (data.event == 'Claimed') {
		    // todo
		} else if (data.event == 'Withdrawn') {
		    // todo
		} else if (data.event == 'Deposited') {
		    // todo
		}
	    }.bind(this))
	    .on('error', cc.error);
    },

    onClaim(event) {
        this.progressLabel.string = "Claim "+this.claimable+" CWS...";

	cc.stakingContract.methods.claim(cc.sessionId)
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

	cc.stakingContract.methods.withdraw(cc.sessionId, depositAmount)
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

    approve(allowance, depositAmount) {
        this.progressLabel.string = "Approve "+this.depositAmount+" LP Tokens...";

	cc.lpToken.methods.approve(cc.stakingAddress, allowance)
	    .send()
	    .on('transactionHash', function(hash){
		this.progressLabel.string = "Please wait tx confirmation...";
	    }.bind(this))
	    .on('receipt', function(receipt){
		this.progressLabel.string = "Approved!";
		this.deposit(depositAmount);
	    }.bind(this))
	    .on('error', function(err){
		this.progressLabel.string = err.toString();
		cc.error(err);
	    }.bind(this));
    },

    // Deposit tokens to smartcontract
    // The deposit is called within smartcontract.
    // However deposit needs to get an approvement from token holder.
    //
    // We do an approvement only once.
    onDeposit(event) {
	this.progressLabel.string = "Checking allowance for "+this.depositAmount+" LP Tokens...";
	let depositAmount = web3.utils.toWei(this.depositAmount.toString(), 'ether');

	let maxToken     = 1000000; // 1 million
	let maxAllowance = this.depositAmount > maxToken
	    ? depositAmount
	    : web3.utils.toWei(maxToken.toString(), 'ether');

	let owner = this.walletAddress;    // Current wallet account
	let sender = cc.stakingAddress;    // allows to spend token to staking contract

	cc.lpToken.methods.allowance(owner, sender).call().then(function(allowance){
	    allowance = parseInt(allowance);
	    if (allowance < depositAmount) {
		this.approve(maxAllowance, /*then deposit:*/ depositAmount);
	    } else {
		this.deposit(depositAmount);
	    }
	}.bind(this));
    },

    deposit(depositAmount) {
	this.progressLabel.string = "Deposit "+this.depositAmount+" LP Tokens...";
	
	cc.stakingContract.methods.deposit(cc.sessionId, depositAmount)
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
	this.updateInfo(cc.sessionId);
    },

    setApy(session, balance) {
	let amount = parseFloat(web3.utils.fromWei(session.amount));
	let claimed = parseFloat(web3.utils.fromWei(session.claimed));

	if (amount == 0) {
	    this.apyLabel.string = "0 %";
	    return;
	}

	let startUnix = parseInt(session.startTime);
	let period = parseInt(session.period);
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
		
	// units per year, units are seconds
	let annualUnits = 31556952;  // 1 year in seconds
	let annualReward = rewardUnit * annualUnits * cwsPrice;
	let apy = (annualReward/amount)*100;

	this.apyLabel.string = apy.toFixed(4) + " %";
    }
});
