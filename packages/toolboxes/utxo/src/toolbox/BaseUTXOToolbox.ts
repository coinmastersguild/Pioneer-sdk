/*
      BaseUTXOToolbox
            -Highlander

     X-pub based
 */

//@ts-ignore
import type { UTXOChain } from '@coinmasters/types';
import { Chain, FeeOption } from '@coinmasters/types';
//@ts-ignore
import { AssetValue, SwapKitNumber } from '@pioneer-platform/helpers';
import { ChainToCaip } from '@pioneer-platform/pioneer-caip';
import { HDKey } from '@scure/bip32';
import { payments, Psbt } from 'bitcoinjs-lib';
import * as coinSelect from 'coinselect';
import * as split from 'coinselect/split';
import type { ECPairInterface } from 'ecpair';
import { ECPairFactory } from 'ecpair';

import type { BlockchairApiType } from '../api/blockchairApi.ts';
import type {
  UTXOBaseToolboxParams,
  UTXOBuildTxParams,
  UTXOType,
  UTXOWalletTransferParams,
} from '../types/common.ts';
import {
  accumulative,
  calculateTxSize,
  compileMemo,
  getNetwork,
  getSeed,
  standardFeeRates,
} from '../utils/index.ts';
const TAG = ' | BaseUTXOToolbox | ';

const createKeysForPath = async ({
  phrase,
  wif,
  derivationPath,
  chain,
}: {
  phrase?: string;
  wif?: string;
  derivationPath: string;
  chain: Chain;
}) => {
  if (!wif && !phrase) throw new Error('Either phrase or wif must be provided');

  const tinySecp = await import('tiny-secp256k1');
  const factory = ECPairFactory(tinySecp);
  const network = getNetwork(chain);

  if (wif) return factory.fromWIF(wif, network);

  const seed = getSeed(phrase as string);
  const master = HDKey.fromMasterSeed(seed, network).derive(derivationPath);

  if (!master.privateKey) {
    throw new Error('Could not get private key from phrase');
  }
  return factory.fromPrivateKey(Buffer.from(master.privateKey), { network });
};

const validateAddress = ({ address, chain }: { address: string } & UTXOBaseToolboxParams) => {
  try {
    //console.log(chain + ' validateAddress: ', address);
    //@TODO validate addresses!
    //btcLibAddress.toOutputScript(address, getNetwork(chain));
    return true;
  } catch (error) {
    return false;
  }
};

const getAddressFromKeys = ({ keys, chain }: { keys: ECPairInterface } & UTXOBaseToolboxParams) => {
  if (!keys) throw new Error('Keys must be provided');

  const method = Chain.Dogecoin === chain ? payments.p2pkh : payments.p2wpkh;
  const { address } = method({ pubkey: keys.publicKey, network: getNetwork(chain) });
  if (!address) throw new Error('Address not defined');

  return address;
};

const transfer = async ({
  signTransaction,
  from,
  memo,
  recipient,
  chain,
  apiClient,
  feeOptionKey,
  broadcastTx,
  feeRate,
  assetValue,
}: UTXOWalletTransferParams<Psbt, Psbt>) => {
  if (!from) throw new Error('From address must be provided');
  if (!recipient) throw new Error('Recipient address must be provided');
  // const txFeeRate = feeRate || (await getFeeRates(apiClient))[feeOptionKey || FeeOption.Fast];
  const txFeeRate = getDefaultTxFeeByChain(chain);
  const { psbt } = await buildTx({
    recipient,
    feeRate: txFeeRate,
    sender: from,
    fetchTxHex: chain === Chain.Dogecoin,
    chain,
    apiClient,
    assetValue,
    memo,
  });
  const signedPsbt = await signTransaction(psbt);
  signedPsbt.finalizeAllInputs(); // Finalise inputs
  // TX extracted and formatted to hex
  return broadcastTx(signedPsbt.extractTransaction().toHex());
};

