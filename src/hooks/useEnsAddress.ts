import { convertEVMChainIdToCoinType, createViemPublicClient } from "../lib/utils";
import { useQuery } from "@tanstack/react-query";
import { normalize } from "viem/ens";

export function useEnsAddress({ name, evmChainId = 1 }: { name?: string; evmChainId?: number }) {
  return useQuery({
    queryKey: ["ensAddress", name, evmChainId],
    queryFn: async () => {
      if (!name) {
        return null;
      }

      const client = await createViemPublicClient(1);
      return client.getEnsAddress({
        name: normalize(name),
        coinType: evmChainId !== 1 ? convertEVMChainIdToCoinType(evmChainId) : 60,
      });
    },
  });
}
