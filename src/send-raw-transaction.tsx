import { useAccounts, useBalance, useSavedChains } from "./hooks";
import { useEnsAddress } from "./hooks/useEnsAddress";
import { allChains } from "./lib/chains";
import "./lib/fetch-polyfill";
import { withQuery } from "./lib/with-query";
import { Form, ActionPanel, Action, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { Address, createWalletClient, formatEther, http, isAddress, isHex, parseEther, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";

const schema = z.object({
  fromAddress: z.string().refine((val) => isAddress(val)),
  chainId: z.coerce.number(),
  // Can be an address or ENS name
  to: z.string().refine((val) => isAddress(val) || (val.includes(".") && !val.includes(" "))),
  value: z.coerce.number(),
  data: z.string().refine((val) => isHex(val)),
});

function SendRawTransactionView() {
  const accounts = useAccounts();
  const chains = useSavedChains();
  const [txIsPending, setTxIsPending] = useState(false);

  const [selectedChainId, setSelectedChainId] = useState<number>();
  const [fromAddress, setFromAddress] = useState<Address | null>(null);
  const [toNameOrAddress, setToNameOrAddress] = useState<string | null>(null);

  // Try to resolve the input to an ENS name if its a dot-separated string
  const { data: ensAddress } = useEnsAddress({
    name: toNameOrAddress?.includes(".") ? toNameOrAddress : undefined,
    evmChainId: selectedChainId,
  });
  const balance = useBalance({ address: fromAddress, chainId: selectedChainId });

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

    // Check if either the to address or the ENS address is valid
    if (!isAddress(to) && !ensAddress) {
      showToast({ title: "Invalid address or ENS name" });
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
        to: isAddress(to) ? to : ensAddress,
        value: parseEther(value.toString()),
        data,
      });

      await client.waitForTransactionReceipt({ hash: txHash });
      setTxIsPending(false);

      const hasBlockExplorer = !!chain?.blockExplorers?.default;

      showToast({
        title: "Transaction success!",
        message: hasBlockExplorer ? `Copied block explorer link to clipboard` : undefined,
        style: Toast.Style.Success,
      });

      if (hasBlockExplorer) {
        Clipboard.copy(`${chain?.blockExplorers?.default.url}/tx/${txHash}`);
      }
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
      <Form.Dropdown
        id="chainId"
        title="Chain"
        info={`Edit this list and RPC endpoints with the "Manage Chains" command`}
        onChange={(value) => setSelectedChainId(Number(value))}
      >
        {chains.value?.map((chain) => (
          <Form.Dropdown.Item key={chain.id} value={chain.id.toString()} title={chain.name} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown id="fromAddress" title="Account" onChange={(value) => setFromAddress(value as Address)}>
        {accounts.data?.map((account) => (
          <Form.Dropdown.Item
            key={account.address}
            value={account.address}
            title={account.name}
            keywords={[account.address]}
          />
        ))}
      </Form.Dropdown>

      <Form.Description title="Balance" text={balance.isLoading ? "..." : formatEther(balance.data || 0n) + " ETH"} />

      <Form.TextField
        id="to"
        title="To"
        placeholder="Address or ENS name"
        onChange={(value) => setToNameOrAddress(value)}
      />

      {ensAddress && <Form.Description title="=>" text={ensAddress} />}

      <Form.TextField id="value" title="Value" info="In Ether" placeholder="0.01" />
      <Form.TextArea id="data" title="Data" placeholder="0x...." defaultValue="0x" />
    </Form>
  );
}

export default withQuery(SendRawTransactionView);
