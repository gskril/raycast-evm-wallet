import { useAccounts } from "./hooks/useAccounts";
import { Chain } from "./lib/types";
import { withQuery } from "./lib/with-query";
import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useLocalStorage } from "@raycast/utils";
import { useState } from "react";
import { createWalletClient, http, isAddress, isHex, parseEther, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as viemChains from "viem/chains";
import { z } from "zod";

const schema = z.object({
  fromAddress: z.string().refine((val) => isAddress(val)),
  chainId: z.coerce.number(),
  to: z.string().refine((val) => isAddress(val)),
  value: z.coerce.number(),
  data: z.string().refine((val) => isHex(val)),
});

function SendRawTransactionView() {
  const accounts = useAccounts();
  const chains = useLocalStorage<Chain[]>("chains");
  const allChains = Object.values(viemChains);
  const [txIsPending, setTxIsPending] = useState(false);

  async function handleSubmit(values: z.infer<typeof schema>) {
    const safeParse = schema.safeParse(values);

    if (!safeParse.success) {
      showToast({ title: "Invalid values" });
      return;
    }

    const { fromAddress, chainId, to, value, data } = safeParse.data;
    const account = privateKeyToAccount(accounts.data!.find((account) => account.address === fromAddress)!.privateKey);
    const chainFromStorage = chains.value!.find((chain) => chain.id === chainId)!;

    if (!chainFromStorage.rpcUrl) {
      showToast({ title: "No RPC URL found" });
      return;
    }

    const chain = allChains.find((chain) => chain.id === chainId && chain.name === chainFromStorage.name);

    const client = createWalletClient({
      chain,
      account,
      transport: http(chainFromStorage.rpcUrl),
    }).extend(publicActions);

    try {
      setTxIsPending(true);
      showToast({ title: "Sending transaction...", style: Toast.Style.Animated });
      const txHash = await client.sendTransaction({
        to,
        value: parseEther(value.toString()),
        data,
      });

      await client.waitForTransactionReceipt({ hash: txHash });
      setTxIsPending(false);
      showToast({ title: "Transaction success!", style: Toast.Style.Success });
    } catch (error) {
      setTxIsPending(false);
      showToast({ title: "Error sending transaction", style: Toast.Style.Failure });
    }
  }

  if (accounts.isLoading || chains.isLoading) {
    return <Form isLoading />;
  }

  return (
    <Form
      isLoading={txIsPending}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Send" />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="fromAddress" title="Account">
        {accounts.data?.map((account) => (
          <Form.Dropdown.Item
            key={account.address}
            value={account.address}
            title={account.name}
            keywords={[account.address]}
          />
        ))}
      </Form.Dropdown>

      <Form.Dropdown
        id="chainId"
        title="Chain"
        info={`Edit this list and RPC endpoints with the "Manage Chains" command`}
      >
        {chains.value?.map((chain) => (
          <Form.Dropdown.Item key={chain.id} value={chain.id.toString()} title={chain.name} />
        ))}
      </Form.Dropdown>

      <Form.TextField id="to" title="To" placeholder="0x..." />
      <Form.TextField id="value" title="Value" info="In Ether" placeholder="0.01" />
      <Form.TextArea id="data" title="Data" placeholder="0x...." defaultValue="0x" />
    </Form>
  );
}

export default withQuery(SendRawTransactionView);
