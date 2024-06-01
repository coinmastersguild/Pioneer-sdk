import { derivationPathToString } from '@pioneer-platform/helpers';
import { NetworkDerivationPath } from '@coinmasters/types';
// @ts-expect-error
import coininfo from 'coininfo';

import { UTXOLedgerInterface } from '../interfaces/LedgerInterfaces.ts';

export class DogecoinLedger extends UTXOLedgerInterface {
  constructor(paths) {
    super();
    this.paths = paths;
    this.additionalSignParams = { additionals: [], segwit: false, useTrustedInputForSegwit: false };
    this.addressNetwork = coininfo.dogecoin.main.toBitcoinJS();
    this.chain = 'doge';
    this.walletFormat = 'legacy';

    this.derivationPath = derivationPathToString(NetworkDerivationPath.DOGE);
  }
}
