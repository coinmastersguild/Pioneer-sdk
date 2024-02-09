import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Flex,
  Text,
} from '@chakra-ui/react';
import { NetworkIdToChain } from '@coinmasters/types';
//@ts-ignore
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
//@ts-ignore
import React, { useEffect } from 'react';

import { usePioneer } from '../../context';

export default function Blockchains({ onSelect }: any) {
  const { state } = usePioneer();
  const { app } = state;
  // const { isOpen, onOpen, onClose: onModalClose } = useDisclosure();
  // const [selectedPubkey, setSelectedPubkey] = useState(null);

  useEffect(() => {
    if (app?.blockchains) {
      console.log('app?.blockchains: ', app?.blockchains);
    }
  }, [app, app?.blockchains]);
  // Function to group and sort blockchains
  const groupAndSortBlockchains = (blockchains: any) => {
    const UTXO = blockchains.filter((chain: any) => chain.startsWith('bip122:'));
    const EVM = blockchains.filter((chain: any) => chain.startsWith('eip155:'));
    const others = blockchains.filter(
      (chain: any) => !chain.startsWith('bip122:') && !chain.startsWith('eip155:'),
    );
    return { UTXO, EVM, others };
  };

  const { UTXO, EVM, others } = groupAndSortBlockchains(app?.blockchains || []);

  const renderChainCard = (chain: any) => (
    <Box borderRadius="lg" borderWidth="1px" textAlign="center">
      <Flex
        alignItems="center"
        bg="black"
        borderRadius="md"
        boxShadow="sm"
        justifyContent="space-between" // Adjusts the space between items
        padding={2}
        w="100%" // Ensures the Flex container takes full width
      >
        <Avatar src={`https://pioneers.dev/coins/${COIN_MAP_LONG[NetworkIdToChain[chain]]}.png`} />
        <Text fontWeight="bold" mt={2}>
          {chain}
        </Text>
        <Button mt={3} onClick={() => onSelect(chain)}>
          Select
        </Button>
      </Flex>
    </Box>
  );

  const renderAvatarGroup = (chains: any) => (
    <AvatarGroup max={3} size="md">
      {chains.map((chain: any) => (
        <Avatar
          key={chain}
          src={`https://pioneers.dev/coins/${COIN_MAP_LONG[NetworkIdToChain[chain]]}.png`}
        />
      ))}
    </AvatarGroup>
  );

  return (
    <div>
      <Accordion allowMultiple>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontWeight="bold">UTXO Chains</Text>
                {renderAvatarGroup(UTXO)}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Flex justify="center" wrap="wrap">
              {UTXO.map((chain: any) => renderChainCard(chain))}
            </Flex>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontWeight="bold">EVM Chains</Text>
                {renderAvatarGroup(EVM)}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Flex justify="center" wrap="wrap">
              {EVM.map((chain: any) => renderChainCard(chain))}
            </Flex>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontWeight="bold">Other Chains</Text>
                {renderAvatarGroup(others)}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Flex justify="center" wrap="wrap">
              {others.map((chain: any) => renderChainCard(chain))}
            </Flex>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
