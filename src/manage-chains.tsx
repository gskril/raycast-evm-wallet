import { useSavedChains } from "./hooks";
import { allChains as _allChains } from "./lib/chains";
import { Chain } from "./lib/types";
import { ActionPanel, Action, Icon, List, Color, useNavigation, Form } from "@raycast/api";
import type { Chain as ViemChain } from "viem/chains";

export default function ManageChainsView() {
  const { value: chains, setValue: setChains, isLoading } = useSavedChains();

  // Move a few select chains to the top of the list in a specific order
  const topChains = [1, 8453, 42161, 10, 59144];
  const allChains = [
    ...topChains.map((id) => _allChains.find((chain) => chain.id === id)),
    ..._allChains.filter((chain) => !topChains.includes(chain.id)),
  ] as ViemChain[];

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search chains (includes all from viem)">
      <List.EmptyView title="No chains" description="Add a chain to get started" />

      {allChains.map((item, i) => {
        const isChainAdded = chains?.some((chain) => chain.id === item.id);

        return (
          <List.Item
            key={i}
            icon={
              isChainAdded
                ? { source: Icon.Check, tintColor: Color.Green }
                : { source: Icon.Xmark, tintColor: Color.Red }
            }
            title={item.name}
            subtitle={item.id.toString()}
            accessories={[{ text: item.id.toString() }]}
            actions={
              <ActionPanel>
                {isChainAdded && (
                  <Action.SubmitForm
                    icon={Icon.Trash}
                    title="Remove Chain"
                    onSubmit={async () => {
                      const newChains = chains?.filter((chain) => chain.id !== item.id) ?? [];
                      await setChains(newChains);
                    }}
                  />
                )}

                {!chains?.some((chain) => chain.id === item.id) && (
                  <Action.SubmitForm
                    icon={Icon.Plus}
                    title="Add Chain"
                    onSubmit={async () => {
                      const newItem = { id: item.id, name: item.name, rpcUrl: item.rpcUrls.default?.http?.[0] };
                      const newChains = new Set(chains ?? []).add(newItem);
                      await setChains(Array.from(newChains));
                    }}
                  />
                )}

                {chains?.some((chain) => chain.id === item.id) && (
                  // eslint-disable-next-line @raycast/prefer-title-case
                  <Action.Push icon={Icon.Gear} title="Set RPC URL" target={<SetRpcUrlView chainId={item.id} />} />
                )}
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function SetRpcUrlView({ chainId }: { chainId: number }) {
  const { value: chains, setValue: setChains, isLoading } = useSavedChains();
  const chain = chains?.find((chain) => chain.id === chainId);
  const { pop } = useNavigation();

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            icon={Icon.Pencil}
            title="Save"
            onSubmit={async (values) => {
              const newItem = { ...chain, rpcUrl: values.rpcUrl } as Chain;

              if (!chains) {
                throw new Error("Unreachable");
              }

              const chainsWithoutOld = chains.filter((chain) => chain.id !== chainId);

              // Enforce unique chain ids
              const newChains = new Set(chainsWithoutOld).add(newItem);

              await setChains(Array.from(newChains));
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      {chain && <Form.TextField id="rpcUrl" title="RPC URL" defaultValue={chain?.rpcUrl} />}
    </Form>
  );
}