const getPubkeyBalance = async function (
  pubkey: string,
  type: string,
  apiClient: BlockchairApiType,
) {
  let tag = TAG + ' | getPubkeyBalance | ';
  try {
    //console.log(tag, 'getPubkeyBalance pubkey: ', pubkey);
    //console.log(tag, 'getPubkeyBalance type: ', type);
    switch (type) {
      case 'zpub':
      case 'ypub':
      case 'xpub':
        // eslint-disable-next-line no-case-declarations
        const xpubBalance = await apiClient.getBalanceXpub(pubkey);
        //console.log(tag, ' xpubBalance: ', xpubBalance);
        return xpubBalance;
      case 'address':
        // eslint-disable-next-line no-case-declarations
        const address = pubkey.address;
        //console.log('getPubkeyBalance address: ', address);
        // eslint-disable-next-line no-case-declarations
        const addressBalance = await apiClient.getBalance(address);
        //console.log(tag, ' addressBalance: ', addressBalance);
        //console.log('getPubkeyBalance: addressBalance: ', addressBalance);
        return addressBalance;
      default:
        throw new Error('Invalid pubkey type');
    }
  } catch (e) {
    console.error(e);
  }
};

const getBalance = async ({ pubkey, chain, apiClient }: any) => {
  const tag = TAG + ' | getBalance | ';
  try {
    if (!Array.isArray(pubkey)) {
      throw new Error('pubkey must be an array');
    }

    //console.log(tag, 'chain: ', chain);
    //console.log(tag, 'pubkeys: ', pubkey);

    let totalBalanceRaw = BigInt(0);

    for (const key of pubkey) {
      const balanceRaw = await getPubkeyBalance(key.pubkey, key.type, apiClient);
      //console.log(tag, `(${key.note}: (${key.path}) balance for ${key.pubkey}: `, balanceRaw);
      totalBalanceRaw += BigInt(balanceRaw);
    }
    //console.log(tag, 'totalBalanceRaw: ', totalBalanceRaw);

    const asset = await AssetValue.fromChainOrSignature(chain, totalBalanceRaw);
    asset.caip = ChainToCaip[chain];
    if (!asset.caip) throw new Error('Invalid chain! missing caip! ');
    //console.log('BaseUTXO asset: ', asset);

    asset.pubkeys = pubkey.map((key) => key.pubkey).join(','); // combining all pubkeys for reference

    return asset;
  } catch (error) {
    console.error(tag, 'Error in getBalance: ', error);
    throw error; // re-throw the error after logging it
  }
};

// const getBalance = async ({ pubkey, chain, apiClient }: any) => {
//   const tag = TAG + ' getBalance';
//   try {
//     if (Array.isArray(pubkey)) {
//       pubkey = pubkey[0];
//     }
//
//     //console.log(tag, 'chain: ', chain);
//     //console.log(tag, 'pubkey: ', pubkey);
//     let balanceRaw = await getPubkeyBalance(pubkey.pubkey, pubkey.type, apiClient);
//     //console.log(tag, 'balanceRaw: ', balanceRaw);
//
//     const asset = await AssetValue.fromChainOrSignature(chain, BigInt(balanceRaw));
//     asset.caip = ChainToCaip[chain];
//     if (!asset.caip) throw new Error('Invalid chain! missing caip! ');
//     //console.log('BaseUTXO asset: ', asset);
//     asset.pubkey = pubkey.pubkey;
//
//     return asset;
//   } catch (error) {
//     console.error(tag, 'Error in getBalance: ', error);
//     throw error; // re-throw the error after logging it
//   }
// };

