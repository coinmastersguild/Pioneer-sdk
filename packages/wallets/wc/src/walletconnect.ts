import type {
  BaseCosmosToolboxType,
  DepositParam,
  TransferParams,
} from '@coinmasters/toolbox-cosmos';
import { ApiUrl, Chain, ChainId, WalletOption } from '@coinmasters/types';
import type { StdSignDoc } from '@cosmjs/amino';
import type { TxBodyEncodeObject } from '@cosmjs/proto-signing';
import type { WalletConnectModalSign } from '@walletconnect/modal-sign-html';
import type { SessionTypes, SignClientTypes } from '@walletconnect/types';
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing.js';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';

import {
  DEFAULT_APP_METADATA,
  DEFAULT_COSMOS_METHODS,
  DEFAULT_LOGGER,
  DEFAULT_RELAY_URL,
  THORCHAIN_MAINNET_ID,
  WC_SUPPORTED_CHAINS,
} from './constants.ts';
import { getEVMSigner } from './evmSigner.ts';
import { chainToChainId, getAddressByChain } from './helpers.ts';
import { getRequiredNamespaces } from './namespaces.ts';

const THORCHAIN_GAS_FEE = '500000000';
const DEFAULT_THORCHAIN_FEE = {
  amount: [],
  gas: THORCHAIN_GAS_FEE,
};

const SUPPORTED_CHAINS = [
  // Chain.Binance, // Not supported by WC
  Chain.BinanceSmartChain,
  Chain.Ethereum,
  // Chain.THORChain,
  Chain.Avalanche,
  Chain.Arbitrum,
  Chain.Optimism,
  Chain.Polygon,
  // Chain.Mayachain,
  // Chain.Cosmos,
  // Chain.Kujira,
] as const;

