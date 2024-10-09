/*
    E2E testing

 */


require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | intergration-test | "
import { WalletOption, availableChainsByWallet, Chain, DerivationPath } from '@coinmasters/types';
import { AssetValue } from '@pioneer-platform/helpers';
import { bip32ToAddressNList } from '@pioneer-platform/pioneer-coins';
//@ts-ignore
import * as coinSelect from 'coinselect';

// console.log(process.env['BLOCKCHAIR_API_KEY'])
// if(!process.env['VITE_BLOCKCHAIR_API_KEY']) throw Error("Failed to load env vars! VITE_BLOCKCHAIR_API_KEY")
// if(!process.env['VITE_BLOCKCHAIR_API_KEY']) throw Error("Failed to load env vars!")
const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
let {ChainToNetworkId, ChainToCaip} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;

let BLOCKCHAIN = ChainToNetworkId['DASH']
console.log("BLOCKCHAIN: ",BLOCKCHAIN)
let ASSET = 'DASH'
let MIN_BALANCE = process.env['MIN_BALANCE_DASH'] || "0.004"
let TEST_AMOUNT = process.env['TEST_AMOUNT'] || "0.001"
let spec = process.env['URL_PIONEER_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
let wss = process.env['URL_PIONEER_SOCKET'] || 'wss://pioneers.dev'
let FAUCET_DASH_ADDRESS = process.env['FAUCET_DASH_ADDRESS']
if(!FAUCET_DASH_ADDRESS) throw Error("Need Faucet Address!")
let FAUCET_ADDRESS = FAUCET_DASH_ADDRESS

import {
    getPaths,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';

console.log("spec: ",spec)
console.log("wss: ",wss)

let txid:string
let IS_SIGNED: boolean


const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        //(tag,' CHECKPOINT 1');
        console.time('start2paired');
        console.time('start2build');
        console.time('start2broadcast');
        console.time('start2end');
        //if force new user
        const queryKey = "sdk:pair-keepkey:"+Math.random();
        log.info(tag,"queryKey: ",queryKey)
        // const queryKey = "key:66fefdd6-7ea9-48cf-8e69-fc74afb9c45412"
        assert(queryKey)

        const username = "user:"+Math.random()
        assert(username)

        let pathsCustom:any = [
        ]

        log.info(tag,"BLOCKCHAIN: ",BLOCKCHAIN)
        assert(BLOCKCHAIN)
        let blockchains = [BLOCKCHAIN]
        let paths = getPaths(blockchains)
        paths = paths.concat(pathsCustom)
        log.info("paths: ",paths.length)

        let config:any = {
            username,
            queryKey,
            spec,
            keepkeyApiKey:process.env.KEEPKEY_API_KEY,
            paths,
            blockchains,
            // @ts-ignore
            ethplorerApiKey:
            // @ts-ignore
              process.env.VITE_ETHPLORER_API_KEY || 'EK-xs8Hj-qG4HbLY-LoAu7',
            // @ts-ignore
            covalentApiKey:
            // @ts-ignore
              process.env.VITE__COVALENT_API_KEY || 'cqt_rQ6333MVWCVJFVX3DbCCGMVqRH4q',
            // @ts-ignore
            utxoApiKey: process.env.VITE_BLOCKCHAIR_API_KEY || 'B_s9XK926uwmQSGTDEcZB3vSAmt5t2',
            // @ts-ignore
            walletConnectProjectId:
            // @ts-ignore
              process.env.VITE_WALLET_CONNECT_PROJECT_ID || '18224df5f72924a5f6b3569fbd56ae16',
        };

        //console.log(tag,' CHECKPOINT 2');
        //console.log(tag,' config: ',config);
        let app = new SDK.SDK(spec,config)
        const walletsVerbose: any = [];
        const { keepkeyWallet } = await import("@coinmasters/wallet-keepkey");
        //log.info(tag,"walletKeepKey: ",keepkeyWallet)
        const walletKeepKey = {
            type: WalletOption.KEEPKEY,
            icon: "https://pioneers.dev/coins/keepkey.png",
            chains: availableChainsByWallet[WalletOption.KEEPKEY],
            wallet: keepkeyWallet,
            status: "offline",
            isConnected: false,
        };
        walletsVerbose.push(walletKeepKey);

        let resultInit = await app.init(walletsVerbose, {})
        log.info(tag,"resultInit: ",resultInit)
        log.info(tag,"wallets: ",app.wallets.length)

        let assets = app.assetsMap;
        log.info(tag, "assets: ", assets);
        assert(assets);

        // //connect
        // assert(blockchains)
        // assert(blockchains[0])
        log.info(tag,"blockchains: ",blockchains)
        let pairObject = {
            type:WalletOption.KEEPKEY,
            blockchains
        }
        resultInit = await app.pairWallet(pairObject)
        log.info(tag,"resultInit: ",resultInit)

        //check pairing
        // //context should match first account
        let context = await app.context
        log.info(tag,"context: ",context)
        assert(context)
        await app.getPubkeys()
        log.info(tag,"pubkeys: ",app.pubkeys)
        assert(app.pubkeys)
        assert(app.pubkeys[0])


        await app.getBalances()
        log.info(tag,"balances: ",app.balances)
        assert(app.balances)
        assert(app.balances[0])
        log.info(tag,"balances: ",app.balances[0])


        log.info(tag,"assetContext: ",ChainToCaip[ASSET])
        log.info(tag,"asset: ",assets.get(ChainToCaip[ASSET]))
        assert(assets.get(ChainToCaip[ASSET]))
        await app.setAssetContext(assets.get(ChainToCaip[ASSET]))
        log.info(tag,"assetContext: ",app.assetContext)
        assert(app.assetContext)
        assert(app.assetContext.caip)


        const wallet = await app.swapKit.getWallet(Chain.Dash);
        log.info(tag,"wallet: ",wallet)

        // create assetValue
        const assetString = `${ASSET}.${ASSET}`;
        //console.log('assetString: ', assetString);
        await AssetValue.loadStaticAssets();
        const assetValue = AssetValue.fromStringSync(assetString, parseFloat(TEST_AMOUNT));
        log.info("assetValue: ",assetValue)

        let fromAddress = await app.swapKit.getAddress(Chain.Dash)
        log.info("fromAddress: ",fromAddress)

        //get pubkeys
        let pubkeys = await wallet.getPubkeys(paths)
        // let pubkeys = await app.getPubkeys()
        log.info("pubkeys: ",pubkeys)
        assert(pubkeys)
        assert(pubkeys.length)
        assert(pubkeys[0])

        let changeAddressIndex = await app.pioneer.GetChangeAddress({ network: 'DASH', xpub: pubkeys[0].pubkey || pubkeys[0].xpub });
        changeAddressIndex = changeAddressIndex.data.changeIndex
        console.log(tag, 'changeAddressIndex: ', changeAddressIndex);

        let path = `m/44'/5'/0'/1/${changeAddressIndex}`
        console.log(tag, 'path: ', path);
        let customAddressInfo = {
            coin: 'Dash',
            script_type: 'p2pkh',
            address_n: bip32ToAddressNList(path),
        }
        let address = await wallet.getAddress(customAddressInfo)
        log.info("address: ",address)
        let changeAddress = {
            address: address,
            path: path,
            index: changeAddressIndex,
            addressNList: bip32ToAddressNList(path),
        }

        //get unspend from pioneer
        // let utxos = await app.pioneer.ListUnspent({network:Chain.Dash, xpub:pubkeys[0].xpub})
        // utxos = utxos.data
        let utxos = [{"txid":"1e4387826ac4cafccff68de8e0a8c13afb2bdcf200687f2374c21fdb481b26f1","vout":0,"value":"108410071","height":2063569,"confirmations":85142,"address":"Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x","path":"m/44'/5'/0'/0/0","tx":{"txid":"1e4387826ac4cafccff68de8e0a8c13afb2bdcf200687f2374c21fdb481b26f1","hash":"1e4387826ac4cafccff68de8e0a8c13afb2bdcf200687f2374c21fdb481b26f1","version":1,"vin":[{"txid":"e90c40f8a0cd456f90c4612fc36a342157b02dd825cf3bef009f959151f7cf1d","vout":1,"addr":"XuruLk6SiqCZ7gv12qaRtYS6V6WZnxHVWq","scriptSig":{"hex":"0014459a4d8600bfdaa52708eaae5be1dcf959069efc"},"valueSat":1663896449390,"value":16638.9644939},{"txid":"d586a7655691f522dd46468fa07b5177c8a4c4e0c35f5f2360e15bb0a1b25664","addr":"XuruLk6SiqCZ7gv12qaRtYS6V6WZnxHVWq","scriptSig":{"hex":"0014459a4d8600bfdaa52708eaae5be1dcf959069efc"},"valueSat":1000000,"value":0.01},{"txid":"a5c723de0e485aee2a8010be88f21a89470575603edc8c3993d148119bb4df9e","addr":"XuruLk6SiqCZ7gv12qaRtYS6V6WZnxHVWq","scriptSig":{"hex":"0014459a4d8600bfdaa52708eaae5be1dcf959069efc"},"valueSat":14998773,"value":0.14998773},{"txid":"d7ad16b3451945345745d66e77b638a0eaad326f6ee575f963251b71aae4256b","addr":"XuruLk6SiqCZ7gv12qaRtYS6V6WZnxHVWq","scriptSig":{"hex":"0014459a4d8600bfdaa52708eaae5be1dcf959069efc"},"valueSat":10390996,"value":0.10390996}],"vout":[{"value":"108410071","scriptPubKey":{"hex":"76a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac"}},{"value":"1663814423676","scriptPubKey":{"hex":"76a914d2517a6c9e3b4327a28e5216f371c5f9b5ad0b2c88ac"}},{"value":"0","scriptPubKey":{"hex":"6a444f55543a42363532383533433845393533334331433738353645343434304336384633333646364546303942344132463137463439354535323343434435313333353334"}}],"hex":"01000000041dcff75191959f00ef3bcf25d82db05721346ac32f61c4906f45cda0f8400ce9010000006a4730440220010052c02b5b7d272dc3997743c5bd8b0d4d2036b4320af7054bf8dc097560a5022024324ff6bfc48fbf86d3ed9f3e674169181a191bc01fbba4694e5f30111df6ae012103088d0d9f0aad6faecc4973eaa42f833aeb7a08d71f93fd6f7755571c0dcba2c3ffffffff6456b2a1b05be160235f5fc3e0c4a4c877517ba08f4646dd22f5915665a786d5000000006b483045022100f84535e3df6f60572cf81013416df82e33c2b2c25cf96ad67248fe79ca81e2b102205f2f1b6a1b6bc36dd18505e098f55eac4143f49a1a1d2d2f301248467b0d5af3012103088d0d9f0aad6faecc4973eaa42f833aeb7a08d71f93fd6f7755571c0dcba2c3ffffffff9edfb49b1148d193398cdc3e60750547891af288be10802aee5a480ede23c7a5000000006b483045022100a0556100976321ba3f3ad0a3ec851ef67d0c84bc6466a411e02a55ad67f927c5022048decb6a6f3ca8eed2a7f7593ebf10682f2031b0e3bf8f91e633afcbb9743185012103088d0d9f0aad6faecc4973eaa42f833aeb7a08d71f93fd6f7755571c0dcba2c3ffffffff6b25e4aa711b2563f975e56e6f32adeaa038b6776ed6455734451945b316add7000000006b483045022100a16e70d8116a822cabbf8924c3fb3405432622decf0d94efadbe4218d3da543b02201dac1740b5232ab848c34f22af516ca6ae6498ca7d6140ad57ae5fad1d6c02e7012103088d0d9f0aad6faecc4973eaa42f833aeb7a08d71f93fd6f7755571c0dcba2c3ffffffff03d7347606000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac7c541163830100001976a914d2517a6c9e3b4327a28e5216f371c5f9b5ad0b2c88ac0000000000000000466a444f55543a4236353238353343384539353333433143373835364534343430433638463333364636454630394234413246313746343935453532334343443531333335333400000000"},"hex":"01000000041dcff75191959f00ef3bcf25d82db05721346ac32f61c4906f45cda0f8400ce9010000006a4730440220010052c02b5b7d272dc3997743c5bd8b0d4d2036b4320af7054bf8dc097560a5022024324ff6bfc48fbf86d3ed9f3e674169181a191bc01fbba4694e5f30111df6ae012103088d0d9f0aad6faecc4973eaa42f833aeb7a08d71f93fd6f7755571c0dcba2c3ffffffff6456b2a1b05be160235f5fc3e0c4a4c877517ba08f4646dd22f5915665a786d5000000006b483045022100f84535e3df6f60572cf81013416df82e33c2b2c25cf96ad67248fe79ca81e2b102205f2f1b6a1b6bc36dd18505e098f55eac4143f49a1a1d2d2f301248467b0d5af3012103088d0d9f0aad6faecc4973eaa42f833aeb7a08d71f93fd6f7755571c0dcba2c3ffffffff9edfb49b1148d193398cdc3e60750547891af288be10802aee5a480ede23c7a5000000006b483045022100a0556100976321ba3f3ad0a3ec851ef67d0c84bc6466a411e02a55ad67f927c5022048decb6a6f3ca8eed2a7f7593ebf10682f2031b0e3bf8f91e633afcbb9743185012103088d0d9f0aad6faecc4973eaa42f833aeb7a08d71f93fd6f7755571c0dcba2c3ffffffff6b25e4aa711b2563f975e56e6f32adeaa038b6776ed6455734451945b316add7000000006b483045022100a16e70d8116a822cabbf8924c3fb3405432622decf0d94efadbe4218d3da543b02201dac1740b5232ab848c34f22af516ca6ae6498ca7d6140ad57ae5fad1d6c02e7012103088d0d9f0aad6faecc4973eaa42f833aeb7a08d71f93fd6f7755571c0dcba2c3ffffffff03d7347606000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac7c541163830100001976a914d2517a6c9e3b4327a28e5216f371c5f9b5ad0b2c88ac0000000000000000466a444f55543a4236353238353343384539353333433143373835364534343430433638463333364636454630394234413246313746343935453532334343443531333335333400000000","coin":"DASH","network":"DASH"},{"txid":"764f5b7e5f123d774b29f63b4cd8f028c671444e2e292621d267223115f79dce","vout":1,"value":"59996610","height":2034514,"confirmations":114197,"address":"Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x","path":"m/44'/5'/0'/0/0","tx":{"txid":"764f5b7e5f123d774b29f63b4cd8f028c671444e2e292621d267223115f79dce","hash":"764f5b7e5f123d774b29f63b4cd8f028c671444e2e292621d267223115f79dce","version":1,"vin":[{"txid":"57aeb34b9db3454f6eda891f997f7518fe3230b02d7bd503799f28dd34f515e3","addr":"Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x","scriptSig":{"hex":"0014459a4d8600bfdaa52708eaae5be1dcf959069efc"},"valueSat":90000000,"value":0.9}],"vout":[{"value":"30000000","scriptPubKey":{"hex":"76a914843543ad608e44ae5667b4d94af2f5c38215b0af88ac"}},{"value":"59996610","scriptPubKey":{"hex":"76a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac"}}],"hex":"0100000001e315f534dd289f7903d57b2db03032fe18757f991f89da6e4f45b39d4bb3ae57000000006a47304402200af96f38ef23b1a950a4f029d4736cf93fae99770b74cd0088b3985b0abbbdcb022057ec5da8b5427c3de8917816aeb3a4261e601e18417dac6c01a99d58c16bae1201210320d77aff1ebe4e738fba63f8c8d6dcf18eb1bb7f1fd548f65b8b2a06267f74dfffffffff0280c3c901000000001976a914843543ad608e44ae5667b4d94af2f5c38215b0af88acc2799303000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac00000000"},"hex":"0100000001e315f534dd289f7903d57b2db03032fe18757f991f89da6e4f45b39d4bb3ae57000000006a47304402200af96f38ef23b1a950a4f029d4736cf93fae99770b74cd0088b3985b0abbbdcb022057ec5da8b5427c3de8917816aeb3a4261e601e18417dac6c01a99d58c16bae1201210320d77aff1ebe4e738fba63f8c8d6dcf18eb1bb7f1fd548f65b8b2a06267f74dfffffffff0280c3c901000000001976a914843543ad608e44ae5667b4d94af2f5c38215b0af88acc2799303000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac00000000","coin":"DASH","network":"DASH"},{"txid":"57aeb34b9db3454f6eda891f997f7518fe3230b02d7bd503799f28dd34f515e3","vout":1,"value":"223512","height":2034492,"confirmations":114219,"address":"Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x","path":"m/44'/5'/0'/0/0","tx":{"txid":"57aeb34b9db3454f6eda891f997f7518fe3230b02d7bd503799f28dd34f515e3","hash":"57aeb34b9db3454f6eda891f997f7518fe3230b02d7bd503799f28dd34f515e3","version":1,"vin":[{"txid":"ee33b72d528f95f583adb95bf7f7da016bd1fe5744b37903410191cc8510c9cf","addr":"Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x","scriptSig":{"hex":"0014459a4d8600bfdaa52708eaae5be1dcf959069efc"},"valueSat":90225772,"value":0.90225772}],"vout":[{"value":"90000000","scriptPubKey":{"hex":"76a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac"}},{"value":"223512","scriptPubKey":{"hex":"76a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac"}}],"hex":"0100000001cfc91085cc9101410379b34457fed16b01daf7f75bb9ad83f5958f522db733ee000000006a4730440220472e8cc5bda0ab9ee4a62800b488763453daa45675d63fcc8b798d5ec2c857e2022023e82580c9e7beb34451ac125a2236462c0c7d5db1e24f3c5f452c1bc9e9e76c01210320d77aff1ebe4e738fba63f8c8d6dcf18eb1bb7f1fd548f65b8b2a06267f74dfffffffff02804a5d05000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac18690300000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac00000000"},"hex":"0100000001cfc91085cc9101410379b34457fed16b01daf7f75bb9ad83f5958f522db733ee000000006a4730440220472e8cc5bda0ab9ee4a62800b488763453daa45675d63fcc8b798d5ec2c857e2022023e82580c9e7beb34451ac125a2236462c0c7d5db1e24f3c5f452c1bc9e9e76c01210320d77aff1ebe4e738fba63f8c8d6dcf18eb1bb7f1fd548f65b8b2a06267f74dfffffffff02804a5d05000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac18690300000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac00000000","coin":"DASH","network":"DASH"},{"txid":"8e6173926727edf73ae2c380e30cf64c46d1972ec89c3f2c9b4ef5174d39ceae","vout":1,"value":"247737","height":2028424,"confirmations":120287,"address":"Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x","path":"m/44'/5'/0'/0/0","tx":{"txid":"8e6173926727edf73ae2c380e30cf64c46d1972ec89c3f2c9b4ef5174d39ceae","hash":"8e6173926727edf73ae2c380e30cf64c46d1972ec89c3f2c9b4ef5174d39ceae","version":1,"vin":[{"txid":"725b6946afe0a0bac2d94c0688c47d384d7bca06d1828cfea4fe2613b86f0822","vout":1,"addr":"Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x","scriptSig":{"hex":"0014459a4d8600bfdaa52708eaae5be1dcf959069efc"},"valueSat":1251127,"value":0.01251127}],"vout":[{"value":"1000000","scriptPubKey":{"hex":"76a914b72a1b1ddc9284abd098ca6e05c5de90d648d0ae88ac"}},{"value":"247737","scriptPubKey":{"hex":"76a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac"}}],"hex":"010000000122086fb81326fea4fe8c82d106ca7b4d387dc488064cd9c2baa0e0af46695b72010000006b483045022100db2fa9ba1416dad20b1cd8b466c2cfb51ce1f1b5385c7e183024a716603050560220049ed1fa0ddcbf34459099111d1d46b1be5d56972cdced3dc88e522197df7d5201210320d77aff1ebe4e738fba63f8c8d6dcf18eb1bb7f1fd548f65b8b2a06267f74dfffffffff0240420f00000000001976a914b72a1b1ddc9284abd098ca6e05c5de90d648d0ae88acb9c70300000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac00000000"},"hex":"010000000122086fb81326fea4fe8c82d106ca7b4d387dc488064cd9c2baa0e0af46695b72010000006b483045022100db2fa9ba1416dad20b1cd8b466c2cfb51ce1f1b5385c7e183024a716603050560220049ed1fa0ddcbf34459099111d1d46b1be5d56972cdced3dc88e522197df7d5201210320d77aff1ebe4e738fba63f8c8d6dcf18eb1bb7f1fd548f65b8b2a06267f74dfffffffff0240420f00000000001976a914b72a1b1ddc9284abd098ca6e05c5de90d648d0ae88acb9c70300000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac00000000","coin":"DASH","network":"DASH"},{"txid":"e66564e91e75d40fb416bf001096be424fafb7ea15ee5762a3d907534992e550","vout":1,"value":"155692","height":2018523,"confirmations":130188,"address":"Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x","path":"m/44'/5'/0'/0/0","tx":{"txid":"e66564e91e75d40fb416bf001096be424fafb7ea15ee5762a3d907534992e550","hash":"e66564e91e75d40fb416bf001096be424fafb7ea15ee5762a3d907534992e550","version":1,"vin":[{"txid":"e54e70a82fdca03083b5409ad24d1a43670e6724ddb1bef08deccdeacd9a99c2","addr":"Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x","scriptSig":{"hex":"0014459a4d8600bfdaa52708eaae5be1dcf959069efc"},"valueSat":41688272,"value":0.41688272},{"txid":"dbacf777222dbb5cd5f1c0dd541725fcf04927d3d34e4c496f8ad910783a9de0","vout":1,"addr":"Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x","scriptSig":{"hex":"0014459a4d8600bfdaa52708eaae5be1dcf959069efc"},"valueSat":8473030,"value":0.0847303}],"vout":[{"value":"50000000","scriptPubKey":{"hex":"76a914df1cd8d4be93ea7ebffcb880a5f32d976e74064888ac"}},{"value":"155692","scriptPubKey":{"hex":"76a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac"}}],"hex":"0100000002c2999acdeacdec8df0beb1dd24670e67431a4dd29a40b58330a0dc2fa8704ee5000000006a473044022046525f676881070effa8018303234434445f24b5fc3bc8476ad0fa01660e39a80220536f346e4ab963e0be0498a8f402f5364d91be053db32a223e384d02c2240afc01210320d77aff1ebe4e738fba63f8c8d6dcf18eb1bb7f1fd548f65b8b2a06267f74dfffffffffe09d3a7810d98a6f494c4ed3d32749f0fc251754ddc0f1d55cbb2d2277f7acdb010000006a47304402206e9faa75a15b0106f74584e9737966aac4871416b269fb80e5bfe270454a931702201539e0909fc385c7de55ef2381ec14e9fdadf5a0870ee2917515a420b5390d0801210320d77aff1ebe4e738fba63f8c8d6dcf18eb1bb7f1fd548f65b8b2a06267f74dfffffffff0280f0fa02000000001976a914df1cd8d4be93ea7ebffcb880a5f32d976e74064888ac2c600200000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac00000000"},"hex":"0100000002c2999acdeacdec8df0beb1dd24670e67431a4dd29a40b58330a0dc2fa8704ee5000000006a473044022046525f676881070effa8018303234434445f24b5fc3bc8476ad0fa01660e39a80220536f346e4ab963e0be0498a8f402f5364d91be053db32a223e384d02c2240afc01210320d77aff1ebe4e738fba63f8c8d6dcf18eb1bb7f1fd548f65b8b2a06267f74dfffffffffe09d3a7810d98a6f494c4ed3d32749f0fc251754ddc0f1d55cbb2d2277f7acdb010000006a47304402206e9faa75a15b0106f74584e9737966aac4871416b269fb80e5bfe270454a931702201539e0909fc385c7de55ef2381ec14e9fdadf5a0870ee2917515a420b5390d0801210320d77aff1ebe4e738fba63f8c8d6dcf18eb1bb7f1fd548f65b8b2a06267f74dfffffffff0280f0fa02000000001976a914df1cd8d4be93ea7ebffcb880a5f32d976e74064888ac2c600200000000001976a914d2502c5faeb74c2a5b01d6995f12cccc544ace9488ac00000000","coin":"DASH","network":"DASH"}]
        log.info("utxos: ",utxos)
        log.info("utxos: ",JSON.stringify(utxos))

        for(let i = 0; i < utxos.length; i++){
            let utxo = utxos[i]
            //@ts-ignore
            utxo.value = parseInt(utxo.value)
        }
        log.info("utxos: ",utxos)

        //TODO get recomended fee from pioneer

        let amountOut: number = Math.floor(Number(TEST_AMOUNT) * 1e8);

        log.info(tag,"amountOut: ",amountOut)
        let effectiveFeeRate = 10
        const { inputs, outputs, fee } = coinSelect.default(
          utxos,
          [{ address: FAUCET_ADDRESS, value: amountOut }],
          effectiveFeeRate,
        );
        log.info("inputs: ",inputs)
        log.info("outputs: ",outputs)
        log.info("fee: ",fee)

        //buildTx

        let unsignedTx = await wallet.buildTx({
            inputs,
            outputs,
            memo: 'test',
            changeAddress,
        })

        log.info(tag, 'unsignedTx: ', unsignedTx);
        //remove locked utxos...

        //use coinselect and select inputs

        //buildTx

        //push all uxto's to buildTxPayload

        let signedTx = await wallet.signTx(unsignedTx.inputs, unsignedTx.outputs, unsignedTx.memo)
        log.info("signedTx: ",signedTx)

        //broadcast tx
        let txid = await wallet.broadcastTx(signedTx)
        log.info("txid: ",txid)


        //list unspent
        // let utxos = await wallet.listUnspent(pubkeys)
        // log.info("utxos: ",utxos)

        //remove locked utxos

        //get max spendable
        // let estimatePayload:any = {
        //     feeRate: 10,
        //     pubkeys,
        //     memo: '',
        //     recipient: FAUCET_ADDRESS,
        // }
        // log.info("estimatePayload: ",estimatePayload)
        // //verify amount is < max spendable
        // let maxSpendable = await app.swapKit.estimateMaxSendableAmount({chain:Chain.Dash, params:estimatePayload})
        // log.info("maxSpendable: ",maxSpendable)

        //send
        // let sendPayload = {
        //     from: fromAddress,
        //     assetValue,
        //     // assetValue:maxSpendable,
        //     // isMax: true,
        //     memo: '',
        //     recipient: FAUCET_ADDRESS,
        // }
        //
        // // sendPayload.assetValue = maxSpendable
        // log.info("sendPayload: ",sendPayload)
        // const txHash = await app.swapKit.transfer(sendPayload);
        // log.info("txHash: ",txHash)
        // assert(txHash)

        // log.info('sendPayload: ', sendPayload)
        // let unsignedTx = await wallet.buildTx(sendPayload)
        // log.info("unsignedTx: ",unsignedTx)
        // assert(unsignedTx)
        // assert(unsignedTx.outputs)
        // assert(unsignedTx.inputs)



        console.log("************************* TEST PASS *************************")
    } catch (e) {
        log.error(e)
        //process
        process.exit(666)
    }
}
test_service()
