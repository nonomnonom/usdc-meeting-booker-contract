export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_URL;
  
    const config = {
      accountAssociation: {
        header:
          "eyJmaWQiOjE5NjY0OCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGUzMTNGMDlDM2RkMzAzRjAzMzQ4QzA3N0NERjA2NEE5ZGY2MjI2NjIifQ",
        payload: "eyJkb21haW4iOiJsaWZlYWR2aWNlLXNpeC52ZXJjZWwuYXBwIn0",
        signature:
          "MHhiZWVkMWZhZjYxNmRjYWVlNTI1NTk0YzgxM2U1Y2EzMmExNWNmZjZmYTYxMDYwMTJiZWE5NGU5MDAzOTU5ODRkMDBkMjQ4MWRmNTY5YWQxOWQ5MmFhNWEyMWM5NjMyYTJmNmY5ZmJmMWEwOTkzYzY5OGY4ZWViOTA2MzJmZjg4NjFi",
      },
      frame: {
        version: "1",
        name: "lifeadvice",
        iconUrl: `${appUrl}/icon.jpg`,
        splashImageUrl: `${appUrl}/splash.jpg`,
        splashBackgroundColor: "#f7f7f7",
        homeUrl: appUrl,
        webhookUrl: `${appUrl}/api/webhook`,
      },
    };
  
    return Response.json(config);
  }