// const getBalance = async ({ pubkeys, chain, apiClient }: { pubkeys: any[] } & any) => {
//   const tag = TAG + ' getBalance';
//   try {
//     //console.log(tag, 'pubkeys: ', pubkeys);
//
//     // Legacy support
//     if (typeof pubkeys === 'string') {
//       pubkeys = [{ address: pubkeys }];
//     }
//
//     let totalBalance = 0;
//
//     // eslint-disable-next-line @typescript-eslint/prefer-for-of
//     for (let i = 0; i < pubkeys.length; i++) {
//       let pubkey = pubkeys[i];
//       let type = '';
//       if (pubkey.pubkey) {
//         type = 'pubkey';
//       } else {
//         type = 'address';
//       }
//
//       let balance = await getPubkeyBalance(pubkey, type, apiClient);
//       //console.log(tag, 'PRE BaseUTXO getPubkeyBalance balance: ', balance);
//
//       if (typeof balance === 'object') balance = 0;
//       //console.log(tag, 'POST BaseUTXO getPubkeyBalance balance: ', balance);
//
//       totalBalance += balance;
//     }
//
//     totalBalance = totalBalance / 100000000;
//     //console.log(tag, `BaseUTXO totalBalance:`, totalBalance);
//
//     const asset = await AssetValue.fromChainOrSignature(chain, totalBalance);
//     //console.log(tag, 'BaseUTXO asset: ', asset);
//
//     return [asset];
//   } catch (error) {
//     console.error(tag, 'Error in getBalance: ', error);
//     throw error; // re-throw the error after logging it
//   }
// };

// const getBalance = async ({ pubkeys, chain, apiClient }: { pubkeys: any[] } & any) => {
//   console.log('getBalance pubkeys: ', pubkeys);
//   //legacy support
//   if (typeof pubkeys === 'string') {
//     pubkeys = [{ address: pubkeys }];
//   }
//   let totalBalance = 0;
//   // eslint-disable-next-line @typescript-eslint/prefer-for-of
//   for (let i = 0; i < pubkeys.length; i++) {
//     let pubkey = pubkeys[i];
//     let type = '';
//     if (pubkey.pubkey) {
//       type = 'pubkey';
//       //console.log('pubkey: ', pubkey.pubkey);
//     } else {
//       type = 'address';
//     }
//     //console.log('type: ', type);
//     let balance = await getPubkeyBalance(pubkey, type, apiClient);
//     console.log('PRE BaseUTXO getPubkeyBalance balance: ', balance);
//     if (typeof balance === 'object') balance = 0;
//     console.log('POST BaseUTXO getPubkeyBalance balance: ', balance);
//     totalBalance = totalBalance + balance;
//   }
//   totalBalance = totalBalance / 100000000;
//   console.log(`BaseUTXO totalBalance:`, totalBalance);
//   const asset = await AssetValue.fromChainOrSignature(chain, totalBalance);
//   console.log('BaseUTXO asset: ', asset);
//   return [asset];
// };

const getDefaultTxFeeByChain = (chain: Chain) => {
  switch (chain) {
    case Chain.Bitcoin:
      return 5;
    case Chain.Dogecoin:
      return 10000;
    case Chain.Dash:
      return 1;
    case Chain.Litecoin:
      return 1;
    default:
      return 2;
  }
};

const getFeeRates = async (apiClient: BlockchairApiType) =>
  standardFeeRates(await apiClient.getSuggestedTxFee());

// Create a function to transform an input into the desired output format
function transformInput(input) {
  const {
    txid,
    vout,
    value,
    address,
    height,
    confirmations,
    path,
    scriptType,
    hex: txHex,
    tx,
    coin,
    network,
  } = input;

  return {
    address,
    hash: txid, // Rename txid to hash
    index: vout,
    value: parseInt(value),
    height,
    scriptType,
    confirmations,
    path,
    txHex,
    tx,
    coin,
    network,
    witnessUtxo: {
      value: parseInt(input.tx.vout[0].value),
      script: Buffer.from(input.tx.vout[0].scriptPubKey.hex, 'hex'),
    },
  };
}

