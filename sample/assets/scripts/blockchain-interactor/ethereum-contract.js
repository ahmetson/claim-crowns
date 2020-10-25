
let contract = {
    loadContract (address, abiPath, deployer) {
        let promise = new Promise(function(resolve, reject) {
            if (this.contracts != undefined && this.contracts[address] != undefined) {
                resolve(this.contracts[address]);
                return;
            }
            cc.loader.loadRes(abiPath, function (err, data) {
                if (err) {
                    reject('Failed to load Matic RootChain Contract ABI')
                }
                else {
                    var contractWeb3 = new web3.eth.Contract(
                        data.json.abi,
                        address,
                        {
                                from: deployer
                        }
                    );

                    if (this.contracts != undefined) {
                        this.contracts[address] = contractWeb3;
                    }
                    resolve(contractWeb3);
                }
            }.bind(this));
        }.bind(this));
        
        return promise;
    },

};

module.exports = contract;