const getToolbox = async ({
  chain,
  ethplorerApiKey,
  covalentApiKey = '',
  walletconnect,
  address,
  session,
}: {
  walletconnect: Walletconnect;
  session: SessionTypes.Struct;
  chain: (typeof SUPPORTED_CHAINS)[number];
  covalentApiKey?: string;
  ethplorerApiKey?: string;
  stagenet?: boolean;
  address: string;
}) => {
  const from = address;

  switch (chain) {
    case Chain.Avalanche:
    case Chain.BinanceSmartChain:
    case Chain.Arbitrum:
    case Chain.Optimism:
    case Chain.Polygon:
    case Chain.Ethereum: {
      if (chain === Chain.Ethereum && !ethplorerApiKey)
        throw new Error('Ethplorer API key not found');
      if (chain !== Chain.Ethereum && !covalentApiKey)
        throw new Error('Covalent API key not found');

      const { getProvider, getToolboxByChain } = await import(
        '@coinmasters/toolbox-evm'
      );

      const provider = getProvider(chain);
      const signer = await getEVMSigner({ walletconnect, chain, provider });
      const toolbox = await getToolboxByChain(chain);

      return toolbox({
        provider,
        signer,
        ethplorerApiKey: ethplorerApiKey as string,
        covalentApiKey,
      });
    }
    case Chain.THORChain: {
      const { getDenomWithChain, ThorchainToolbox } = await import('@coinmasters/toolbox-cosmos');
      const toolbox = ThorchainToolbox({ stagenet: false });

      const signRequest = (signDoc: StdSignDoc) =>
        walletconnect?.client.request({
          chainId: THORCHAIN_MAINNET_ID,
          topic: session.topic,
          request: {
            method: DEFAULT_COSMOS_METHODS.COSMOS_SIGN_AMINO,
            params: { signerAddress: address, signDoc },
          },
        });

      const transfer = async ({ assetValue, recipient, memo }: TransferParams) => {
        const account = await toolbox.getAccount(from);
        if (!account) throw new Error('Account not found');
        if (!account.pubkey) throw new Error('Account pubkey not found');
        const { accountNumber, sequence = 0 } = account;

        const sendCoinsMessage = {
          amount: [
            {
              amount: assetValue.getBaseValue('string'),
              denom: assetValue.symbol.toLowerCase(),
            },
          ],
          from_address: address,
          to_address: recipient,
        };

        const msg = {
          type: 'thorchain/MsgSend',
          value: sendCoinsMessage,
        };

        const { encodePubkey, makeAuthInfoBytes } = await import('@cosmjs/proto-signing');
        const { makeSignDoc } = await import('@cosmjs/amino');
        const { fromBase64 } = await import('@cosmjs/encoding');
        const { Int53 } = await import('@cosmjs/math');

        const signDoc = makeSignDoc(
          [msg],
          DEFAULT_THORCHAIN_FEE,
          ChainId.THORChain,
          memo,
          accountNumber?.toString(),
          sequence?.toString() || '0',
        );

        const signature: any = await signRequest(signDoc);

        const txObj = {
          msg: [msg],
          fee: DEFAULT_THORCHAIN_FEE,
          memo,
          signatures: [
            {
              // The request coming from TW Android are different from those coming from iOS.
              ...(typeof signature.signature === 'string' ? signature : signature.signature),
              sequence: sequence?.toString(),
            },
          ],
        };

        const aminoTypes = await toolbox.createDefaultAminoTypes();
        const registry = await toolbox.createDefaultRegistry();
        const signedTxBody: TxBodyEncodeObject = {
          typeUrl: '/cosmos.tx.v1beta1.TxBody',
          value: {
            messages: txObj.msg.map((msg) => aminoTypes.fromAmino(msg)),
            memo: txObj.memo,
          },
        };

        const signMode = SignMode.SIGN_MODE_LEGACY_AMINO_JSON;

        const signedTxBodyBytes = registry.encode(signedTxBody);
        const signedGasLimit = Int53.fromString(txObj.fee.gas).toNumber();
        const pubkey = encodePubkey(account.pubkey);
        const signedAuthInfoBytes = makeAuthInfoBytes(
          [{ pubkey, sequence }],
          txObj.fee.amount,
          signedGasLimit,
          undefined,
          undefined,
          signMode,
        );

        const txRaw = TxRaw.fromPartial({
          bodyBytes: signedTxBodyBytes,
          authInfoBytes: signedAuthInfoBytes,
          signatures: [
            fromBase64(
              typeof signature.signature === 'string'
                ? signature.signature
                : signature.signature.signature,
            ),
          ],
        });
        const txBytes = TxRaw.encode(txRaw).finish();

        const broadcaster = await createStargateClient(ApiUrl.ThornodeMainnet);
        const result = await broadcaster.broadcastTx(txBytes);
        return result.transactionHash;
      };

      const deposit = async ({ assetValue, memo }: DepositParam) => {
        const account = await toolbox.getAccount(address);
        if (!assetValue) throw new Error('invalid asset to deposit');
        if (!account) throw new Error('Account not found');
        if (!account.pubkey) throw new Error('Account pubkey not found');
        const { accountNumber, sequence = 0 } = account;

        const msg = {
          type: 'thorchain/MsgDeposit',
          value: {
            coins: [
              { amount: assetValue.getBaseValue('string'), asset: getDenomWithChain(assetValue) },
            ],
            memo,
            signer: address,
          },
        };

        const { makeSignDoc } = await import('@cosmjs/amino');
        const { fromBase64 } = await import('@cosmjs/encoding');
        const { Int53 } = await import('@cosmjs/math');
        const { encodePubkey, makeAuthInfoBytes } = await import('@cosmjs/proto-signing');

        const signDoc = makeSignDoc(
          [msg],
          DEFAULT_THORCHAIN_FEE,
          ChainId.THORChain,
          memo,
          accountNumber?.toString(),
          sequence?.toString() || '0',
        );

        const signature: any = await signRequest(signDoc);

        const txObj = {
          msg: [msg],
          fee: DEFAULT_THORCHAIN_FEE,
          memo,
          signatures: [
            {
              // The request coming from TW Android are different from those coming from iOS.
              ...(typeof signature.signature === 'string' ? signature : signature.signature),
              sequence: sequence?.toString(),
            },
          ],
        };

        const aminoTypes = await toolbox.createDefaultAminoTypes();
        const registry = await toolbox.createDefaultRegistry();
        const signedTxBody: TxBodyEncodeObject = {
          typeUrl: '/cosmos.tx.v1beta1.TxBody',
          value: {
            messages: txObj.msg.map((msg) => aminoTypes.fromAmino(msg)),
            memo: txObj.memo,
          },
        };

        const signMode = SignMode.SIGN_MODE_LEGACY_AMINO_JSON;

        const signedTxBodyBytes = registry.encode(signedTxBody);
        const signedGasLimit = Int53.fromString(txObj.fee.gas).toNumber();
        const pubkey = encodePubkey(account.pubkey);
        const signedAuthInfoBytes = makeAuthInfoBytes(
          [{ pubkey, sequence }],
          txObj.fee.amount,
          signedGasLimit,
          undefined,
          undefined,
          signMode,
        );

        const txRaw = TxRaw.fromPartial({
          bodyBytes: signedTxBodyBytes,
          authInfoBytes: signedAuthInfoBytes,
          signatures: [
            fromBase64(
              typeof signature.signature === 'string'
                ? signature.signature
                : signature.signature.signature,
            ),
          ],
        });
        const txBytes = TxRaw.encode(txRaw).finish();

        const broadcaster = await createStargateClient(ApiUrl.ThornodeMainnet);
        const result = await broadcaster.broadcastTx(txBytes);
        return result.transactionHash;
      };

      return { ...toolbox, transfer, deposit };
    }
    default:
      throw new Error('Chain is not supported');
  }
};