const getInputsAndTargetOutputs = async ({
  assetValue,
  recipient,
  memo,
  pubkeys,
  sender,
  fetchTxHex = false,
  apiClient,
  chain,
}: {
  assetValue: AssetValue;
  pubkeys: any[];
  recipient: string;
  memo?: string;
  sender: string;
  fetchTxHex?: boolean;
  apiClient: BlockchairApiType;
  chain: UTXOChain;
}) => {
  //get inputs by xpub
  //console.log('pubkeys: ', pubkeys);
  //get balances for each pubkey
  // for (let i = 0; i < pubkeys.length; i++) {
  //   let pubkey = pubkeys[i];
  //   //console.log('1 pubkey: ', pubkey);
  //   //console.log('2 pubkey: ', pubkey.pubkey);
  //   let balance = await apiClient.getBalanceXpub(pubkey.pubkey || pubkey.xpub || pubkey);
  //   //console.log('balance: ', balance);
  //   pubkeys[i].balance = balance.toString();
  // }
  // //console.log('pubkeys: ', pubkeys);
  //
  // // select a single pubkey
  // // choose largest balance
  // let largestBalance = -Infinity; // Initialize with a very small value
  // let pubkeyWithLargestBalance = null; // Initialize as null
  //
  // // eslint-disable-next-line @typescript-eslint/prefer-for-of
  // for (let i = 0; i < pubkeys.length; i++) {
  //   const pubkey = pubkeys[i];
  //   const balance = parseFloat(pubkey.balance);
  //
  //   if (!isNaN(balance) && balance > largestBalance) {
  //     largestBalance = balance;
  //     pubkeyWithLargestBalance = pubkey;
  //   }
  // }
  //
  // //console.log('The pubkey with the highest balance is:', pubkeyWithLargestBalance);
  //
  // // pubkeyWithLargestBalance
  // //console.log('pubkeyWithLargestBalance: ', pubkeyWithLargestBalance);
  // let inputs = await apiClient.listUnspent({
  //   pubkey:
  //     pubkeyWithLargestBalance?.pubkey ||
  //     pubkeyWithLargestBalance?.xpub ||
  //     pubkeyWithLargestBalance,
  //   chain,
  //   apiKey: apiClient.apiKey,
  // });
  // //console.log('inputs total: ', inputs);
  // //console.log('inputs total: ', inputs.length);

  let allInputs: any[] = [];

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < pubkeys.length; i++) {
    const pubkeyInfo = pubkeys[i];
    const pubkey = pubkeyInfo.pubkey || pubkeyInfo.xpub || pubkeyInfo;

    // Assuming getBalance is a method of apiClient that returns a Promise<number>
    const balance: number = await apiClient.getBalanceXpub(pubkey.pubkey || pubkey.xpub || pubkey);

    if (balance > 0) {
      // Assuming listUnspent returns a Promise of an array
      // @ts-ignore
      let inputs = await apiClient.listUnspent({
        pubkey: pubkey.pubkey || pubkey.xpub || pubkey,
        chain,
        apiKey: apiClient.apiKey,
      });
      //console.log('getInputsAndTargetOutputs: pubkeyInfo: ', pubkeyInfo);
      //console.log('getInputsAndTargetOutputs: inputs: ', inputs);
      //add scriptType
      inputs = inputs.map((input) => {
        input.scriptType = pubkeyInfo.script_type;
        return input;
      });
      //console.log('getInputsAndTargetOutputs: inputs: POST: ', inputs);
      if (inputs && inputs.length > 0) {
        allInputs = [...allInputs, ...inputs];
      }
    }
  }

  //console.log('Aggregated inputs total: ', allInputs.length);
  //console.log('Aggregated inputs: ', allInputs);

  //console.log('allInputs: ', allInputs);
  //Use the map function to transform each input
  let inputs = allInputs.map(transformInput);
  //console.log('inputs: ', inputs);

  // //console.log('sender: ', sender);
  // const inputs = await apiClient.scanUTXOs({
  //   address: sender,
  //   fetchTxHex,
  // });
  // //console.log('inputsMaster Inputs: ', inputs);

  //TODO do this again
  // if (!validateAddress({ address: recipient, chain, apiClient })) {
  //   throw new Error('getInputsAndTargetOutputs Invalid address');
  // }

  //1. add output amount and recipient to targets
  //2. add output memo to targets (optional)

  return {
    inputs,
    outputs: [
      { address: recipient, value: Number(assetValue.bigIntValue) },
      ...(memo ? [{ address: '', script: compileMemo(memo), value: 0 }] : []),
    ],
  };
};

