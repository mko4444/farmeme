export function insertNamesAtPoints(
  text: string,
  fids: number[],
  positions: number[],
  mentions: { fid: number; fname: string }[]
): string {
  const inserts = positions
    .map((position, index) => ({
      position,
      ...mentions.find((f) => fids[index]),
    }))
    .sort((a, b) => b.position - a.position);

  let position_count = 0;

  // Step 4: Loop through the sorted array and insert fname at the specified position
  for (const insert of inserts) {
    let before = (text = text.slice(0, insert.position + position_count) + "@" + insert.fname);

    text = before + text.slice(before.length);
    position_count += ("@" + insert.fname).length;
  }

  return text;
}
