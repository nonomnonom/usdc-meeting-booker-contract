export async function GET() {
    const appUrl = process.env.NEXT_PUBLIC_URL;
  
    const config = {
      accountAssociation: {
        header:
          "eyJmaWQiOjE5NjY0OCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGUzMTNGMDlDM2RkMzAzRjAzMzQ4QzA3N0NERjA2NEE5ZGY2MjI2NjIifQ",
        payload: "eyJkb21haW4iOiJ1c2RjLW1lZXRpbmctYm9va2VyLWNvbnRyYWN0LnZlcmNlbC5hcHAifQ",
        signature:
          "MHhlMjlkMThhMThmZWZjZTYwZDRjNDRmMTljYmJiYzZiYmUwMzA1ZjM2ZDY3OTkzOWUyMWRmZDY1MmM5OTFjYzhhMTJkYTRjYzc2MzJjNDUwZGEwYTgwMGMzNGM0OTVlZDk0ZjQ2NTQ0NGJlNzc1ZTU2NjNlNDA2MmUxMDc0NDY1NjFj",
      },
      frame: {
        version: "1",
        name: "native",
        iconUrl: `${appUrl}/icon.png`,
        splashImageUrl: `${appUrl}/splash.png`,
        splashBackgroundColor: "#f7f7f7",
        homeUrl: appUrl,
        webhookUrl: `${appUrl}/api/webhook`,
      },
    };
  
    return Response.json(config);
  }