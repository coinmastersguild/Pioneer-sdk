import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

import Path from '../../components/Path';
import { usePioneer } from '../../context';
import Basic from '..//Basic';
import Blockchains from '../Blockchains';

export default function Settings() {
  const { state } = usePioneer();
  const { app } = state;
  const { isOpen, onOpen, onClose: onModalClose } = useDisclosure();
  const [selectedPubkey, setSelectedPubkey] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState('');

  useEffect(() => {
    if (app?.blockchains) {
      console.log('app?.blockchains: ', app?.blockchains);
    }
  }, [app, app?.blockchains]);

  // const handlePubkeyClick = (pubkey) => {
  //   setSelectedPubkey(pubkey);
  //   onOpen();
  // };
  //
  // const handleCopy = (address) => {
  //   navigator.clipboard.writeText(address);
  //   setCopiedAddress(address);
  //   setTimeout(() => setCopiedAddress(''), 3000);
  // };

  const onSelect = (pubkey: any) => {
    console.log('pubkey: ', pubkey);
  };

  return (
    <div>
      <Tabs>
        <TabList>
          <Tab>Context</Tab>
          <Tab>blockchains</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Basic />
          </TabPanel>
          <TabPanel>
            <Blockchains onSelect={onSelect} />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Modal isOpen={isOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Pubkey Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPubkey && <Path onClose={onModalClose} path={selectedPubkey} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
