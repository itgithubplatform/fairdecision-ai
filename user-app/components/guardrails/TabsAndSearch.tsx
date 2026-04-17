import React from 'react'
import { TabsList, TabsTrigger } from '../ui/tabs'
import { Filter, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

export default function TabsAndSearch({ searchQuery, setSearchQuery, activeTab, setActiveTab, selectedCategory, setSelectedCategory, dynamicCategories }:{
    searchQuery: string,
    setSearchQuery: (query: string) => void,
    activeTab: string,
    setActiveTab: (tab: string) => void,
    selectedCategory: string,
    setSelectedCategory: (category: string) => void,
    dynamicCategories: string[]
}) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            
            <TabsList className="h-10! w-full md:w-auto bg-muted text-muted-foreground rounded-lg p-1 shrink-0">
              <TabsTrigger value="system" className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Aegis Templates
              </TabsTrigger>
              <TabsTrigger value="custom" className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Custom Guardrails
              </TabsTrigger>
            </TabsList>

            {/* Global Search & Conditional Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-[250px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text" 
                  placeholder="Search rules..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 h-9 text-[13px] bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                />
              </div>
              {activeTab === 'system' && (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 text-[13px] bg-background shadow-sm">
                    <div className="flex items-center">
                      <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="All Categories" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[13px]">All Categories</SelectItem>
                    {dynamicCategories.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-[13px]">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
  )
}
