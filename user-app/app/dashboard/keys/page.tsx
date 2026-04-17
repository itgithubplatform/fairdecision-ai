'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Key, Copy, Check, ShieldAlert, RefreshCw, 
  Terminal, Eye, EyeOff, Info, ArrowRight, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type Language = 'curl' | 'ts' | 'python' | 'go' | 'java'

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState<string | null>(null) 
  const [hasActiveKey, setHasActiveKey] = useState(false)  
  const [isChecking, setIsChecking] = useState(true)        
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  
  const [activeTab, setActiveTab] = useState<Language>('ts')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkKeyStatus = async () => {
      try {
        const res = await fetch('/api/keys')
        if (res.ok) {
          const data = await res.json()
          setHasActiveKey(data.hasKey)
        }
      } catch (err) {
        console.error("Failed to fetch key status")
      } finally {
        setIsChecking(false)
      }
    }
    checkKeyStatus()
  }, [])

  const generateKey = async () => {
    setIsGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/keys', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate key')
      const data = await res.json()
      setApiKey(data.apiKey)
      setHasActiveKey(true)
      setShowKey(true) 
    } catch (err) {
      setError('Failed to contact server. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string, type: 'key' | 'code') => {
    if (!text || text.includes('***')) return 
    navigator.clipboard.writeText(text)
    if (type === 'key') {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } else {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const displayKey = apiKey 
    ? (showKey ? apiKey : `${'*'.repeat(24)}`) 
    : (hasActiveKey ? `${'*'.repeat(24)}` : 'YOUR_API_KEY')

  const canRevealOrCopy = !!apiKey

  const snippets: Record<Language, string> = {
    curl: `curl -X POST "http://localhost:8000/v1/evaluate" \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "We are looking for digital natives to join our team.",
    "policies": ["EEOC", "FairLending", "Toxicity"],
    "action": "block"
  }'`,
    
    ts: `const response = await fetch('http://localhost:8000/v1/evaluate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${displayKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    prompt: 'We are looking for digital natives to join our team.',
    policies: ['EEOC', 'FairLending', 'Toxicity'],
    action: 'block'
  })
});

const data = await response.json();`,

    python: `import requests

headers = {
    "Authorization": f"Bearer {displayKey}",
    "Content-Type": "application/json"
}
payload = {
    "prompt": "We are looking for digital natives to join our team.",
    "policies": ["EEOC", "FairLending", "Toxicity"],
    "action": "block"
}

response = requests.post("http://localhost:8000/v1/evaluate", headers=headers, json=payload)
print(response.json())`,

    go: `package main

import (
  "bytes"
  "net/http"
)

func main() {
  jsonStr := []byte(\`{
    "prompt": "We are looking for digital natives...",
    "policies": ["EEOC", "FairLending"],
    "action": "block"
  }\`)
  req, _ := http.NewRequest("POST", "http://localhost:8000/v1/evaluate", bytes.NewBuffer(jsonStr))
  
  req.Header.Set("Authorization", "Bearer ${displayKey}")
  req.Header.Set("Content-Type", "application/json")

  client := &http.Client{}
  client.Do(req)
}`,

    java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        String payload = "{\\"prompt\\":\\"We are looking...\\", \\"policies\\":[\\"EEOC\\"]}";
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:8000/v1/evaluate"))
            .header("Authorization", "Bearer ${displayKey}")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();
            
        HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }
}`
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 font-sans animate-in fade-in duration-500">
      <div className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-2">API Authentication</h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
          Manage your cryptographic keys to authenticate directly with the Aegis security network. Use these keys to integrate real-time bias detection, toxicity filtering, and enterprise compliance guardrails into any application, chat platform, or AI pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Key Management */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-medium text-foreground tracking-wide">PRODUCTION KEY</h2>
              </div>
            </div>

            <div className="p-5">
              {error && <p className="text-destructive text-sm mb-4 font-medium">{error}</p>}
              
              {isChecking ? (
                 <div className="flex flex-col items-center justify-center py-12">
                   <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                 </div>
              ) : !hasActiveKey ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ShieldAlert className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Vault Locked</h3>
                  <p className="text-xs text-muted-foreground mb-6 max-w-[250px]">
                    Generate your first API key to unlock the integration snippets and begin protecting your data pipelines.
                  </p>
                  <Button onClick={generateKey} disabled={isGenerating} className="w-full sm:w-auto shadow-sm !px-5 !py-4 !rounded-md">
                    {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                    Generate Secret Key
                  </Button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    
                   <div className="flex items-start gap-3 p-3.5 bg-primary/5 border border-primary/10 rounded-lg">
                      <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-foreground/80 leading-relaxed">
                        <span className="font-semibold text-primary block mb-0.5">Store this securely.</span>
                        This is the only time your raw key will be displayed. We only store a cryptographic hash. If you lose it, roll the key.
                      </div>
                    </div> 

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secret Key</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative group">
                          <input
                            type="text"
                            readOnly
                            value={displayKey}
                            className={`w-full font-mono text-sm bg-muted/50 border border-border rounded-md py-2.5 pl-3 pr-10 text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all ${!canRevealOrCopy ? 'text-muted-foreground' : ''}`}
                          />
                          {canRevealOrCopy && (
                            <button 
                              onClick={() => setShowKey(!showKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                        <Button 
                          variant="secondary" 
                          className="w-12 px-0 shrink-0 border-border" 
                          onClick={() => copyToClipboard(apiKey || '', 'key')}
                          disabled={!canRevealOrCopy}
                        >
                          {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={generateKey} disabled={isGenerating}>
                        <RefreshCw className={`w-3 h-3 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                        Revoke & Roll Key
                      </Button>
                    </div>

                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col h-full min-h-[400px]">
          <div className="rounded-xl border border-border bg-zinc-950 shadow-lg overflow-hidden flex flex-col flex-1">
            <div className="flex items-center justify-between px-2 pt-2 bg-zinc-900 border-b border-zinc-800 overflow-x-auto no-scrollbar">
              <div className="flex space-x-1">
                {(['curl', 'ts', 'python', 'go', 'java'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveTab(lang)}
                    className={`px-4 py-2.5 text-xs font-medium font-mono transition-colors border-b-2 ${
                      activeTab === lang 
                        ? 'text-zinc-100 border-primary bg-zinc-800/50' 
                        : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/30'
                    }`}
                  >
                    {lang === 'ts' ? 'TypeScript' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 pr-2 shrink-0 pb-1">
                 {canRevealOrCopy && (
                   <button 
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-md hover:bg-zinc-800"
                    title="Toggle Key Visibility"
                   >
                     {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                 )}
                 <button 
                  onClick={() => copyToClipboard(snippets[activeTab], 'code')}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canRevealOrCopy}
                 >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                 </button>
              </div>
            </div>
            
            <div className="p-5 overflow-x-auto flex-1 bg-zinc-950">
              <pre className="text-[13px] text-zinc-300 font-mono leading-relaxed tracking-tight">
                <code>{snippets[activeTab]}</code>
              </pre>
            </div>

            <div className="px-5 py-3.5 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center text-xs text-zinc-400">
                <Terminal className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                Looking to explore all platform capabilities?
              </div>
              <Link 
                href="/docs" 
                className="text-xs text-primary-foreground hover:bg-primary bg-primary/80 py-2 px-4 border border-primary rounded-md font-medium flex items-center transition-colors group"
              >
                View full documentation 
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}