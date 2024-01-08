import type { KeepKeySdk } from '@keepkey/keepkey-sdk';
import type { AssetValue } from '@swapkit/helpers';
import { derivationPathToString } from '@swapkit/helpers';
import type { BinanceToolboxType } from '@swapkit/toolbox-cosmos';
import { BinanceToolbox } from '@swapkit/toolbox-cosmos';
import type { DerivationPathArray, WalletTxParams } from '@swapkit/types';
import { Chain, ChainId, DerivationPath } from '@swapkit/types';

import { bip32ToAddressNList } from '../helpers/coins.ts';

export const binanceWalletMethods = async ({
  sdk,
  derivationPath,
}: {
  sdk: KeepKeySdk;
  derivationPath?: DerivationPathArray;
}): Promise<BinanceToolboxType & { getAddress: () => string }> => {
  try {
    const toolbox = BinanceToolbox();

    const derivationPathString = derivationPath
      ? `m/${derivationPathToString(derivationPath)}`
      : DerivationPath['BNB'];

    const { address: fromAddress } = (await sdk.address.binanceGetAddress({
      address_n: bip32ToAddressNList(derivationPathString),
    })) as { address: string };

    const transfer = async ({
      assetValue,
      recipient,
      memo,
    }: WalletTxParams & { assetValue: AssetValue }) => {
      try {
        const accountInfo = await toolbox.getAccount(fromAddress);
        const amount = assetValue.getBaseValue('string');
        const keepKeyResponse = await sdk.bnb.bnbSignTransaction({
          signerAddress: fromAddress,
          signDoc: {
            account_number: accountInfo?.account_number.toString() ?? '0',
            chain_id: ChainId.Binance,
            memo: memo || '',
            sequence: accountInfo?.sequence.toString() ?? '0',
            source: '0',
            msgs: [
              {
                outputs: [{ address: recipient, coins: [{ denom: Chain.Binance, amount }] }],
                inputs: [{ address: fromAddress, coins: [{ denom: Chain.Binance, amount }] }],
              },
            ],
          },
        });

        const broadcastResponse = await toolbox.sendRawTransaction(
          keepKeyResponse?.serialized,
          true,
        );
        return broadcastResponse?.[0]?.hash;
      } catch (e) {
        console.error(e);
      }
    };

    return { ...toolbox, getAddress: () => fromAddress, transfer };
  } catch (e) {
    console.error(e);
    throw e;
  }
};
