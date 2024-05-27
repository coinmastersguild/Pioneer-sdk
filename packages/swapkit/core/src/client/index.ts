/*
    Core Swapkit


 */
import type { Keys, ThornameRegisterParam } from '@coinmasters/helpers';
import {
  AssetValue,
  gasFeeMultiplier,
  getMemoFor,
  getMinAmountByChain,
  SwapKitError,
  SwapKitNumber,
} from '@coinmasters/helpers';
import type { CosmosLikeToolbox } from '@coinmasters/toolbox-cosmos';
import type { AVAXToolbox, BSCToolbox, ETHToolbox, EVMToolbox } from '@coinmasters/toolbox-evm';
import type { UTXOToolbox } from '@coinmasters/toolbox-utxo';
import type {
  AddChainWalletParams,
  EVMChain,
  EVMWalletOptions,
  ExtendParams,
  WalletOption,
} from '@coinmasters/types';
import {
  Chain,
  ChainToChainId,
  classifySwap,
  FeeOption,
  MemoType,
  TCAvalancheDepositABI,
  TCBscDepositABI,
  TCEthereumVaultAbi,
} from '@coinmasters/types';
import { NetworkIdToChain } from '@pioneer-platform/pioneer-caip';

// import * as LoggerModule from "@pioneer-platform/loggerdog";
// const log = LoggerModule.default();
import type { AGG_CONTRACT_ADDRESS } from '../aggregator/contracts/index.ts';
import { lowercasedContractAbiMapping } from '../aggregator/contracts/index.ts';
import { getSwapInParams } from '../aggregator/getSwapParams.ts';

import { getExplorerAddressUrl, getExplorerTxUrl } from './explorerUrls.ts';
import { getInboundData, getMimirData } from './thornode.ts';
import type {
  CoreTxParams,
  EVMWallet,
  SwapParams,
  ThorchainWallet,
  Wallet,
  WalletMethods,
} from './types.ts';
const TAG = ' | CORE | ';

const getEmptyWalletStructure = () =>
  (Object.values(Chain) as Chain[]).reduce(
    (acc, chain) => {
      acc[chain] = null;
      return acc;
    },
    {} as Record<Chain, null>,
  );

const validateAddress = async ({
  chain,
  address,
}: {
  chain: Chain;
  address: string | undefined;
}) => {
  if (!address) return false;
  switch (chain) {
    case Chain.Bitcoin:
      if (address.startsWith('bc1p')) {
        return false;
      }
      return true;
    default:
      return true;
  }
};

export class SwapKitCore<T = ''> {
  public connectedChains: Wallet = getEmptyWalletStructure();
  public connectedWallets: WalletMethods = getEmptyWalletStructure();
  public readonly stagenet: boolean = false;

  constructor({ stagenet }: { stagenet?: boolean } | undefined = {}) {
    this.stagenet = !!stagenet;
  }

  getAddress = (chain: Chain) => this.connectedChains[chain]?.address || '';
  getExplorerTxUrl = (chain: Chain, txHash: string) => getExplorerTxUrl({ chain, txHash });
  getWallet = (chain: Chain) => this.connectedWallets[chain] as WalletMethods[Chain];
  getExplorerAddressUrl = (chain: Chain, address: string) =>
    getExplorerAddressUrl({ chain, address });
  getBalance = async (chain: Chain, potentialScamFilter?: boolean) => {
    const wallet = await this.getWalletByChain(chain, potentialScamFilter);

    return wallet?.balance || [];
  };

