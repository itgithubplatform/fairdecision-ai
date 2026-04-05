import { SchemaType } from "@google-cloud/vertexai";

export const auditSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      log_id: { type: SchemaType.STRING },
      step_by_step_reasoning: { 
        type: SchemaType.STRING,
        description: "Think out loud. Why did the guardrail make this decision? Was it correct?"
      },
      final_verdict: { 
        type: SchemaType.STRING,
        enum: ["AGREE", "FALSE_POSITIVE", "FALSE_NEGATIVE"]
      },
      suggested_rule_update: { 
        type: SchemaType.STRING,
        description: "If the guardrail failed, write a 1-sentence fix for the rule string."
      }
    },
    required: ["log_id", "step_by_step_reasoning", "final_verdict"]
  }
};