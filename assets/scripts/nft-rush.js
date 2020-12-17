let ethereumWalletConnect = require('ethereum-wallet-connect');
let ethereumContract = require('ethereum-contract');

cc.Class({
    extends: cc.Component,	 

    properties: {
        spendAmount:'5',                 // this number should be in String format

	loadContractButton:cc.Button,
	initGameButton:cc.Button,
	spendButton:cc.Button,
	mintButton:cc.Button,
	fetchButton:cc.Button,

	progressLabel:cc.Label,

	spentLabel:cc.Label,
	mintTime:cc.Label,
	qualityLabel:cc.Label,
	sessionEndLabel:cc.Label,

	spentTodayList:cc.Label,
	spentAlltimeList:cc.Label
    },


    onLoad () {
        this.loadContractButton.node.on('click',this.onLoadContracts,this);
        this.initGameButton.node.on('click',this.onInitGame,this);
	this.spendButton.node.on('click',this.onSpend,this);
	this.mintButton.node.on('click',this.onMint,this);
	this.fetchButton.node.on('click',this.onFetch,this);

	this.progressLabel.string = "";

	cc.ethereumContract = ethereumContract;

	this.spentTodayPath = "nftrush/leaderboard/spent/today/";
	this.spentAlltimePath = "nftrush/leaderboard/spent/alltime/";
	this.mintedTodayPath = "nftrush/leaderboard/minted/today/";
	this.mintedAlltimePath = "nftrush/leaderboard/minted/alltime/";
    },

    onLoadContracts(state, address) {
	// Nft Rush (aka Staking game smartcontract
	cc.ethereumContract
	    .loadContract(cc.nftRushAddress, cc.nftRushAbi, cc.walletAddress)
	    .then(function(contract){
		cc.nftRush = contract;

		// LP Token that would be deposited by player
		cc.ethereumContract.loadContract(cc.crownsAddress, cc.erc20Abi, cc.walletAddress)
		    .then(function(token){

			cc.cws = token;

			cc.ethereumContract.loadContract(cc.nftAddress, cc.nftAbi, cc.walletAddress)
			    .then(function(nft){
				cc.nft = nft;

				cc.ethereumContract.loadContract(cc.factoryAddress, cc.factoryAbi, cc.walletAddress)
				    .then(function(factory){
					cc.factory = factory;
					this.progressLabel.string = "Successfully loaded!";
				
					this.setSessionId();
				    }.bind(this))
			    }.bind(this))
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

    setSessionId() {
	cc.nftRush.methods.lastSessionId().call().then(function(sessionId){
	    if (sessionId == undefined) {
		cc.error("No session was found");
	    } else {
		cc.sessionId = parseInt(sessionId);
	    }
	}.bind(this));
    },

    onInitGame() {
	if (cc.sessionId == 0) {
	    alert("No session was found");
	    return;
	}
	
	cc.nftRush.methods.sessions(cc.sessionId).call().then(function(session){
	    cc.session = session;
	    cc.nftRush.methods.balances(cc.sessionId, cc.walletAddress).call().then(function(balance){
		cc.balance = balance;

                // 1. get session end from blockchain		
		this.sessionEnd = (parseInt(session.startTime) + parseInt(session.period)) * 1000;
		this.left = this.sessionEnd - Date.now();
		if (this.left <= 0) {		    
		    this.sessionEndLabel.string = "Game session #"+cc.sessionId+" not active";
		} else {
		    this.sessionEndLabel.string = new Date(this.sessionEnd).toString();
		}

		// 2. player spent balance from blockchain
		this.setSpent(balance.amount);
		
		// 3. player minting time from blockchain
		this.lastMintedTime = web3.utils.fromWei(balance.mintedTime);
		this.mintTime.string = new Date(this.lastMintedTime * 1000).toString();
		
		// 4. next minting token quality from backend
		this.fetchTokenQuality();
		// 5. spent daily leaderboard and spent all time leaderboard from backend
		this.fetchLeaderboards();
	    }.bind(this))
	}.bind(this))
    },

    setSpent(amount) {
	this.spent = parseInt(web3.utils.fromWei(amount));	
	this.spentLabel.string = this.spent + " CWS";	
    },

    fetchLeaderboards() {	
	this.spentTodayList.string = "";
	this.spentAlltimeList.string = "";
	
	// Fetching spent cws leaderboard for today:
	let spentTodayUrl = cc.backendUrl + this.spentTodayPath + cc.sessionId;
	fetch(spentTodayUrl)
	    .then((response) => {		
		return response.json();		
	    })	
	    .then((data)=> {    // json data

		if (data.length == 0) {
		    this.spentTodayList.string = "No leaderboard winners";
		} else {
		    // example of showing the list of leaderboard winners

		    data.forEach(function(row) {
			let walletAddress = row[0];
			let score = row[1];
			this.spentTodayList.string += `${walletAddress}: ${score}\n`;
		    }.bind(this));
		}
	    });

	// Fetching spent cws leaderboard for all session time:	
	let spentAlltimeUrl = cc.backendUrl + this.spentAlltimePath + cc.sessionId;
	fetch(spentAlltimeUrl)
	    .then((response) => {		
		return response.json();		
	    })	
	    .then((data) => {    // json data

		if (data.length == 0) {
		    this.spentTodayList.string = "No leaderboard winners";
		} else {
		    // example of showing the list of leaderboard winners
	
		    data.forEach(function(row) {
			let walletAddress = row[0];
			let score = row[1];
			this.spentAlltimeList.string += `${walletAddress}: ${score}\n`;
		    }.bind(this));
		}
	    });	
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

    onMint(event) {
	let mintableTime = (parseInt(cc.session.interval) + parseInt(this.lastMintedTime)) * 1000;
	let left = mintableTime - Date.now();
	if (left > 0) {
	    alert("Left "+parseInt(left/1000)+" seconds to mint");
	    return;
	}

	if (this.quality == undefined || this.qualitySignature == undefined) {
	    alert("No quality signature from server...");
	    return;
	}
	
	this.progressLabel.string = "Minting a token...";

	let dots = this.signatureDots(this.qualitySignature);

	cc.nftRush.methods.mint(cc.sessionId, dots.v, dots.r, dots.s, this.quality)	
	    .send()
	    .on('transactionHash', function(hash){
		this.progressLabel.string = "Please wait tx confirmation...";
	    }.bind(this))
	    .on('receipt', function(receipt){
		this.progressLabel.string = "Nft Minted!";		
		this.lastMintedTime = parseInt(Date.now()/1000);
		this.mintTime.string = new Date(this.lastMintedTime * 1000).toString();

		this.setSpent(web3.utils.toWei("0"));
	    }.bind(this))
	    .on('error', function(err){
		this.progressLabel.string = err.toString();
		cc.error(err);
	    }.bind(this));	
    },

    signatureDots(hash) {
	let r = hash.substr(0,66);	
	let s = "0x" + hash.substr(66,64);
	let v = parseInt(hash.substr(130), 16);
	if (v < 27) {
	    v += 27;
	}

	return {r: r, s: s, v: v};
    },

    onFetch(event) {
	this.fetchLeaderboards();
    },

    approve(allowance, amount) {
        this.progressLabel.string = "Approve "+allowance+" CWS...";

	cc.cws.methods.approve(cc.nftRushAddress, allowance)
	    .send()
	    .on('transactionHash', function(hash){
		this.progressLabel.string = "Please wait tx confirmation...";
	    }.bind(this))
	    .on('receipt', function(receipt){
		this.progressLabel.string = "Approved!";
		this.spend(amount);
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
    onSpend(event) {
	
	this.progressLabel.string = "Checking allowance for "+this.spendAmount+" CWS...";
	let spendAmount = web3.utils.toWei(this.spendAmount.toString(), 'ether');

	let maxToken     = 1000000; // 1 million
	let maxAllowance = this.spendAmount > maxToken
	    ? spendAmount
	    : web3.utils.toWei(maxToken.toString(), 'ether');

	let owner = cc.walletAddress;    // Current wallet account
	let sender = cc.nftRushAddress;    // allows to spend token to staking contract

	cc.cws.methods.allowance(owner, sender).call().then(function(allowance){
	    allowance = parseInt(allowance);
	    if (allowance < spendAmount) {
		this.approve(maxAllowance, /*then deposit:*/ spendAmount);
	    } else {
		this.spend(spendAmount);
	    }
	}.bind(this));
    },

    spend(spendAmount) {	
        this.progressLabel.string = "Spending "+this.spendAmount+" CWS...";
	
	cc.nftRush.methods.spend(cc.sessionId, spendAmount)
	    .send({from: cc.walletAddress})
	    .on('transactionHash', function(hash){
		this.progressLabel.string = "Please wait tx confirmation...";
	    }.bind(this))
	    .on('receipt', function(receipt){
		this.progressLabel.string = "Spent!";
		let newSpent = web3.utils.toWei((parseInt(this.spent) + parseInt(this.spendAmount)).toString());
		this.setSpent(newSpent);
		// fetch a new quality from server,
		// might need to wait for some seconds...
		setTimeout(this.fetchTokenQuality.bind(this), 5 * 1000);		    
	    }.bind(this))
	    .on('error', function(err){
		this.progressLabel.string = err.toString();
		cc.error(err);
	    }.bind(this));
    },

    fetchTokenQuality() {	
	fetch(this.getQualityUrl())
	    .then((response) => {
		response.json()
		    .then((json) => {
			if (json.quality != undefined) {
			    this.quality = parseInt(json.quality);
			    this.qualitySignature = json.signature;
			    cc.log("Quality was set to "+this.quality);
			    this.qualityLabel.string = this.quality;
			    cc.log("Quality signature: "+json.signature);
			}
		    });
	    })
	    .catch(console.error)
    },

    getQualityUrl () {
	return (cc.backendUrl + "nftrush/quality/" + cc.walletAddress);
    },
});
