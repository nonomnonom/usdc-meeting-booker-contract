export async function GET() {
  const appUrl = "https://jake-psi.vercel.app";

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjEwMjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxN2IzZmIzYTU4ZDc1RjFFMDRDNTFEQmVCMjdDNGEwOTQyRTk3MGE1In0",
      payload: "eyJkb21haW4iOiJqYWtlLXBzaS52ZXJjZWwuYXBwIn0",
      signature: "MHhhNjA4NDJiNDE0ZGZiMmI2YmNkZmJiMTU5M2ZkMzZkM2Y1Zjk5YTEyODM4MzA3MTVkN2JhMGQzZTY0MTNlYTA3NTQ4NzBjMjhkZmQyMmVmYjY3YzY5ZDdmMzQzMjc3MGUwNWJiMTAwMWQyZGViZmU3NDk0MWU4ZGQ4OGUwY2MxOTFj"
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
