export async function GET() {
  const appUrl = "https://jake-psi.vercel.app";

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjEwMjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxN2IzZmIzYTU4ZDc1RjFFMDRDNTFEQmVCMjdDNGEwOTQyRTk3MGE1In0",
      payload: "eyJkb21haW4iOiJmcmFtZS5saWZlLWFkdmljZS54eXoifQ",
      signature: "MHgxNjg2N2I5NjYxYjA1NzNiZTNiMDczMDYzM2U3YTAyYTkwMWQ4NTRjNTJjMjNiMTY0NjQ0ZGNiZThmYTFlYWQ2MGFjOWUzMmFmNTBjZTg4MjFmNGEyNzg4NjQ1NDYyOWEwMWE4NTA3N2JiMmFiMWIxODNkYzliNjVjNzliNmM5NzFj"
    },
    frame: {
      version: "1",
      name: "Life Advice",
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#fafaf9",
      homeUrl: appUrl,
      webhookUrl: `${appUrl}/api/webhook`
    }
  };

  return Response.json(config);
}
