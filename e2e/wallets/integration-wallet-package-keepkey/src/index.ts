/*
    E2E testing
 */

import { AssetValue } from '@pioneer-platform/helpers';

require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | intergration-test-wallet | "
const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
import { WalletOption, availableChainsByWallet, NetworkIdToChain, Chain } from '@coinmasters/types';
let {ChainToNetworkId, shortListSymbolToCaip} = require('@pioneer-platform/pioneer-caip');

import {
    getPaths,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';

// let BLOCKCHAIN = 'DOGE'
let BLOCKCHAIN = 'BTC'
// let BLOCKCHAIN = 'ETH'
// let BLOCKCHAIN = 'THOR'

const syncWalletByChain = async (keepkey:any, chain:any) => {
    if (!keepkey[chain]) throw Error('Missing chain! chain: ' + chain);
    console.log('syncing chain: ', chain);
    let balance:any = [];
    const address = await keepkey[chain].walletMethods.getAddress();
    console.log('address: ', address);
    const pubkeys = await keepkey[chain].walletMethods?.getPubkeys();
    console.log('pubkeys: ', pubkeys);
    if (!address) {
        console.error('Failed to get address for chain! chain: ' + chain);
    }
    if (pubkeys.length <= 0) {
        console.error('Failed to get pubkeys for chain! chain: ' + chain);
    }

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < pubkeys.length; i++) {
        let pubkey = pubkeys[i];
        //console.log(tag, 'pubkey: ', pubkey);
        if (!pubkey || !pubkey.networks) continue;
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let j = 0; j < pubkey.networks.length; j++) {
            let networkId = pubkey.networks[j];
            //console.log(tag, 'networkId: ', networkId);
            if (networkId.includes('eip155') || pubkey.type === 'address') {
                //console.log(tag, 'network includes eip155 or is marked address');
                let balance = await keepkey[Chain.Bitcoin].walletMethods?.getBalance([{ address }]);
                //console.log(tag, 'balance: ', balance);
                balance.push(balance);
            } else {
                //console.log(tag, 'Scan Xpub or other public key type');
                let pubkeyBalances: AssetValue[] = await keepkey[Chain.Bitcoin].walletMethods?.getBalance([
                    { pubkey },
                ]);
                //console.log(tag, 'pubkeyBalances: ', pubkeyBalances);
                pubkeyBalances.forEach((pubkeyBalance) => {
                    balance.push(pubkeyBalance);
                });
            }
        }
    }

    return {
        address,
        pubkeys,
        balance,
        walletType: WalletOption.KEEPKEY,
    };
};


