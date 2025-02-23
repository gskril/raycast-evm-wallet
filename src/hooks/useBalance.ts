import { createViemPublicClient } from "../lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

type Props = {
  address?: Address | null;
  chainId?: number | null;
};

export function useBalance({ address, chainId }: Props) {
  return useQuery({
    queryKey: ["balance", address, chainId],
    queryFn: async () => {
      if (!address || !chainId) {
        return null;
      }

      const client = await createViemPublicClient(chainId);
      return client.getBalance({ address });
    },
  });
}
