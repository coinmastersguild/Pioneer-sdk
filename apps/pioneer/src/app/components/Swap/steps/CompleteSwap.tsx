'use client';
/*
  Comlete swap step
 */
import { Link, Card, CardBody, Text } from "@chakra-ui/react";
import { useEffect } from "react";
import NextLink from "next/link";
import Track from "../../../components/Track";

const BeginSwap = ({ txHash }: any) => {
  const saveToPendingTransactions = () => {
    const storedData = localStorage.getItem("pendingTransactions");
    let pendingTransactions: string[] = [];

    // Check if storedData is not null and is a valid JSON array
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          pendingTransactions = parsedData;
        }
      } catch (e) {
        console.error(
          "Error parsing pendingTransactions from localStorage:",
          e
        );
      }
    }

    // Check if the txHash is not already in the pendingTransactions array
    if (!pendingTransactions.includes(txHash)) {
      // Add the new txHash to the pendingTransactions array
      pendingTransactions.push(txHash);

      // Save the updated array back to local storage
      localStorage.setItem(
        "pendingTransactions",
        JSON.stringify(pendingTransactions)
      );
    }
  };
  useEffect(() => {
    if (txHash) {
      saveToPendingTransactions();
    }
  }, [txHash]);
  return (
    <div>
      <Card>
        <CardBody>
          <Link as={NextLink} href={`/txid/${txHash}`}>
            <Text>Your Transaction:</Text> {txHash}
          </Link>
        </CardBody>
      </Card>
      <br />
      <Track txHash={txHash} />
    </div>
  );
};

export default BeginSwap;
