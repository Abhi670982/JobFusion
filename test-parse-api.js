async function test() {
  const userId = "6a214cd92ae8423d5aaa0ff6";
  try {
    console.log("Calling /api/parse-resume for userId:", userId);
    const res = await fetch("http://localhost:3000/api/parse-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    console.log("Status code:", res.status);
    const parseResult = await res.json();
    console.log("Response data:", JSON.stringify(parseResult, null, 2));
  } catch (error) {
    console.error("Error in test script:", error);
  }
}

test();
