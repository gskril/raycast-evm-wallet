import type { Hex } from "viem";

export type Chain = {
  id: number;
  name: string;
  rpcUrl?: string;
};

export type ZeroXSwapQuote = {
  chainId: number;
  price: string;
  grossPrice: string;
  estimatedPriceImpact: string;
  value: string;
  gasPrice: string;
  gas: string;
  estimatedGas: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenAddress: string;
  buyAmount: string;
  grossBuyAmount: string;
  sellTokenAddress: string;
  sellAmount: string;
  grossSellAmount: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
  allowanceTarget: string;
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;
  to: Hex;
  from: Hex;
  data: Hex;
  decodedUniqueId: Hex;
  guaranteedPrice: string;
  orders: Array<unknown>;
  fees: {
    zeroExFee: null;
  };
  auxiliaryChainData: {
    l1GasEstimate: number;
  };
};
