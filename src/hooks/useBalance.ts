import { allChains } from "../lib/chains";
import { useSavedChains } from "./useSavedChains";
import { useQuery } from "@tanstack/react-query";
import { Address, createPublicClient, http } from "viem";

type Props = {
  address?: Address | null;
  chainId?: number | null;
};

export function useBalance({ address, chainId }: Props) {
  const chains = useSavedChains();

  return useQuery({
    queryKey: ["balance", address, chainId],
    queryFn: async () => {
      if (!address || !chainId) {
        return null;
      }

      const chainFromStorage = chains.value!.find((chain) => chain.id === chainId);

      // Technically this has some edge cases with obscure testnets that share the same id
      const chain = allChains.find((chain) => chain.id === chainId);

      if (!chain) {
        throw new Error(`Chain with id ${chainId} not found`);
      }

      const client = createPublicClient({
        chain,
        transport: http(chainFromStorage?.rpcUrl),
      });

      return client.getBalance({ address });
    },
  });
}
