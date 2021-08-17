let ethereumWalletConnect = require('ethereum-wallet-connect');
let ethereumContract = require('ethereum-contract');

cc.Class({
    extends: cc.Component,	 

    properties: {
		seasonId: cc.Label,
		contractAbi: "Staking",
		claimButtonAll: cc.Button,
		claimAmountAll: cc.Label,
		bonus: cc.Label,

		ethContractAddress: "0x29b0d9A9A989e4651488D0002ebf79199cE1b7C1",
		bscContractAddress: "0x29b0d9A9A989e4651488D0002ebf79199cE1b7C1",

		ethSessionId: 1,
		bscSessionId: 56,

    },

	getContract() {
		let contractName = "stakingSaloon" + this.seasonId.string;
		return cc[contractName];
	},

    onLoad () {
		this.claimButtonAll.node.on('click', this.onClaimAll, this);
		
		cc.ethereumContract = ethereumContract;

		this.spPointPath = "nft/sp-points/";

		this.balances = [];
		this.totalClaimable = 0;

		web3.eth.net.getId()
		.then((netId) => {
			this.netId = netId;
			if (netId == 1) {
				this.sessionId = this.ethSessionId;
				this.contractAddress = this.ethContractAddress;
			} else if (netId == 56) {
				this.sessionId = this.bscSessionId;
				this.contractAddress = this.bscContractAddress;
			}

			this.loadContract()
			.then(() => {
				cc.walletAddress = "0x327DFb7CCc67c22dEE023b98Fe2A9e07144BF281";

				this.initSeason();
			})
			.catch((err) => {
				alert("Failed to init the season "+this.seasonId.string);
				console.error(err);
			});
		})
		.catch((err) => {
			console.log(err);
		})
		
    },

    loadContract() {
		return new Promise((resolve, reject) => {
			// Nft Staking, the third game in seascape network
			cc.ethereumContract
			.loadContract(this.contractAddress, this.contractAbi, cc.walletAddress)
			.then((contract) => {
				let contractName = "stakingSaloon" + this.seasonId.string;
				cc[contractName] = contract;
				resolve();
			})
			.catch((err) => {
				cc.error(err);
				reject();
			});
		});
    },

    // @params.index slot index in smartcontract. value must be between 0-2
    // @params.fetchNext whether to fetch data of next slot or not
    fetchSlot(params) {
		if (params.index < 0 || params.index > 2) {
			return;
		}

		let slotId = (params.index + 1).toString();
		
		let contract = this.getContract();

		contract.methods
		.balances(this.sessionId, cc.walletAddress, params.index).call()	
		.then((balance) => {		
				this.balances[slotId] = balance;

				// 1. update slot status to nft id
				console.log(`slot ${slotId}: nft #${balance.nftId}`); 

				contract.methods.claimable(this.sessionId, cc.walletAddress, parseInt(slotId) - 1).call()
				.then((amount) => {
					// 3. update total unclaim balance
					this.totalClaimable += parseFloat(web3.utils.fromWei(amount, "ether"));
					this.claimAmountAll.string = this.totalClaimable;
					
					// 4. fetch next slot if it asked
					if (params.fetchNext) {
						this.fetchSlot({fetchNext: true, index: params.index + 1});
					}
				})
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

		let rewardUnit    = parseFloat(web3.utils.fromWei(session.rewardUnit, "ether"));
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
		return parseFloat(interest * earnPeriod);
    },

    
    initSeason() {
		this.totalClaimable = 0;	
		
		// session is a general data about the game
		let contract = this.getContract();
		
		contract.methods.sessions(this.sessionId).call()		
				.then((session) => {			
				cc.session = session;

				this.setSessionEnd(session);
				
				// player could have up to 3 parallel stats the game,				
				contract.methods.slots(this.sessionId, cc.walletAddress).call()			
					.then((slots) => {				
					cc.log("Number of used slots: "+slots);				
					this.usedSlots = parseInt(slots);

					this.fetchSlot({index: 0, fetchNext: true});			
				});
		});		

		this.fetchBonus().then(json => {
			this.bonusAmount = json.bonus;
			this.bonusSignature = json.signature;

			this.bonus.string = this.bonusAmount.toString() + "%";
		})
    },

    setSessionEnd (session) {
		this.sessionEnd = (parseInt(session.startTime) + parseInt(session.period)) * 1000;
		
		this.left = this.sessionEnd - Date.now();
		
		if (this.left <= 0) {
			console.log(`Session Ended`);
		} else {
			console.log(`Session ends in ${new Date(this.sessionEnd).toString()}`);
		}
    },

    afterClaimAll() {
		this.usedSlots = 0;	

		this.claimAmountAll.string = "all unclaimed: 0 CWS";	
    },

    onClaimAll() {
		if(this.usedSlots == undefined || this.usedSlots <= 0) {
			alert("All slots are empty...");
			return;
		}

		let contract = this.getContract();

		if(this.bonusAmount != undefined && this.bonusAmount > 0) {
			let dots = this.signatureDots(this.bonusSignature);
			
			contract.methods	    
			.claimAll(this.sessionId, this.bonusAmount, dots.v, dots.r, dots.s)	    
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
			contract.methods	    
			.claimAll(this.sessionId)	    
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
});
