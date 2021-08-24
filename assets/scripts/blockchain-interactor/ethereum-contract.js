
let contract = {
    loadContract (address, abiPath, deployer) {
        let promise = new Promise(function(resolve, reject) {
            if (this.contracts != undefined && this.contracts[address] != undefined) {
                resolve(this.contracts[address]);
                return;
            }
            cc.loader.loadRes(abiPath, function (err, data) {
                if (err) {
                    reject(err.toString());
                }
                else {
                    let abi = data.json.abi;
                    if (!abi) {
                        abi = data.json;
                    }

                    var contractWeb3 = new web3.eth.Contract(
                        abi,
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
