import {
  ARBToolbox,
  AVAXToolbox,
  BASEToolbox,
  BSCToolbox,
  ETHToolbox,
  getProvider,
  MATICToolbox,
  OPToolbox,
} from '@coinmasters/toolbox-evm';
import type { EVMChain } from '@coinmasters/types';
import { Chain, WalletOption } from '@coinmasters/types';
import { KeepKeySdk } from '@keepkey/keepkey-sdk';

import { cosmosWalletMethods } from './chains/cosmos.js';
import { KeepKeySigner } from './chains/evm.ts';
import { mayachainWalletMethods } from './chains/mayachain.ts';
import { osmosisWalletMethods } from './chains/osmosis.js';
import { rippleWalletMethods } from './chains/ripple.js';
import { thorchainWalletMethods } from './chains/thorchain.ts';
import { utxoWalletMethods } from './chains/utxo.js';
export type { PairingInfo } from '@keepkey/keepkey-sdk';

export const KEEPKEY_SUPPORTED_CHAINS = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Cosmos,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Litecoin,
  Chain.Optimism,
  Chain.Osmosis,
  Chain.Polygon,
  Chain.Ripple,
  Chain.THORChain,
  Chain.Mayachain,
  Chain.Zcash,
] as const;

/*
 * KeepKey Wallet
 */
type KeepKeyOptions = {
  sdk: KeepKeySdk;
  apiClient?: any;
  rpcUrl?: string;
  ethplorerApiKey?: string;
  blockchairApiKey?: string;
  covalentApiKey?: string;
  chain: Chain;
  paths?: any;
};

