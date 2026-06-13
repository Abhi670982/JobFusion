async function test() {
  const userId = "6a270bdeaa5d67f12a36b2cd";
  try {
    console.log("Calling /api/parse-resume for userId:", userId);
    const res = await fetch("http://localhost:3000/api/parse-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    console.log("Status code:", res.status);
    const text = await res.text();
    console.log("Response headers:", Object.fromEntries(res.headers.entries()));
    try {
      const parseResult = JSON.parse(text);
      console.log("Response data:", JSON.stringify(parseResult, null, 2));
    } catch (e) {
      console.log("Response is not JSON. Raw body (truncated):", text.slice(0, 500));
    }
  } catch (error) {
    console.error("Error in test script:", error);
  }
}

test();
