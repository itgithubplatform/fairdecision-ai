"use client";

import React, { useState } from "react";
import {
    Check, Copy, Key, FileJson, Server, Zap,
    Layers, MessageSquare, Info, Split, Activity, Code2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";

const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://api.aegis.com";

// --- API SNIPPETS ---
const EVAL_SNIPPETS: Record<string, string> = {
    cURL: `curl -X POST ${BASE_URL}/api/v1/evaluate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "We are seeking digital natives for this role.",
    "action": "block"
  }'`,

    TypeScript: `// 1. Handling Large Text Chunking
const chunkText = (text: string, size = 2000) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.substring(i, i + size));
  }
  return chunks;
};

// 2. Sequential Evaluation
const evaluateLargeNLP = async (fullText: string) => {
  const parts = chunkText(fullText);
  for (const part of parts) {
    const res = await fetch('${BASE_URL}/api/v1/evaluate', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer KEY', 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: part, action: 'block' })
    });
    const result = await res.json();
    if (!result.isSafe) return result; // Intercept early
  }
};`,

    Python: `import requests

def evaluate_stream(text_chunk):
    url = "${BASE_URL}/api/v1/evaluate"
    headers = {"Authorization": "Bearer YOUR_API_KEY"}
    payload = {"prompt": text_chunk, "action": "block"}
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Process LLM stream chunks one-by-one
for chunk in llm_response_stream:
    verdict = evaluate_stream(chunk)
    if not verdict['isSafe']:
        stop_stream()
        break`,

    Go: `func evaluate(chunk string) {
    url := "${BASE_URL}/api/v1/evaluate"
    payload := []byte(fmt.Sprintf(\`{"prompt": "%s", "action": "block"}\`, chunk))
    req, _ := http.NewRequest("POST", url, bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer YOUR_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    // Handle Verdict...
}`,

    Java: `// Java 11+ HttpClient Implementation
var request = HttpRequest.newBuilder()
    .uri(URI.create("${BASE_URL}/api/v1/evaluate"))
    .header("Authorization", "Bearer YOUR_KEY")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
    .build();

var response = HttpClient.newHttpClient()
    .send(request, HttpResponse.BodyHandlers.ofString());`
};

const RULES_GET_SNIPPETS: Record<string, string> = {
    cURL: `curl -X GET ${BASE_URL}/api/v1/rules \\\n  -H "Authorization: Bearer YOUR_API_KEY"`,
    TypeScript: `const response = await fetch('${BASE_URL}/api/v1/rules', {\n  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }\n});\nconst rules = await response.json();`,
    Python: `import requests\n\nresponse = requests.get(\n    "${BASE_URL}/api/v1/rules",\n    headers={"Authorization": "Bearer YOUR_API_KEY"}\n)\nprint(response.json())`,
    Go: `req, _ := http.NewRequest("GET", "${BASE_URL}/api/v1/rules", nil)\nreq.Header.Set("Authorization", "Bearer YOUR_KEY")\nclient := &http.Client{}\nresp, _ := client.Do(req)`,
    Java: `var request = HttpRequest.newBuilder()\n    .uri(URI.create("${BASE_URL}/api/v1/rules"))\n    .header("Authorization", "Bearer YOUR_KEY")\n    .GET()\n    .build();`
};

const RULES_POST_SNIPPETS: Record<string, string> = {
    cURL: `curl -X POST ${BASE_URL}/api/v1/rules \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"ruleText": "Reject origin mandates", "category": "Compliance"}'`,
    TypeScript: `const response = await fetch('${BASE_URL}/api/v1/rules', {\n  method: 'POST',\n  headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },\n  body: JSON.stringify({ ruleText: "Reject origin mandates", category: "Compliance" })\n});`,
    Python: `import requests\nresponse = requests.post("${BASE_URL}/api/v1/rules", headers={"Authorization": "Bearer YOUR_API_KEY"}, json={"ruleText": "Reject origin mandates", "category": "Compliance"})`,
    Go: `payload := []byte(\`{"ruleText": "Reject origin mandates", "category": "Compliance"}\`)\nreq, _ := http.NewRequest("POST", "${BASE_URL}/api/v1/rules", bytes.NewBuffer(payload))\nreq.Header.Set("Authorization", "Bearer YOUR_KEY")\nreq.Header.Set("Content-Type", "application/json")`,
    Java: `var request = HttpRequest.newBuilder()\n    .uri(URI.create("${BASE_URL}/api/v1/rules"))\n    .header("Authorization", "Bearer YOUR_KEY")\n    .header("Content-Type", "application/json")\n    .POST(HttpRequest.BodyPublishers.ofString("{\\"ruleText\\":\\"Reject origin mandates\\"}"))\n    .build();`
};

const RESPONSES = {
    eval: `{\n  "action": "BLOCK",\n  "isSafe": false,\n  "reason": "Violation of Age Bias Policy",\n  "violations": [{ "rule": "Age Policy", "score": 0.89 }],\n  "metrics": { "latency_ms": 42.5 }\n}`,
    rulesGet: `[\n  {\n    "id": "cm2a9xb1...",\n    "createdAt": "2026-04-27T02:19:33.000Z",\n    "updatedAt": "2026-04-27T02:19:33.000Z",\n    "userId": "usr_992",\n    "isActive": true,\n    "ruleText": "Block implicit age bias including terms like 'digital native'.",\n    "category": "HR Compliance",\n    "sourcePrompt": null,\n    "isSystem": false\n  }\n]`,
    rulesPost: `{\n  "id": "cm2a9xb1...",\n  "createdAt": "2026-04-27T02:19:33.000Z",\n  "updatedAt": "2026-04-27T02:19:33.000Z",\n  "userId": "usr_992",\n  "isActive": true,\n  "ruleText": "Reject origin mandates",\n  "category": "Compliance",\n  "sourcePrompt": null,\n  "isSystem": false\n}`
};

// --- SUB-COMPONENTS ---
function CodeBlock({ snippets, responseJSON }: { snippets: Record<string, string>, responseJSON?: string }) {
    const [activeLang, setActiveLang] = useState("cURL");
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(snippets[activeLang]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full flex flex-col gap-4">

            {/* Snippet Container */}
            <div className="w-full rounded-xl border border-zinc-800 bg-[#0A0A0A] shadow-2xl overflow-hidden ring-1 ring-white/5">
                <Tabs value={activeLang} onValueChange={setActiveLang} className="flex flex-col w-full">

                    {/* Tab Header */}
                    <div className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800/80 relative z-10">
                        <div className="flex-1 overflow-x-auto hide-scrollbar">
                            <TabsList className="bg-transparent h-12 p-0 flex justify-start w-max px-2">
                                {Object.keys(snippets).map((lang) => (
                                    <TabsTrigger
                                        key={lang}
                                        value={lang}
                                        className="text-gray-500 data-[state=active]:text-zinc-100 data-[state=active]:bg-zinc-800/80 rounded-none hover:text-zinc-300 border-0 border-b-2 data-[state=active]:border-primary px-3"
                                    >
                                        {lang}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* Copy Button Container */}
                        <div className="px-2 border-l border-zinc-800/50">
                            <button
                                onClick={handleCopy}
                                className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Code Content - Notice there is no wrapper div here anymore */}
                    {Object.entries(snippets).map(([lang, code]) => (
                        <TabsContent
                            key={lang}
                            value={lang}
                            className="p-0 m-0 border-none outline-none mt-0 data-[state=inactive]:hidden"
                        >
                            <div className="w-full overflow-x-auto bg-[#0A0A0A]">
                                <pre className="p-4 text-[13px] font-mono leading-relaxed text-zinc-300 whitespace-pre">
                                    <code>{code}</code>
                                </pre>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Response Container */}
            {responseJSON && (
                <div className="w-full rounded-xl border border-zinc-800 bg-[#0A0A0A] shadow-2xl overflow-hidden ring-1 ring-white/5">
                    <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-zinc-800/80">
                        <span className="text-xs font-mono tracking-wide text-zinc-400 flex items-center">
                            <FileJson className="w-3.5 h-3.5 mr-2" /> RESPONSE
                        </span>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase">
                            200 OK
                        </Badge>
                    </div>
                    <div className="w-full overflow-x-auto bg-[#0A0A0A]">
                        <pre className="p-4 text-[13px] font-mono leading-relaxed text-emerald-400/90 whitespace-pre">
                            <code>{responseJSON}</code>
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
export default function ApiDocs() {
    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12 font-sans animate-in fade-in duration-500">

            {/* 1. HERO HEADER */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12 border-b border-border/60 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                            <Code2 className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">API Reference</h1>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                        Aegis is a high-performance NLP & LLM security layer. Screen user prompts or model outputs for bias, toxicity, and compliance in sub-Second.
                    </p>
                </div>
                <div className="flex shrink-0">
                    <Badge variant="outline" className="py-3 px-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <Activity className="w-3.5 h-3.5 mr-2" /> System Operational
                    </Badge>
                </div>
            </header>

            <div className="space-y-24">

                {/* --- AUTHENTICATION SECTION --- */}
                <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-16 items-start">
                    <div className="xl:col-span-5 space-y-4">
                        <div className="flex items-center gap-2 text-2xl font-bold">
                            <Key className="w-6 h-6 text-primary" /> Authentication
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Authenticate your requests by including your API key in the <code className="text-primary font-mono bg-primary/5 px-1.5 py-0.5 rounded text-sm">Authorization</code> header as a Bearer token.
                        </p>
                    </div>
                    <div className="xl:col-span-7 w-full min-w-0">
                        <Card className="bg-[#0A0A0A] border-zinc-800 shadow-2xl">
                            <CardContent className="p-4 font-mono text-sm text-zinc-300 overflow-x-auto whitespace-nowrap">
                                Authorization: Bearer <span className="text-emerald-400">your_secret_key</span>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* --- ENDPOINT: EVALUATE --- */}
                <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-16 items-start border-t border-border/50 pt-16">
                    <div className="xl:col-span-5 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Badge className="bg-blue-600 text-white hover:bg-blue-700 uppercase tracking-widest px-2 py-1">POST</Badge>
                                <h2 className="text-2xl font-bold tracking-tight">Evaluate Payload</h2>
                            </div>
                            <p className="text-sm font-mono bg-muted/50 px-2 py-1 rounded-md inline-block text-muted-foreground border">
                                /api/v1/evaluate
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="bg-background shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> NLP Input</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                                    Evaluate raw user prompts for toxicity or implicit bias before they reach your LLM.
                                </CardContent>
                            </Card>
                            <Card className="bg-background shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500" /> LLM Output</CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                                    Evaluate model response chunks in real-time to prevent harmful or non-compliant generation.
                                </CardContent>
                            </Card>
                        </div>

                        <Accordion type="single" collapsible className="w-full bg-muted/30 rounded-lg border px-4">
                            <AccordionItem value="item-1" className="border-b-border/50">
                                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                    <div className="flex items-center gap-2"><Split className="w-4 h-4 text-primary" /> Large Text Handling (Chunking)</div>
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-sm leading-relaxed space-y-3 pb-4">
                                    <p>To maintain sub-second latency across the proxy, the Aegis NLP engine enforces a strict <code className="bg-background border px-1 rounded text-foreground">2,000 characters</code> limit per request. When processing large documents or datasets, clients must split the payload into smaller chunks.</p>
                                    <li className="list-disc list-inside">
                                        <strong className="text-black">Context Preservation:</strong> To prevent losing semantic context at chunk boundaries, we highly recommend using a <code className="bg-background border px-1 rounded text-foreground">10% overlapping</code> sliding window or chunking strictly by sentence boundaries.
                                    </li>
                                    <li className="list-disc list-inside">
                                       <strong className="text-black">Fail-Fast Execution:</strong> Process chunks sequentially. If any single chunk returns a <code className="bg-background border px-1 rounded text-red-500">BLOCK</code> action, immediately terminate the evaluation pipeline to conserve compute and API bandwidth.
                                    </li>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2" className="border-none">
                                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                                    <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> LLM Streaming Strategy</div>
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                                    <p>Aegis is optimized to secure real-time generative AI applications. Instead of waiting for a complete LLM response — which exposes users to potential toxicity before the check is complete — Aegis evaluates streams in flight.</p>
                                    <li className="list-disc list-inside">
                                        <strong className="text-black">Buffering Tokens:</strong> As your LLM streams output, buffer the tokens client-side. For the optimal balance of network latency and semantic awareness, we recommend piping buffers to the evaluation endpoint at sentence completions or in <code className="bg-background border px-1 rounded text-foreground">50-token</code> intervals.
                                    </li>
                                    <li className="list-disc list-inside">
                                        <strong className="text-black">Stream Interruption: </strong>If Aegis detects a violation and returns a <code className="bg-background border px-1 rounded text-red-500">BLOCK</code> flag, instantly halt the LLM stream. This prevents harmful content from rendering on the UI and saves downstream inference costs.
                                    </li>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <div className="xl:col-span-7 w-full xl:sticky xl:top-8 min-w-0">
                        <CodeBlock snippets={EVAL_SNIPPETS} responseJSON={RESPONSES.eval} />
                    </div>
                </section>

                {/* --- ENDPOINT: GET RULES --- */}
                <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-16 items-start border-t border-border/50 pt-16">
                    <div className="xl:col-span-5 space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-500/10 uppercase tracking-widest px-2 py-1">GET</Badge>
                                <h2 className="text-2xl font-bold tracking-tight">List Policies</h2>
                            </div>
                            <p className="text-sm font-mono bg-muted/50 px-2 py-1 rounded-md inline-block text-muted-foreground border">
                                /api/v1/rules
                            </p>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Retrieve all active guardrail policies configured in your workspace. These rules represent the underlying semantic vectors loaded into your live proxy environment.
                        </p>
                    </div>

                    <div className="xl:col-span-7 w-full xl:sticky xl:top-8 min-w-0">
                        <CodeBlock snippets={RULES_GET_SNIPPETS} responseJSON={RESPONSES.rulesGet} />
                    </div>
                </section>

                {/* --- ENDPOINT: POST RULES --- */}
                <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-16 items-start border-t border-border/50 pt-16 pb-16">
                    <div className="xl:col-span-5 space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Badge className="bg-blue-600 text-white hover:bg-blue-700 uppercase tracking-widest px-2 py-1">POST</Badge>
                                <h2 className="text-2xl font-bold tracking-tight">Deploy Policy</h2>
                            </div>
                            <p className="text-sm font-mono bg-muted/50 px-2 py-1 rounded-md inline-block text-muted-foreground border">
                                /api/v1/rules
                            </p>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            Programmatically deploy a new safety rule. The system will automatically embed the rule text and update the semantic routing engine in real-time without downtime.
                        </p>
                    </div>

                    <div className="xl:col-span-7 w-full xl:sticky xl:top-8 min-w-0">
                        <CodeBlock snippets={RULES_POST_SNIPPETS} responseJSON={RESPONSES.rulesPost} />
                    </div>
                </section>

            </div>
        </div>
    );
}