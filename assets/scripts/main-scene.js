let ethereumWalletConnect = require('ethereum-wallet-connect');
let ethereumContract = require('ethereum-contract');

cc.Class({
    extends: cc.Component,

    properties: {
        unlockButton:cc.Button,
        gameOneButton:cc.Button,
		gameTwoButton:cc.Button,
		gameThreeButton:cc.Button,

		initBlock: cc.Node,
		walletBlock: cc.Node,
		walletAddress: cc.Label,

		ethToggle: cc.Toggle,
		bscToggle: cc.Toggle,
		movrToggle: cc.Toggle,

		ethNetId: 1,
		ethName: "Ethereum",
		bscNetId: 56,
		bscName: "bsc",
		movrNetId: 1285,
		movrName: "moonrivr"
    },

    onLoad () {
        this.unlockButton.node.on('click',this.onUnlockWallet,this);
        this.gameOneButton.node.on('click',this.onGameOne,this);
		this.gameTwoButton.node.on('click',this.onGameTwo,this);
		this.gameThreeButton.node.on('click',this.onGameThree,this);	

		cc.walletConnect = new ethereumWalletConnect();
		cc.ethereumContract = ethereumContract;

		this.setActivity(false);
    },

	setActivity(active) {
		if (active) {
			this.initBlock.active = false;
			this.walletBlock.active = true;
		} else {
			this.initBlock.active = true;
			this.walletBlock.active = false;
		}
	},

	getNetworkName() {
		if (this.ethToggle.isChecked) {
			return this.ethName;
		} else if (this.bscToggle.isChecked) {
			return this.bscName;
		} else if (this.movrToggle.isChecked) {
			return this.movrName;
		} else {
			return "localhost";
		}
	},

	getNetworkId () {
		if (this.ethToggle.isChecked) {
			return this.ethNetId;
		} else if (this.bscToggle.isChecked) {
			return this.bscNetId;
		} else if (this.movrToggle.isChecked) {
			return this.movrNetId;
		} else {
			return 8545;
		}
	},

    onUnlockWallet(event) {
		var ok = confirm(`Are you sure to select to ${this.getNetworkName()} network?`);
		if (!ok) {
			return;
		}

		let onError = function(err){
			cc.error(err.toString());
			alert(err.toString());

			this.setActivity(false);
		}.bind(this);

		let onSuccess = function(state, address){
			if (state === "UNLOCKED") {
				cc.walletAddress = address;
				cc.log("Connected as: "+address);

				this.setActivity(true);
				this.walletAddress.string = cc.walletAddress;
			} else {
				cc.warn("Not expected state from metamask: "+state);
			}
		}.bind(this);

		let expectedAccount = "";
		let network = {id: this.getNetworkId(), name: this.getNetworkName()};
		cc.walletConnect.connectToMetaMask(expectedAccount, network, onSuccess, onError);
    },

    onGameOne(state, address) {
		if (cc.walletAddress == undefined) {
			alert("Please unlock wallet first!");
			return;
		}

		cc.director.loadScene("game-one");
    },

    onGameTwo(state, address) {	
		if (cc.walletAddress == undefined) {
			alert("Please unlock wallet first!");
			return;
		}

		cc.director.loadScene("game-two");
    },

    
    onGameThree(state, address) {	
		if (cc.walletAddress == undefined) {
			alert("Please unlock wallet first!");
			return;
		}

		cc.director.loadScene("game-three");
    },
});
