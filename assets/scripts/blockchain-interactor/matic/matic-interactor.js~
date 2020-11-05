let Contract = require('matic-contract');
let MetamaskProvider = require('metamask-provider');
let MaticConfig = require('matic-config');
let EthConfig = require('ethereum-config');

module.exports = {
    Contract: Contract,
    Utils: Utils,
    init: function(configName = 'testnet') {
        if (MaticConfig[configName] != undefined) {
            MaticConfig = MaticConfig[configName];
        }
        if (EthConfig[configName] != undefined) {
            EthConfig = EthConfig[configName];
        }

        let promise = new Promise(function(resolve, reject) {
            this.maticWeb3 = this.getMaticWeb3();

            this.maticjs = new Matic({
                network: MaticConfig.network,
                version: MaticConfig.version,
                maticProvider: this.maticWeb3,
                parentProvider: window.ethereum,
                rootChain: EthConfig.Contracts.RootChainProxy,
                registry: EthConfig.Contracts.Registry,
                withdrawManager: EthConfig.Contracts.WithdrawManagerProxy,
                depositManager: EthConfig.Contracts.DepositManagerProxy
            });

            this.maticjs.initialize().then(function(i) {
                resolve(this);
            }.bind(this)).catch(e => {
                reject(e);
            })
        }.bind(this));
        
        return promise;
    },
    // RPC endpoint to matic network
    getMaticWeb3: function() {
        const maticProvider = new MetamaskProvider(window.ethereum, {
            url: MaticConfig.RPC
        });

        // return maticProvider;
        return new Web3(maticProvider);
    },
}
