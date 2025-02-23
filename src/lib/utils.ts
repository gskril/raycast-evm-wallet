import { Chain } from "./types";
import { LocalStorage, getPreferenceValues } from "@raycast/api";
import { http, bytesToHex, Hex, createWalletClient, createPublicClient } from "viem";
import { privateKeyToAccount, mnemonicToAccount } from "viem/accounts";
import * as viemChains from "viem/chains";

export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function convertEVMChainIdToCoinType(chainId: number) {
  return (0x80000000 | chainId) >>> 0;
}

// TODO: Combine the two functions below into one. I tried but Typescript was complaining.

// Creates a public client using the locally configured RPC URL if available
export async function createViemPublicClient(chainId: number) {
  const chainsFromStorage = JSON.parse((await LocalStorage.getItem("chains")) ?? "[]") as Chain[];
  const chainFromStorage = chainsFromStorage.find((chain) => chain.id === chainId);

  const allChains = Object.values(viemChains);
  // Technically this has some edge cases with obscure testnets that share the same id
  const matchingViemChain = allChains.find((chain) => chain.id === chainId);

  if (!matchingViemChain) {
    throw new Error(`No matching viem chain found for chainId: ${chainId}`);
  }

  return createPublicClient({
    chain: matchingViemChain,
    transport: http(chainFromStorage?.rpcUrl),
  });
}

// Creates a wallet client using the locally configured RPC URL if available
export async function createViemWalletClient(chainId: number, account: Hex) {
  const chainsFromStorage = JSON.parse((await LocalStorage.getItem("chains")) ?? "[]") as Chain[];
  const chainFromStorage = chainsFromStorage.find((chain) => chain.id === chainId);

  const allChains = Object.values(viemChains);
  // Technically this has some edge cases with obscure testnets that share the same id
  const matchingViemChain = allChains.find((chain) => chain.id === chainId);

  if (!matchingViemChain) {
    throw new Error(`No matching viem chain found for chainId: ${chainId}`);
  }

  const { mnemonic, accountsCountStr } = getPreferenceValues<Preferences>();
  const accountsCount = parseInt(accountsCountStr);

  const possibleAccounts = Array.from({ length: accountsCount }, (_, i) => {
    const localAcc = mnemonicToAccount(mnemonic, { accountIndex: i });

    return {
      address: localAcc.address,
      privateKey: bytesToHex(localAcc.getHdKey().privateKey!),
    };
  });

  const desiredAccount = possibleAccounts.find((acc) => acc.address === account);

  if (!desiredAccount) {
    throw new Error(`Account not found: ${account}`);
  }

  return createWalletClient({
    account: privateKeyToAccount(desiredAccount.privateKey),
    chain: matchingViemChain,
    transport: http(chainFromStorage?.rpcUrl),
  });
}