const buildTx = async ({
  assetValue,
  pubkeys,
  recipient,
  memo,
  feeRate,
  sender,
  isMax,
  fetchTxHex = false,
  apiClient,
  chain,
}: UTXOBuildTxParams): Promise<{
  psbt: Psbt;
  utxos: UTXOType[];
  inputs: UTXOType[];
}> => {
  let tag = TAG + ' | buildTx | ';
  const compiledMemo = memo ? compileMemo(memo) : null;

  console.log(tag, 'Checkpoint buildTx');
  console.log(tag, 'pubkeys: ', pubkeys);

  const inputsAndOutputs = await getInputsAndTargetOutputs({
    assetValue,
    pubkeys,
    recipient,
    memo,
    sender,
    fetchTxHex,
    apiClient,
    chain,
  });
  //Blockchairs Doge API recomendations are WAYY wrong
  if (chain === Chain.Dogecoin) feeRate = 100000;
  if (chain === Chain.BitcoinCash) feeRate = 100;
  //console.log('inputsAndOutputs: ', inputsAndOutputs);
  //console.log('coinSelect: ', coinSelect);
  //console.log('feeRate: ', feeRate);

  // Assuming inputsAndOutputs, feeRate, and isMax are defined elsewhere in your code
  let inputs: any[], outputs: any[];

  if (isMax) {
    //console.log('isMax: detected!');
    inputsAndOutputs.outputs = inputsAndOutputs.outputs
      .filter((output) => output.address !== undefined)
      .map((output) => {
        const newOutput = { ...output };
        delete newOutput.value;
        return newOutput;
      });
    //console.log('inputsAndOutputs: ', inputsAndOutputs);
    ({ inputs, outputs } = split.default(
      inputsAndOutputs.inputs,
      inputsAndOutputs.outputs,
      feeRate,
    ));
  } else {
    //console.log('isMax: not detected!');
    //const { inputs, outputs } = accumulative({ ...inputsAndOutputs, feeRate, chain });
    //({ inputs, outputs } = accumulative({ ...inputsAndOutputs, feeRate, chain }));

    ({ inputs, outputs } = coinSelect.default(
      inputsAndOutputs.inputs,
      inputsAndOutputs.outputs,
      feeRate,
    ));
  }

  //console.log('inputs: ', inputs);
  //console.log('outputs: ', outputs);

  // .inputs and .outputs will be undefined if no solution was found
  if (!inputs) {
    console.error(tag, '(DEBUG) pubkeys: ', pubkeys);
  }
  if (!inputs) throw new Error('0 inputs found for pubkeys: ' + pubkeys.length);
  if (!outputs) throw new Error('Invalid transaction outputs required!');
  const psbt = new Psbt({ network: getNetwork(chain) }); // Network-specific

  if (chain === Chain.Dogecoin) psbt.setMaximumFeeRate(650000000);

  let inputMap = new Map();
  inputs.forEach((utxo: UTXOType) => {
    console.log('utxo: ', utxo);
    const inputOptions: any = {
      hash: utxo.txid || utxo.hash,
      index: utxo.vout || utxo.index,
    };

    // Explicitly set Dogecoin transactions as non-SegWit.
    let isSegwit = false;
    if (chain === Chain.Bitcoin) isSegwit = true;

    if (isSegwit) {
      console.log('isSegwit: ', isSegwit);
      inputOptions.witnessUtxo = utxo.witnessUtxo;
    } else {
      console.log('not segwit: ', utxo);
      // For Dogecoin and non-SegWit transactions of other chains, use nonWitnessUtxo if available.
      if (utxo.txHex) {
        console.log('not txHex: ', utxo.txHex);
        inputOptions.nonWitnessUtxo = Buffer.from(utxo.txHex, 'hex');
      }
    }

    console.log('buildTx Checkpoint 1.5:');
    console.log('inputOptions: ', inputOptions);
    console.log('inputOptions: ', JSON.stringify(inputOptions));

    // Check for uniqueness in inputMap before adding
    if (inputOptions.hash && inputOptions.index) {
      const inputKey = `${inputOptions.hash}:${inputOptions.index}`;
      if (!inputMap.has(inputKey)) {
        psbt.addInput(inputOptions);
        inputMap.set(inputKey, true);
      }

      console.log('buildTx Checkpoint 2:');
    }
  });

  // inputs.forEach((utxo: UTXOType) => {
  //   const inputOptions: any = {
  //     hash: utxo.hash,
  //     index: utxo.index,
  //   };
  //
  //   // Explicitly set Dogecoin transactions as non-SegWit.
  //   let isSegwit = false;
  //   if (chain === Chain.Bitcoin) isSegwit = true;
  //
  //   if (isSegwit) {
  //     console.log('isSegwit: ', isSegwit);
  //     inputOptions.witnessUtxo = utxo.witnessUtxo;
  //   } else {
  //     console.log('not segwit: ', utxo);
  //     // For Dogecoin and non-SegWit transactions of other chains, use nonWitnessUtxo if available.
  //     if (utxo.txHex) {
  //       console.log('not txHex: ', utxo.txHex);
  //       inputOptions.nonWitnessUtxo = Buffer.from(utxo.txHex, 'hex');
  //     }
  //   }
  //   console.log('buildTx Checkpoint 1.5:');
  //   console.log('inputOptions: ', inputOptions);
  //   console.log('inputOptions: ', JSON.stringify(inputOptions));
  //   psbt.addInput(inputOptions);
  //   console.log(' buildTx Checkpoint 2:');
  // });

  // inputs.forEach((utxo: UTXOType) =>
  //   psbt.addInput({
  //     // @ts-ignore
  //     hash: utxo.hash,
  //     index: utxo.index,
  //     ...(!!utxo.witnessUtxo && chain !== Chain.Dogecoin && { witnessUtxo: utxo.witnessUtxo }),
  //     ...(chain === Chain.Dogecoin && {
  //       nonWitnessUtxo: utxo.txHex ? Buffer.from(utxo.txHex, 'hex') : undefined,
  //     }),
  //   }),
  // );

  console.log(tag, 'checkpoint: 3');
  outputs.forEach((output: any) => {
    console.log(tag, 'output: ', output);
    if (!output.address) {
      //an empty address means this is the change address
      output.address = sender; //TODO use new change address
    }
    if (!output.script) {
      psbt.addOutput(output);
    } else {
      //we need to add the compiled memo this way to
      //avoid dust error tx when accumulating memo output with 0 value
      if (compiledMemo) {
        psbt.addOutput({ script: compiledMemo, value: 0 });
      }
    }
  });

  return { psbt, utxos: inputsAndOutputs.inputs, inputs };
};

