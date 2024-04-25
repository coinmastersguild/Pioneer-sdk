import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Icon,
  Button,
  Divider,
  Flex,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';

function SwapInput({ usePioneer, setAmountSelected, setInputAmount }:any) {
  const { state } = usePioneer();
  const { app } = state;
  const [depositAmount, setDepositAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<any>(null);

  useEffect(() => {
    if (app?.assetContext?.priceUsd && app?.outboundAssetContext?.priceUsd) {
      let rate = app.assetContext.priceUsd / app.outboundAssetContext.priceUsd;
      rate = 1 / rate;
      setExchangeRate(rate || 0);
    }
  }, [app, app?.assetContext, app?.outboundAssetContext]);

  const handleDepositChange = (valueAsString:any) => {
    setDepositAmount(valueAsString);
    if (exchangeRate !== null) {
      setAmountSelected(true);
      const depositValue = parseFloat(valueAsString) || 0;
      setInputAmount(depositValue);
      const receiveValue = depositValue / exchangeRate;
      setReceiveAmount(receiveValue.toFixed(4));
    }
  };

  const handleReceiveChange = (valueAsString:any) => {
    setReceiveAmount(valueAsString);
    if (exchangeRate !== null) {
      setAmountSelected(true);
      const receiveValue = parseFloat(valueAsString) || 0;
      const depositValue = receiveValue * exchangeRate;
      setInputAmount(depositValue);
      setDepositAmount(depositValue.toFixed(4));
    }
  };

  const maxDeposit = () => {
    const maxBalance = app.assetContext.balance || 0;
    setDepositAmount(maxBalance.toString());
    handleDepositChange(maxBalance.toString());
  };

  return (
    <Flex direction="column" align="center">
      <Box borderRadius="lg" maxWidth="sm" padding={6} color="white" bg="gray.800" width="100%" mx="auto">
        <VStack spacing={4}>
          <Box width="full">
            <HStack justifyContent="space-between">
              <Text>Deposit</Text>
              <Icon as={ChevronRightIcon} />
            </HStack>
            <NumberInput
              variant="filled"
              mb={2}
              value={depositAmount}
              onChange={(valueAsString) => handleDepositChange(valueAsString)}
              _placeholder={{ color: 'gray.500' }}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text fontSize="sm" color="gray.500">{app?.assetContext?.name} on {app?.assetContext?.chain}</Text>
            {app?.assetContext?.balance && (
              <HStack justifyContent="space-between">
                <Text></Text> {/* Empty text for alignment */}
                <HStack>
                  <Text fontSize="xs" color="green.400">
                    Balance: {parseFloat(app.assetContext.balance).toFixed(3)} (${parseFloat(app.assetContext.valueUsd).toFixed(0)} USD)
                  </Text>
                  <Button size="xs" ml={2} colorScheme="green" onClick={maxDeposit}>Max</Button>
                </HStack>
              </HStack>
            )}
          </Box>
          <Divider borderColor="gray.600" />
          <Box width="full">
            <HStack justifyContent="space-between">
              <Text>Receive</Text>
              <Icon as={ChevronRightIcon} />
            </HStack>
            <NumberInput
              variant="filled"
              mb={2}
              value={receiveAmount}
              onChange={(valueAsString) => handleReceiveChange(valueAsString)}
              _placeholder={{ color: 'gray.500' }}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {app?.outboundAssetContext?.balance && (
              <HStack justifyContent="space-between">
                <Text></Text> {/* Empty text for alignment */}
                <HStack>
                  <Text fontSize="xs" color="green.400">
                    Balance: {parseFloat(app.outboundAssetContext.balance).toFixed(3)} (${parseFloat(app.outboundAssetContext.valueUsd).toFixed(0)} USD)
                  </Text>
                </HStack>
              </HStack>
            )}
            <Text fontSize="sm" color="gray.500">{app?.outboundAssetContext?.name} on {app?.outboundAssetContext?.chain}</Text>
            {app?.outboundAssetContext?.address && (
              <Text fontSize='xs'>{`address: ${app.outboundAssetContext.address}`}</Text>
            )}
            {app?.outboundAssetContext?.label && (
              <Text mt={2} fontSize='md'>{`Label: ${app.outboundAssetContext.label}`}</Text>
            )}
            {app?.outboundAssetContext?.context === 'external' && (
              <Text mt={2} fontStyle="italic">External</Text>
            )}
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
}

export default SwapInput;