import React, { useEffect, useRef } from 'react';
import { Image, Frown, Meh, Smile, Lightbulb } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';

function Canvas({ storyData, selectedFrameId, onFrameSelect }) {
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
    return cleanup;
  }, [storyData, selectedFrameId]);

  const renderConnections = () => {
    const svg = document.getElementById('canvas-connections');
    if (!svg) return;
    
    const existingDefs = svg.querySelector('defs');
    svg.innerHTML = '';
    if(existingDefs) svg.appendChild(existingDefs);

    if (!svg.querySelector('#arrowhead')) {
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

    storyData.forEach(fromFrameData => {
      if (fromFrameData.connections && fromFrameData.connections.length > 0) {
        fromFrameData.connections.forEach(toId => {
          const toFrameData = storyData.find(f => f.id === toId);
          if (toFrameData) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const fromX = fromFrameData.pos.x + 288;
            const fromY = fromFrameData.pos.y + 125;
            const toX = toFrameData.pos.x;
            const toY = toFrameData.pos.y + 125;
            
            const controlX1 = fromX + Math.abs(toX-fromX) * 0.5;
            const controlY1 = fromY;
            const controlX2 = toX - Math.abs(toX-fromX) * 0.5;
            const controlY2 = toY;

            line.setAttribute('d', `M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`);
            line.setAttribute('stroke', '#9ca3af');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('fill', 'none');
            line.setAttribute('marker-end', 'url(#arrowhead)');
            
            svg.appendChild(line);
          }
        });
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