const getInputsOutputsFee = async ({
  assetValue,
  apiClient,
  chain,
  feeOptionKey = FeeOption.Fast,
  feeRate,
  fetchTxHex = false,
  memo,
  recipient,
  sender,
}: {
  assetValue: AssetValue;
  recipient: string;
  memo?: string;
  feeRate: number;
  sender: string;
  fetchTxHex?: boolean;
  apiClient: BlockchairApiType;
  chain: UTXOChain;
  feeOptionKey?: FeeOption;
  feeeRate?: number;
}) => {
  const inputsAndOutputs = await getInputsAndTargetOutputs({
    pubkeys,
    assetValue,
    recipient,
    memo,
    sender,
    fetchTxHex,
    apiClient,
    chain,
  });

  const feeRateWhole = feeRate ? Math.floor(feeRate) : (await getFeeRates(apiClient))[feeOptionKey];

  return accumulative({ ...inputsAndOutputs, feeRate: feeRateWhole, chain });
};

export const getInputsForPubkey = async function (pubkey: string, chain: Chain, apiKey: any) {
  try {
    const utxos = await apiClient.listUnspent({ pubkey, chain, apiKey });
    return utxos.map(transformInput);
  } catch (e) {
    console.error('Error getting inputs for pubkey', pubkey, e);
    throw e;
  }
};

