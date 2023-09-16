export function removeOrReplaceUrl(inputStr: string) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = inputStr.match(urlPattern);

  if (urls) {
    urls.forEach((url) => {
      if (inputStr.trim().endsWith(url)) {
        inputStr = inputStr.replace(url, "");
      } else {
        inputStr = inputStr.replace(url, "[link]");
      }
    });
  }

  return inputStr.replace(/[:;\s]+$/, "").trim();
}
