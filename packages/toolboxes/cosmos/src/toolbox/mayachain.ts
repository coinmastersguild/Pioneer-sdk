import { AssetValue, RequestClient, SwapKitNumber } from '@coinmasters/helpers';
import { BaseDecimal, FeeOption } from '@coinmasters/types';

//https://pioneers.dev/api/v1/getAccountInfo/osmosis/
const PIONEER_API_URI = 'https://pioneers.dev';
// const PIONEER_API_URI = 'http://localhost:9001';
const TAG = ' | mayachain-toolbox | ';
const getAccount = (address: string): Promise<any> => {
  // Construct the URL
  const url = `${PIONEER_API_URI}/api/v1/getAccountInfo/mayachain/${address}`;

  // Log the URL
  //console.log(`Requesting URL: ${url}`);

  // Make the request
  return RequestClient.get<any>(url);
};

const getBalance = async (address: any) => {
  try {
    //console.log('Fetching balances for address:', address);
    //console.log('Fetching balances for address:', address[0].address);
    const balancesEndpoint = `${PIONEER_API_URI}/api/v1/ibc/balances/mayachain/${address[0].address}`;
    //console.log('URL:', balancesEndpoint);

    // Fetch the balances for maya and cacao
    const balances: any = await RequestClient.get(balancesEndpoint);
    //console.log('Balances:', balances);

    await AssetValue.loadStaticAssets();

    // Process each balance using AssetValue
    return balances.map((balance: any) => {
      const identifier = `MAYA.${balance.denom.toUpperCase()}`;
      const assetValue = AssetValue.fromStringSync(identifier, balance.amount.toString());
      //console.log(`Asset value for ${identifier}:`, assetValue);
      return assetValue;
    });
  } catch (e) {
    console.error('Error fetching balances:', e);
    return [];
  }
};

const sendRawTransaction = async (tx, sync = true) => {
  let tag = TAG + ' | sendRawTransaction | ';
  try {
    let output: any = {};
    // Construct payload
    let payload = {
      tx_bytes: tx,
      mode: sync ? 'BROADCAST_MODE_SYNC' : 'BROADCAST_MODE_ASYNC',
    };

    // Define the URL for broadcasting transactions
    //let urlRemote = `${RPCUrl.Mayachain}/cosmos/tx/v1beta1/txs`;
    let urlRemote = `https://mayanode.mayachain.info/cosmos/tx/v1beta1/txs`;
    //console.log(tag, 'urlRemote: ', urlRemote);

    // Sending the transaction using RequestClient
    let result = await RequestClient.post(urlRemote, {
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json', // Assuming JSON content type is required
      },
    });
    //console.log(tag, '** Broadcast ** REMOTE: result: ', result);

    // Handle the response
    if (result.tx_response.txhash) {
      output.txid = result.tx_response.txhash;
      output.success = true;
    } else {
      output.success = false;
      output.error = 'No txhash found in response';
    }
    return output;
  } catch (e) {
    //console.log(e);
    throw e;
  }
};

const getFees = async function () {
  let tag = TAG + ' | getFees | ';
  try {
    let fee: SwapKitNumber;
    let isThorchain = false;
    //console.log(tag, 'checkpoint');
    fee = new SwapKitNumber({ value: isThorchain ? 0.02 : 1, decimal: BaseDecimal['MAYA'] });

    return { [FeeOption.Average]: fee, [FeeOption.Fast]: fee, [FeeOption.Fastest]: fee };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// const getFees = async () => {
//   let fee: SwapKitNumber;
//   let isThorchain = false;
//
//   fee = new SwapKitNumber({ value: isThorchain ? 0.02 : 1, decimal: BaseDecimal['MAYA'] });
//
//   return { [FeeOption.Average]: fee, [FeeOption.Fast]: fee, [FeeOption.Fastest]: fee };
// };

export const MayachainToolbox = (): any => {
  return {
    // transfer: (params: TransferParams) => transfer(params),
    getAccount,
    getBalance,
    getFees,
    sendRawTransaction,
  };
};
