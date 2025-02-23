import { Chain } from "../lib/types";
import { LocalStorage } from "@raycast/api";
import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

export function useEnsAddress(name?: string) {
  return useQuery({
    queryKey: ["ensAddress", name],
    queryFn: async () => {
      if (!name) {
        return null;
      }

      let ethRpcUrl: string | undefined;

      // Use the ETH RPC URL from storage if available, otherwise use viem's default
      try {
        const chainsFromStorage = JSON.parse((await LocalStorage.getItem("chains")) ?? "[]") as Chain[];
        ethRpcUrl = chainsFromStorage.find((chain) => chain.id === 60)?.rpcUrl;
        // eslint-disable-next-line no-empty
      } catch {}

      const client = createPublicClient({
        chain: mainnet,
        transport: http(ethRpcUrl),
      });

      return client.getEnsAddress({ name: normalize(name) });
    },
  });
}