  swap = async ({ streamSwap, recipient, route, feeOptionKey }: SwapParams) => {
    const tag = TAG + ' | swap | ';
    console.log(tag, 'route: ', route);
    if (!route) throw new SwapKitError('core_swap_route_not_found');
    if (!route.meta && route.quote) route = route.quote;
    const { quoteMode } = route.meta;
    //console.log(tag, 'quoteMode: ', quoteMode);

    let evmChain;

    switch (quoteMode.split('-')[0]) {
      case 'ERC20':
        evmChain = Chain.Ethereum;
        break;
      case 'ARC20':
        evmChain = Chain.Avalanche;
        break;
      default:
        evmChain = Chain.BinanceSmartChain;
    }

    if (!route.complete) throw new SwapKitError('core_swap_route_not_complete');

    try {
      const swapType = classifySwap(quoteMode);
      console.log(tag, 'swapType: ', swapType);

      switch (swapType) {
        case 'AGG_SWAP': {
          const walletMethods = this.connectedWallets[evmChain];
          if (!walletMethods?.sendTransaction) {
            throw new SwapKitError('core_wallet_connection_not_found');
          }

          const transaction = streamSwap ? route?.streamingSwap?.transaction : route?.transaction;
          if (!transaction) throw new SwapKitError('core_swap_route_transaction_not_found');

          const { data, from, to, value } = route.transaction;

          const params = {
            data,
            from,
            to: to.toLowerCase(),
            chainId: BigInt(ChainToChainId[evmChain]),
            value: value ? BigInt(value) : 0n,
          };

          return walletMethods.sendTransaction(params, feeOptionKey) as Promise<string>;
        }

        case 'SWAP_OUT': {
          console.log('route: ', route);
          if (!route.calldata.fromAsset) throw new SwapKitError('core_swap_asset_not_recognized');
          const asset = await AssetValue.fromString(route.calldata.fromAsset);
          if (!asset) throw new SwapKitError('core_swap_asset_not_recognized');

          const { address: recipient } = await this.#getInboundDataByChain(asset.chain);
          const {
            contract: router,
            calldata: { expiration, amountIn, memo, memoStreamingSwap },
          } = route;

          const assetValue = asset.add(SwapKitNumber.fromBigInt(BigInt(amountIn), asset.decimal));
          const swapMemo = (streamSwap ? memoStreamingSwap || memo : memo) as string;

          return this.deposit({
            expiration,
            assetValue,
            memo: swapMemo,
            feeOptionKey,
            router,
            recipient,
          });
        }

        case 'SWAP_IN': {
          const { calldata, contract: contractAddress } = route;
          if (!contractAddress) throw new SwapKitError('core_swap_contract_not_found');

          const walletMethods = this.connectedWallets[evmChain];
          const from = this.getAddress(evmChain);
          if (!walletMethods?.sendTransaction || !from) {
            throw new SwapKitError('core_wallet_connection_not_found');
          }

          const { getProvider, toChecksumAddress } = await import('@coinmasters/toolbox-evm');
          // @ts-ignore
          const provider = getProvider(evmChain);
          const abi = lowercasedContractAbiMapping[contractAddress.toLowerCase()];

          if (!abi) throw new SwapKitError('core_swap_contract_not_supported', { contractAddress });

          const contract = await walletMethods.createContract?.(contractAddress, abi, provider);

          const tx = await contract.getFunction('swapIn').populateTransaction(
            ...getSwapInParams({
              streamSwap,
              toChecksumAddress,
              contractAddress: contractAddress as AGG_CONTRACT_ADDRESS,
              recipient,
              calldata,
            }),
            { from },
          );

          return walletMethods.sendTransaction(tx, feeOptionKey) as Promise<string>;
        }
        case 'OSMOSIS_SWAP': {
          //log.info(tag,"OSMOSIS_SWAP route: ",route)
          //log.info(tag,"OSMOSIS_SWAP route: ",JSON.stringify(route))
          /*
             Osmosis swaps are a bit different, they require 2 tx's. a osmo swap and an IBC transfer
           */
          return await this.performTx(route.txs[0]);
        }
        case 'UXTO_SWAP': {
          //console.log(tag, 'UXTO_SWAP route: ', route);
          //log.info(tag,"OSMOSIS_SWAP route: ",JSON.stringify(route))
          return await this.performTx(route.txs[0]);
        }
        case 'ETH_TO_ETH': {
          //Placeholder UNISWAP swaps
          console.log(' ETH_TO_ETH  Detected! ');
          // const walletMethods = this.connectedWallets[Chain.Ethereum];
          // console.log("walletMethods: ", walletMethods)
          // //Uniswap needs permit2
          // let permit2Sig = await walletMethods.signTypedData(route.txs[0].txParams);
          // console.log('permit2Sig: ', permit2Sig);
          // //get txData to sign and broadcast

          //broadcast

          //console.log('route: ', route);
          //perform
          return await this.performTx(route.txs[0]);
        }
        case 'MAYA_SUPPORTED_TO_MAYA_SUPPORTED': {
          //console.log(' MAYA  Detected! ');
          //console.log('route: ', route);
          //perform
          return await this.performTx(route.txs[0]);
        }
        case 'RANGO': {
          //console.log(' RANGO  Detected! ');
          //perform
          return await this.performTx(route.txs[0]);
        }
        case 'CENTRALIZED_SWAPPER': {
          //log.info(tag,"CENTRALIZED_SWAPPER route: ",route)
          /*
            Centralized swappers just need a normal tranfer into their deposit address
           */
          const from = this.getAddress(NetworkIdToChain[route.tx.chain]);
          //build assetValue
          // create assetValue
          const assetString = `${NetworkIdToChain[route.tx.chain]}.${
            NetworkIdToChain[route.tx.chain]
          }`; //TODO caip to identifier
          //console.log('assetString: ', assetString);
          await AssetValue.loadStaticAssets();
          // @ts-ignore
          const assetValue = await AssetValue.fromIdentifier(
            assetString,
            parseFloat(route.tx.txParams.amount),
          );
          if (!route.tx.txParams.memo && NetworkIdToChain[route.tx.chain] === 'XRP')
            throw Error('Dest tag is required for centralized swapper for XRP');
          let params = {
            from,
            assetValue,
            memo: route.tx.txParams.memo || '',
            recipient: route.tx.txParams.address,
          };
          let resultSend = await this.transfer(params);
          //log.info(tag,"CENTRALIZED_SWAPPER resultSend: ",resultSend)
          return resultSend;
        }
        default:
          throw new SwapKitError('core_swap_quote_mode_not_supported', { quoteMode });
      }
    } catch (error) {
      throw new SwapKitError('core_swap_transaction_error', error);
    }
  };