const getEVMWalletMethods = async ({
  api,
  sdk,
  chain,
  ethplorerApiKey,
  covalentApiKey,
  rpcUrl,
  derivationPath = [2147483692, 2147483708, 2147483648, 0, 0],
}: any) => {
  const provider = getProvider(chain as EVMChain, rpcUrl);
  const signer = new KeepKeySigner({ sdk, chain, derivationPath, provider });
  const address = await signer.getAddress();
  const evmParams = { api, signer, provider };

  const getPubkeys = () => ({ type: 'address', pubkey: address });

  switch (chain) {
    case Chain.Ethereum:
      return {
        ...ETHToolbox({ ...evmParams, ethplorerApiKey }),
        getAddress: () => address,
        getPubkeys,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.BinanceSmartChain:
      return {
        ...BSCToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        getPubkeys,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.Arbitrum:
      return {
        ...ARBToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        getPubkeys,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.Optimism:
      return {
        ...OPToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        getPubkeys,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.Polygon:
      return {
        ...MATICToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        getPubkeys,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.Avalanche:
      return {
        ...AVAXToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        getPubkeys,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    case Chain.Base:
      return {
        ...BASEToolbox({ ...evmParams, covalentApiKey }),
        getAddress: () => address,
        getPubkeys,
        signMessage: signer.signMessage,
        signTypedData: signer.signTypedData,
      };
    default:
      throw new Error('getEVMWalletMethods Chain not supported');
  }
};

const getToolbox = async ({
  sdk,
  apiClient,
  rpcUrl,
  chain,
  covalentApiKey,
  ethplorerApiKey,
  utxoApiKey,
  paths,
}: KeepKeyOptions) => {
  switch (chain) {
    case Chain.BinanceSmartChain:
    case Chain.Base:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Avalanche:
    case Chain.Ethereum: {
      if (chain === Chain.Ethereum && !ethplorerApiKey)
        throw new Error('Ethplorer API key not found');
      if (chain !== Chain.Ethereum && !covalentApiKey)
        throw new Error('Covalent API key not found');
      const walletMethods = await getEVMWalletMethods({
        sdk,
        apiClient,
        chain,
        covalentApiKey,
        derivationPath: [2147483692, 2147483708, 2147483648, 0, 0],
        ethplorerApiKey,
        rpcUrl,
      });

      return { address: walletMethods.getAddress(), walletMethods };
    }
    case Chain.Cosmos: {
      const walletMethods = await cosmosWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.Osmosis: {
      const walletMethods = await osmosisWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.THORChain: {
      const walletMethods = await thorchainWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.Mayachain: {
      const walletMethods = await mayachainWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.Ripple: {
      const walletMethods = await rippleWalletMethods({ sdk });
      return { address: await walletMethods.getAddress(), walletMethods };
    }
    case Chain.Bitcoin:
    case Chain.BitcoinCash:
    case Chain.Dash:
    case Chain.Zcash:
    case Chain.Dogecoin:
    case Chain.Litecoin: {
      const walletMethods = await utxoWalletMethods({
        apiKey: utxoApiKey,
        paths,
        apiClient,
        sdk,
        chain,
      });
      return { address: walletMethods.getAddress(), walletMethods };
    }
    default:
      throw new Error('KeepKey Chain not supported ' + chain);
  }
};

export const checkKeepkeyAvailability = async (spec: string) => {
  try {
    const response = await fetch(spec);
    if (response.status === 200) {
      return true;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
  return false;
};

// kk-sdk docs: https://medium.com/@highlander_35968/building-on-the-keepkey-sdk-2023fda41f38
// test spec: if offline, launch keepkey-bridge
let attempt = 0;
const checkAndLaunch = async () => {
  attempt++;
  if (!(await checkKeepkeyAvailability('http://localhost:1646/spec/swagger.json'))) {
    if (attempt === 3) {
      alert(
        'KeepKey desktop is required for keepkey-sdk, please go to https://keepkey.com/get-started',
      );
    } else {
      window.location.assign('keepkey://launch');
      await new Promise((resolve) => setTimeout(resolve, 30000));
      checkAndLaunch();
    }
  }
};

const connectKeepkey =
  ({
    apis,
    rpcUrls,
    addChain,
    config: { keepkeyConfig, covalentApiKey, ethplorerApiKey, utxoApiKey },
  }) =>
  async (chains, paths) => {
    let tag = 'connectKeepkey';
    if (!keepkeyConfig) throw new Error('KeepKey config not found');
    if (!keepkeyConfig.pairingInfo.name)
      throw new Error('KeepKey pairingInfo.name not found and is required');
    if (!keepkeyConfig.pairingInfo.imageUrl)
      throw new Error('KeepKey pairingInfo.imageUrl not found and is required');

    console.time('Total connectKeepkey time');

    // Debug start
    // console.time('checkAndLaunch');
    await checkAndLaunch();
    // console.timeEnd('checkAndLaunch');

    if (!paths) paths = [];
    if (!keepkeyConfig.pairingInfo.name) keepkeyConfig.pairingInfo.name = 'KeepKey';
    if (!keepkeyConfig.pairingInfo.imageUrl)
      keepkeyConfig.pairingInfo.imageUrl = 'https://pioneers.dev/coins/keepkey.png';

    console.time('KeepKeySdk.create');
    console.log(tag, 'keepkeyConfig: ', keepkeyConfig);
    const keepKeySdk = await KeepKeySdk.create(keepkeyConfig);
    console.timeEnd('KeepKeySdk.create');
    console.log('keepKeySdk: ', keepKeySdk);

    let features = await keepKeySdk.system.info.getFeatures();

    const chainPromises = chains.map(async (chain) => {
      if (!chain) return;

      const chainLogLabel = `Chain ${chain} processing time`;
      console.time(chainLogLabel);

      console.time(`getToolbox for ${chain}`);
      const { address, walletMethods } = await getToolbox({
        sdk: keepKeySdk,
        apiClient: apis[chain],
        rpcUrl: rpcUrls[chain],
        chain,
        covalentApiKey,
        ethplorerApiKey,
        utxoApiKey,
        paths,
      });
      console.timeEnd(`getToolbox for ${chain}`);

      console.time(`addChain for ${chain}`);
      addChain({
        chain,
        info: features,
        walletMethods,
        wallet: { address, balance: [], walletType: WalletOption.KEEPKEY },
        keepkeySdk: keepKeySdk,
      });
      console.timeEnd(`addChain for ${chain}`);

      console.timeEnd(chainLogLabel);
    });

    // Wait for all the promises to resolve
    console.time('Promise.all(chainPromises)');
    await Promise.all(chainPromises);
    console.timeEnd('Promise.all(chainPromises)');

    console.timeEnd('Total connectKeepkey time');

    return { keepkeyApiKey: keepkeyConfig.apiKey, info: features, keepKeySdk };
  };

export const keepkeyWallet = {
  connectMethodName: 'connectKeepkey' as const,
  connect: connectKeepkey,
  isDetected: () => checkKeepkeyAvailability('http://localhost:1646/spec/swagger.json'),
};
