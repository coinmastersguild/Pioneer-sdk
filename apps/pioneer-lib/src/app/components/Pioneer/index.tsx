'use client';
import {
  Avatar,
  AvatarBadge,
  Box,
  Button,
  Card,
  CardBody,
  CircularProgress,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  Spacer,
  Stack,
  AvatarGroup,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FaCog, FaDownload, FaExchangeAlt, FaPaperPlane, FaRegMoneyBillAlt } from 'react-icons/fa';
import { availableChainsByWallet, ChainToNetworkId, getChainEnumValue, NetworkIdToChain } from '@coinmasters/types';
//@ts-ignore
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import AssetSelect from '../../components/AssetSelect';
import KeepKey from '../../components/KeepKey';
import Ledger from '../../components/Ledger';
import MetaMask from '../../components/MetaMask';
// import MiddleEllipsis from '../../components/MiddleEllipsis';
import Onboarding from '../../components/Onboarding';
import Portfolio from '../../components/Portfolio';
import Receive from '../../components/Receive';
import Settings from '../../components/Settings';
import Swap from '../../components/Swap';
import Transfer from '../../components/Transfer';
import {
  getWalletBadgeContent,
  getWalletContent,
  pioneerImagePng,
} from '../WalletIcon';
// import { usePioneer } from '@coinmasters/pioneer-react';


