import {
  ChevronLeftIcon,
  RepeatIcon,
  AddIcon,
  SettingsIcon,
} from '@chakra-ui/icons';
import {
  Image,
  Avatar,
  Card,
  Box,
  Button,
  Flex,
  Text,
  Spinner,
  IconButton,
  Stack,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Badge,
  Link,
  HStack,
  Switch,
  useDisclosure,
} from '@chakra-ui/react';
import { getPaths } from '@pioneer-platform/pioneer-coins';
import React, { useEffect, useState } from 'react';
import { Blockchains } from '../Blockchains';
import Context from '../Context';
import { Asset } from '../Asset';

export function Classic({ usePioneer }: any) {
  const { state, connectWallet } = usePioneer();
  const { app, assets, blockchains } = state;
  const [assetContext, setAssetContext] = useState(app?.assetContext);
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();
  const {
    isOpen: isAddAssetOpen,
    onOpen: onAddAssetOpen,
    onClose: onAddAssetClose,
  } = useDisclosure();

  let onStart = async function () {
    if (app && app.pairWallet && !isConnecting) {
      console.log('App loaded... connecting');
      await connectWallet('KEEPKEY');
      setIsConnecting(true);

      await app.getPubkeys();
      await app.getBalances();
    } else {
      console.log('App not loaded yet... can not connect');
    }
  };

  useEffect(() => {
    onStart();
  }, [app, app?.assetContext, assets]);

  useEffect(() => {
    setAssetContext(app?.assetContext);
  }, [app, app?.assetContext]);

  const onSelect = (asset: any) => {
    console.log("onSelect", asset);
    if (asset.caip) {
      app.setAssetContext(asset);
    } else {
      console.error('invalid asset', asset);
    }
  };

  const onClose = async () => {
    console.log("onClose");
    await app?.setAssetContext(null);
    console.log('app.assetContext', app?.assetContext);
    setAssetContext(null);
  };

  const onRefresh = async () => {
    console.log("onRefresh");
    if (app) {
      console.log("blockchains", app.blockchains);
      let paths = getPaths(app.blockchains);
      console.log("paths", paths);
      await app.setPaths(paths);
      await app.getAssets();
      await app.getPubkeys();
      await app.getBalances();
      console.log('assetsMap: ', app.assetsMap);
      console.log("assets: ", assets);
    }
  };

  const onAdd = () => {
    onAddAssetOpen();
  };

  const formatBalance = (balance: string) => {
    // console.log("balance: ", balance);
    const [integer, decimal] = balance.split('.');
    const largePart = decimal?.slice(0, 4);
    const smallPart = decimal?.slice(4, 8);
    return { integer, largePart, smallPart };
  };
  console.log('assets: ', assets);
  const sortedAssets = [...assets.values()]
    .filter(asset => asset.type === 'native' && app.blockchains.includes(asset.networkId))
    .sort((a: any, b: any) => {
      const balanceA = app.balances.find((balance: any) => balance.caip === a.caip);
      const balanceB = app.balances.find((balance: any) => balance.caip === b.caip);

      const valueUsdA = balanceA?.valueUsd || 0;
      const valueUsdB = balanceB?.valueUsd || 0;

      if (valueUsdA === 0) return 1;
      if (valueUsdB === 0) return -1;
      return valueUsdB - valueUsdA;
    });

  const formatUsd = (valueUsd:any) => {
    if (valueUsd == null) return null;
    return valueUsd.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Flex direction="column" width="100%" height="100vh" overflow="hidden">
      <Flex alignItems="center" p={4} borderBottom="1px solid #ccc" width="100%">
        {assetContext ? (
          <IconButton
            icon={<ChevronLeftIcon />}
            aria-label="Go back"
            onClick={onClose}
          />
        ) : (
          <IconButton
            icon={<SettingsIcon />}
            aria-label="Settings"
            onClick={onSettingsOpen}
          />
        )}
        <Context usePioneer={usePioneer} setAssetContext={setAssetContext}></Context>
        <IconButton
          icon={<RepeatIcon />}
          aria-label="Refresh"
          onClick={onRefresh}
          ml="auto"
        />
      </Flex>
      <Flex flex="1" overflowY="auto" width="100%">
        <Stack width="100%">
          {assetContext ? (
            <Asset usePioneer={usePioneer} onClose={onClose} asset={app?.assetContext} />
          ) : (
            <>
              {!assets || assets.size === 0 ? (
                <Flex justifyContent="center" alignItems="center" width="100%">
                  <Spinner size="xl" />
                  blockchains{app?.blockchains?.length}
                  Loading....
                </Flex>
              ) : (
                <>
                  {sortedAssets.map((asset: any, index: any) => (
                    <Card key={index} borderRadius="md" p={1} mb={1} width="100%">
                      <Flex align="center" width="100%">
                        <Avatar src={asset.icon} />
                        <Box ml={3} flex="1" minWidth="0">
                          <Text fontWeight="bold" isTruncated>{asset.name}</Text>
                          {app.balances
                            .filter((balance: any) => balance.caip === asset.caip)
                            .map((balance: any, index: any) => {
                              const { integer, largePart, smallPart } = formatBalance(balance.balance);
                              return (
                                <Text key={index}>
                                  {integer}.
                                  <Text as="span" fontSize="lg">{largePart}</Text>
                                  {largePart === '0000' && (
                                    <Text as="span" fontSize="sm">{smallPart}</Text>
                                  )}
                                  <Badge ml={2} colorScheme="teal">{asset.symbol}</Badge>
                                  <br/>
                                  <Badge colorScheme="green">USD {formatUsd(balance.valueUsd)}</Badge>
                                </Text>
                              );
                            }).length === 0 ? (
                            <Spinner size="sm" />
                          ) : (
                            app.balances
                              .filter((balance: any) => balance.caip === asset.caip)
                              .map((balance: any, index: any) => {
                                const { integer, largePart, smallPart } = formatBalance(balance.balance);
                                return (
                                  <Text key={index}>
                                    {integer}.
                                    <Text as="span" fontSize="lg">{largePart}</Text>
                                    {largePart === '0000' && (
                                      <Text as="span" fontSize="sm">{smallPart}</Text>
                                    )}
                                    <Badge ml={2} colorScheme="teal">{asset.symbol}</Badge>
                                    <br/>
                                    <Badge colorScheme="green">USD {formatUsd(balance.valueUsd)}</Badge>
                                  </Text>
                                );
                              })
                          )}
                        </Box>
                        <Button ml="auto" onClick={() => onSelect(asset)} size='md'>
                          Select
                        </Button>
                      </Flex>
                    </Card>
                  ))}
                </>
              )}
            </>
          )}
        </Stack>
      </Flex>
      <Flex alignItems="center" p={4} borderTop="1px solid #ccc" width="100%">
        <Text>KeepKey</Text>
        <IconButton
          icon={<AddIcon />}
          aria-label="Add"
          onClick={onAdd}
          ml="auto"
        />
      </Flex>
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text fontSize="lg" fontWeight="bold" textAlign="center">
              Settings For Your KeepKey
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Link href="https://www.keepkey.com" isExternal w="100%">
                <Button variant="ghost" w="100%">
                  About KeepKey
                </Button>
              </Link>
              <Image src={'https://i.ibb.co/jR8WcJM/kk.gif'} alt="KeepKey" />
            </VStack>
            <VStack spacing={4} align="stretch">
              {/* Heading for Enable Masking */}
              <Text fontSize="md" fontWeight="bold">
                Enable Masking
              </Text>

              {/* Toggle for Firefox */}
              <HStack w="100%" justifyContent="space-between">
                <HStack>
                  <Avatar size="md" name="Firefox" src="https://forum.zeroqode.com/uploads/default/original/2X/4/401498d7adfbb383fea695394f4f653ea4e7c9a7.png" />
                  <Text>Enable Firefox</Text>
                </HStack>
                <Switch size="md" />
              </HStack>

              {/* Toggle for XDEFI Keplr */}
              <HStack w="100%" justifyContent="space-between">
                <HStack>
                  <Avatar size="md" name="XDEFI" src="https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/cs5s7reskl2onltpd7gw" />
                  <Text>Enable XDEFI</Text>
                </HStack>
                <Switch size="md" />
              </HStack>

              {/* Toggle for XDEFI Keplr */}
              <HStack w="100%" justifyContent="space-between">
                <HStack>
                  <Avatar size="md" name="Keplr" src="https://cdn.dealspotr.com/io-images/logo/keplr.jpg?fit=contain&trim=true&flatten=true&extend=10&width=500&height=500" />
                  <Text>Enable Keplr</Text>
                </HStack>
                <Switch size="md" />
              </HStack>

              {/* Warning Text */}
              <Text fontSize="sm" color="gray.500">
                This setting may conflict with these apps if also enabled.
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal isOpen={isAddAssetOpen} onClose={onAddAssetClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Asset</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Blockchains usePioneer={usePioneer} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
}

export default Classic;