export const estimateMaxSendableAmount = async ({
  pubkeys,
  feeRate,
  feeOptionKey = FeeOption.Fast,
  recipient,
  memo,
  chain,
  apiClient,
}: {
  pubkeys: any[];
  feeRate?: number;
  feeOptionKey?: FeeOption;
  recipient: string;
  memo?: string;
  chain: Chain;
  apiClient: any;
}): Promise<AssetValue> => {
  const tag = TAG + ' | EstimateMaxSendableAmount | ';

  try {
    let utxos = [];
    for (let pubkey of pubkeys) {
      const utxoSet = await apiClient.listUnspent({
        pubkey: pubkey.pubkey || pubkey.xpub || pubkey,
        chain,
        apiKey: apiClient.apiKey,
      });
      utxos = utxos.concat(utxoSet.map(transformInput));
    }
    if (utxos.length === 0) {
      //@ts-ignore
      return AssetValue.fromChainOrSignature(chain, 0);
    } else {
      let effectiveFeeRate = getDefaultTxFeeByChain(chain);

      // Start with the total balance of all UTXOs as the initial sendable amount
      let totalInputValue = utxos.reduce((acc, utxo) => acc + utxo.value, 0);

      let maxSendableValue = totalInputValue;
      let estimatedFee;
      let tryCount = 0;
      let success = false;

      // Try to find a viable spendable amount by reducing the sendable value until it works or a limit is reached
      while (!success && tryCount < 100) {
        // Prevent infinite loops
        const estimatedTxSize = utxos.length * 148 + 2 * 34 + 10; // Basic estimation, adjust as needed
        estimatedFee = estimatedTxSize * effectiveFeeRate;
        maxSendableValue = totalInputValue - estimatedFee;

        if (maxSendableValue <= 0) {
          throw new Error('Insufficient funds for transaction after accounting for fees');
        }

        // Simulate a transaction to check if the selection works
        const { inputs, outputs } = coinSelect.default(
          utxos,
          [{ address: recipient, value: maxSendableValue }],
          effectiveFeeRate,
        );

        if (inputs && outputs) {
          success = true; // A viable set of inputs and outputs was found
        } else {
          totalInputValue -= estimatedFee; // Reduce the total input value and try again
          tryCount++;
        }
      }

      if (!success) {
        throw new Error('Unable to find a viable transaction amount after multiple attempts');
      }

      console.log(
        tag,
        `Successfully estimated max sendable amount for chain ${chain}:`,
        maxSendableValue,
      );
      //@ts-ignore
      return AssetValue.fromChainOrSignature(chain, maxSendableValue / 100000000);
    }
  } catch (error) {
    console.error(`${TAG} Error estimating max sendable amount:`, error);
    throw error;
  }
};

