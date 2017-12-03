export default {
  id: "summarizer-distribution",
  name: "Details about the downloadURL link status of a distribution",
  jsonSchema: require("@magda/registry-aspects/summarizer-distribution.schema.json")
};

export interface SummarizeAspect {
  status: RetrieveResult;
  errorDetails?: any,
  summary: Summary,
}

export type RetrieveResult = "isValid" | "unknown" | "isNotValid";
export type Summary = string;