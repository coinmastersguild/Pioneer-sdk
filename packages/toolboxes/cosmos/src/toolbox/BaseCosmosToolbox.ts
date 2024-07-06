import { SwapKitApi } from '@coinmasters/api';
import { Chain, type ChainId, type DerivationPath } from '@coinmasters/types';
import { AssetValue } from '@pioneer-platform/helpers';

import type { CosmosClient } from '../cosmosClient.ts';

const TAG = ' | BaseCosmosToolbox | ';

type Params = {
  client: CosmosClient;
  decimal: number;
  derivationPath: DerivationPath;
};

export const getFeeRateFromThorswap = async (chainId: ChainId) => {
  const response = await SwapKitApi.getGasRates();
  return response.find((gas) => gas.chainId === chainId)?.gas;
};

// TODO: figure out some better way to initialize from base value
export const getAssetFromDenom = async (denom: string, amount: string) => {
  switch (denom) {
    case 'thor':
    case 'rune':
      return AssetValue.fromChainOrSignature(Chain.THORChain, parseInt(amount) / 1e8);
    case 'bnb':
      return AssetValue.fromChainOrSignature(Chain.Binance, parseInt(amount) / 1e8);
    case 'uosmo':
    case 'osmo':
    case 'uatom':
    case 'atom':
      return AssetValue.fromChainOrSignature(Chain.Cosmos, parseInt(amount) / 1e6);
    case 'cacao':
      return AssetValue.fromChainOrSignature(Chain.Maya, parseInt(amount) / 1e10);
    case 'maya':
      return AssetValue.fromChainOrSignature('MAYA.MAYA', parseInt(amount) / 1e4);
    case 'ukuji':
    case 'kuji':
      return AssetValue.fromChainOrSignature(Chain.Kujira, parseInt(amount) / 1e6);
    default:
      return AssetValue.fromString(denom, parseInt(amount) / 1e8);
  }
};

export const BaseCosmosToolbox = ({
  derivationPath,
  client: cosmosClient,
}: Params): {
  getSignerFromPrivateKey: (privateKey: Uint8Array) => Promise<any>;
  transfer: ({ from, recipient, assetValue, memo, fee, signer }: any) => Promise<any>;
  getBalance: (pubkeys: any) => Promise<any>;
  broadcast: (tx: any) => Promise<any>;
  getAccount: (address: string) => Promise<any>;
  getSigner: (phrase: string) => Promise<any>;
  validateAddress: (address: string) => Promise<boolean>;
  getAddressFromMnemonic: (phrase: string) => Promise<any>;
  getFeeRateFromThorswap: (chainId: ChainId) => Promise<any>;
  getPubKeyFromMnemonic: (phrase: string) => Promise<string>;
} => ({
  transfer: cosmosClient.transfer,
  getSigner: async (phrase: string) => {
    const { DirectSecp256k1HdWallet } = await import('@cosmjs/proto-signing');
    const { stringToPath } = await import('@cosmjs/crypto');
    return DirectSecp256k1HdWallet.fromMnemonic(phrase, {
      prefix: cosmosClient.prefix,
      hdPaths: [stringToPath(`${derivationPath}/0`)],
    });
  },
  getSignerFromPrivateKey: async (privateKey: Uint8Array) => {
    const { DirectSecp256k1Wallet } = await import('@cosmjs/proto-signing');
    return DirectSecp256k1Wallet.fromKey(privateKey, cosmosClient.prefix);
  },
  getAccount: cosmosClient.getAccount,
  validateAddress: (address: string) => cosmosClient.checkAddress(address),
  getAddressFromMnemonic: (phrase: string) =>
    cosmosClient.getAddressFromMnemonic(phrase, `${derivationPath}/0`),
  getPubKeyFromMnemonic: (phrase: string) =>
    cosmosClient.getPubKeyFromMnemonic(phrase, `${derivationPath}/0`),
  getFeeRateFromThorswap,
  broadcast: async (tx: any) => {
    let tag = TAG + ' | broadcast | ';
    try {
      const response = await cosmosClient.broadcast(tx);
      return response;
    } catch (error) {
      console.error(tag, 'Error getting balance: ', error);
      throw error;
    }
  },
  getBalance: async (pubkeys: any) => {
    let tag = TAG + ' | getBalance | ';
    try {
      //console.log(tag, 'pubkeys: ', pubkeys);
      let address;
      if (Array.isArray(pubkeys)) {
        address = pubkeys[0].address;
      } else {
        address = pubkeys.address;
      }
      //console.log(tag, 'address: ', address);
      const balance = await cosmosClient.getBalance(address);

      return balance;
      // const ERROR_SYMBOL = Symbol('error');
      //
      // return Promise.all(
      //   balances
      //     .filter(({ denom }) => denom)
      //     .map(async ({ denom, amount }) => {
      //       try {
      //         let balance = await getAssetFromDenom(denom, amount);
      //         //console.log(tag, 'balance: ', balance);
      //         //console.log(tag, 'chain: ', chain);
      //         balance.caip = ChainToCaip[chain];
      //         return balance;
      //       } catch (error) {
      //         console.error(tag, error);
      //         // Return the shared error symbol
      //         return ERROR_SYMBOL;
      //       }
      //     }),
      // ).then((results) => results.filter((result) => result !== ERROR_SYMBOL));
    } catch (error) {
      console.error(tag, 'Error getting balance: ', error);
      throw error;
    }
  },
});
