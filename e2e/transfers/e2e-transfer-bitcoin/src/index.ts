/*
    E2E testing

 */
//@ts-ignore
import { getPaths, addressNListToBIP32, bip32ToAddressNList } from '@pioneer-platform/pioneer-coins';
require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | intergration-test | "
import { WalletOption, availableChainsByWallet, Chain, NetworkIdToChain } from '@coinmasters/types';
import { AssetValue } from '@pioneer-platform/helpers';
// console.log(process.env['BLOCKCHAIR_API_KEY'])
// if(!process.env['VITE_BLOCKCHAIR_API_KEY']) throw Error("Failed to load env vars! VITE_BLOCKCHAIR_API_KEY")
// if(!process.env['VITE_BLOCKCHAIR_API_KEY']) throw Error("Failed to load env vars!")
const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
//@ts-ignore
let {ChainToNetworkId, ChainToCaip} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;

let BLOCKCHAIN = ChainToNetworkId['BTC']
console.log("BLOCKCHAIN: ",BLOCKCHAIN)
let ASSET = 'BTC'
let MIN_BALANCE = process.env['MIN_BALANCE_DASH'] || "0.004"
let TEST_AMOUNT = process.env['TEST_AMOUNT'] || "0.0001"
let spec = process.env['URL_PIONEER_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
let wss = process.env['URL_PIONEER_SOCKET'] || 'wss://pioneers.dev'
let FAUCET_BITCOIN_ADDRESS = process.env['FAUCET_BITCOIN_ADDRESS']
if(!FAUCET_BITCOIN_ADDRESS) throw Error("Need Faucet Address!")
let FAUCET_ADDRESS = FAUCET_BITCOIN_ADDRESS

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

        let blockchains = [BLOCKCHAIN]

        //get paths for wallet
        // let paths = getPaths(blockchains)
        // paths = [paths[1]]

        // log.info("paths: ",paths.length)
        // log.info("paths: ",paths)
        let paths = []

        //add account 0 p2sh segwit
        paths.push({
            note:"Bitcoin account 0 segwit (p2sh)",
            networks: ['bip122:000000000019d6689c085ae165831e93'],
            script_type:"p2sh-p2wpkh",
            available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
            type:"xpub",
            addressNList: [0x80000000 + 49, 0x80000000 + 0, 0x80000000 + 0],
            addressNListMaster: [0x80000000 + 49, 0x80000000 + 0, 0x80000000 + 0, 0, 0],
            curve: 'secp256k1',
            showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        })

        paths.push({
            note:"Bitcoin account 0 Native Segwit (Bech32)",
            blockchain: 'bitcoin',
            symbol: 'BTC',
            symbolSwapKit: 'BTC',
            networks: ['bip122:000000000019d6689c085ae165831e93'],
            script_type:"p2wpkh", //bech32
            available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
            type:"zpub",
            addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1],
            addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
            curve: 'secp256k1',
            showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        })

        paths.push({
            note:"Bitcoin account 0 (EXTRACTION) segwit path on legacy account",
            blockchain: 'bitcoin',
            symbol: 'BTC',
            symbolSwapKit: 'BTC',
            networks: ['bip122:000000000019d6689c085ae165831e93'],
            script_type:"p2pkh",
            available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
            type:"xpub",
            addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 0],
            addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 0, 0, 0],
            curve: 'secp256k1',
            showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        })

        paths.push({
            note:"Bitcoin account 1 legacy",
            networks: ['bip122:000000000019d6689c085ae165831e93'],
            script_type:"p2pkh",
            available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
            type:"xpub",
            addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 1],
            addressNListMaster: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
            curve: 'secp256k1',
            showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        })

        paths.push({
            note:"Bitcoin account 1 Native Segwit (Bech32)",
            blockchain: 'bitcoin',
            symbol: 'BTC',
            symbolSwapKit: 'BTC',
            network: 'bip122:000000000019d6689c085ae165831e93',
            script_type:"p2wpkh", //bech32
            available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
            type:"zpub",
            addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1],
            addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
            curve: 'secp256k1',
            showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        })

        paths.push({
            note:"Bitcoin account 1 legacy",
            networks: ['bip122:000000000019d6689c085ae165831e93'],
            script_type:"p2pkh",
            available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
            type:"xpub",
            addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 2],
            addressNListMaster: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 2, 0, 0],
            curve: 'secp256k1',
            showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        })

        paths.push({
            note:"Bitcoin account 1 Native Segwit (Bech32)",
            blockchain: 'bitcoin',
            symbol: 'BTC',
            symbolSwapKit: 'BTC',
            networks: ['bip122:000000000019d6689c085ae165831e93'],
            script_type:"p2wpkh", //bech32
            available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
            type:"zpub",
            addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1],
            addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
            curve: 'secp256k1',
            showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        })

        paths.push({
            note:"Bitcoin account 3 legacy",
            networks: ['bip122:000000000019d6689c085ae165831e93'],
            script_type:"p2pkh",
            available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
            type:"xpub",
            addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 3],
            addressNListMaster: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 3, 0, 0],
            curve: 'secp256k1',
            showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        })


        let config:any = {
            username,
            queryKey,
            spec,
            keepkeyApiKey:process.env.KEEPKEY_API_KEY,
            wss,
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
        // log.info(tag,"resultInit: ",resultInit)
        log.info(tag,"wallets: ",app.wallets.length)

        //paths
        let paths2 = app.paths
        console.assert(paths2)
        log.info(tag,"paths2: ",paths2)
        log.info(tag,"paths2[0]: ",paths2[0])
        log.info(tag,"paths2[0].addressNList: ",paths2[0].addressNList)

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

        log.info("app.pubkeys.length: ",app.pubkeys.length)
        if(!app.pubkeys || app.pubkeys.length === 0){
            log.info(tag,"No pubkeys found, recalculating...")
            let pubkeys = await app.getPubkeys()
            assert(pubkeys)
            assert(pubkeys[0])
            assert(app.pubkeys)
            assert(app.pubkeys[0])
            log.info(tag,"pubkeys: ",pubkeys)
            log.info(tag,"app.pubkeys: ",app.pubkeys)
            for(let i = 0; i < pubkeys.length; i++){
                let pubkey = pubkeys[i]
                log.info(tag,"pubkey: ",pubkey)
                assert(pubkey)
                assert(pubkey.pubkey)
            }
        }

        let pubkeys = app.pubkeys.filter((e: any) => e.networks.includes(BLOCKCHAIN));
        log.info("pubkeys: ",pubkeys)
        // log.info("pubkeys[0]: ",pubkeys[0])
        // log.info("pubkeys[1]: ",pubkeys[1])
        // log.info("pubkeys[0].master: ",pubkeys[0].master)
        // log.info("pubkeys[1].master: ",pubkeys[1].master)
        // if(pubkeys[0].master == pubkeys[1].master)throw Error("error, wrong masters")
        // assert(pubkeys)
        // assert(pubkeys[0])
        // assert(pubkeys[0].pubkey)
        // assert(pubkeys[0].master)
        // assert(pubkeys[1])
        // assert(pubkeys[1].pubkey)
        // assert(pubkeys[1].master)

        //very path should have a pubkey
        for(let i = 0; i < app.paths.length; i++){
            let path = app.paths[i]
            log.info(tag,"path: ",path)
            assert(path)
            //convert path to addressNList
            log.info(tag,'*** path: ',path.addressNList)
            log.info(tag,'path: ',addressNListToBIP32(path.addressNList))
            //get pubkey for path
            let pubkey = await app.pubkeys.filter((b:any) => b.path === addressNListToBIP32(path.addressNList))
            log.info(tag,'*** pubkey: ',pubkey)
            assert(pubkey)
            assert(pubkey[0])
            //find path for pubkey
        }
        log.info("pubkeys: ",pubkeys)


        log.info("app.balances.length: ",app.balances.length)
        if(!app.balances || app.balances.length === 0){
            log.info(tag,"No balances found, recalculating...")
            let balances = await app.getBalances()
            log.info(tag,"balances: TOTAL: ",balances.length)
            assert(balances)
            assert(balances[0])
            assert(app.balances)
            assert(app.balances[0])
            log.info(tag,"balances: ",app.balances)
            for(let i = 0; i < balances.length; i++){
                let balance = balances[i]
                log.info(tag,"balance: ",balance)
                assert(balance)
                assert(balance.caip)
            }
        }
        console.timeEnd('start2BalancesGas');


        log.info(tag,"app.assets: ",app.assets)
        log.info(tag,"app.pubkeys: ",app.pubkeys)
        // let asset = app.assets.filter((b:any) => b.networkId === ChainToNetworkId[Chain.Bitcoin])
        // log.info(tag,"asset: ",asset)
        // assert(asset[0])
        // assert(asset[0].caip)
        // assert(asset[0].pubkeys)
        // assert(asset[0].pubkeys[0])
        //verify pubkey

        let assets = app.assetsMap;
        log.info(tag, "assets: ", assets);
        assert(assets);

        //assets
        let assetInfo = assets.get(ChainToCaip[ASSET])
        await app.setAssetContext(assetInfo)
        log.info(tag,"assetContext: ",app.assetContext)
        assert(app.assetContext.name)
        assert(app.assetContext.chain)
        assert(app.assetContext.caip)
        assert(app.assetContext.icon)
        assert(app.assetContext.identifier)

        //check pairing
        // //context should match first account
        let context = await app.context
        log.info(tag,"context: ",context)
        assert(context)
        assert(app.paths)
        assert(app.paths[0])

        assert(app.pubkeys)
        assert(app.pubkeys[0])

        log.info(tag,"all app.pubkeys: ",app.pubkeys)
        log.info(tag,"all pubkeys: ",app.pubkeys.length)

        let allBtcPubkeys = app.pubkeys.filter((e: any) => e.networks.includes(BLOCKCHAIN));
        log.info(tag,"allBtcPubkeys: ",allBtcPubkeys)

        let btcAddress = await app.swapKit.getAddress(Chain.Bitcoin)
        log.info(tag,"btcAddress: ",btcAddress)


        // let balance = app.balances.filter((b:any) => b.networkId === BLOCKCHAIN)
        // log.info(tag,"*** balance: ",balance[0])
        // assert(balance[0])
        // assert(balance[0].caip)

        // log.info(tag,'walletKeepKey: ',walletKeepKey)

        //got each pubkey listUnspent
        let unspent:any = []
        for(let i = 0; i < allBtcPubkeys.length; i++){
            let pubkey = allBtcPubkeys[i]
            // log.info(tag,"pubkey: ",pubkey)
            let rawInputs = await app.pioneer.ListUnspent({network:'BTC',xpub:pubkey.pubkey})
            // log.info('rawInputs: ',rawInputs)
            rawInputs = rawInputs.data
            unspent = unspent.concat(rawInputs)
        }
        log.info('unspent: ',unspent)

        // let balance = app.balances.filter((b:any) => b.networkId === BLOCKCHAIN)
        // log.info(tag,"*** balance: ",balance[0])
        // assert(balance[0])
        // assert(balance[0].caip)

        //get wallet for chain
        // let walletSwapkit = await app.swapKit.syncWalletByChain('BTC')
        // log.info("walletSwapkit: ",walletSwapkit)

        //sendMax


        //verify balance
        // await app.getBalances()
        // log.info(tag,"balances: ",app.balances)
        // log.info(tag,"balances: ",app.balances.length)
        // assert(app.balances)
        // let balances = app.balances.filter((e: any) => e.caip == ChainToCaip[ASSET]);
        // log.info(tag,"balances: ",balances)
        // assert(balances)
        // assert(balances[0])
        // assert(balances[0].caip)
        // assert(balances[0].balance)
        // log.info(tag,"balance: ",balances[0].balance)
        //
        // //get total spendable balance
        // let totalSpend = 0
        // for(let i = 0; i < balances.length; i++){
        //     totalSpend += parseFloat(balances[i].balance)
        // }
        // log.info(tag,"totalSpend: ",totalSpend)
        // if(totalSpend <= 0) throw Error("error, no spendable balance. you are broke!")
        //
        //
        // //get total balances value in USD
        // let totalValueUsd = 0
        // for (let i = 0; i < app.balances.length; i++) {
        //     let balance = app.balances[i]
        //     log.info(tag, "balance: ", balance)
        //     totalValueUsd += balance.valueUsd
        // }
        // log.info(tag, "totalValueUsd: ", totalValueUsd)

        //TODO view inputs for pubkeys

        //TODO verify inputs



        // create assetValue
        // const assetString = `${ASSET}.${ASSET}`;
        // log.info(tag,'assetString: ', assetString);
        // await AssetValue.loadStaticAssets();
        // log.info(tag,"TEST_AMOUNT: ",TEST_AMOUNT);
        // log.info(tag,"TEST_AMOUNT: ",typeof(TEST_AMOUNT));
        // const assetValue = AssetValue.fromStringSync(assetString, parseFloat(TEST_AMOUNT));
        // log.info(tag,"assetValue: ",assetValue)
        // assert(assetValue)


        //send
        let estimatePayload:any = {
            feeRate: 10,
            pubkeys,
            memo: '',
            recipient: FAUCET_ADDRESS,
        }
        log.info(tag,"estimatePayload: ",estimatePayload)
        //verify amount is < max spendable
        let maxSpendable = await app.swapKit.estimateMaxSendableAmount({chain:Chain.Bitcoin, params:estimatePayload})
        log.info(tag,"maxSpendable: ",maxSpendable)
        log.info(tag,"maxSpendable: ",maxSpendable.getValue('string'))

        //send
        let sendPayload = {
            // assetValue,
            assetValue:maxSpendable,
            isMax: true,
            memo: '',
            recipient: FAUCET_ADDRESS,
            noBroadcast: true,
        }

        // let sendPayload = {
        //     // assetValue,
        //     assetValue,
        //     isMax: true,
        //     memo: '',
        //     recipient: FAUCET_ADDRESS,
        //     noBroadcast: true,
        // }
        log.info("sendPayload: ",sendPayload)
        const txHash = await app.swapKit.transfer(sendPayload);
        log.info("txHash: ",txHash)
        assert(txHash)

        console.log("************************* TEST PASS *************************")
        console.timeEnd('start2end');
    } catch (e) {
        log.error(e)
        //process
        process.exit(666)
    }
}
test_service()
