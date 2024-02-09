'use client';
import { ArrowUpDownIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Spinner,
  Text,
} from '@chakra-ui/react';
// @ts-ignore
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import React, { useEffect, useState } from 'react';

// @ts-ignore
import { usePioneer } from '../../../context';

const labelStyles = {
  mt: '2',
  ml: '-2.5',
  fontSize: 'sm',
};

interface BeginSwapProps {
  openModal: any; // Replace 'any' with the actual type of 'openModal'
  handleClick: any; // Replace 'any' with the actual type of 'handleClick'
  selectedButton: any; // Replace 'any' with the actual type of 'selectedButton'
}

const BeginSwap: React.FC<BeginSwapProps> = ({
  openModal,
  handleClick,
  selectedButton,
  sliderValue,
  setSliderValue,
}) => {
  const { state } = usePioneer();
  const [inputAmount, setInputAmount] = useState(0);
  const { assetContext, outboundAssetContext, app, balances } = state;
  const [isInputValid, setIsInputValid] = useState<boolean>(true);
  const minimumTradeAmountUSD = 10;
  const [inputCurrency, setInputCurrency] = useState<'USD' | 'Native'>('USD');

  const switchAssets = function () {
    const currentInput = assetContext;
    const currentOutput = outboundAssetContext;
    console.log('currentInput: ', currentInput);
    console.log('currentOutput: ', currentOutput);
    console.log('Switching assets!');
    app.setOutboundAssetContext(currentInput);
    app.setAssetContext(currentOutput);
  };

  const selectDefaultAssets = function () {
    try {
      const filteredAssets = balances
        .filter((asset: any) => {
          return asset.valueUsd ? parseFloat(asset.valueUsd) >= 1 : false;
        })
        .sort((a: any, b: any) => {
          return (b.valueUsd || 0) - (a.valueUsd || 0);
        });

      // set the default assets
      if (filteredAssets.length > 0) {
        app.setAssetContext(filteredAssets[0]);
        app.setOutboundAssetContext(filteredAssets[1]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (assetContext) {
      let initialSliderValue = 50;
      const newInitialAmount =
        (parseFloat(assetContext.balance) * assetContext.priceUsd * initialSliderValue) / 100;
      updateInputAmount(newInitialAmount);
      setSliderValue(initialSliderValue);
    }
  }, [assetContext]);

  // start the context provider
  useEffect(() => {
    if (balances) {
      console.log(`https://pioneers.dev/coins/${COIN_MAP_LONG.BTC}.png`);
      selectDefaultAssets();
    }
  }, [balances]);

  const getValidAmount = (amount: number, asset: AssetContext): number => {
    const maxAmount = parseFloat(asset.balance) * asset.priceUsd - minimumTradeAmountUSD;
    return Math.min(Math.max(amount, minimumTradeAmountUSD), maxAmount);
  };

  useEffect(() => {
    if (assetContext) {
      const initialSliderValue = 50;
      setSliderValue(initialSliderValue);
      const newInitialAmount =
        (initialSliderValue / 100) * parseFloat(assetContext.balance) * assetContext.priceUsd;
      updateInputAmount(newInitialAmount);
    }
  }, [assetContext]);

  const updateInputAmount = (value: number) => {
    if (!assetContext) return;
    let validAmount = value;
    if (inputCurrency === 'USD') {
      const maxAmount =
        parseFloat(assetContext.balance) * assetContext.priceUsd - minimumTradeAmountUSD;
      validAmount = Math.min(Math.max(value, minimumTradeAmountUSD), maxAmount);
    } else {
      const maxAmount =
        parseFloat(assetContext.balance) - minimumTradeAmountUSD / assetContext.priceUsd;
      validAmount = Math.min(
        Math.max(value, minimumTradeAmountUSD / assetContext.priceUsd),
        maxAmount,
      );
    }
    setIsInputValid(validAmount === value);
    setInputAmount(validAmount);
  };

  const onSliderChange = (value: number) => {
    if (!assetContext) return;
    let newAmount;
    if (inputCurrency === 'USD') {
      newAmount = (value / 100) * parseFloat(assetContext.balance) * assetContext.priceUsd;
    } else {
      newAmount = (value / 100) * parseFloat(assetContext.balance);
    }
    updateInputAmount(newAmount);
    setSliderValue(value);
  };

  const toggleCurrency = () => {
    if (inputCurrency === 'USD') {
      setInputCurrency('Native');
      const nativeAmount = inputAmount / assetContext.priceUsd;
      setInputAmount(nativeAmount);
    } else {
      setInputCurrency('USD');
      const usdAmount = inputAmount * assetContext.priceUsd;
      setInputAmount(usdAmount);
    }
  };

  return (
    <div>
      <Flex alignItems="center" bg="black" justifyContent="center" mx="auto" p="2rem">
        <HStack maxWidth="35rem" spacing={4} width="100%">
          {/* Asset selection box */}
          <Box
            _hover={{ color: 'rgb(128,128,128)' }}
            alignItems="center"
            border="1px solid #fff"
            borderRadius="8px"
            display="flex"
            flex="1"
            flexDirection="column"
            h="10rem"
            justifyContent="center"
            onClick={() => openModal('Select Asset')}
          >
            {!assetContext ? (
              <Spinner color="blue.500" size="lg" />
            ) : (
              <>
                <Avatar
                  size="xl"
                  src={
                    assetContext?.image ||
                    `https://pioneers.dev/coins/${COIN_MAP_LONG[assetContext?.chain]}.png`
                  }
                />
                <Box border="1px solid #fff" borderRadius="8px" width="100%">
                  <Text>Network: {assetContext?.chain}</Text>
                </Box>
                <Box border="1px solid #fff" borderRadius="8px" width="100%">
                  <Text>Asset: {assetContext?.ticker}</Text>
                </Box>
              </>
            )}
          </Box>
          <ArrowUpDownIcon boxSize="2rem" color="white" onClick={switchAssets} />
          {/* Outbound asset selection box */}
          <Box
            _hover={{ color: 'rgb(128,128,128)' }}
            alignItems="center"
            border="1px solid #fff"
            borderRadius="8px"
            display="flex"
            flex="1"
            flexDirection="column"
            h="10rem"
            justifyContent="center"
            onClick={() => openModal('Select Outbound')}
          >
            {!outboundAssetContext ? (
              <Spinner color="blue.500" size="lg" />
            ) : (
              <div>
                <Avatar
                  size="xl"
                  src={
                    outboundAssetContext?.image ||
                    `https://pioneers.dev/coins/${COIN_MAP_LONG[outboundAssetContext?.chain]}.png`
                  }
                />
                <Box border="1px solid #fff" borderRadius="8px" width="100%">
                  <Text>Network: {outboundAssetContext?.chain}</Text>
                </Box>
                <Box border="1px solid #fff" borderRadius="8px" width="100%">
                  <Text>Asset: {outboundAssetContext?.ticker}</Text>
                </Box>
              </div>
            )}
          </Box>
        </HStack>
      </Flex>
      <Text fontSize="md" mb="2">
        Select Amount To Trade:
      </Text>
      <Flex alignItems="center" direction="column">
        <Text fontSize="md" mb="2">
          Select Amount To Trade (in {inputCurrency}):
        </Text>
        <Flex justify="space-between" mb="2" width="100%">
          <Button onClick={toggleCurrency}>Toggle {inputCurrency}</Button>
          <Button
            onClick={() =>
              setInputAmount(
                parseFloat(assetContext?.balance || '0') -
                  minimumTradeAmountUSD / assetContext?.priceUsd,
              )
            }
          >
            Max
          </Button>
        </Flex>
        <NumberInput
          errorBorderColor="red.500"
          isInvalid={!isInputValid}
          maxW="200px"
          onChange={(_, valueAsNumber) => updateInputAmount(valueAsNumber)}
          value={inputAmount}
        >
          <NumberInputField borderColor={isInputValid ? 'inherit' : 'red.500'} />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Slider
          flex="1"
          focusThumbOnChange={false}
          mt="4"
          onChange={onSliderChange}
          value={sliderValue}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb boxSize="32px">{sliderValue}%</SliderThumb>
        </Slider>
      </Flex>
    </div>
  );
};

export default BeginSwap;
