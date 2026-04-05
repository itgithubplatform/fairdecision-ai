function safeJsonParse(rawText: string): any {
  let cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleanText);
  } catch (error) {
    cleanText = cleanText.replace(/,\s*$/, ""); 
    if (!cleanText.endsWith("]")) {
      if (!cleanText.endsWith("}")) {
        cleanText += "}"; 
      }
      cleanText += "]";
    }

    try {
      const healedJson = JSON.parse(cleanText);
      console.log("Successfully healed truncated JSON!");
      return healedJson;
    } catch (fatalError) {
      throw new Error("JSON is fundamentally broken and cannot be healed.");
    }
  }
}

export default safeJsonParse