const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        //TODO wtf why await
        const { keepkeyWallet } = await import("@coinmasters/wallet-keepkey");

        const walletKeepKey = {
            type: WalletOption.KEEPKEY,
            icon: "https://pioneers.dev/coins/keepkey.png",
            chains: availableChainsByWallet[WalletOption.KEEPKEY],
            wallet: keepkeyWallet,
            status: "offline",
            isConnected: false,
        };

        let blockchains:any = []
        
        let AllChainsSupported = blockchains.map(
          (caip: string | number) =>
            NetworkIdToChain[caip] ||
            (() => {
                throw new Error(`Missing CAIP: ${caip}`);
            })(),
        );

        // let paths:any = [
        //     {
        //         note:"Bitcoin account 0 Native Segwit (Bech32)",
        //         blockchain: 'bitcoin',
        //         symbol: 'BTC',
        //         symbolSwapKit: 'BTC',
        //         network: 'bip122:000000000019d6689c085ae165831e93',
        //         script_type:"p2wpkh", //bech32
        //         available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
        //         type:"zpub",
        //         addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 0],
        //         addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 0, 0, 0],
        //         curve: 'secp256k1',
        //         showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        //     },
        //     // {
        //     //     note:"Bitcoin account 1 Native Segwit (Bech32)",
        //     //     blockchain: 'bitcoin',
        //     //     symbol: 'BTC',
        //     //     symbolSwapKit: 'BTC',
        //     //     network: 'bip122:000000000019d6689c085ae165831e93',
        //     //     script_type:"p2wpkh", //bech32
        //     //     available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
        //     //     type:"zpub",
        //     //     addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1],
        //     //     addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
        //     //     curve: 'secp256k1',
        //     //     showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        //     // },
        //     {
        //         note:"Bitcoin account 0 legacy",
        //         blockchain: 'bitcoin',
        //         symbol: 'BTC',
        //         symbolSwapKit: 'BTC',
        //         network: 'bip122:000000000019d6689c085ae165831e93',
        //         script_type:"p2pkh",
        //         available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
        //         type:"xpub",
        //         addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 0],
        //         addressNListMaster: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 0, 0, 0],
        //         curve: 'secp256k1',
        //         showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        //     },
        //     {
        //         note:"Bitcoin account 1 legacy",
        //         blockchain: 'bitcoin',
        //         symbol: 'BTC',
        //         symbolSwapKit: 'BTC',
        //         network: 'bip122:000000000019d6689c085ae165831e93',
        //         script_type:"p2pkh",
        //         available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
        //         type:"xpub",
        //         addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 1],
        //         addressNListMaster: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
        //         curve: 'secp256k1',
        //         showDisplay: false // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        //     }
        // ]

        // log.info("walletKeepKey.wallet: ",walletKeepKey.wallet)
        // log.info("walletKeepKey.wallet: ",walletKeepKey.wallet.connect)
        // log.info("walletKeepKey.wallet: ",walletKeepKey.wallet.connect?.connectKeepkey)

        // Define the chainData object
        let keepkey:any = {};

        // Implement the addChain function with additional logging
        // @ts-ignore
        function addChain({ chain, walletMethods, wallet }) {
            log.info(`Adding chain: ${chain}`);
            // log.info(`Chain data:`, { chain, walletMethods, wallet });
            keepkey[chain] = {
                walletMethods,
                wallet
            };
        }

        let keepkeyConfig = {
          apiKey: 'test123',
          pairingInfo: {
              name: "int-test-package",
              imageUrl: "",
              basePath: 'http://localhost:1646/spec/swagger.json',
              url: 'http://localhost:1646',
          }
        }
        let covalentApiKey = 'cqt_rQ6333MVWCVJFVX3DbCCGMVqRH4q'
        let ethplorerApiKey = 'freekey'
        let utxoApiKey = 'B_s9XK926uwmQSGTDEcZB3vSAmt5t2'
        let input = {
            apis: {},
            rpcUrls:{},
            addChain,
            config: { keepkeyConfig, covalentApiKey, ethplorerApiKey, utxoApiKey },
        }
        let chains =  [
            BLOCKCHAIN
        ]

        // let chains =  [
        //     'ARB',  'AVAX',
        //     'BSC',  'BTC',  'BCH',
        //     'GAIA', 'OSMO', 'XRP',
        //     'DOGE', 'DASH', 'ETH',
        //     'LTC',  'OP',   'MATIC',
        //     'THOR'
        // ]

        // Step 1: Invoke the outer function with the input object
        const connectFunction = walletKeepKey.wallet.connect(input);
        let networkId = ChainToNetworkId[BLOCKCHAIN]
        log.info("networkId: ",networkId)
        let paths = getPaths([networkId])
        log.info("paths: ",paths)
        //get default paths
        let pubkeys:any = [] //pubkey cache
        let kkApikey = await connectFunction(chains, paths);
        log.info("kkApikey: ", kkApikey);
        log.info("keepkey: ",keepkey)

        //got balances
        for(let i = 0; i < chains.length; i++) {
            let chain = chains[i]
            let walletData:any = await syncWalletByChain(keepkey, chain);
            log.info(chain+ " walletData: ",walletData)
            // keepkey[chain].wallet.address = walletData.address
            keepkey[chain].wallet.pubkeys = walletData.pubkeys
            keepkey[chain].wallet.balance = walletData.balance
        }
        log.info(tag,"keepkey: ",keepkey)

        // let address = await keepkey['ETH'].walletMethods.getAddress()
        // log.info("address: ",address)

        //validate all the balances
        let allChains = Object.keys(keepkey)
        for(let i = 0; i < allChains.length; i++) {
            let chain = allChains[i]
            let balance = keepkey[chain].wallet.balance
            log.info(chain+ " balance: ",balance)
            for(let j = 0; j < balance.length; j++) {
                let ticker = balance[j].ticker
                let value = balance[j].getValue('string')
                log.info(chain+ " "+ticker+ " balance: ",value)
                if(!ticker || !value) {
                    log.error(balance[j])
                    throw new Error("Invalid balance for "+chain+ " "+ticker)
                }
            }
        }



        // log.info("balance: ",keepkey['ETH'].wallet.balance)
        // log.info("balance: ",keepkey['ETH'].wallet.balance)
        // log.info("balance: ",keepkey['ETH'].wallet.balance[0].getValue('string'))
        // log.info("balance: ", keepkey['ETH'].wallet.balance.find((item: any) => item.ticker === 'FOX')?.getValue('string'));
        // log.info("FOX entries count: ", keepkey['ETH'].wallet.balance.filter((item: any) => item.ticker === 'FOX').length);


        // log.info("balance: ", keepkey['ETH'].wallet.balance.find((item: any) => item.ticker === 'USDT')?.getValue('string'));
        // log.info("USDT entries count: ", keepkey['ETH'].wallet.balance.filter((item: any) => item.ticker === 'USDT').length);
        //


        /*
            TODO
            depositThorchain
            depositEthereum
            depositBitcoin
            depositDash
            
            transfer {to amount asset}
            transferCosmos
            transferEthereum
            transferBitcoin
            transferDash
            transferMaya
         */

        /*
               SYNTH RUNE
         */

       //
       //  //deposit maya
       //  //get assetValue for asset
       //  // let assetString = 'ETH.USDT'
       //  let assetString = 'THOR.RUNE'
       //  // create assetValue
       //  // const assetString = `${ASSET}.${ASSET}`;
       // log.info('assetString: ', assetString);
       //  let TEST_AMOUNT = "0.01"
       //  // await AssetValue.loadStaticAssets();
       //  log.info("TEST_AMOUNT: ",TEST_AMOUNT)
       //  log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
       //  let assetValue = await AssetValue.fromString(
       //    assetString,
       //    parseFloat(TEST_AMOUNT),
       //  );
       //  log.info("assetValue: ",assetValue)
       //  let memo = '=:r:thor1g9el7lzjwh9yun2c4jjzhy09j98vkhfxfhgnzx'
       //  //send
       //  let sendPayload = {
       //      assetValue,
       //      memo
       //  }
       //  log.info("sendPayload: ",sendPayload)
       //  const txHash = await  keepkey[Chain.THORChain].walletMethods.deposit(sendPayload);
       //  log.info("txHash: ",txHash)
       //  assert(txHash)

        /*
                SEND MAYA

         */
        // let address = await keepkey[BLOCKCHAIN].walletMethods.getAddress()
        // let pubkey = address
        // let balanceNew = await keepkey[BLOCKCHAIN].walletMethods.getBalance([{ pubkey }])
        // log.info(tag,"** balance: ",balanceNew)
        // if(balanceNew.length === 0) {
        //     log.error(tag,"No balance")
        //     return
        // }
        // let assetString = 'MAYA.MAYA'
        // console.log('assetString: ', assetString);
        // let TEST_AMOUNT = "0.1"
        // // await AssetValue.loadStaticAssets();
        // log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        // log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        // let assetValue = await AssetValue.fromString(
        //   assetString,
        //   parseFloat(TEST_AMOUNT),
        // );
        // //send
        // let sendPayload = {
        //     assetValue,
        //     memo: '',
        //     recipient: process.env['FAUCET_MAYA_ADDRESS'] || 'maya1g9el7lzjwh9yun2c4jjzhy09j98vkhfxfqkl5k',
        // }
        // log.info("sendPayload: ",sendPayload)
        // const txHash = await  keepkey[Chain.Mayachain].walletMethods.transfer(sendPayload);
        // log.info("txHash: ",txHash)
        // assert(txHash)


        /*
                SEND CACAO

         */
        // let address = await keepkey[BLOCKCHAIN].walletMethods.getAddress()
        // // let pubkey = address
        // log.info(tag,"** address: ",address)
        // let balanceNew = await keepkey[BLOCKCHAIN].walletMethods.getBalance([{ address }])
        // log.info(tag,"** balance: ",balanceNew)
        // if(balanceNew.length === 0) {
        //     log.error(tag,"No balance")
        //     return
        // }
        // //get assetValue for asset
        // // let assetString = 'ETH.USDT'
        // let assetString = 'MAYA.CACAO'
        // // create assetValue
        // // const assetString = `${ASSET}.${ASSET}`;
        // console.log('assetString: ', assetString);
        // let TEST_AMOUNT = "0.1"
        // // await AssetValue.loadStaticAssets();
        // log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        // log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        // let assetValue = await AssetValue.fromString(
        //   assetString,
        //   parseFloat(TEST_AMOUNT),
        // );
        // log.info("assetValue: ",assetValue)
        //
        // //send
        // let sendPayload = {
        //     assetValue,
        //     memo: '',
        //     recipient: process.env['FAUCET_MAYA_ADDRESS'] || 'maya1g9el7lzjwh9yun2c4jjzhy09j98vkhfxfqkl5k',
        // }
        // log.info("sendPayload: ",sendPayload)
        // const txHash = await  keepkey[Chain.Mayachain].walletMethods.transfer(sendPayload);
        // log.info("txHash: ",txHash)
        // assert(txHash)


        /*
               DEPOSIT CACAO
         */


        // //deposit maya
        // //get assetValue for asset
        // // let assetString = 'ETH.USDT'
        // let assetString = 'MAYA.CACAO'
        // // create assetValue
        // // const assetString = `${ASSET}.${ASSET}`;
        // console.log('assetString: ', assetString);
        // let TEST_AMOUNT = "20"
        // // await AssetValue.loadStaticAssets();
        // log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        // log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        // let assetValue = await AssetValue.fromString(
        //   assetString,
        //   parseFloat(TEST_AMOUNT),
        // );
        // log.info("assetValue: ",assetValue)
        //
        // //send
        // let sendPayload = {
        //     assetValue,
        //     memo: '=:DASH.DASH:Xursn5XQzLEa2J91uEWeAVsKpLsBTf393x::ELD:75'
        // }
        // log.info("sendPayload: ",sendPayload)
        // const txHash = await  keepkey[Chain.Mayachain].walletMethods.deposit(sendPayload);
        // log.info("txHash: ",txHash)
        // assert(txHash)


        /*
               SEND ERC-20
         */

        // //get assetValue for asset
        // // let assetString = 'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7'
        // let assetString = 'ETH.USDT-0xdac17f958d2ee523a2206206994597c13d831ec7'
        // // create assetValue
        // // const assetString = `${ASSET}.${ASSET}`;
        // console.log('assetString: ', assetString);
        // let TEST_AMOUNT = "0.1"
        // // await AssetValue.loadStaticAssets();
        // log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        // log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        // await AssetValue.loadStaticAssets();
        // let assetValue = await AssetValue.fromString(
        //   assetString,
        //   parseFloat(TEST_AMOUNT),
        // );
        // log.info("assetValue: ",assetValue)
        //
        //
        // let address = await keepkey[Chain.Ethereum].walletMethods.getAddress()
        // log.info("address: ",address)
        // assert(address)
        // //send
        // let sendPayload = {
        //     from:address,
        //     assetValue,
        //     memo: '',
        //     recipient: process.env['FAUCET_ETH_ADDRESS'] || '0xC3aFFff54122658b89C31183CeC4F15514F34624',
        // }
        // log.info("sendPayload: ",sendPayload)
        // const txHash = await  keepkey[Chain.Ethereum].walletMethods.transfer(sendPayload);
        // log.info("txHash: ",txHash)
        // assert(txHash)

        /*
           SEND Bitcoin
         */

        //get assetValue for asset
        // let assetString = 'BTC.BTC'
        // console.log('assetString: ', assetString);
        // let TEST_AMOUNT = "0.0005"
        // // await AssetValue.loadStaticAssets();
        // log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        // log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        // await AssetValue.loadStaticAssets();
        // let assetValue = await AssetValue.fromString(
        //   assetString,
        //   parseFloat(TEST_AMOUNT),
        // );
        // log.info("assetValue: ",assetValue)
        //
        //
        // let address = await keepkey[Chain.Bitcoin].walletMethods.getAddress()
        // log.info("address: ",address)
        // assert(address)
        // //send
        // let sendPayload = {
        //     from:address,
        //     assetValue,
        //     memo: '',
        //     recipient: process.env['FAUCET_BITCOIN_ADDRESS'],
        // }
        // log.info("sendPayload: ",sendPayload)
        // log.info("keepkey: ",keepkey)
        // log.info("keepkey[Chain.Bitcoin]: ",keepkey)
        // const txHash = await  keepkey[Chain.Bitcoin].walletMethods.transfer(sendPayload);
        // log.info("txHash: ",txHash)
        // assert(txHash)


        log.info("************************* TEST PASS *************************")
    } catch (e) {
        log.error(e)
        //process
        process.exit(666)
    }
}
test_service()
