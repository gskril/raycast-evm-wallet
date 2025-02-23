import { useAccounts, useBalance, useSavedChains } from "./hooks";
import { use0xQuote } from "./hooks/useQuote";
import "./lib/fetch-polyfill";
import { matcha } from "./lib/matcha";
import { createViemPublicClient, createViemWalletClient } from "./lib/utils";
import { withQuery } from "./lib/with-query";
import { Form, ActionPanel, Action, showToast, Toast, Clipboard } from "@raycast/api";
import { useState } from "react";
import { Address, formatEther, formatUnits, isAddress } from "viem";
import { z } from "zod";

const schema = z.object({
  fromAddress: z.string().refine((val) => isAddress(val)),
  chainId: z.coerce.number(),
  buyToken: z.string().refine((val) => isAddress(val)),
  ethAmount: z.coerce.number(),
});

function SwapView() {
  const accounts = useAccounts();
  const chains = useSavedChains();
  const [txIsPending, setTxIsPending] = useState(false);

  const [selectedChainId, setSelectedChainId] = useState<number>();
  const [fromAddress, setFromAddress] = useState<Address | null>(null);
  const [buyToken, setBuyToken] = useState<Address>();
  const [ethAmount, setEthAmount] = useState<number>();

  const quote = use0xQuote({ buyToken, chainId: selectedChainId, ethAmount });
  const balance = useBalance({ address: fromAddress, chainId: selectedChainId });

  console.log("quote.error", quote.error);

  async function handleSubmit(values: z.infer<typeof schema>) {
    const { data: safeValues, success: isSafeParse } = schema.safeParse(values);

    if (!isSafeParse) {
      showToast({ title: "Invalid values" });
      return;
    }

    const publicClient = await createViemPublicClient(safeValues.chainId);
    const walletClient = await createViemWalletClient(safeValues.chainId, safeValues.fromAddress);

    try {
      const quote = await matcha.getQuote(safeValues);

      setTxIsPending(true);
      showToast({ title: "Sending transaction...", style: Toast.Style.Animated });
      const txHash = await walletClient.sendTransaction({
        to: quote.to,
        value: BigInt(quote.value),
        data: quote.data,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setTxIsPending(false);

      const hasBlockExplorer = !!publicClient.chain.blockExplorers?.default;

      showToast({
        title: "Transaction success!",
        message: hasBlockExplorer ? `Copied block explorer link to clipboard` : undefined,
        style: Toast.Style.Success,
      });

      if (hasBlockExplorer) {
        Clipboard.copy(`${publicClient.chain.blockExplorers?.default.url}/tx/${txHash}`);
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
      <Form.Dropdown id="chainId" title="Chain" onChange={(value) => setSelectedChainId(Number(value))}>
        {matcha.chains.map((chain) => (
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
        id="buyToken"
        title="Token Address"
        placeholder="0x..."
        onChange={(value) => {
          if (isAddress(value)) {
            setBuyToken(value);
          }
        }}
      />

      <Form.TextField
        id="ethAmount"
        title="ETH Amount"
        placeholder="0.01"
        onChange={(value) => {
          if (!isNaN(Number(value))) {
            setEthAmount(Number(value));
          }
        }}
      />

      {quote.data && (
        <>
          <Form.Separator />
          <Form.Description
            title="Expected Output"
            text={`${Number(formatUnits(BigInt(quote.data.grossBuyAmount), quote.data.decimals)).toFixed(2)} $${quote.data.symbol}`}
          />
        </>
      )}
    </Form>
  );
}

export default withQuery(SwapView);
