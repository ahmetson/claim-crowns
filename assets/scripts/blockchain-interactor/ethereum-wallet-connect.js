let isChecksumAddress = function (address) {
    var addressHash = web3.sha3(address.toLowerCase());
    for (var i = 0; i < 40; i++ ) {
            // the nth letter should be uppercase if the nth digit of casemap is 1
        if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
            return false;
        }
    }
    
    return true;
};

cc.Class({
    extends: cc.Component,

    ctor: function() {
	this.METAMASK_NOT_FOUND = "METAMASK_NOT_FOUND";
	this.LOADING_WALLET_CONFIRMATION = "LOADING_WALLET_CONFIRMATION";
	this.UNLOCKED = "UNLOCKED";
	this.WALLET_AUTH_REJECTED = "WALLET_AUTH_REJECTED";
	this.EXPECTING_VALID_CONNECTION = "EXPECTING_VALID_CONNECTION";
    },
    
    /* Checks whether the variable is a valid Ethereum Wallet Address or not.

     * @return bool
     */
    isAddress (address) {
        if (address == undefined || address.length == 0) {
            return false;
        }

        address = address.toLowerCase();

        // delete "0x" prefix
        if (address.startsWith("0x")) {
            address = address.substr(2);
        }

        if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
            // check if it has the basic requirements of an address
            return false;
	}
	    
	// Otherwise check each case
        return isChecksumAddress(address);
    },


    /**
     * Connects the game in browser to the metamask wallet.
     *
     * At current moment only MetaMask is supported.
     * 
     * @param {String}      address         expected address that metamask should be connected to
     * @param {Object}      network         metamask network that should be connected to, contains name and network ID
     * @param  {Function}   callback        function that will be evoked after wallet connection
     * @return {String}                     the address that connected in the wallet
     */
    connectToMetaMask(expectedAddress, expectedNetwork, callback, errCallback) {
        /////////////////////////////////////
        // Format the address and network. //
        /////////////////////////////////////
        if (expectedAddress.length > 0 && !expectedAddress.startsWith("0x")) {
            expectedAddress = "0x"+expectedAddress;
        }

	if (!this.isAddress(expectedAddress)) {
            expectedAddress = undefined;
        }

        /////////////////////
        // Detect Metamask //
        /////////////////////
        if (typeof window.ethereum === 'undefined') {
            if (errCallback !== undefined) {
		errCallback(this.METAMASK_NOT_FOUND, {});
	    }
            return;
        } else {
	    if (callback !== undefined) {
		callback(this.LOADING_WALLET_CONFIRMATION);
	    }

	    ethereum.autoRefreshOnNetworkChange = false;
            window.web3 = new Web3(ethereum);
        }

        this.callback = callback;
	    this.errCallback = errCallback;
	
        // update the flag of the valid network
        this.expectedNetwork = expectedNetwork;
        this.expectNetwork();

        // update the flag of the valid address
        this.expectedAddress = expectedAddress;
        this.expectAddress();
    },

    setAsUnlocked () {
        if (this.validAddress && this.validNetworkID && this.callback) {

            if (this.callback) {
                this.callback(this.UNLOCKED, this.currentAddress);

                this.callback = undefined;
            }
        }
    },

    expectAddress () {
        ethereum
          .request({ method: 'eth_accounts' })
          .then(function(currentAccounts) {
            if (currentAccounts.length === 0) {
                ethereum.request({ method: 'eth_requestAccounts' })
                .then(function(addresses) {
                    if (addresses.length === 0) {
			if (this.errCallback) {
			    this.errCallback(this.WALLET_AUTH_REJECTED);
			}
                    } else {
                        this.setValidAddress(addresses[0]);
                    }
                }.bind(this))
                    .catch(function(error) {
			if (this.errCallback) {
			    this.errCallback(this.WALLET_AUTH_REJECTED);
			}
			cc.error(error);
                    });
            }
            else {
                this.setValidAddress(currentAccounts[0]);
            }
        }.bind(this))
        .catch(cc.error);
        
        ethereum.on('accountsChanged', function (accounts) {
            this.setValidAddress(accounts[0]);
        }.bind(this));
    },

     setValidAddress(address) {
        if (this.expectedAddress != undefined && this.expectedAddress != address.toLowerCase()) {
            this.validAddress = false;

	    if (this.errCallback) {
		let code = this.EXPECTING_VALID_CONNECTION;
		let msg = `Game should be connected to ${this.expectedAddress} \n` +
                    `Selected account on MetaMask is ${address}.`;

		this.errCallback(msg, code);
	    }
        } else {
            this.currentAddress = address.toLowerCase();
            this.validAddress = true;
            this.setAsUnlocked();
        }
    },

    expectNetwork () {
        let currentNetworkID = parseInt(ethereum.networkVersion);
        this.setValidNetwork(currentNetworkID);

        ethereum.on('chainChanged', this.setValidNetwork.bind(this));
    },

    setValidNetwork(networkID) {
        if (this.expectedNetwork.id == networkID) {
            this.validNetworkID = true;
            this.setAsUnlocked();
        }
        else {
	    if (this.errCallback) {
		this.validNetworkID = false;

		let code = this.EXPECTING_VALID_CONNECTION;
		let msg = `Waiting for connection to ${this.expectedNetwork.name}...`;

		this.errCallback(code, msg);
	    }
        }
    },
});
