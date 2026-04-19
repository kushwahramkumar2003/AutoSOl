const PINATA_FILE_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_GATEWAY_BASE = "https://gateway.pinata.cloud/ipfs/";

export function getIpfsGatewayUrl(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return `${PINATA_GATEWAY_BASE}${uri.replace("ipfs://", "")}`;
  }

  return uri;
}

export async function fetchTextFromIpfs(uri: string): Promise<string> {
  const response = await fetch(getIpfsGatewayUrl(uri), {
    method: "GET",
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch note content (${response.status})`);
  }

  return response.text();
}

export async function uploadMarkdownToPinata(markdown: string): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!jwt) {
    throw new Error(
      "Missing NEXT_PUBLIC_PINATA_JWT. Configure it before creating commitment proposals."
    );
  }

  const file = new Blob([markdown], { type: "text/markdown" });
  const formData = new FormData();
  formData.append("file", file, "payment-commitment.md");
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name: `autosol-commitment-${Date.now()}.md`,
    })
  );

  const response = await fetch(PINATA_FILE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { IpfsHash?: string };
  if (!payload.IpfsHash) {
    throw new Error("Pinata upload did not return an IpfsHash");
  }

  return `ipfs://${payload.IpfsHash}`;
}
