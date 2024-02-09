import {
  Avatar,
  Box,
  Button,
  Flex,
  Text,
  Badge,
  useClipboard,
  Table,
  Tbody,
  Tr,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from "@chakra-ui/react";
import QRCode from "qrcode.react";
import { useEffect, useState } from "react";
import { usePioneer } from "../../context";
import MiddleEllipsis from '../../components/MiddleEllipsis';
// @ts-ignore
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import OutputSelect from '../../components/OutputSelect';
import { getWalletBadgeContent } from '../WalletIcon';

export default function Receive({ onClose }: any) {
  const { state } = usePioneer();
  const { app, assetContext, balances, context } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletType, setWalletType] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const { hasCopied, onCopy } = useClipboard(assetContext?.address || '');

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
  };

  let onSelect = async function(asset: any) {
    console.log("onSelect: ", asset);
    await app.setAssetContext(asset);
    closeModal();
  }

  useEffect(() => {
    if (assetContext && COIN_MAP_LONG[assetContext.chain]) {
      const newAvatarUrl = `https://pioneers.dev/coins/${COIN_MAP_LONG[assetContext.chain]}.png`;
      setAvatarUrl(newAvatarUrl);
    }
  }, [assetContext]);

  useEffect(() => {
    if (context) {
      console.log('context: ', context);
      setWalletType(context.split(':')[0]);
    }
  }, [context, app]);

  return (
    <Box border="1px" borderColor="white" p={4}>
      <Flex align="center" justify="space-between" mb={4}>
        <Avatar size="xxl" src={avatarUrl}>
          {getWalletBadgeContent(walletType, '8em')}
        </Avatar>
        <Button onClick={openModal} colorScheme="blue">Change Asset</Button>
      </Flex>

      <Text fontSize="xl" fontWeight="bold">Receive</Text>
      <Table variant="simple">
        <Tbody>
          <Tr>
            <Td>Chain</Td>
            <Td><Badge>{assetContext?.chain}</Badge></Td>
          </Tr>
          <Tr>
            <Td>Ticker</Td>
            <Td><Badge>{assetContext?.ticker}</Badge></Td>
          </Tr>
          <Tr>
            <Td>CAIP</Td>
            <Td><MiddleEllipsis text={assetContext?.caip} /></Td>
          </Tr>
          <Tr>
            <Td>Address</Td>
            <Td fontWeight="bold"><MiddleEllipsis text={assetContext?.address} /></Td>
          </Tr>
        </Tbody>
      </Table>

      {assetContext?.address && (
        <Flex align="center" justify="center" my={4}>
          <QRCode value={assetContext.address} />
        </Flex>
      )}
      <Button onClick={onCopy}>{hasCopied ? 'Copied' : 'Copy Address'}</Button>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Output Selection</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <OutputSelect onClose={closeModal} onSelect={onSelect}/>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