  performTx = async function (tx: any) {
    const tag = TAG + ' | performTx | ';
    try {
      //log.info(tag, "Transaction: ", tx);
      //console.log(tag, 'Transaction: ', tx);
      if (!tx.chain) throw Error('Invalid tx missing chain!');
      if (!tx.type) throw Error('Invalid tx missing type!');
      //console.log(tag, 'tx.type: ', tx.type);
      //console.log(tag, 'tx.chain: ', tx.chain);

      // @ts-ignore
      let chain = NetworkIdToChain[tx.chain];
      //console.log(tag, 'chain: ', chain);

      // let chain = tx.chain;
      if (!chain) throw Error(`Invalid tx unknown chain! ${chain}`);
      //console.log(tag, 'chain: ', chain);
      //log.info(tag, "chain: ", chain);
      //log.info(tag, "tx.type: ", tx.type);

      if (tx.type.toLowerCase() === 'evm') {
        //TODO do evm stuff
        //console.log(tag, 'EVM Transaction: ', tx);
        tx.type = 'sendTransaction';
      } else {
        let assetString = chain + '.' + tx.txParams.token;
        await AssetValue.loadStaticAssets();
        // @ts-ignore
        const assetValue = await AssetValue.fromIdentifier(
          assetString,
          parseFloat(tx.txParams.amount),
        );
        if (!tx.txParams.from) tx.txParams.from = tx.txParams.senderAddress;
        tx.txParams.assetValue = assetValue;
      }

      // @ts-ignore
      let walletMethods = this.connectedWallets[chain];
      if (!walletMethods || !walletMethods[tx.type]) {
        // @ts-ignore
        throw new SwapKitError(`core_wallet_tx_type_not_implemented for chain ${chain}`);
      }
      tx.txParams.recipient = tx.txParams.recipientAddress;

      //result
      tx.txParams.nonce = null;
      //console.log('tx.type: ', tx.type);
      //console.log('tx.txParams: ', tx.txParams);
      let result = await walletMethods[tx.type](tx.txParams);
      //console.log('result: ', result);
      return result;
    } catch (error) {
      // Handle or log the error as per requirement
      //log.error(tag, 'Error occurred:', error);
      // Optionally rethrow or handle the error
      console.error('error: ', error);
    }
  };

