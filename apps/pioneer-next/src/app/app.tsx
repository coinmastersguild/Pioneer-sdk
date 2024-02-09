"use client";
import { usePioneer } from './context';
import { availableChainsByWallet, WalletOption } from '@coinmasters/types';
import Swap from './components/Swap'; // Assuming these are correctly implemented
import Pioneer from './components/Pioneer';
import Receive from './components/Receive';
import { useEffect } from 'react';
export default function App() {
  const { state, onStart } = usePioneer();

  let onStartApp = async function(){
    try{
      let walletsVerbose = []
      const { keepkeyWallet } = await import("@coinmasters/wallet-keepkey");
      console.log('keepkeyWallet: ', keepkeyWallet);

      const pioneerSetup: any = {
        appName: "Pioneer Template",
        appIcon: "https://pioneers.dev/coins/pioneerMan.png",
      };
      const walletKeepKey = {
        type: WalletOption.KEEPKEY,
        icon: "https://pioneers.dev/coins/keepkey.png",
        chains: availableChainsByWallet[WalletOption.KEEPKEY],
        wallet: keepkeyWallet,
        status: "offline",
        isConnected: false,
      };
      console.log('walletKeepKey: ', walletKeepKey);
      walletsVerbose.push(walletKeepKey);
      console.log('walletsVerbose: ', walletsVerbose);
      onStart(walletsVerbose, pioneerSetup);
    }catch(e){
      console.error("Failed to start app!")
    }
  }
  useEffect(() => {
    onStartApp();
  }, []);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Pioneer />
    </main>
  );
}
