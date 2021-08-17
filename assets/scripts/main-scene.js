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
		walletAddress: cc.Label
    },

    onLoad () {
        this.unlockButton.node.on('click',this.onUnlockWallet,this);
        this.gameOneButton.node.on('click',this.onGameOne,this);
		this.gameTwoButton.node.on('click',this.onGameTwo,this);
		this.gameThreeButton.node.on('click',this.onGameThree,this);	

		cc.walletConnect = new ethereumWalletConnect();
		cc.ethereumContract = ethereumContract;

		this.initBlock.active = true;
		this.walletBlock.active = false;
    },

    onUnlockWallet(event) {
		let onError = function(err){
			cc.error(err.toString());
		}.bind(this);

		let onSuccess = function(state, address){
			if (state === "UNLOCKED") {
				cc.walletAddress = address;
				cc.log("Connected as: "+address);

				this.initBlock.active = false;
				this.walletBlock.active = true;
				this.walletAddress.string = cc.walletAddress;
			} else {
				cc.warn("Not expected state from metamask: "+state);
			}
		}.bind(this);

		let expectedAccount = "";
		let network = {id: cc.networkId, name: cc.networkName};
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