  getWalletByChain = async (chain: Chain, potentialScamFilter?: boolean) => {
    let tag = TAG + ' | getWalletByChain | ';
    try {
      //console.log(tag, 'start');
      const address = this.getAddress(chain);
      //console.log(tag, 'address: ', address);
      if (!address) return null;
      //console.log(tag, 'chain: ', chain);
      //console.log(tag, 'address: ', address);
      let pubkeys = [];
      if (this.getWallet(chain)?.getPubkeys) {
        pubkeys = await this.getWallet(chain)?.getPubkeys();
        //
        //console.log('pubkeys: ', pubkeys);
      }
      // let balance = [];
      //console.log(' getWalletByChain ' + chain + ': pubkeys: ', pubkeys);
      //for each pubkey iterate and sum the balance
      let balance: AssetValue[] = [];
      if (pubkeys.length === 0) {
        //get inputs
        //console.log(tag, 'Get balance for Address! address: ' + address);
        //console.log(tag, 'Get balance for Address! chain: ' + chain);
        //use address balance
        balance = await this.getWallet(chain)?.getBalance([{ address }]);
        //console.log(tag, 'balance: ' + balance);

        //console.log('Get balance for Address! chain: ' + chain);

        // for (let i = 0; i < balance.length; i++) {
        //   balance[i].address = address;
        // }
      } else {
        //console.log(tag, chain + ' pubkeys: ', pubkeys.length);
        /*
              Logic assumptions
                * Every pubkey will be a UTXO
                * every UXTO has only 1 asset balance (fungable)
                * we sum ALL balances of all pubkeys and return as 1 balance
                  (aka you have x amount bitcoin) as is commonly used in wallets

                Notes: we will only allow sending FROM 1 xpub at a time
                *so the MAX spendable is the balance of highest balance xpub.*

                blockbook has a wallet gap limit of 20
           */
        //use pubkey balances
        let balanceTotal = 0;
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < pubkeys.length; i++) {
          const pubkey = pubkeys[i];
          //console.log(tag, 'Get balance for xpub!');
          //console.log(tag, 'pubkey: ', pubkey);
          let pubkeyBalance: AssetValue[] = await this.getWallet(chain)?.getBalance([{ pubkey }]);
          //console.log(tag, 'NEW pubkeyBalance pre: ', pubkeyBalance);
          //console.log(
          //   tag,
          //   'NEW pubkeyBalance pubkeyBalance[0].decimal: ',
          //   pubkeyBalance[0].decimal,
          // );
          pubkeyBalance = pubkeyBalance[0].toFixed(pubkeyBalance[0].decimal);
          //console.log(tag, 'NEW pubkeyBalance post: ', pubkeyBalance);
          if (isNaN(pubkeyBalance)) {
            pubkeyBalance = 0;
          }
          //TODO get string balance
          pubkeys[i].balance = pubkeyBalance;
          //console.log(tag, 'pubkeyBalance: ', pubkeyBalance);
          //console.log(tag, 'pubkeyBalance: ', parseFloat(pubkeyBalance));
          balanceTotal += parseFloat(pubkeyBalance);
        }
        //console.log(tag, 'NEW balanceTotal: ', balanceTotal);
        // balanceTotal = balanceTotal / 100000000;
        let balanceValue = AssetValue.fromChainOrSignature(chain, balanceTotal);
        balanceValue.address = address;
        balance = [balanceValue];
      }
      //if inputs add inputs

      //if features (keepkey) add to object
      this.connectedChains[chain] = {
        address,
        pubkeys,
        balance,
        walletType: this.connectedChains[chain]?.walletType as WalletOption,
      };

      return { ...this.connectedChains[chain] };
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  approveAssetValue = (assetValue: AssetValue, contractAddress?: string) =>
    this.#approve({ assetValue, type: 'approve', contractAddress });

  isAssetValueApproved = (assetValue: AssetValue, contractAddress?: string) =>
    this.#approve<boolean>({ assetValue, contractAddress, type: 'checkOnly' });

  validateAddress = ({ address, chain }: { address: string; chain: Chain }) =>
    this.getWallet(chain)?.validateAddress?.(address);

  transfer = async (params: CoreTxParams & { router?: string }) => {
    let tag = TAG + ' | transfer | ';
    try {
      console.log(tag, 'params: ', params);
      const walletInstance = this.connectedWallets[params.assetValue.chain];
      if (!walletInstance) throw new SwapKitError('core_wallet_connection_not_found');
      let transferParams = await this.#prepareTxParams(params);
      console.log(tag, 'CORE transferParams: ', transferParams);
      return await walletInstance.transfer(transferParams);
    } catch (error) {
      throw new SwapKitError('core_transfer_transaction_error', error);
    }
  };
  // transfer = async (params: CoreTxParams & { router?: string }) => {
  //   const walletInstance = this.connectedWallets[params.assetValue.chain];
  //   if (!walletInstance) throw new SwapKitError('core_wallet_connection_not_found');
  //
  //   try {
  //     let transferParams = await this.#prepareTxParams(params);
  //     console.log(tag, 'CORE transferParams: ', transferParams);
  //     return await walletInstance.transfer(transferParams);
  //   } catch (error) {
  //     throw new SwapKitError('core_transfer_transaction_error', error);
  //   }
  // };

  deposit = async ({
    assetValue,
    recipient,
    router,
    ...rest
  }: CoreTxParams & { router?: string }) => {
    const { chain, symbol, ticker } = assetValue;
    const walletInstance = this.connectedWallets[chain];
    if (!(await validateAddress({ address: await walletInstance?.getAddress(), chain })))
      throw new SwapKitError('core_transaction_invalid_sender_address');
    if (!walletInstance) throw new SwapKitError('core_wallet_connection_not_found');

    const params = this.#prepareTxParams({ assetValue, recipient, router, ...rest });

    try {
      switch (chain) {
        case Chain.THORChain: {
          const wallet = walletInstance as ThorchainWallet;
          return await (recipient === '' ? wallet.deposit(params) : wallet.transfer(params));
        }

        case Chain.Ethereum:
        case Chain.BinanceSmartChain:
        case Chain.Avalanche: {
          const { getChecksumAddressFromAsset } = await import('@coinmasters/toolbox-evm');

          const abi =
            chain === Chain.Avalanche
              ? TCAvalancheDepositABI
              : chain === Chain.BinanceSmartChain
                ? TCBscDepositABI
                : TCEthereumVaultAbi;

          const response = await (
            walletInstance as EVMWallet<typeof AVAXToolbox | typeof ETHToolbox | typeof BSCToolbox>
          ).call({
            abi,
            contractAddress:
              router || ((await this.#getInboundDataByChain(chain as EVMChain)).router as string),
            funcName: 'depositWithExpiry',
            funcParams: [
              recipient,
              getChecksumAddressFromAsset({ chain, symbol, ticker }, chain),
              assetValue.getBaseValue('string'),
              params.memo,
              rest.expiration || parseInt(`${(new Date().getTime() + 15 * 60 * 1000) / 1000}`),
            ],
            txOverrides: {
              from: params.from,
              value: assetValue.isGasAsset ? assetValue.getBaseValue('bigint') : undefined,
            },
          });

          return response as string;
        }

        default: {
          return await walletInstance.transfer(params);
        }
      }
    } catch (error: any) {
      const errorMessage = (error?.message || error?.toString()).toLowerCase();
      const isInsufficientFunds = errorMessage?.includes('insufficient funds');
      const isGas = errorMessage?.includes('gas');
      const isServer = errorMessage?.includes('server');
      const errorKey: Keys = isInsufficientFunds
        ? 'core_transaction_deposit_insufficient_funds_error'
        : isGas
          ? 'core_transaction_deposit_gas_error'
          : isServer
            ? 'core_transaction_deposit_server_error'
            : 'core_transaction_deposit_error';

      throw new SwapKitError(errorKey, error);
    }
  };

  /**
   * TC related Methods
   */
  createLiquidity = async ({
    runeAssetValue,
    assetValue,
  }: {
    runeAssetValue: AssetValue;
    assetValue: AssetValue;
  }) => {
    if (runeAssetValue.lte(0) || assetValue.lte(0)) {
      throw new SwapKitError('core_transaction_create_liquidity_invalid_params');
    }

    let runeTx = '';
    let assetTx = '';

    try {
      runeTx = await this.#depositToPool({
        assetValue: runeAssetValue,
        memo: getMemoFor(MemoType.DEPOSIT, {
          ...assetValue,
          address: this.getAddress(assetValue.chain),
        }),
      });
    } catch (error) {
      throw new SwapKitError('core_transaction_create_liquidity_rune_error', error);
    }

    try {
      assetTx = await this.#depositToPool({
        assetValue,
        memo: getMemoFor(MemoType.DEPOSIT, {
          ...assetValue,
          address: this.getAddress(Chain.THORChain),
        }),
      });
    } catch (error) {
      throw new SwapKitError('core_transaction_create_liquidity_asset_error', error);
    }

