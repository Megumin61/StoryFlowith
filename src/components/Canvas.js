import React, { useEffect, useRef } from 'react';
import { Image, Frown, Meh, Smile, Lightbulb } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
import { getNodeDisplayWidth, getNodeHeight } from './layout/LayoutEngine';

function Canvas({ storyData, storyModel, selectedFrameId, onFrameSelect }) {
  const t = useLocale();
  const canvasWorldRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const isPanningRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const worldPosRef = useRef({ x: 0, y: 0 });
  const lastWorldPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    renderConnections();
    const cleanup = initCanvasControls();
    
    // 自动聚焦到选中的分镜（只在首次加载时）
    if (selectedFrameId && storyData.length > 0 && !worldPosRef.current.hasFocused) {
      const selectedFrame = storyData.find(frame => frame.id === selectedFrameId);
      if (selectedFrame && canvasWorldRef.current) {
        // 计算需要移动的距离，使选中的分镜居中显示
        const containerWidth = canvasContainerRef.current?.clientWidth || 800;
        const containerHeight = canvasContainerRef.current?.clientHeight || 600;
        const targetX = containerWidth / 2 - selectedFrame.pos.x - 144; // 144是分镜宽度的一半
        const targetY = containerHeight / 2 - selectedFrame.pos.y - 100; // 100是分镜高度的一半
        
        worldPosRef.current.x = targetX;
        worldPosRef.current.y = targetY;
        worldPosRef.current.hasFocused = true;
        
        if (canvasWorldRef.current) {
          canvasWorldRef.current.style.transform = `translate(${targetX}px, ${targetY}px)`;
        }
      }
    }
    
    return cleanup;
  }, [storyData, selectedFrameId]);

  const renderConnections = () => {
    const svg = document.getElementById('canvas-connections');
    if (!svg || !storyModel) return;
    
    // 清除现有的连接线和圆点，保留defs
    const existingDefs = svg.querySelector('defs');
    const existingPaths = svg.querySelectorAll('path');
    const existingCircles = svg.querySelectorAll('circle');
    existingPaths.forEach(path => path.remove());
    existingCircles.forEach(circle => circle.remove());
    
    if (!existingDefs) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6"
            orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af"></path>
        </marker>
      `;
      svg.appendChild(defs);
    }

    // 第一步：绘制分支内部的连线
    Object.values(storyModel.branches).forEach(branch => {
      const branchNodes = branch.nodeIds
        .map(nodeId => storyModel.nodes[nodeId])
        .filter(Boolean)
        .sort((a, b) => (a.nodeIndex || 0) - (b.nodeIndex || 0));
      
      // 在分支内的相邻节点之间绘制实线
      for (let i = 0; i < branchNodes.length - 1; i++) {
        const fromNode = branchNodes[i];
        const toNode = branchNodes[i + 1];
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // 动态计算节点宽度和高度
        const fromWidth = getNodeDisplayWidth(fromNode);
        const toWidth = getNodeDisplayWidth(toNode);
        const fromHeight = getNodeHeight(fromNode);
        const toHeight = getNodeHeight(toNode);
        
        // 连接基于真实显示宽度，避免重复叠加面板宽度
        const fromX = fromNode.pos.x + fromWidth;
        const fromY = fromNode.pos.y + fromHeight / 2;
        const toX = toNode.pos.x;
        const toY = toNode.pos.y + toHeight / 2;
        
        // 创建直线连接
        line.setAttribute('d', `M ${fromX} ${fromY} L ${toX} ${toY}`);
        line.setAttribute('stroke', '#9ca3af'); // 统一使用灰色
        line.setAttribute('stroke-width', '1.5'); // 细线
        line.setAttribute('fill', 'none');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        svg.appendChild(line);
        
        // 添加连接点圆点
        const fromCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        fromCircle.setAttribute('cx', fromX);
        fromCircle.setAttribute('cy', fromY);
        fromCircle.setAttribute('r', '3');
        fromCircle.setAttribute('fill', '#9ca3af');
        svg.appendChild(fromCircle);
        
        const toCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        toCircle.setAttribute('cx', toX);
        toCircle.setAttribute('cy', toY);
        toCircle.setAttribute('r', '3');
        toCircle.setAttribute('fill', '#9ca3af');
        svg.appendChild(toCircle);
      }
    });

    // 第二步：绘制分支点的连线（从起源节点到分支第一个节点）
    Object.values(storyModel.branches).forEach(branch => {
      if (branch.originNodeId && branch.nodeIds.length > 0) {
        const originNode = storyModel.nodes[branch.originNodeId];
        const firstBranchNode = storyModel.nodes[branch.nodeIds[0]];
        
        if (originNode && firstBranchNode) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          
          // 动态计算节点宽度和高度
                  const originWidth = getNodeDisplayWidth(originNode);
        const firstBranchWidth = getNodeDisplayWidth(firstBranchNode);
        const originHeight = getNodeHeight(originNode);
        const firstBranchHeight = getNodeHeight(firstBranchNode);
        
        // 基于真实显示宽度计算连接点
        const fromX = originNode.pos.x + originWidth;
        const fromY = originNode.pos.y + originHeight / 2;
        const toX = firstBranchNode.pos.x;
        const toY = firstBranchNode.pos.y + firstBranchHeight / 2;
          
          // 创建曲线连接
          const distance = Math.abs(toX - fromX);
          const controlX1 = fromX + distance * 0.3;
          const controlY1 = fromY;
          const controlX2 = toX - distance * 0.3;
          const controlY2 = toY;
          
          line.setAttribute('d', `M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`);
          line.setAttribute('stroke', '#9ca3af'); // 统一使用灰色
          line.setAttribute('stroke-width', '1.5'); // 细线
          line.setAttribute('stroke-dasharray', '4,4'); // 虚线表示分支
          line.setAttribute('fill', 'none');
          line.setAttribute('marker-end', 'url(#arrowhead)');
          
          svg.appendChild(line);
          
          // 添加连接点圆点
          const fromCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          fromCircle.setAttribute('cx', fromX);
          fromCircle.setAttribute('cy', fromY);
          fromCircle.setAttribute('r', '3');
          fromCircle.setAttribute('fill', '#9ca3af');
          svg.appendChild(fromCircle);
          
          const toCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          toCircle.setAttribute('cx', toX);
          toCircle.setAttribute('cy', toY);
          toCircle.setAttribute('r', '3');
          toCircle.setAttribute('fill', '#9ca3af');
          svg.appendChild(toCircle);
        }
      }
    });
  };

  const initCanvasControls = () => {
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return () => {};
    
    const handleMouseDown = (e) => {
      if (e.target.closest('.story-frame')) return;
      isPanningRef.current = true;
      canvasContainer.classList.add('grabbing');
      startPosRef.current = { x: e.clientX, y: e.clientY };
      lastWorldPosRef.current = { ...worldPosRef.current };
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isPanningRef.current) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      worldPosRef.current.x = lastWorldPosRef.current.x + dx;
      worldPosRef.current.y = lastWorldPosRef.current.y + dy;
      
      if (canvasWorldRef.current) {
        canvasWorldRef.current.style.transform = `translate(${worldPosRef.current.x}px, ${worldPosRef.current.y}px)`;
      }
    };

    const handleMouseUp = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      canvasContainer.classList.remove('grabbing');
    };

    canvasContainer.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvasContainer.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  };

  // 监听节点状态变化，重新渲染连接线
  useEffect(() => {
    const timer = setTimeout(() => {
      renderConnections();
    }, 200); // 增加延迟时间，确保DOM完全更新
    
    return () => clearTimeout(timer);
  }, [storyModel, selectedFrameId]); // 添加selectedFrameId依赖，确保选中状态变化时重新渲染

  // 添加额外的监听器，确保节点状态变化时重新渲染
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTimeout(() => {
        renderConnections();
      }, 100);
    });

    // 监听所有节点元素的变化
    const nodeElements = document.querySelectorAll('[data-node-id]');
    nodeElements.forEach(element => {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['data-expanded', 'data-node-width', 'data-node-height', 'data-state']
      });
    });

    return () => observer.disconnect();
  }, [storyModel, storyData]); // 添加storyData依赖，确保数据变化时重新设置监听器

  const renderEmotionIcon = (emotion, color) => {
    const props = { className: `text-${color} flex-shrink-0`, size: 20 };
    
    const emotionToIcon = { 
      'frown': Frown, 
      'meh': Meh, 
      'smile': Smile, 
      'lightbulb': Lightbulb,
      'frustrated': Frown,
      'neutral': Meh,
      'relieved': Smile
    };
    
    const IconComponent = emotionToIcon[emotion];
    return IconComponent ? <IconComponent {...props} /> : null;
  };
  
  return (
    <div id="canvas-container" className="flex-grow h-full overflow-hidden cursor-grab relative" ref={canvasContainerRef}>
      <div id="canvas-world" className="absolute top-0 left-0" ref={canvasWorldRef}>
        <svg id="canvas-connections" style={{ position: 'absolute', top: 0, left: 0, width: '5000px', height: '5000px', pointerEvents: 'none' }}></svg>
        <div id="canvas-frames-container">
          {storyData.map(frameData => (
            <div 
              key={frameData.id}
              className={`story-frame ${frameData.id === selectedFrameId ? 'selected' : ''}`}
              style={{ left: `${frameData.pos.x}px`, top: `${frameData.pos.y}px` }}
              onClick={() => onFrameSelect(frameData.id)}
            >
              <div className={`img-placeholder bg-gray-200 h-40 rounded-lg mb-3 flex items-center justify-center text-gray-400 ${
                frameData.style === t.canvas.styleCartoon ? 'style-cartoon' : 
                frameData.style === t.canvas.styleLineart ? 'style-lineart' : ''
              }`}>
                <Image className="w-16 h-16" />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800 flex-grow pr-2">{frameData.title}</h4>
                {renderEmotionIcon(frameData.emotion, frameData.color)}
              </div>
              <p className="text-sm text-gray-500 mt-1">{frameData.description}</p>
              {frameData.agentId && (
                <div className="mt-2 bg-blue-50 rounded-md px-2 py-1 text-xs text-blue-700 flex items-center">
                  <span className="mr-1">?</span> {t.canvas.userRoleBinding}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Canvas; 