// app/api/additionalData/route.ts
export async function GET() {
  return Response.json({
    AAPL: { 
      marketCap: "2.8T", 
      companyDescription: "Apple Inc. designs, manufactures, and markets consumer electronics, software, and services.", 
      daysTillEarnings: 15 
    },
    TSLA: { 
      marketCap: "750B", 
      companyDescription: "Tesla Inc. designs and manufactures electric vehicles and energy storage solutions.", 
      daysTillEarnings: 10 
    },
    NVDA: { 
      marketCap: "1.2T", 
      companyDescription: "NVIDIA Corporation develops GPUs for gaming and professional markets, as well as AI and data center applications.", 
      daysTillEarnings: 18 
    },
    GOOGL: { 
      marketCap: "1.7T", 
      companyDescription: "Alphabet Inc. is a multinational conglomerate primarily known for Google and its various digital services.", 
      daysTillEarnings: 7 
    },
    AMZN: { 
      marketCap: "1.5T", 
      companyDescription: "Amazon.com Inc. is a global e-commerce and cloud computing company.", 
      daysTillEarnings: 21 
    },
    MSFT: { 
      marketCap: "2.9T", 
      companyDescription: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.", 
      daysTillEarnings: 12 
    }
  });
}
