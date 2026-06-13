"use client";

import { useState } from "react";

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null);

  const uploadFile = async () => {
  alert("Upload Started");

  if (!file) {
    alert("Please select a file");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-resume", {
      method: "POST",
      body: formData,
    });

    alert(`Status: ${res.status}`);

    const data = await res.json();

    console.log(data);

    alert(JSON.stringify(data));
  } catch (error) {
    console.error(error);
    alert("Upload Failed");
  }
};

  return (
    <div className="p-10">
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
  onClick={() => {
    alert("Upload button clicked");
  }}
>
  Upload
</button>
    </div>
  );
}