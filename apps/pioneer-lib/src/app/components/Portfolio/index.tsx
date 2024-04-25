/*
    Portfolio component

 */

import { Box, Center, Flex, Text, Spinner, Button } from '@chakra-ui/react';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';

// import { Balances } from '../Balances';
import Balances from '../../components/Balances';
import Assets from '../../components/Assets';
//import Basic from '@/app/components/Basic';
// Adjust the import path according to your file structure

// Register the necessary plugins for Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export function Portfolio({usePioneer}:any) {
  const { state, showModal } = usePioneer();
  const { balances, app } = state;
  const [showAll, setShowAll] = useState(false);
  const [lastClickedBalance, setLastClickedBalance] = useState(null);
  const [activeSegment, setActiveSegment] = useState(null);
  const [totalValueUsd, setTotalValueUsd] = useState(0);
  const [chartData, setChartData] = useState({
    datasets: [],
    labels: [],
  });
  const handleChartClick = (event: any, elements: any) => {
    //console.log(`Clicked on asset`);
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      const clickedAsset = balances[elementIndex];
      //console.log(`Clicked on asset: ${clickedAsset.symbol}`);
      // setLastClickedBalance(clickedAsset);
    }
  };

  const options: any = {
    responsive: true,
    onClick: handleChartClick,
    cutout: '75%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        // callbacks: {
        //   label(context: any) {
        //     let label = context.label || '';
        //     if (label) {
        //       label += ': ';
        //     }
        //     if (context.parsed !== null) {
        //       const valueUsd = balances[context.dataIndex].valueUsd.toLocaleString('en-US', {
        //         style: 'currency',
        //         currency: 'USD',
        //       });
        //       label += `${context.parsed.toFixed(2)}%, ${valueUsd}`;
        //     }
        //     return label;
        //   },
        // },
      },
    },
    // onHover: (event: any, chartElement: any) => {
    //   //console.log('event: ', event);
    //   if (chartElement.length) {
    //     const { index } = chartElement[0];
    //     setActiveSegment(index);
    //   } else {
    //     setActiveSegment(null);
    //   }
    // },
    maintainAspectRatio: false,
  };



  // Initialize lastClickedBalance with the largest asset
  useEffect(() => {
    if (balances && balances.length > 0) {
      const largestBalance = balances.reduce(
        (max: any, balance: any) => (balance.valueUsd > max.valueUsd ? balance : max),
        balances[0],
      );
      setLastClickedBalance(largestBalance);
    }
  }, [balances]);

  const updateChart = () => {
    setShowAll(false);

    const filteredBalances = showAll
      ? balances
      : balances.filter((balance: any) => parseFloat(balance.valueUsd) >= 10);

    filteredBalances.sort((a: any, b: any) => parseFloat(b.valueUsd) - parseFloat(a.valueUsd));

    const totalValue = filteredBalances.reduce(
      (acc: any, balance: any) => acc + parseFloat(balance.valueUsd),
      0,
    );
    setTotalValueUsd(totalValue);

    const chartData = filteredBalances.map(
      (balance: any) => (parseFloat(balance.valueUsd) / totalValue) * 100,
    );
    const chartLabels = filteredBalances.map((balance: any) => balance.symbol);

    const chartColors = filteredBalances.map(
      () => `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    );
    const dataSet: any = {
      datasets: [
        {
          data: chartData,
          backgroundColor: chartColors,
          hoverBackgroundColor: chartColors.map((color: any) => `${color}B3`),
          borderColor: 'white',
          borderWidth: 2,
        },
      ],
      labels: chartLabels,
    };
    setChartData(dataSet);
  };

  let onSelect = (balance: any) => {
    //console.log('balance: ', balance);
    // setLastClickedBalance(balance);
  };

  useEffect(() => {
    //console.log('activeSegment: ', activeSegment);
    updateChart();
  }, [balances]);

  return (
    <Flex direction="column" align="center" justify="center">

      {/* Balances Component or Loading Spinner */}
      {balances.length === 0 ? (
        <Center mt="20px">
          assets: {app?.assets?.length}
          pubkeys: {app?.pubkeys?.length}
          balances: {app?.balances?.length}

          {app?.pubkeys?.length === 0 ? (
            <Button colorScheme="blue">
              Pair Wallets
            </Button>
          ) : (
            <>
              <Spinner mr="3" />
              <Text>Loading Wallet Balances...</Text>
            </>
          )}
        </Center>
      ) : (
        <div>
          <br/>
          {/* Doughnut Chart */}
          <Center bottom="0" left="0" >
          <Box height="300px" width="300px" position="relative">
            <Doughnut data={chartData} options={options} />
            <Center bottom="0" left="0" position="absolute" right="0" top="0">
              <Text fontSize="lg" fontWeight="bold" textAlign="center">
                Total Value: {totalValueUsd.toFixed(2)}
              </Text>
            </Center>
          </Box>
          </Center>
          <br/>
          <Box width="100%" maxHeight="600px" overflowY="auto" mt="20px">
            <Assets usePioneer={usePioneer} onSelect={onSelect} filters={{onlyOwned: true, noTokens: false, hasPubkey:true }}/>
          </Box>
        </div>
      )}
    </Flex>
  );
}

export default Portfolio;
