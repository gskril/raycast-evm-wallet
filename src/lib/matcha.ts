import { ZeroXSwapQuote } from "./types";
import { createViemPublicClient } from "./utils";
import { getPreferenceValues } from "@raycast/api";
import { erc20Abi, getContract, parseAbi } from "viem";
import { arbitrum, base, mainnet, optimism, unichain } from "viem/chains";
import { parseEther } from "viem/utils";

export const matcha = {
  chains: [mainnet, base, arbitrum, optimism, unichain],
  getQuote,
};

async function getQuote({
  buyToken,
  ethAmount,
  chainId,
}: {
  buyToken: `0x${string}`;
  ethAmount: number;
  chainId: number;
}) {
  const network = getApiNameFromChainId(chainId);
  const baseUrl = `https://${network}.api.0x.org/swap/v1/quote?`;

  const params = new URLSearchParams({
    buyToken,
    sellToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH
    sellAmount: parseEther(ethAmount.toString()).toString(),
    feeRecipient: "0x00000b0A7308257BFD464868f14D34C5108fd898",
    buyTokenPercentageFee: "0.03",
  }).toString();

  const { zeroXApiKey } = getPreferenceValues<Preferences>();

  const res = await fetch(baseUrl + params, {
    headers: { "0x-api-key": zeroXApiKey },
  });

  const localClient = await createViemPublicClient(chainId);

  const token = getContract({
    client: localClient,
    address: buyToken,
    abi: erc20Abi,
  });

  const [decimals, symbol, ethPrice] = await Promise.all([token.read.decimals(), token.read.symbol(), getEthPrice()]);

  const quote = (await res.json()) as ZeroXSwapQuote;
  console.log("quote", quote);

  console.log("buyTokenToEthRate", quote.buyTokenToEthRate);
  console.log("ethPrice", ethPrice);
  // TODO: figure out the USD price, thing weird is happening

  return {
    ...quote,
    decimals,
    symbol,
    usdCost: "unknown",
  };
}

function getApiNameFromChainId(chainId: number) {
  switch (chainId) {
    case mainnet.id:
      return "ethereum";
    case base.id:
      return "base";
    case arbitrum.id:
      return "arbitrum";
    case optimism.id:
      return "optimism";
    case unichain.id:
      return "unichain";
    default:
      throw new Error(`Unsupported chain id: ${chainId}`);
  }
}

async function getEthPrice() {
  const l1Client = await createViemPublicClient(1);

  const sourceToken = {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    decimals: 6,
  } as const;

  const destinationToken = {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    decimals: 18,
  } as const;

  const res = await l1Client.readContract({
    address: "0x07D91f5fb9Bf7798734C3f606dB065549F6893bb", // 1inch Oracle
    abi: parseAbi([
      "function getRate(address srcsourceToken, address dstsourceToken, bool useWrappers) view returns (uint256 weightedRate)",
    ]),
    functionName: "getRate",
    args: [sourceToken.address, destinationToken.address, false],
  });

  const numerator = 10 ** sourceToken.decimals;
  const denominator = 10 ** destinationToken.decimals;
  const conversionFactor = numerator / (1e18 * denominator);
  const price = 1 / (Number(res) * conversionFactor);

  return price;
}
