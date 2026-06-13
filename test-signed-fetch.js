const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using env file or defaults
cloudinary.config({
  cloud_name: 'dgnabufda',
  api_key: '644342557871676',
  api_secret: 'R97w9lF3nB6VfK8C_M7r8cT1sA0' // read from local env
});

const getPublicIdFromUrl = (url) => {
  const parts = url.split('/raw/upload/');
  if (parts.length < 2) return '';
  const subParts = parts[1].split('/');
  if (subParts[0].startsWith('v') && !isNaN(Number(subParts[0].substring(1)))) {
    return subParts.slice(1).join('/');
  }
  return parts[1];
};

async function test() {
  const originalUrl = "https://res.cloudinary.com/dgnabufda/raw/upload/v1780571644/jobfusion-resumes/6a214cd92ae8423d5aaa0ff6_resume_1780571640419.pdf";
  const publicId = getPublicIdFromUrl(originalUrl);
  console.log("Extracted Public ID:", publicId);

  try {
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      sign_url: true
    });
    console.log("Generated Signed URL:", signedUrl);

    console.log("Fetching signed URL...");
    const res = await fetch(signedUrl);
    console.log("Status:", res.status);
    console.log("OK:", res.ok);
    
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      console.log("Download success! Buffer size:", buffer.byteLength);
    } else {
      console.log("X-Cld-Error Header:", res.headers.get("x-cld-error"));
    }
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();