export interface PioneerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function Pioneer({ children, usePioneer }: any): JSX.Element {
  const { state, hideModal, resetState } = usePioneer();
  const { api, app, balances, context, openModal } = state;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isWalletPaired, setIsWalletPaired] = useState(false);
  const [showAllWallets, setShowAllWallets] = useState(false);
  const [modalShowClose, setModalShowClose] = useState(false);
  const [modalType, setModalType] = useState('');
  //const [pairedWallets, setPairedWallets] = useState([]);
  const [walletsAvailable, setWalletsAvailable] = useState([]);
  const [walletType, setWalletType] = useState('');
  const [pioneerImage, setPioneerImage] = useState('');
  // const [context, setContext] = useState('');
  const [isPioneer, setIsPioneer] = useState(false);
  const [isSwitchingWallet, setIsSwitchingWallet] = useState(false);



  useEffect(() => {
    if (openModal) {
      setModalType(openModal.toUpperCase());
      onOpen();
    } else {
      hideModal();
      onClose();
    }
  }, [openModal]);

  // Function to toggle the visibility of all wallets
  const toggleShowAllWallets = (e: any) => {
    e.stopPropagation();
    setShowAllWallets(!showAllWallets);
  };

  // start the context provider
  useEffect(() => {
    if (typeof window !== 'undefined') {

      let pioneerUrl = window.localStorage.getItem('pioneerUrl');
      if (balances.length === 0 && !pioneerUrl) {
        onOpen();
        setModalType('ONBOARDING');
      }
    }
  }, [balances]);

  useEffect(() => {
    if (context) {
      console.log('context: ', context);
      setWalletType(context.split(':')[0]);
    }
  }, [context, app]);

  useEffect(() => {
    if (context && app.isPioneer) {
      console.log('context: ', context);
      setWalletType(context.split(':')[0]);
      setPioneerImage(app.isPioneer);
    }
  }, [context, app, app?.isPioneer]);

  const handleWalletClick = async (wallet: string) => {
    setIsSwitchingWallet(true);
    resetState();

    //get cached wallets.
    // Retrieve and parse paired wallets
    // let pairedWallets = localStorage.getItem('pairedWallets');
    // if (pairedWallets) {
    //   pairedWallets = JSON.parse(pairedWallets);
    // } else {
    //   pairedWallets = [];
    // }
    // console.log('pairedWallets: ', pairedWallets);
    // //if type found in cache, use it.
    // const foundWallet = pairedWallets.find(pw => pw.toLowerCase().includes(wallet.toLowerCase()));
    // if (foundWallet && false) {
    //   console.log('Wallet found! foundWallet: ', foundWallet);
    //   //then load it.
    //   console.log('Loading from cache!');
    //   await app.setContext(foundWallet);
    //   //get wallet type
    //   const walletType = foundWallet.split(':')[0];
    //   console.log('walletType: ', walletType);
    //   //set blockchains
    //   let blockchainsForContext = availableChainsByWallet[walletType.toUpperCase()];
    //   let allByCaip = blockchainsForContext.map((chainStr) => {
    //     const chainEnum = getChainEnumValue(chainStr);
    //     return chainEnum ? ChainToNetworkId[chainEnum] : undefined;
    //   });
    //   console.log('allByCaip: ', allByCaip);
    //   await app.setBlockchains(allByCaip);
    //
    //   // balance cache
    //   let balanceCache: any = localStorage.getItem(foundWallet + ':balanceCache');
    //   balanceCache = balanceCache ? JSON.parse(balanceCache) : [];
    //   console.log('balanceCache: ', balanceCache);
    //   await app.loadBalanceCache(balanceCache);
    //
    //   // pubkey cache
    //   let pubkeyCache: any = localStorage.getItem(foundWallet + ':pubkeyCache');
    //   pubkeyCache = pubkeyCache ? JSON.parse(pubkeyCache) : [];
    //   console.log('pubkeyCache: ', pubkeyCache);
    //   await app.loadPubkeyCache(pubkeyCache);
    // }
    console.log('Wallet not found! needs to pair now!');
    //clear balances
    //clear pubkeys
    //clear context
    //clear blockchains
    onOpen();
    setWalletType(wallet);
    setModalType(wallet);
    setModalShowClose(false);
  };

  const renderWallets = () => {
    if (typeof window !== 'undefined') {

      const walletsToDisplay = showAllWallets
        ? walletsAvailable
        : walletsAvailable.filter((wallet: any) =>
          ['metamask', 'keepkey', 'ledger'].includes(wallet.type.toLowerCase()),
        );

      // Retrieve and parse paired wallets
      let pairedWallets: any = window.localStorage.getItem('pairedWallets');
      if (pairedWallets) {
        pairedWallets = JSON.parse(pairedWallets).map((pw: any) => pw.split(':')[0].toUpperCase());
      } else {
        pairedWallets = [];
      }

      return walletsToDisplay.map((wallet: any) => (
        <Card key={wallet.type} onClick={() => handleWalletClick(wallet.type)}>
          <CardBody>
            <Flex align="center" direction="column" justify="center">
              <Avatar m={2} size="md" src={wallet.icon}>
                {pairedWallets?.includes(wallet?.type?.toUpperCase()) ? (
                  <AvatarBadge bg="green.500" boxSize="1em" />
                ) : (
                  <AvatarBadge bg="red.500" boxSize="1em" />
                )}
              </Avatar>
            </Flex>
          </CardBody>
        </Card>
      ));
    }
  };

  const onStart = async function () {
    try {
      console.log('onStart');
      if (app && app.wallets) {
        setWalletsAvailable(app.wallets);
      }
      if (app && app.isPioneer) {
        console.log('app.isPioneer: ', app.isPioneer);
        setIsPioneer(true);
        setPioneerImage(app.isPioneer);
      }
      if (typeof window !== 'undefined') {
        const pioneerCache = window.localStorage.getItem('isPioneer');
        if (pioneerCache) {
          setIsPioneer(true);
          setPioneerImage(pioneerCache);
        }
      }

      if (balances && balances.length > 0) {
        console.log('balances: ', balances);
      }
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    onStart();
  }, [app, app?.wallets, app?.isPioneer]);

  const modalSelected = async function (modalType: string) {
    try {
      setModalType(modalType);
      onOpen();
    } catch (e) {
      console.error(e);
    }
  };

  const avatarContent = api ? (
    getWalletBadgeContent(walletType)
  ) : (
    <AvatarBadge bg="red.500" boxSize="1em">
      <CircularProgress isIndeterminate color="white" size="1em" />
    </AvatarBadge>
  );

  const closeModal = () => {
    onClose();
    hideModal();
  };

  return (
    <div>
      <Modal isOpen={isOpen} onClose={() => closeModal()} size="xl">
        <ModalOverlay />
        <ModalContent bg="black">
          <ModalHeader>{modalType}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* Render content based on modalType */}
            {modalType === 'KEEPKEY' && (
              <div>
                <KeepKey usePioneer={usePioneer} onClose={onClose} />
              </div>
            )}
            {modalType === 'METAMASK' && (
              <div>
                <MetaMask usePioneer={usePioneer} onClose={onClose} />
              </div>
            )}
            {modalType === 'LEDGER' && (
              <div>
                <Ledger usePioneer={usePioneer} />
              </div>
            )}
            {modalType === 'TRANSFER' && (
              <div>
                <Transfer usePioneer={usePioneer} />
              </div>
            )}
            {modalType === 'SELECT' && (
              <div>
                <AssetSelect usePioneer={usePioneer} onlyOwned onClose={onClose} />
              </div>
            )}
            {modalType === 'RECEIVE' && (
              <div>
                <Receive usePioneer={usePioneer}/>
              </div>
            )}
            {modalType === 'PORTFOLIO' && (
              <div>
                <Portfolio usePioneer={usePioneer}/>
              </div>
            )}
            {modalType === 'SWAP' && (
              <div>
                <Swap usePioneer={usePioneer}/>
              </div>
            )}
            {modalType === 'SETTINGS' && (
              <div>
                <Settings usePioneer={usePioneer}/>
              </div>
            )}
            {modalType === 'TREZOR' && <div>Trezor TODO</div>}
            {modalType === 'XDEFI' && <div>Xdefi TODO</div>}
            {modalType === 'ONBOARDING' && (
              <Onboarding
                usePioneer={usePioneer}
                onClose={onClose}
                setModalType={setModalType}
                setWalletType={setWalletType}
              />
            )}
          </ModalBody>
          <ModalFooter>
            {modalShowClose ? (
              <div>
                <Button colorScheme="blue" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : (
              <div />
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
      {!isWalletPaired ? (<>
        <Button onClick={onOpen} colorScheme="blue" borderRadius="full">
          Connect Wallet
        </Button>
      </>) : (<>
        <Menu>
          <MenuButton as={Button} cursor="pointer" minW={100} rounded="full" variant="link">
            <Avatar size="md">
              {isSwitchingWallet ? (
                <div>
                  <Box display="inline-block" position="relative">
                    <Avatar size="md" src={pioneerImage} />
                    <CircularProgress
                      isIndeterminate
                      color="green.500"
                      left="50%"
                      position="absolute"
                      size="1.25em"
                      top="50%"
                      transform="translate(-50%, -50%)"
                    />
                  </Box>
                </div>
              ) : (
                <div>
                  {isPioneer ? (
                    <Avatar size="md" src='/png/pioneer.png'>
                      {avatarContent}
                    </Avatar>
                  ) : (
                    <Avatar size="md" src='/png/pioneer.png'>
                      {avatarContent}
                    </Avatar>
                  )}
                </div>
              )}
            </Avatar>
          </MenuButton>
          <MenuList>
            <Box borderBottomWidth="1px" p="4">
              <Flex align="center" justify="space-between">
                {/*<Stack direction="row" spacing={-3} align="center">*/}
                {/*  <AvatarGroup size="md" max={4}>*/}
                {/*    {app?.blockchains.slice(0, 4).map((chain: any, index: any) => { // Limit to first 4 chains*/}

                {/*      // @ts-ignore*/}
                {/*      const chainKey = NetworkIdToChain[chain];*/}
                {/*      // @ts-ignore*/}
                {/*      const imageUrl = `https://pioneers.dev/coins/${COIN_MAP_LONG[chainKey] || 'pioneer'}.png`;*/}

                {/*      return (*/}
                {/*        <Avatar*/}
                {/*          key={index}*/}
                {/*          src={imageUrl}*/}
                {/*          name={chainKey} // Optional: Use the chainKey or another property for the avatar's tooltip*/}
                {/*          onClick={() => modalSelected('SETTINGS')}*/}
                {/*        />*/}
                {/*      );*/}
                {/*    })}*/}
                {/*    {app?.blockchains.length > 4 && ( // Conditionally render this if there are more than 4 chains*/}
                {/*      <Text pl="3" alignSelf="center">*/}
                {/*        +{app.blockchains.length - 4}*/}
                {/*      </Text>*/}
                {/*    )}*/}
                {/*  </AvatarGroup>*/}
                {/*</Stack>*/}
                <Spacer />
                <IconButton
                  isRound
                  aria-label="Settings"
                  icon={<FaCog />}
                  onClick={() => modalSelected('SETTINGS')}
                  size="md"
                />
              </Flex>
              {/*{app?.blockchains.length === 0 && <Text>No blockchains enabled.</Text>}*/}
            </Box>
            <Box
              borderRadius="md"
              borderWidth="1px"
              maxWidth="300px"
              p="4"
              textAlign="center"
              width="100%"
            >
              <Flex justify="space-around" wrap="wrap">
                {' '}
                {/* Flex container for the buttons */}
                {/* Portfolio Button */}
                <Flex align="center" direction="column" m={2}>
                  <IconButton
                    aria-label="Portfolio"
                    colorScheme="green"
                    icon={<FaRegMoneyBillAlt />}
                    onClick={() => modalSelected('PORTFOLIO')}
                    rounded="full"
                    size="lg"
                    variant="solid"
                  />
                  <Text fontSize="xs">Portfolio</Text>
                </Flex>
                {/* Send Button */}
                <Flex align="center" direction="column" m={2}>
                  <IconButton
                    aria-label="Send"
                    colorScheme="green"
                    icon={<FaPaperPlane />}
                    onClick={() => modalSelected('TRANSFER')}
                    rounded="full"
                    size="lg"
                    variant="solid"
                  />
                  <Text fontSize="xs">Send</Text>
                </Flex>
                {/* Receive Button */}
                <Flex align="center" direction="column" m={2}>
                  <IconButton
                    aria-label="Receive"
                    colorScheme="green"
                    icon={<FaDownload />}
                    onClick={() => modalSelected('RECEIVE')}
                    rounded="full"
                    size="lg"
                    variant="solid"
                  />
                  <Text fontSize="xs">Receive</Text>
                </Flex>
                {/* Swap Button */}
                {/*<Flex align="center" direction="column" m={2}>*/}
                {/*  <IconButton*/}
                {/*    aria-label="Swap"*/}
                {/*    colorScheme="green"*/}
                {/*    icon={<FaExchangeAlt />}*/}
                {/*    onClick={() => modalSelected('SWAP')}*/}
                {/*    rounded="full"*/}
                {/*    size="lg"*/}
                {/*    variant="solid"*/}
                {/*  />*/}
                {/*  <Text fontSize="xs">Swap</Text>*/}
                {/*</Flex>*/}
              </Flex>
            </Box>
            <MenuItem>
              <SimpleGrid columns={3} maxWidth="280px" row={1}>
                {renderWallets()}
                {/*<Text color="blue.500" cursor="pointer" fontSize="sm" onClick={toggleShowAllWallets}>*/}
                {/*  {showAllWallets ? 'Hide Wallets' : 'more'}*/}
                {/*</Text>*/}
              </SimpleGrid>
            </MenuItem>
          </MenuList>
        </Menu>
      </>)}

    </div>
  );
};

export default Pioneer;