// export const estimateMaxSendableAmount = async ({
//   pubkeys,
//   feeRate,
//   feeOptionKey = FeeOption.Fast,
//   recipient,
//   memo,
//   chain,
//   apiClient,
// }: {
//   pubkeys: any[];
//   feeRate?: number;
//   feeOptionKey?: FeeOption;
//   recipient: string;
//   memo?: string;
//   chain: Chain;
//   apiClient: any;
// }): Promise<AssetValue> => {
//   let utxos = [];
//   for (let pubkey of pubkeys) {
//     const utxoSet = await apiClient.listUnspent({
//       pubkey: pubkey.pubkey || pubkey.xpub || pubkey,
//       chain,
//       apiKey: apiClient.apiKey,
//     });
//     utxos = utxos.concat(utxoSet.map(transformInput));
//   }
//   if (utxos.length === 0) throw new Error('No UTXOs found for the provided pubkeys');
//
//   let effectiveFeeRate = getDefaultTxFeeByChain(chain);
//
//   // Start with the total balance of all UTXOs as the initial sendable amount
//   let totalInputValue = utxos.reduce((acc, utxo) => acc + utxo.value, 0);
//
//   let maxSendableValue = totalInputValue;
//   let estimatedFee;
//   let tryCount = 0;
//   let success = false;
//
//   // Try to find a viable sendable amount by reducing the sendable value until it works or a limit is reached
//   while (!success && tryCount < 100) {
//     // Prevent infinite loops
//     const estimatedTxSize = utxos.length * 148 + 2 * 34 + 10; // Basic estimation, adjust as needed
//     estimatedFee = estimatedTxSize * effectiveFeeRate;
//     maxSendableValue = totalInputValue - estimatedFee;
//
//     if (maxSendableValue <= 0) {
//       throw new Error('Insufficient funds for transaction after accounting for fees');
//     }
//
//     // Simulate a transaction to check if the selection works
//     const { inputs, outputs } = coinSelect.default(
//       utxos,
//       [{ address: recipient, value: maxSendableValue }],
//       effectiveFeeRate,
//     );
//
//     if (inputs && outputs) {
//       success = true; // A viable set of inputs and outputs was found
//     } else {
//       totalInputValue -= estimatedFee; // Reduce the total input value and try again
//       tryCount++;
//     }
//   }
//
//   if (!success) {
//     throw new Error('Unable to find a viable transaction amount after multiple attempts');
//   }
//
//   return AssetValue.fromChainOrSignature(chain, maxSendableValue / 100000000);
// };

export const BaseUTXOToolbox = (
  baseToolboxParams: UTXOBaseToolboxParams & { broadcastTx: (txHex: string) => Promise<string> },
) => ({
  accumulative,
  apiClient: baseToolboxParams.apiClient,
  broadcastTx: baseToolboxParams.broadcastTx,
  calculateTxSize,
  buildTx: (params: any) => buildTx({ ...params, ...baseToolboxParams }),
  getAddressFromKeys: (keys: ECPairInterface) => getAddressFromKeys({ keys, ...baseToolboxParams }),
  validateAddress: (address: string) => validateAddress({ address, ...baseToolboxParams }),

  createKeysForPath: (params: any) => createKeysForPath({ ...params, ...baseToolboxParams }),
  getInputsForPubkey: (pubkey: string) =>
    getInputsForPubkey(pubkey, baseToolboxParams.chain, baseToolboxParams.apiClient),
  getPrivateKeyFromMnemonic: async ({
    phrase,
    derivationPath,
  }: {
    phrase: string;
    derivationPath: string;
  }) => (await createKeysForPath({ phrase, derivationPath, ...baseToolboxParams })).toWIF(),

  getBalance: (pubkey: any) => getBalance({ pubkey, ...baseToolboxParams }),

  getFeeRates: () => getFeeRates(baseToolboxParams.apiClient),

  transfer: (params: any) => transfer({ ...params, ...baseToolboxParams }),

  getInputsOutputsFee: (params: any) => getInputsOutputsFee({ ...params, ...baseToolboxParams }),

  getFeeForTransaction: async (params: any) =>
    new SwapKitNumber({
      value: (await getInputsOutputsFee({ ...params, ...baseToolboxParams })).fee,
      decimal: 8,
    }),

  estimateMaxSendableAmount: async (params: any) =>
    estimateMaxSendableAmount({ ...params, ...baseToolboxParams }),
});
