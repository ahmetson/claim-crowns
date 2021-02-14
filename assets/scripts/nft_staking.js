let ethereumWalletConnect = require('ethereum-wallet-connect');
let ethereumContract = require('ethereum-contract');

cc.Class({
    extends: cc.Component,	 

    properties: {
        spendAmount:'5',                 // this number should be in String format

	loadContractButton:cc.Button,
	initGameButton:cc.Button,
	updateStatsButton: cc.Button,

	addButton1: cc.Button,
	addButton2: cc.Button,
	addButton3: cc.Button,

	claimButton1: cc.Button,
	claimButton2: cc.Button,
	claimButton3: cc.Button,

	claimButtonAll: cc.Button,
	
	progressLabel:cc.Label,

	sessionEndLabel: cc.Label,
	slot1: cc.Label,
	slot2: cc.Label,
	slot3: cc.Label,

	claimAmount1: cc.Label,
	claimAmount2: cc.Label,
	claimAmount3: cc.Label,
	claimAmountAll: cc.Label,

	totalEarned: cc.Label,
	yourPower: cc.Label,

	bonus: cc.Label,

	///------------------------------------------------------------
	/// Nft list
	///------------------------------------------------------------
	nftListLayout: cc.Node,
	nftListClose: cc.Button,
	nftListContent: cc.Node,
	nftItemPrefab: cc.Prefab,
    },


    onLoad () {
        this.loadContractButton.node.on('click',this.onLoadContracts,this);
        this.initGameButton.node.on('click',this.onInitGame,this);
	this.updateStatsButton.node.on('click',this.onUpdate,this);
	
	this.addButton1.node.on('click',this.onAdd1,this);
	this.addButton2.node.on('click',this.onAdd2,this);
	this.addButton3.node.on('click',this.onAdd3,this);

	this.claimButton1.node.on('click', this.onClaim1, this);
	this.claimButton2.node.on('click', this.onClaim2, this);
	this.claimButton3.node.on('click', this.onClaim3, this);
	this.claimButtonAll.node.on('click', this.onClaimAll, this);
	
	this.progressLabel.string = "";

	cc.ethereumContract = ethereumContract;

	this.spPointPath = "nft/sp-points/";

	this.balances = [];
	this.totalClaimable = 0;

	/// --------------------
	/// initiate nft list
	/// --------------------
	this.hideNftList();
	this.nftListClose.node.on('click', this.hideNftList, this);
    },

    onLoadContracts(state, address) {
	// Nft Staking, the third game in seascape network
	cc.ethereumContract
	    .loadContract(cc.nftStakingAddress, cc.nftStakingAbi, cc.walletAddress)
	    .then(function(contract){
		cc.nftStaking = contract;

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
	return new Promise((res, rej) => {
	    cc.nftStaking.methods.lastSessionId().call().then(function(sessionId){
	    if (sessionId == undefined) {
		rej("No session was found");
	    } else {
		cc.sessionId = parseInt(sessionId);
		res(cc.sessionId);
	    }
	    }.bind(this));
	});
    },

    // @params.index slot index in smartcontract. value must be between 0-2
    // @params.fetchNext whether to fetch data of next slot or not
    fetchSlot(params) {
	if (params.index < 0 || params.index > 2) {
	    return;
	}

	let slotId = (params.index + 1).toString();
	
	cc.nftStaking.methods
	    .balances(cc.sessionId, cc.walletAddress, params.index).call()	
	    .then((balance) => {		
		this.balances[slotId] = balance;

		// 1. update slot status to nft id
		this["slot"+slotId].string = `slot ${slotId}: nft #${balance.nftId}`; 
		
		
		// 2. player spent balance from blockchain
		this["claimable"+slotId] = this.calculateInterest(cc.session, balance);
		this["claimAmount"+slotId].string = "slot "+slotId+": "+this["claimable"+slotId];
		
		// 3. update total unclaim balance
		this.totalClaimable += this["claimable"+slotId];
		this.claimAmountAll.string = this.totalClaimable;

		// todo
		// your power

		// change the smartcontract to track total earned
		// total earned
		
		// 4. fetch next slot if it asked
		if (params.fetchNext) {
		    this.fetchSlot({fetchNext: true, index: params.index + 1});
		}
	    });
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
	let balanceAmount = parseInt(balance.sp);
	let sessionAmount = parseInt(session.totalSp);

	let rewardUnit    = parseInt(session.rewardUnit);
	let portion = balanceAmount / sessionAmount;
	if (isNaN(portion)) {
	    return 0;
	}
	let interest = rewardUnit * portion;

	let claimedTime   = parseInt(balance.claimedTime);
	let sessionCap    = Math.floor(Date.now()/1000);
	if (this.isStartedFor(session) == false) {
	    sessionCap    = parseInt(session.startTime) + parseInt(session.period);
	}
	let earnPeriod    = sessionCap - claimedTime;
	return parseFloat(web3.utils.fromWei((interest * earnPeriod).toString()));
    },

    
    onInitGame() {
	this.totalClaimable = 0;	
	
	// latest game session id
	this.setSessionId()
	    .then((sessionId) => {
		// session is a general data about the game
		cc.nftStaking.methods.sessions(cc.sessionId).call()		
		    .then((session) => {			
			cc.session = session;

			this.setSessionEnd(session);
			
			// player could have up to 3 parallel stats the game,
			cc.nftStaking.methods.slots(cc.sessionId, cc.walletAddress).call()			
			    .then((slots) => {				
				cc.log("Number of used slots: "+slots);				
				this.usedSlots = parseInt(slots);

				this.fetchSlot({index: 0, fetchNext: true});			
			    });
		    })		
	    });

	this.fetchBonus().then(json => {
	    this.bonusAmount = json.bonus;
	    this.bonusSignature = json.signature;

	    this.bonus.string = this.bonusAmount.toString() + "%";
	})
    },

    onUpdate() {	
	// player could have up to 3 parallel stats the game,	
	cc.nftStaking.methods.slots(cc.sessionId, cc.walletAddress).call()	
	    .then((slots) => {
		cc.log("Number of used slots: "+slots);
		
		this.usedSlots = parseInt(slots);
		
		this.fetchSlot({index: 0, fetchNext: true});
	    })
    },


    setSessionEnd (session) {
	this.sessionEnd = (parseInt(session.startTime) + parseInt(session.period)) * 1000;
	
	this.left = this.sessionEnd - Date.now();
	
	if (this.left <= 0) {
	    
	    this.sessionEndLabel.string = "Game session #"+cc.sessionId+" not active";
	    
	} else {
	    
	    this.sessionEndLabel.string = new Date(this.sessionEnd).toString();
	    
	}
    },


    onAdd1() {
	if (this.balances[1] != undefined && this.balances[1].nftId > 0) {
	    cc.error("Slot 1 is already fit with NFT");
	    this.progressLabel.string = "Slot 1 is used by Nft";
	    return;
	}

	this.showNftList();
	this.populateNftList(1); // pick 1 nft from list, then call adding nft to slot
    },

    onAdd2() {	
	if (this.balances[2] != undefined && this.balances[2].nftId > 0) {
	    cc.error("Slot 2 is already fit with NFT");
	    this.progressLabel.string = "Slot 2 is used by Nft";
	    return;
	}

	this.showNftList();
	this.populateNftList(2); // pick 1 nft from list, then call adding nft to slot
	
	//this.add(this.balances[0].nftId, 2);
    },


    onAdd3() {	
	if (this.balances[3] != undefined && this.balances[3].nftId > 0) {
	    cc.error("Slot 3 is already fit with NFT");
	    this.progressLabel.string = "Slot 3 is used by Nft";
	    return;
	}

	this.showNftList();
	this.populateNftList(3); // pick 1 nft from list, then call adding nft to slot
    },


    approve(nftId, slotId) {
	// first, checking whether game's smartcontract was approved to manipulate
	// player's nft
	cc.nft.methods	
	    .isApprovedForAll(cc.walletAddress, cc.nftStakingAddress)	
	    .call()
	    .then((approved) => {
		if (approved) {
		    this.add(nftId, slotId);
		} else {
		    // if not approved, we approve player

		    // approve to manipulate with player's token in smartcontract:
		    cc.nft.methods
			.setApprovalForAll(cc.nftStakingAddress, true)
			.send({from: cc.walletAddress})
		    .on('transactionHash', (hash) => {			
			this.progressLabel.string = "Please wait approvement confirmation...";			
		    })		
		    .on('receipt', (receipt) => {			
			this.progressLabel.string = "Nft manipulation by game was approved";

			this.add(nftId, slotId);
		    })		
		    .on('error', function(err){
			this.progressLabel.string = err.toString();
			console.error(err);	
		    }.bind(this));					
		}
	    })
	    .catch(e => {
		console.error(e);		
	    });
    },
    
    add(nftId, slotId) {
	
	// first getting the signature of the nft
	let spPointUrl = cc.backendUrl + this.spPointPath + nftId;
	fetch(spPointUrl)
	    .then((response) => {// convert stream to json
		return response.json();		
	    })	
	    .then((data)=> {    // then, work with it:
		if (!data.scape_points || data.signature.length == 0) {
		    this.progressLabel.string = "No scape points were set for nft";
		    cc.error(data);
		    return;
		}

		this.progressLabel.string = "Putting Nft to slot "+slotId+"...";

		let dots = this.signatureDots(data.signature);		

		cc.nftStaking.methods
		    .deposit(cc.sessionId, slotId - 1, nftId, data.scape_points, dots.v, dots.r, dots.s)		
		    .send()		
		    .on('transactionHash', (hash) => {			
			this.progressLabel.string = "Please wait tx confirmation...";			
		    })		
		    .on('receipt', (receipt) => {			
			this.progressLabel.string = "Nft was added to slot!";

			this.usedSlots++;

			cc.session = session;
			cc.session.totalSp = parseInt(cc.session.totalSp)
			    + parseInt(data.scape_points);
		
			this.fetchSlot({index: slotId -1, fetchNext: false});
		    })		
		    .on('error', function(err){
			this.progressLabel.string = err.toString();
			cc.error(err);			
		    }.bind(this));		
	    });	
    },

    onClaim1 () {
	this.claim(1);
    },

    onClaim2 () {	
	this.claim(2);
    },


    onClaim3 () {	
	this.claim(3);
    },


    claim(slotId) {
	if (this.balances[slotId] == undefined) {
	    cc.error(`Slot ${slotId} is empty`);
	    this.progressLabel.string = `Slot ${slotId} is empty`;
	    return;
	}

	cc.nftStaking.methods	
	    .claim(cc.sessionId, slotId - 1)	
	    .send()	
	    .on('transactionHash', (hash) => {		
		this.progressLabel.string = "Please wait tx confirmation...";		
	    })	
	    .on('receipt', (receipt) => {		
		this.progressLabel.string = "Nft was cleared!";		

		this.usedSlots--;
		
		this.balances[slotId] = undefined;

		this.slot1.string = `slot ${slotId}: [empty]`;
		this.claimAmount1.string = `slot ${slotId}: 0 CWS`;
	    })	
	    .on('error', function(err){		
		this.progressLabel.string = err.toString();		
		cc.error(err);		
	    }.bind(this));	
    },

    afterClaimAll() {
	this.progressLabel.string = "Everything was claimed!";	

	this.usedSlots = 0;	
		
	this.balances[1] = undefined;
	this.balances[2] = undefined;	
	this.balances[3] = undefined;	
		
	this.slot1.string = "slot 1: [empty]";	
	this.claimAmount1.string = "slot 1: 0 CWS";	

	this.slot2.string = "slot 2: [empty]";	
	this.claimAmount2.string = "slot 2: 0 CWS";	
		
	this.slot3.string = "slot 3: [empty]";	
	this.claimAmount3.string = "slot 3: 0 CWS";	

	this.claimAmountAll.string = "all unclaimed: 0 CWS";	
    },

    onClaimAll() {
	if(this.usedSlots == undefined || this.usedSlots <= 0) {
	    cc.error("All slots are empty...");
	    this.progressLabel.string = "All slots are empty...";
	    return;
	}

	if(this.bonusAmount != undefined && this.bonusAmount > 0) {
	    let dots = this.signatureDots(this.bonusSignature);
	    
	    cc.nftStaking.methods	    
		.claimAll(cc.sessionId, this.bonusAmount, dots.v, dots.r, dots.s)	    
		.send()	    
		.on('transactionHash', (hash) => {		    
		    this.progressLabel.string = "Please wait tx confirmation...";		    
		})	    
		.on('receipt', (receipt) => {		    
		    this.afterClaimAll();		    
		})	    
		.on('error', function(err){		    
		    this.progressLabel.string = err.toString();		    
		    cc.error(err);		    
		}.bind(this));	    
	} else {
	    cc.nftStaking.methods	    
		.claimAll(cc.sessionId)	    
		.send()	    
		.on('transactionHash', (hash) => {		    
		    this.progressLabel.string = "Please wait tx confirmation...";		    
		})	    
		.on('receipt', (receipt) => {		    
		    this.afterClaimAll();		    
		})	    
		.on('error', function(err){		    
		    this.progressLabel.string = err.toString();		    
		    cc.error(err);		    
		}.bind(this));	    
	}
    },

    ////////////////////////////////////////////////////    

    signatureDots(hash) {
	let r = hash.substr(0,66);	
	let s = "0x" + hash.substr(66,64);
	let v = parseInt(hash.substr(130), 16);
	if (v < 27) {
	    v += 27;
	}

	return {r: r, s: s, v: v};
    },

    fetchBonus() {	
	return new Promise((resolve, reject) => {
	    fetch(this.getBonusUrl())
	    .then((response) => {
		response.json()
		    .then((json) => {
			if (json.bonus != undefined) {
			    resolve(json);
			} else {
			    reject(json);
			}
		    })
		    .catch(reject);
	    })
		.catch(reject)
	});
    },
    

    getBonusUrl() {
	return (cc.backendUrl + "nftstaking/bonus/" + cc.walletAddress);
    },
    

    ///------------------------------------------------------------
    /// Nft list related functions
    ///------------------------------------------------------------    

    hideNftList () {
	this.nftListLayout.active = false;
	this.nftListContent.removeAllChildren();
	
    },

    showNftList () {	
	this.nftListLayout.active = true;
    },

    populateNftList (slotId) {
	cc.nft.methods
	    .balanceOf(cc.walletAddress)
	    .call()
	    .then(balance => {
		balance = parseInt(balance);
		if (balance === 0) {
		    console.warn("No Nft was found, please mint some");
		    return;
		}
	
		for (var i = 0; i<balance; i++) {
		    cc.nft.methods
			.tokenOfOwnerByIndex(cc.walletAddress, i)
			.call()
			.then(nftId => {
			    nftId = parseInt(nftId);

			    // todo --->>
			    //
			    //   here you probably want to fetch it's data
			    //   from server as well. for example, sprite id
			    //
			    // todoend.

			    // meanwhile showing simple id
			    var node = cc.instantiate(this.nftItemPrefab);
			    node.getComponentInChildren(cc.Label).string
				= "Seascape Nft "+nftId;
			    node.parent = this.nftListContent;  
			    
			    node.on('click', function() {
				this.hideNftList();
				this.approve(nftId, slotId);				    
			    }, this);
			})
			.catch(e => {
			    console.error("Failed to fetch a token at index "+i);
			    console.error(e);
			    return;
			});
	}
	    })
	    .catch(e => console.error);
    }
});
