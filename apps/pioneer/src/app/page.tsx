"use client";
import { useEffect } from 'react';
import { ChakraProvider, useColorMode } from '@chakra-ui/react';
import { theme } from './styles/theme';
import { PioneerProvider, usePioneer } from './context';
import App from './app';

const ForceDarkMode = ({ children }: { children: React.ReactNode }) => {
  const { setColorMode } = useColorMode();

  useEffect(() => {
    setColorMode('dark');
  }, [setColorMode]);

  return <>{children}</>;
};

export default function Home() {

  return (
    <PioneerProvider>
      <ChakraProvider theme={theme}>
        <ForceDarkMode>
          <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <App></App>
          </main>
        </ForceDarkMode>
      </ChakraProvider>
    </PioneerProvider>
  );
}
