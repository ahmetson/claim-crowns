

cc.Class({
    extends: cc.Component,

    properties: {
	backendUrl: "http://localhost:4000/",
	backendWs: "ws://localhost:4000/socket",
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
	factoryAbi:"NFTFactory",
	lpAbi:"uni_v2_lp",
	wethAddress:"Weth address",
	wethAbi:"weth",
	nftRushAddress:"nft rush address",
	nftRushAbi:"NftRush",
	nftStakingAddress:"nft staking address",
	nftStakingAbi:"NftStaking",
    },

    start () {
	cc.backendUrl = this.backendUrl;
	cc.backendWs = this.backendWs;
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
	cc.lpAbi = this.lpAbi;
	cc.wethAddress = this.wethAddress;
	cc.wethAbi = this.wethAbi;
	cc.nftRushAddress = this.nftRushAddress;
	cc.nftRushAbi = this.nftRushAbi;
	cc.nftStakingAddress = this.nftStakingAddress;
	cc.nftStakingAbi = this.nftStakingAbi;
    },
});
