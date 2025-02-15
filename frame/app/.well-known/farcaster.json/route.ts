export async function GET() {
  const appUrl = "https://jake-psi.vercel.app";

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjEwMjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxN2IzZmIzYTU4ZDc1RjFFMDRDNTFEQmVCMjdDNGEwOTQyRTk3MGE1In0",
      payload: "eyJkb21haW4iOiJqYWtlLXBzaS52ZXJjZWwuYXBwIn0",
      signature: "MHgzZGNmOWRiNTg1ZjYzNzkyMTU4MjIzMThmOTBkZWM4OWMyYjhjOGZmMmI3NTI4NWUyMmM2NTM0NDRmODU2ZTg5MTE5MzMyYjIyZTNjYTNhNDdiNWIwNmVkZWM3ZDc2MWEzYjQ3ZjZmM2FkYzhiY2IxNjdlOWM5YmJmYmI5ZWU3YTFi"
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
