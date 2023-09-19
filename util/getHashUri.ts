export function getHashUri(hash: string) {
  return hash.startsWith("0x") ? hash.slice(0, 8) : `0x${hash.slice(0, 6)}`;
}
