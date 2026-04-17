import { VertexAI, Schema, SchemaType } from "@google-cloud/vertexai";

const ruleSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    ruleText: {
      type: SchemaType.STRING,
      description: "A highly concise, binary policy directive. Must act as a strict decision boundary for a classifier. Maximum 15 words. Must start with an action verb (e.g., 'Block', 'Reject', 'Flag', 'Prevent')."
    },
    category: {
      type: SchemaType.STRING,
      description: "A 1-3 word macro-category for the rule (e.g., 'Data Security', 'Toxicity', 'Age Bias')."
    }
  },
  required: ["ruleText", "category"],
}

export async function askVertex(prompt: string): Promise<string> {
  const vertex = new VertexAI({
    project: process.env.GOOGLE_PROJECT_ID!,
    // location: "asia-south1",
    googleAuthOptions: {
      // keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      credentials:JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || "{}")
    },
  });
  
   const careerModel = vertex.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: {
        role: "system",
        parts: [{ 
          text: `You are an AI constraint generator. 
                 Translate user intent into a strict, machine-readable semantic rule for an NLP classifier.
                 Strip away all conversational context. Extract ONLY the core restriction.
                 The rule must evaluate as a true/false binary.` 
        }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ruleSchema,
        temperature: 0.1,
      }
  });
  const resp = await careerModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return resp.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