const getWalletconnect = async (
  chains: Chain[],
  walletConnectProjectId?: string,
  walletconnectOptions?: SignClientTypes.Options,
) => {
  const modal: WalletConnectModalSign | undefined = undefined;

  try {
    if (!walletConnectProjectId) {
      throw new Error('Error while setting up walletconnect connection: Project ID not specified');
    }
    console.log("chains", chains)
    const requiredNamespaces = getRequiredNamespaces(chains.map(chainToChainId));
    console.log("requiredNamespaces", requiredNamespaces)

    const { WalletConnectModalSign } = await import('@walletconnect/modal-sign-html');

    const client = new WalletConnectModalSign({
      logger: DEFAULT_LOGGER,
      relayUrl: DEFAULT_RELAY_URL,
      projectId: walletConnectProjectId,
      metadata: walletconnectOptions?.metadata || DEFAULT_APP_METADATA,
      ...walletconnectOptions?.core,
    });

    const oldSession = await client.getSession();

    // disconnect old Session cause we can't handle using it with current ui
    if (oldSession) {
      await client.disconnect({
        topic: oldSession.topic,
        reason: {
          code: 0,
          message: "Resetting session",
        },
      });
    }

    const session = await client.connect({
      requiredNamespaces,
    });

    const accounts = Object.values(session.namespaces)
      .map((namespace: any) => namespace.accounts)
      .flat();

    return { session, accounts, client };
  } catch (e) {
    console.error(e);
  } finally {
    if (modal) {
      modal.closeModal();
    }
  }
  return undefined;
};

export type Walletconnect = Awaited<ReturnType<typeof getWalletconnect>>;

const connectWalletconnect =
  ({
    addChain,
    config: { ethplorerApiKey, walletConnectProjectId, covalentApiKey, stagenet = false },
  }: {
    addChain: any;
    config: {
      covalentApiKey?: string;
      ethplorerApiKey?: string;
      walletConnectProjectId?: string;
      stagenet?: boolean;
    };
  }) =>
  async (
    chains: (typeof WC_SUPPORTED_CHAINS)[number][],
    walletconnectOptions?: SignClientTypes.Options,
  ) => {
    const chainsToConnect = chains.filter((chain) => WC_SUPPORTED_CHAINS.includes(chain));
    const walletconnect = await getWalletconnect(
      chainsToConnect,
      walletConnectProjectId,
      walletconnectOptions,
    );

    if (!walletconnect) throw new Error('Unable to establish connection through walletconnect');

    const { session, accounts } = walletconnect;

    const promises = chainsToConnect.map(async (chain) => {
      const address = getAddressByChain(chain, accounts);

      const toolbox = await getToolbox({
        session,
        address,
        chain,
        walletconnect,
        ethplorerApiKey,
        covalentApiKey,
        stagenet,
      });

      const getAccount = async (accountAddress: string) => {
        const account = await (toolbox as BaseCosmosToolboxType).getAccount(accountAddress);
        const [{ address, algo, pubkey }] = (await walletconnect?.client.request({
          chainId: THORCHAIN_MAINNET_ID,
          topic: session.topic,
          request: {
            method: DEFAULT_COSMOS_METHODS.COSMOS_GET_ACCOUNTS,
            params: {},
          },
        })) as [{ address: string; algo: string; pubkey: string }];

        return { ...account, address, pubkey: { type: algo, value: pubkey } };
      };

      addChain({
        chain,
        walletMethods: {
          ...toolbox,
          getAddress: () => address,
          getAccount:
            chain === Chain.THORChain ? getAccount : (toolbox as BaseCosmosToolboxType).getAccount,
        },
        wallet: { address, balance: [], walletType: WalletOption.WALLETCONNECT },
      });
      return;
    });

    await Promise.all(promises);

    return true;
  };

export const walletconnectWallet = {
  connectMethodName: 'connectWalletconnect' as const,
  connect: connectWalletconnect,
  isDetected: () => true,
};
