"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Save, Plus, Palette, Download, Loader2, X, Edit3, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface StoryNode {
  id: string
  plotDescription: string
  visualDescription: string
  imageUrl?: string
  isGenerating?: boolean
  hasImage?: boolean
  cardState: "collapsed" | "editing" | "generating" | "image" | "imageEditing"
}

const initialNodes: StoryNode[] = [
  {
    id: "1",
    plotDescription: "老人醒来，尝试语音开灯，感到困惑",
    visualDescription: "昏暗房间中老人皱眉，暖色调，床边场景",
    cardState: "collapsed",
  },
  {
    id: "2",
    plotDescription: "智能助手响应，但理解错误",
    visualDescription: "蓝色光环闪烁，老人疑惑表情，科技感",
    cardState: "collapsed",
  },
  {
    id: "3",
    plotDescription: "老人尝试手动开关，发现位置改变",
    visualDescription: "老人摸索墙壁，寻找开关，困惑手势",
    cardState: "collapsed",
  },
  {
    id: "4",
    plotDescription: "家人到达，解释智能家居系统",
    visualDescription: "年轻人展示手机应用，温馨交流",
    cardState: "collapsed",
  },
]

export default function StoryboardCanvas() {
  const [nodes, setNodes] = useState<StoryNode[]>(initialNodes)
  const [editingVisualPrompt, setEditingVisualPrompt] = useState("")
  const [regeneratePrompt, setRegeneratePrompt] = useState("")
  const [globalStyle, setGlobalStyle] = useState("realistic")

  const updateNodeState = (nodeId: string, newState: StoryNode["cardState"], updates?: Partial<StoryNode>) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              cardState: newState,
              ...updates,
            }
          : node,
      ),
    )
  }

  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return

    if (node.cardState === "collapsed") {
      setEditingVisualPrompt(node.visualDescription)
      updateNodeState(nodeId, "editing")
    }
  }

  const handleGenerateImage = async (nodeId: string) => {
    updateNodeState(nodeId, "generating", {
      visualDescription: editingVisualPrompt,
      isGenerating: true,
    })

    // 模拟API调用
    setTimeout(() => {
      updateNodeState(nodeId, "image", {
        isGenerating: false,
        hasImage: true,
        imageUrl: `/placeholder.svg?height=200&width=280&text=Scene+${nodeId}`,
      })
    }, 2000)
  }

  const handleImageClick = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (node?.cardState === "image") {
      setRegeneratePrompt("")
      updateNodeState(nodeId, "imageEditing")
    }
  }

  const handleRegenerateImage = async (nodeId: string) => {
    const prompt = regeneratePrompt.trim() || editingVisualPrompt

    updateNodeState(nodeId, "generating", {
      visualDescription: prompt,
      isGenerating: true,
    })

    setTimeout(() => {
      updateNodeState(nodeId, "image", {
        isGenerating: false,
        imageUrl: `/placeholder.svg?height=200&width=280&text=Regenerated+${nodeId}`,
      })
      setRegeneratePrompt("")
    }, 2000)
  }

  const handleAddNode = () => {
    const newNode: StoryNode = {
      id: Date.now().toString(),
      plotDescription: "新分镜场景描述",
      visualDescription: "新分镜的视觉描述",
      cardState: "collapsed",
    }
    setNodes((prev) => [...prev, newNode])
  }

  // 状态1：折叠状态 - 极简文字气泡
  const CollapsedCard = ({ node }: { node: StoryNode }) => (
    <Card
      className="w-64 p-6 bg-white border border-gray-100 hover:border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-sm"
      onClick={() => handleNodeClick(node.id)}
    >
      <div className="space-y-4">
        <div className="text-xs text-gray-400 font-medium tracking-wide">分镜 {node.id}</div>
        <div className="text-sm text-gray-900 leading-relaxed font-light">{node.plotDescription}</div>
        <div className="flex justify-center">
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </Card>
  )

  // 状态2：编辑状态 - 纵向扩展显示输入框
  const EditingCard = ({ node }: { node: StoryNode }) => (
    <Card className="w-64 bg-white border border-gray-200 shadow-sm transition-all duration-500">
      <div className="p-6 space-y-4">
        <div className="text-xs text-gray-400 font-medium tracking-wide">分镜 {node.id}</div>
        <div className="text-sm text-gray-900 leading-relaxed font-light">{node.plotDescription}</div>
      </div>

      <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-4">
        <div>
          <div className="text-xs text-gray-500 mb-2 font-medium">视觉描述</div>
          <Textarea
            value={editingVisualPrompt}
            onChange={(e) => setEditingVisualPrompt(e.target.value)}
            placeholder="描述画面的视觉元素..."
            className="w-full h-20 text-xs resize-none border-gray-100 focus:border-gray-200 bg-gray-50/50"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => updateNodeState(node.id, "collapsed")}
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-gray-500 hover:text-gray-700"
          >
            取消
          </Button>
          <Button
            onClick={() => handleGenerateImage(node.id)}
            size="sm"
            className="flex-1 h-8 text-xs bg-gray-900 hover:bg-gray-800 text-white"
          >
            生成
          </Button>
        </div>
      </div>
    </Card>
  )

  // 状态3：生成中状态
  const GeneratingCard = ({ node }: { node: StoryNode }) => (
    <Card className="w-64 bg-white border border-gray-100">
      <div className="p-6">
        <div className="text-xs text-gray-400 font-medium tracking-wide mb-4">分镜 {node.id}</div>
        <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto mb-2" />
            <div className="text-xs text-gray-500">生成中</div>
          </div>
        </div>
        <div className="text-sm text-gray-900 leading-relaxed font-light mt-4">{node.plotDescription}</div>
      </div>
    </Card>
  )

  // 状态4：图片展示状态
  const ImageCard = ({ node }: { node: StoryNode }) => (
    <Card className="w-64 bg-white border border-gray-100 hover:border-gray-200 transition-all duration-300 group">
      <div className="relative">
        <img
          src={node.imageUrl || "/placeholder.svg"}
          alt={`分镜 ${node.id}`}
          className="w-full h-40 object-cover cursor-pointer"
          onClick={() => handleImageClick(node.id)}
        />
        {/* 悬浮编辑提示 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
              <Edit3 className="w-3 h-3 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="text-xs text-gray-400 font-medium tracking-wide mb-2">分镜 {node.id}</div>
        <div className="text-sm text-gray-900 leading-relaxed font-light">{node.plotDescription}</div>
      </div>
    </Card>
  )

  // 状态5：图片编辑状态 - 悬浮编辑层
  const ImageEditingCard = ({ node }: { node: StoryNode }) => (
    <Card className="w-64 bg-white border border-gray-200 shadow-lg relative">
      <div className="relative">
        <img
          src={node.imageUrl || "/placeholder.svg"}
          alt={`分镜 ${node.id}`}
          className="w-full h-40 object-cover opacity-75"
        />

        {/* 悬浮编辑层 */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-4 flex flex-col justify-center">
          <div className="space-y-3">
            <div className="text-xs text-gray-500 text-center mb-2">修改图像</div>

            <Input
              value={regeneratePrompt}
              onChange={(e) => setRegeneratePrompt(e.target.value)}
              placeholder="输入修改要求..."
              className="w-full h-8 text-xs border-gray-200 bg-white/80"
            />

            <div className="flex gap-2">
              <Button
                onClick={() => updateNodeState(node.id, "image")}
                variant="ghost"
                size="sm"
                className="flex-1 h-7 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                取消
              </Button>
              <Button
                onClick={() => handleRegenerateImage(node.id)}
                size="sm"
                className="flex-1 h-7 text-xs bg-gray-900 hover:bg-gray-800"
              >
                <Check className="w-3 h-3 mr-1" />
                重新生成
              </Button>
            </div>

            <div className="text-xs text-gray-400 text-center">当前：{node.visualDescription.slice(0, 30)}...</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="text-xs text-gray-400 font-medium tracking-wide mb-2">分镜 {node.id}</div>
        <div className="text-sm text-gray-900 leading-relaxed font-light">{node.plotDescription}</div>
      </div>
    </Card>
  )

  const renderCard = (node: StoryNode) => {
    switch (node.cardState) {
      case "collapsed":
        return <CollapsedCard key={node.id} node={node} />
      case "editing":
        return <EditingCard key={node.id} node={node} />
      case "generating":
        return <GeneratingCard key={node.id} node={node} />
      case "image":
        return <ImageCard key={node.id} node={node} />
      case "imageEditing":
        return <ImageEditingCard key={node.id} node={node} />
      default:
        return <CollapsedCard key={node.id} node={node} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* 极简顶部导航 */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-8 py-4">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Palette className="w-4 h-4 mr-2" />
                  风格
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-gray-100">
                <DropdownMenuItem onClick={() => setGlobalStyle("realistic")}>写实</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGlobalStyle("cartoon")}>卡通</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGlobalStyle("anime")}>动漫</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleAddNode} variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Plus className="w-4 h-4 mr-2" />
              添加
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="p-8">
        <div className="flex flex-wrap gap-6">{nodes.map((node) => renderCard(node))}</div>
      </div>
    </div>
  )
}
