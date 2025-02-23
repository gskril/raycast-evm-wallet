import { matcha } from "../lib/matcha";
import { useQuery } from "@tanstack/react-query";

export function use0xQuote({ buyToken, ethAmount, chainId }: Partial<Parameters<typeof matcha.getQuote>[0]>) {
  return useQuery({
    queryKey: ["quote", buyToken, ethAmount, chainId],
    enabled: !!buyToken && !!ethAmount && !!chainId,
    refetchInterval: 10_000,
    queryFn: () => {
      if (!buyToken || !ethAmount || !chainId) {
        return null;
      }

      return matcha.getQuote({ buyToken, ethAmount, chainId });
    },
  });
}
