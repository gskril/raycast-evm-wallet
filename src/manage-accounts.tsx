import { withQuery } from "./lib/with-query";
import { truncateAddress } from "./utils";
import { ActionPanel, Action, Icon, List, LocalStorage, getPreferenceValues, Form, useNavigation } from "@raycast/api";
import { useQuery } from "@tanstack/react-query";
import { mnemonicToAccount } from "viem/accounts";
import { bytesToHex } from "viem/utils";

function ManageAccountsView() {
  const { accountsCountStr, mnemonic } = getPreferenceValues<Preferences>();
  const accountsCount = parseInt(accountsCountStr);

  const {
    data: accounts,
    isLoading,
    refetch,
  } = useQuery({
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

  return (
    <List isLoading={isLoading}>
      {accounts?.map((item) => (
        <List.Item
          key={item.address}
          icon={Icon.Wallet}
          title={item.name}
          accessories={[{ text: truncateAddress(item.address) }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy Address" content={item.address} />
              <Action.CopyToClipboard title="Copy Private Key" content={item.privateKey} />
              <Action.Push
                icon={Icon.Pencil}
                title="Rename Account"
                target={<RenameAccountView address={item.address} refetch={refetch} />}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function RenameAccountView({ address, refetch }: { address: string; refetch: () => void }) {
  const { pop } = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            icon={Icon.Pencil}
            title="Rename Account"
            onSubmit={async (values) => {
              await LocalStorage.setItem(`account:${address}`, values.title);
              console.log(`Set ${address} to ${values.title}`);
              refetch();
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" />
    </Form>
  );
}

export default withQuery(ManageAccountsView);
