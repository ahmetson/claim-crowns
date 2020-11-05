

cc.Class({
    extends: cc.Component,

    properties: {
	networkId: 4,
	networkName: "rinkeby",
	stakingAddress:"staking address", //Address of Smartcontract (Miniapp) on blockchain
	stakingAbi:"Staking",      //Path to Abi in resources folder
	lpTokenAddress:"lp token address",
	crownsAddress:"crowns addrss",
	erc20Abi:"ERC20",
	nftAddress:"seascape nft",
	nftAbi:"SeascapeNFT",
	factoryAddress:"nfs Factory",
	factoryAbi:"NFTFactory"
    },

    start () {
	cc.networkId = parseInt(this.networkId);
	cc.networkName = this.networkName;
	cc.stakingAddress = this.stakingAddress;
	cc.stakingAbi = this.stakingAbi;
	cc.lpTokenAddress = this.lpTokenAddress;
	cc.crownsAddress = this.crownsAddress;
	cc.erc20Abi = this.erc20Abi;
	cc.nftAddress = this.nftAddress;
	cc.nftAbi = this.nftAbi;
	cc.factoryAddress = this.factoryAddress;
	cc.factoryAbi = this.factoryAbi;
    },
});
