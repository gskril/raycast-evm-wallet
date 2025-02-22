import { useAccounts } from "./hooks/useAccounts";
import { withQuery } from "./lib/with-query";
import { truncateAddress } from "./utils";
import { ActionPanel, Action, Icon, List, LocalStorage, Form, useNavigation } from "@raycast/api";

function ManageAccountsView() {
  const { data: accounts, isLoading, refetch } = useAccounts();

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
