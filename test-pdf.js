try {
  console.log("Loading pdf-parse...");
  const pdf = require('pdf-parse');
  console.log("pdf-parse loaded successfully!", typeof pdf);
} catch (error) {
  console.error("Error loading pdf-parse:", error);
}
