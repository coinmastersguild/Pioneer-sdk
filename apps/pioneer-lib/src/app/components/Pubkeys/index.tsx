import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Flex,
  IconButton,
  useClipboard,
} from '@chakra-ui/react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
import Pubkey from '../../components/Pubkey'; // Adjust the import path as needed
import { getWalletContent } from '../../components/WalletIcon';

export default function Pubkeys({usePioneer}:any) {
  const { state } = usePioneer();
  const { app } = state;
  const { isOpen, onOpen, onClose: onModalClose } = useDisclosure();
  const [selectedPubkey, setSelectedPubkey] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState('');

  useEffect(() => {
    if (app?.pubkeys) {
      //console.log('app?.pubkeys: ', app?.pubkeys);
    }
  }, [app, app?.pubkeys]);

  const handlePubkeyClick = (pubkey: any) => {
    setSelectedPubkey(pubkey);
    onOpen();
  };

  const handleCopy = (address: any) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(''), 3000);
  };

  return (
    <div>
      {app?.pubkeys?.map((key: any, index: any) => (
        <Flex key={index} p={4} borderWidth="1px" borderRadius="lg" alignItems="center" justifyContent="space-between">
          <Box>
            <Text fontWeight="bold">caip: {key.networkId}</Text>
            <Text fontWeight="bold">address: {key.address}</Text>
            <Text fontWeight="bold">pubkey: {key.pubkey}</Text>
            {getWalletContent(key.context.split(':')[0])}
          </Box>
          <Box>
            <Text fontWeight="bold">{key.type}</Text>
          </Box>
          <Flex alignItems="center">
            <IconButton
              icon={copiedAddress === key.address ? <CheckIcon /> : <CopyIcon />}
              onClick={() => handleCopy(key.address)}
              aria-label="Copy address"
              mr={2}
            />
            <Button onClick={() => handlePubkeyClick(key)}>Select</Button>
          </Flex>
        </Flex>
      ))}

      <Modal isOpen={isOpen} onClose={onModalClose} size={'xxl'}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Pubkey Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPubkey && <Pubkey pubkey={selectedPubkey} onClose={onModalClose} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
