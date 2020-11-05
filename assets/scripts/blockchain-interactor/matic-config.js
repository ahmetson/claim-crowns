module.exports = {
    "testnet": {
        "network": "testnet",
        "version": "mumbai",
        "NetworkName": "Matic Testnet Mumbai",
        "ChainId": 80001,
        "RPC": "https://rpc-mumbai.matic.today",
        "Explorer": "https://mumbai-explorer.matic.today",
        "Checkpoint": "https://mumbai-watcher.api.matic.today/api/v1/header/included/",
        "Contracts": {
          "ChildChain": "0x1EDd419627Ef40736ec4f8ceffdE671a30803c5e",
          "Tokens": {
            "MaticWeth": "0x4DfAe612aaCB5b448C12A591cD0879bFa2e51d62",
            "MaticToken": "0x0000000000000000000000000000000000001010",
            "TestToken": "0x2d7882beDcbfDDce29Ba99965dd3cdF7fcB10A1e",
            "RootERC721": "0x33FC58F12A56280503b04AC7911D1EceEBcE179c"
          }
        }
    },
    "mainnet": {
        "NetworkName": "Matic Network",
        "ChainId": 137,
        "RPC": "https://rpc-mainnet.matic.network",
        "DaggerEndpoint": "wss://matic-mainnet.dagger.matic.network",
        "Checkpoint": "https://staking.api.matic.network/api/v1/header/included/",
        "Explorer": "https://explorer.matic.network",
        "Contracts": {
          "ChildChain": "0xD9c7C4ED4B66858301D0cb28Cc88bf655Fe34861",
          "Tokens": {
            "MaticWeth": "0x8cc8538d60901d19692F5ba22684732Bc28F54A3",
            "MaticToken": "0x0000000000000000000000000000000000001010",
            "TestToken": "0x5E1DDF2e5a0eCDD923692d4b4429d8603825A8C6",
            "RootERC721": "0xa35363CFf92980F8268299D0132D5f45834A9527"
          }
        }
    }
};