    return { runeTx, assetTx };
  };

  addLiquidity = async ({
    runeAssetValue,
    assetValue,
    runeAddr,
    assetAddr,
    isPendingSymmAsset,
    mode = 'sym',
  }: {
    runeAssetValue: AssetValue;
    assetValue: AssetValue;
    isPendingSymmAsset?: boolean;
    runeAddr?: string;
    assetAddr?: string;
    mode?: 'sym' | 'rune' | 'asset';
  }) => {
    const { chain, symbol } = assetValue;
    const isSym = mode === 'sym';
    const runeTransfer = runeAssetValue?.gt(0) && (isSym || mode === 'rune');
    const assetTransfer = assetValue?.gt(0) && (isSym || mode === 'asset');
    const includeRuneAddress = isPendingSymmAsset || runeTransfer;
    const runeAddress = includeRuneAddress ? runeAddr || this.getAddress(Chain.THORChain) : '';
    const assetAddress = isSym || mode === 'asset' ? assetAddr || this.getAddress(chain) : '';

    if (!runeTransfer && !assetTransfer) {
      throw new SwapKitError('core_transaction_add_liquidity_invalid_params');
    }
    if (includeRuneAddress && !runeAddress) {
      throw new SwapKitError('core_transaction_add_liquidity_no_rune_address');
    }

    let runeTx, assetTx;

    if (runeTransfer && runeAssetValue) {
      try {
        runeTx = await this.#depositToPool({
          assetValue: runeAssetValue,
          memo: getMemoFor(MemoType.DEPOSIT, { chain, symbol, address: assetAddress }),
        });
      } catch (error) {
        throw new SwapKitError('core_transaction_add_liquidity_rune_error', error);
      }
    }

    if (assetTransfer && assetValue) {
      try {
        assetTx = await this.#depositToPool({
          assetValue,
          memo: getMemoFor(MemoType.DEPOSIT, { chain, symbol, address: runeAddress }),
        });
      } catch (error) {
        throw new SwapKitError('core_transaction_add_liquidity_asset_error', error);
      }
    }

    return { runeTx, assetTx };
  };

  addLiquidityPart = ({
    assetValue,
    poolAddress,
    address,
    symmetric,
  }: {
    assetValue: AssetValue;
    address?: string;
    poolAddress: string;
    symmetric: boolean;
  }) => {
    if (symmetric && !address) {
      throw new SwapKitError('core_transaction_add_liquidity_invalid_params');
    }
    const addressString = symmetric ? address || '' : '';

    return this.#depositToPool({ assetValue, memo: `+:${poolAddress}:${addressString}:t:0` });
  };

  withdraw = async ({
    memo,
    assetValue,
    percent,
    from,
    to,
  }: {
    memo?: string;
    assetValue: AssetValue;
    percent: number;
    from: 'sym' | 'rune' | 'asset';
    to: 'sym' | 'rune' | 'asset';
  }) => {
    const targetAsset =
      to === 'rune'
        ? AssetValue.fromChainOrSignature(Chain.THORChain)
        : (from === 'sym' && to === 'sym') || from === 'rune' || from === 'asset'
          ? undefined
          : assetValue;

    const value = getMinAmountByChain(from === 'asset' ? assetValue.chain : Chain.THORChain);
    const memoString =
      memo ||
      getMemoFor(MemoType.WITHDRAW, {
        symbol: assetValue.symbol,
        chain: assetValue.chain,
        ticker: assetValue.ticker,
        basisPoints: Math.max(10000, Math.round(percent * 100)),
        targetAssetString: targetAsset?.toString(),
        singleSide: false,
      });

    return this.#depositToPool({ assetValue: value, memo: memoString });
  };

  savings = async ({
    assetValue,
    memo,
    percent,
    type,
  }: { assetValue: AssetValue; memo?: string } & (
    | { type: 'add'; percent?: undefined }
    | { type: 'withdraw'; percent: number }
  )) => {
    const memoType = type === 'add' ? MemoType.DEPOSIT : MemoType.WITHDRAW;
    const memoString =
      memo ||
      getMemoFor(memoType, {
        ticker: assetValue.ticker,
        symbol: assetValue.symbol,
        chain: assetValue.chain,
        singleSide: true,
        basisPoints: percent ? Math.min(10000, Math.round(percent * 100)) : undefined,
      });

    const value =
      memoType === MemoType.DEPOSIT ? assetValue : getMinAmountByChain(assetValue.chain);

    return this.#depositToPool({ memo: memoString, assetValue: value });
  };

  loan = ({
    assetValue,
    memo,
    minAmount,
    type,
  }: {
    assetValue: AssetValue;
    memo?: string;
    minAmount: AssetValue;
    type: 'open' | 'close';
  }) =>
    this.#depositToPool({
      assetValue,
      memo:
        memo ||
        getMemoFor(type === 'open' ? MemoType.OPEN_LOAN : MemoType.CLOSE_LOAN, {
          asset: assetValue.toString(),
          minAmount: minAmount.toString(),
          address: this.getAddress(assetValue.chain),
        }),
    });

  nodeAction = ({
    type,
    assetValue,
    address,
  }: { address: string } & (
    | { type: 'bond' | 'unbond'; assetValue: AssetValue }
    | { type: 'leave'; assetValue?: undefined }
  )) => {
    const memoType =
      type === 'bond' ? MemoType.BOND : type === 'unbond' ? MemoType.UNBOND : MemoType.LEAVE;
    const memo = getMemoFor(memoType, {
      address,
      unbondAmount: type === 'unbond' ? assetValue.getBaseValue('number') : undefined,
    });

    return this.#thorchainTransfer({
      memo,
      assetValue: type === 'bond' ? assetValue : getMinAmountByChain(Chain.THORChain),
    });
  };

  registerThorname = ({
    assetValue,
    ...param
  }: ThornameRegisterParam & { assetValue: AssetValue }) =>
    this.#thorchainTransfer({ assetValue, memo: getMemoFor(MemoType.THORNAME_REGISTER, param) });

  extend = ({ wallets, config, apis = {}, rpcUrls = {} }: ExtendParams<T>) => {
    try {
      wallets.forEach((wallet) => {
        // @ts-expect-error - this is fine as we are extending the class
        this[wallet.connectMethodName] = wallet.connect({
          addChain: this.#addConnectedChain,
          config: config || {},
          apis,
          rpcUrls,
        });
      });
    } catch (error) {
      throw new SwapKitError('core_extend_error', error);
    }
  };

  estimateMaxSendableAmount = async ({
    chain,
    params,
  }: {
    chain: Chain;
    params: any;
    // params: { from: string; recipient: string; assetValue: AssetValue };
  }) => {
    const walletMethods = this.getWallet<typeof chain>(chain);

    switch (chain) {
      case Chain.Arbitrum:
      case Chain.Avalanche:
      case Chain.BinanceSmartChain:
      case Chain.Base:
      case Chain.Ethereum:
      case Chain.Optimism:
      case Chain.Polygon: {
        const { estimateMaxSendableAmount } = await import('@coinmasters/toolbox-evm');
        return estimateMaxSendableAmount({
          ...params,
          toolbox: walletMethods as EVMToolbox,
        });
      }

      case Chain.Bitcoin:
      case Chain.BitcoinCash:
      case Chain.Dogecoin:
      case Chain.Dash:
      case Chain.Zcash:
      case Chain.Litecoin:
        return (walletMethods as UTXOToolbox).estimateMaxSendableAmount(params);

      case Chain.Binance:
      case Chain.Mayachain:
      case Chain.THORChain:
      case Chain.Cosmos: {
        const { estimateMaxSendableAmount } = await import('@coinmasters/toolbox-cosmos');
        return estimateMaxSendableAmount({
          ...params,
          toolbox: walletMethods as CosmosLikeToolbox,
        });
      }

      default:
        throw new SwapKitError('core_estimated_max_spendable_chain_not_supported');
    }
  };

  /**
   * Wallet connection methods
   */
  connectXDEFI = async (_chains: Chain[]): Promise<void> => {
    throw new SwapKitError('core_wallet_xdefi_not_installed');
  };
  connectEVMWallet = async (_chains: Chain[] | Chain, _wallet: EVMWalletOptions): Promise<void> => {
    throw new SwapKitError('core_wallet_evmwallet_not_installed');
  };
  connectWalletconnect = async (_chains: Chain[], _options?: any): Promise<void> => {
    throw new SwapKitError('core_wallet_walletconnect_not_installed');
  };
  connectKeystore = async (_chains: Chain[], _phrase: string): Promise<void> => {
    throw new SwapKitError('core_wallet_keystore_not_installed');
  };
  connectKeepkey = async (_chains: Chain[], paths: any): Promise<string> => {
    throw new SwapKitError('core_wallet_keepkey_not_installed');
  };
  connectLedger = async (_chains: Chain, _derivationPath: number[]): Promise<void> => {
    throw new SwapKitError('core_wallet_ledger_not_installed');
  };
  connectTrezor = async (_chains: Chain, _derivationPath: number[]): Promise<void> => {
    throw new SwapKitError('core_wallet_trezor_not_installed');
  };
  connectKeplr = async (_chain: Chain): Promise<void> => {
    throw new SwapKitError('core_wallet_keplr_not_installed');
  };
  connectOkx = async (_chains: Chain[]): Promise<void> => {
    throw new SwapKitError('core_wallet_okx_not_installed');
  };
  disconnectChain = (chain: Chain) => {
    this.connectedChains[chain] = null;
    this.connectedWallets[chain] = null;
  };

  #getInboundDataByChain = async (chain: Chain) => {
    //console.log('getInboundDataByChain: ', chain);
    if (chain === Chain.THORChain) {
      return {
        gas_rate: '0',
        router: '0',
        address: '',
        halted: false,
        chain: Chain.THORChain,
      };
    }
    const inboundData = await getInboundData(this.stagenet);
    //console.log('inboundData: ', inboundData);
    const chainAddressData = inboundData.find((item) => item.chain === chain);

    if (!chainAddressData) throw new SwapKitError('core_inbound_data_not_found');
    if (chainAddressData?.halted) throw new SwapKitError('core_chain_halted');

    return chainAddressData;
  };

  #addConnectedChain = ({ chain, wallet, walletMethods }: AddChainWalletParams) => {
    this.connectedChains[chain] = wallet;
    this.connectedWallets[chain] = walletMethods;
  };

  #approve = async <T = string>({
    assetValue,
    type = 'checkOnly',
    contractAddress,
  }: {
    assetValue: AssetValue;
    type?: 'checkOnly' | 'approve';
    contractAddress?: string;
  }) => {
    const { address, chain, isGasAsset, isSynthetic } = assetValue;
    const isEVMChain = [Chain.Ethereum, Chain.Avalanche, Chain.BinanceSmartChain].includes(chain);
    const isNativeEVM = isEVMChain && isGasAsset;

    if (isNativeEVM || !isEVMChain || isSynthetic) return true;

    const walletMethods = this.connectedWallets[chain as EVMChain];
    const walletAction = type === 'checkOnly' ? walletMethods?.isApproved : walletMethods?.approve;

    if (!walletAction) throw new SwapKitError('core_wallet_connection_not_found');

    const from = this.getAddress(chain);

    if (!address || !from) throw new SwapKitError('core_approve_asset_address_or_from_not_found');

    const spenderAddress =
      contractAddress || ((await this.#getInboundDataByChain(chain)).router as string);

    return walletAction({
      amount: assetValue.getBaseValue('bigint'),
      assetAddress: address,
      from,
      spenderAddress,
    }) as Promise<T>;
  };

  #depositToPool = async ({
    assetValue,
    memo,
    feeOptionKey = FeeOption.Fast,
  }: {
    assetValue: AssetValue;
    memo: string;
    feeOptionKey?: FeeOption;
  }) => {
    //console.log('depositToPool: chain: ', assetValue.chain);
    //console.log('memo: ', memo);
    const {
      gas_rate,
      router,
      address: poolAddress,
    } = await this.#getInboundDataByChain(assetValue.chain);

    const feeRate = (parseInt(gas_rate) || 0) * gasFeeMultiplier[feeOptionKey];

    return this.deposit({
      assetValue,
      recipient: poolAddress,
      memo,
      router,
      feeRate,
    });
  };

  #thorchainTransfer = async ({ memo, assetValue }: { assetValue: AssetValue; memo: string }) => {
    const mimir = await getMimirData(this.stagenet);

    // check if trading is halted or not
    if (mimir['HALTCHAINGLOBAL'] >= 1 || mimir['HALTTHORCHAIN'] >= 1) {
      throw new SwapKitError('core_chain_halted');
    }

    return this.deposit({ assetValue, recipient: '', memo });
  };

  #prepareTxParams = ({ assetValue, ...restTxParams }: CoreTxParams & { router?: string }) => ({
    ...restTxParams,
    memo: restTxParams.memo || '',
    from: this.getAddress(assetValue.chain),
    assetValue,
  });
}
