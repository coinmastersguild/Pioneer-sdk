import { EIP155_CHAINS, EIP155_SIGNING_METHODS, TEIP155Chain } from '@/data/EIP155Data'
// import EIP155Lib from '@/lib/EIP155Lib'
// import { SmartAccountLib } from '@/lib/SmartAccountLib'
import { createOrRestoreEIP155Wallet, eip155Addresses, eip155Wallets } from '@/utils/EIP155WalletUtil';
import {
  getSignParamsMessage,
  getSignTypedDataParamsData,
  getWalletAddressFromParams
} from '@/utils/HelperUtil'
import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils'
import { SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { JsonRpcProvider } from 'ethers'
import { chains } from './SmartAccountUtils'
import { Hex } from 'viem'
import { Chain, allowedChains } from './SmartAccountUtils'
import SettingsStore from '@/store/SettingsStore'
type RequestEventArgs = Omit<SignClientTypes.EventArguments['session_request'], 'verifyContext'>
import useKeepKey from '@/hooks/useKeepKey'

export async function approveEIP155Request(requestEvent: RequestEventArgs) {
  const { params, id } = requestEvent
  const { chainId, request } = params

  console.log(requestEvent, chainId, "tests")

  SettingsStore.setActiveChainId(chainId)
  if(!eip155Wallets) {
    alert("Failed to init keepkey! restart app")
    throw Error("Failed to init keepkey! restart app")
  }
  // const wallet = await getWallet(params)

  switch (request.method) {
    case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
    case EIP155_SIGNING_METHODS.ETH_SIGN:
      try {
        // const message = getSignParamsMessage(request.params)
        // const signedMessage = await wallet.signMessage(message)
        // return formatJsonRpcResult(id, signedMessage)

        console.log("eip155Wallets: ",eip155Wallets)
        //KeepKey Mapping
        // console.log("signMessage: walletMethods: ",keepkey['ETH'].walletMethods)
        // const signedMessage = await keepkey['ETH'].walletMethods.signMessage(message)
        // console.log("signedMessage: ",signedMessage)

      } catch (error: any) {
        console.error(error)
        alert(error.message)
        return formatJsonRpcError(id, error.message)
      }

    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
      try {
        // const { domain, types, message: data, primaryType } = getSignTypedDataParamsData(request.params)
        // // https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
        // delete types.EIP712Domain
        // const signedData = await wallet._signTypedData(domain, types, data, primaryType)
        // return formatJsonRpcResult(id, signedData)

        console.log("eip155Wallets: ",eip155Wallets)

        // console.log("signTypedData: ",{domain, types, data, primaryType})
        // const signedMessage = await keepkey['ETH'].walletMethods.signTypedData(domain, types, data, primaryType)
        // console.log("signedMessage: ",signedMessage)

      } catch (error: any) {
        console.error(error)
        alert(error.message)
        return formatJsonRpcError(id, error.message)
      }

    case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
      try {
        console.log("eip155Wallets: ",eip155Wallets)
        console.log("chainId: ",chainId)
        console.log("rpc: ",EIP155_CHAINS[chainId as TEIP155Chain].rpc)


        const sendTransaction = request.params[0]

        // let rpcUrl = EIP155_CHAINS[chainId as TEIP155Chain].rpc
        // console.log('rpcUrl: ',rpcUrl)
        // // console.log("providers: ",providers)
        // const provider = new JsonRpcProvider(rpcUrl)
        // let nonce = await provider.getTransactionCount(sendTransaction.from,'pending')
        // console.log("nonce: ",nonce)
        // Use KeepKey's method to sign a transaction

        let chainidNum = parseInt(chainId.split(":")[1])
        console.log("chainidNum: ",chainidNum)
        sendTransaction.networkId = chainId
        sendTransaction.chainId = chainidNum
        // sendTransaction.provider = provider
        console.log("sendTransaction: ",sendTransaction)

        // const connectedWallet = await wallet.connect(provider)
        // const hash = await connectedWallet.sendTransaction(sendTransaction)

        //
        console.log("eip155Wallets: ",eip155Wallets)
        let wallets = Object.keys(eip155Wallets)
        console.log("wallets: ",wallets)
        //TODO handle multiple accounts
        let signedTx = await eip155Wallets[wallets[0]].signTransaction(sendTransaction)

        //broadcast
        let hash = ''
        try{
          let receipt = await eip155Wallets[wallets[0]].broadcastTransaction(signedTx, sendTransaction.networkId)
          console.log("receipt: ",receipt)
          return formatJsonRpcResult(id, receipt)
        }catch(e: any){
          alert("failed to broadcast! e: "+e.message)
        }

      } catch (error: any) {
        console.error(error)
        alert(error.message)
        return formatJsonRpcError(id, error.message)
      }

    case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
      try {
        const signTransaction = request.params[0]
        console.log("signTransaction: ",signTransaction)

        // const signature = await wallet.signTransaction(signTransaction)
        console.log("eip155Wallets: ",eip155Wallets)

        // const signature = await keepkey['ETH'].walletMethods.signTransaction(signTransaction)
        // console.log("signature: ",signature)


        // return formatJsonRpcResult(id, signature)
      } catch (error: any) {
        console.error(error)
        alert(error.message)
        return formatJsonRpcError(id, error.message)
      }

    default:
      throw new Error(getSdkError('INVALID_METHOD').message)
  }
}

export function rejectEIP155Request(request: RequestEventArgs) {
  const { id } = request

  return formatJsonRpcError(id, getSdkError('USER_REJECTED').message)
}
