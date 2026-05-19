"use client"

import React, { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Map,
  Building2,
  Layers,
  Home,
  CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Node {
  id: string
  type: "Project" | "Outside" | "Tower" | "Floor" | "Flat"
  name: string
  metadata?: string
  subtext?: string
  children?: Node[]
  isOpen?: boolean
}

const structureData: Node = {
  id: "p1",
  type: "Project",
  name: "VPG Grande",
  isOpen: true,
  children: [
    {
      id: "a1",
      type: "Outside",
      name: "Non Tower Area",
      isOpen: true,
      children: [
        { id: "s1", type: "Outside", name: "Swimming Pool" },
        { id: "s2", type: "Outside", name: "Garden Area" },
        { id: "s3", type: "Outside", name: "Parking Lot" },
      ]
    },
    {
      id: "t1",
      type: "Tower",
      name: "Tower Alpha",
      metadata: "1 Floors",
      subtext: "T-01",
      isOpen: true,
      children: [
        {
          id: "f1",
          type: "Floor",
          name: "Floor 1",
          metadata: "2 Flats",
          subtext: "01",
          isOpen: true,
          children: [
            { id: "fl1", type: "Flat", name: "Flat 101", subtext: "101" },
            { id: "fl2", type: "Flat", name: "Flat 102", subtext: "102" },
          ]
        }
      ]
    },
    {
      id: "t2",
      type: "Tower",
      name: "Tower Beta",
      metadata: "0 Floors",
      subtext: "T-02",
      isOpen: false,
    }
  ]
}

const TypeTag = ({ type, metadata }: { type: Node["type"], metadata?: string }) => {
  const styles = {
    Project: "bg-blue-50 text-blue-600 border-blue-100",
    Outside: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Tower: "bg-indigo-50 text-indigo-600 border-indigo-100",
    Floor: "bg-purple-50 text-purple-600 border-purple-100",
    Flat: "bg-cyan-50 text-cyan-600 border-cyan-100",
  }

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
        styles[type]
      )}>
        {type}
      </span>
      {metadata && (
        <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold border border-zinc-200">
          {metadata}
        </span>
      )}
    </div>
  )
}

const NodeIcon = ({ type }: { type: Node["type"] }) => {
  const icons = {
    Project: <LayoutGrid className="h-4 w-4" />,
    Outside: <Map className="h-4 w-4" />,
    Tower: <Building2 className="h-4 w-4" />,
    Floor: <Layers className="h-4 w-4" />,
    Flat: <Home className="h-4 w-4" />,
  }

  const bgStyles = {
    Project: "bg-blue-50 text-blue-500 border-blue-100",
    Outside: "bg-emerald-50 text-emerald-500 border-emerald-100",
    Tower: "bg-indigo-50 text-indigo-500 border-indigo-100",
    Floor: "bg-purple-50 text-purple-500 border-purple-100",
    Flat: "bg-cyan-50 text-cyan-500 border-cyan-100",
  }

  return (
    <div className={cn(
      "h-10 w-10 rounded-2xl flex items-center justify-center border-2 shrink-0 shadow-sm",
      bgStyles[type]
    )}>
      {icons[type]}
    </div>
  )
}

const TreeNode = ({ node, isLast, level }: { node: Node, isLast: boolean, level: number }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? false)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="relative">
      {/* Branch Line (Horizontal part of L) */}
      {level > 0 && (
        <div className="absolute left-[-28px] top-[26px] w-[28px] h-[1px] bg-zinc-200" />
      )}

      <div className="flex items-start gap-4 py-3">
        <div className="flex items-center justify-center w-6 h-10 shrink-0">
          {hasChildren && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors z-10"
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>

        <NodeIcon type={node.type} />

        <div className="flex flex-col gap-0.5 justify-center h-10">
          <TypeTag type={node.type} metadata={node.metadata} />
          <span className="font-black text-zinc-900 leading-none">
            {node.name}
          </span>
          {node.subtext && (
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter mt-0.5">
              {node.subtext}
            </span>
          )}
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="ml-[62px] relative">
          {/* Vertical line connecting children (Vertical part of L) */}
          {/* It starts from the parent's icon area and ends at the last child's horizontal branch */}
          <div className={cn(
            "absolute left-[-28px] top-[-10px] w-[1px] bg-zinc-200",
            isLast ? "h-[20px]" : "bottom-[26px]" // This logic is slightly flawed for recursion
          )}
            style={{
              height: isLast ? '0px' : 'calc(100% - 10px)',
              bottom: '26px'
            }}
          />
          {/* Simpler approach: a line that always goes from top to bottom, but we hide it for the last node if it's a leaf? No. */}
          {/* Let's use a border on the container and rely on the child to "cover" the bottom part if needed, 
              but standard tree lines are usually handled by a vertical line that extends from the parent down to the last child's branch. */}
          <div className="absolute left-[-28px] top-[-10px] bottom-[26px] w-[1px] bg-zinc-200" />

          {node.children?.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isLast={index === (node.children?.length ?? 0) - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ProjectStructure() {
  return (
    <div className="bg-white border border-zinc-200 rounded-[32px] p-6 sm:p-10 shadow-sm text-left">
      <div className="flex items-center gap-3 mb-10 pb-6 border-b border-zinc-100">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Project Structure</h2>
      </div>

      <div className="max-w-full">
        <TreeNode node={structureData} level={0} isLast={true} />
      </div>
    </div>
  )
}
