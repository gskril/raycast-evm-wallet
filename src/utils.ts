export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const convertEVMChainIdToCoinType = (chainId: number) => {
  return (0x80000000 | chainId) >>> 0;
};
