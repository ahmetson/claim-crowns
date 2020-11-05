let ethereumWalletConnect = require('ethereum-wallet-connect');
let ethereumContract = require('ethereum-contract');

cc.Class({
    extends: cc.Component,

    properties: {
        caseExperience:cc.Button, // 联网案例体验
        networkFlow:cc.Button, //联网流程
        exampleExplain:cc.Button, //范例说明
	gameContractAddress:"", //Address of Smartcontract (Miniapp) on blockchain
	gameContractAbi:""      //Path to Abi in resources folder
    },


    onLoad () {
        this.caseExperience.node.on('click',this.startScene,this);
        this.networkFlow.node.on('click',this.startScene,this);
        this.exampleExplain.node.on('click',this.startScene,this);

	cc.walletConnect = new ethereumWalletConnect();
	cc.ethereumContract = ethereumContract;
    },

    startScene(event) {
	let onSuccess = this.onConnection.bind(this);
	cc.walletConnect.connectToMetaMask("", {id: 4, name: "rinkeby"}, onSuccess, cc.error);
    },

    onConnection(state, address) {
	if (state === "UNLOCKED") {
	    let contractInteractor = address;
	    cc.ethereumContract
		.loadContract(this.gameContractAddress, this.gameContractAbi, contractInteractor)
		.then(contract => {
		    cc.stakingContract = contract;
		    cc.log("Successfully loaded a smartcontract");

		    // To retrieve data from blockchain
		    // https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#id23
		    //cc.stakingContract.methods.owner().call()...
		    
		    // For a transaction
		    // https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#id23
		    //cc.stakingContract.methods.startSession(stakingToken, totalReward, period, startTime, generation).send()...;
		})
		.catch(err => cc.err);
	} 
    }


    // start () {},

    // update (dt) {},
});
