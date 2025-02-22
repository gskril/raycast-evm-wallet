import { getPreferenceValues, LocalStorage } from "@raycast/api";
import { useQuery } from "@tanstack/react-query";
import { mnemonicToAccount } from "viem/accounts";
import { bytesToHex } from "viem/utils";

export function useAccounts() {
  const { accountsCountStr, mnemonic } = getPreferenceValues<Preferences>();
  const accountsCount = parseInt(accountsCountStr);

  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      return await Promise.all(
        Array.from({ length: accountsCount }, async (_, i) => {
          const localAcc = mnemonicToAccount(mnemonic, { accountIndex: i });
          const name = await LocalStorage.getItem<string>(`account:${localAcc.address}`);

          return {
            name: name ?? `Account ${i + 1}`,
            address: localAcc.address,
            privateKey: bytesToHex(localAcc.getHdKey().privateKey!),
          };
        }),
      );
    },
  });
}
