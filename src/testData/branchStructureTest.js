// 测试分支结构的数据
export const testBranchStructureData = [
  // 主线节点 A
  {
    id: 'node_A',
    title: '分镜 A',
    label: '分镜 A',
    text: '这是主线分镜A的内容',
    pos: { x: 100, y: 100 },
    connections: ['node_B'],
    state: 'collapsed'
  },
  
  // 主线节点 B
  {
    id: 'node_B',
    title: '分镜 B',
    label: '分镜 B',
    text: '这是主线分镜B的内容',
    pos: { x: 300, y: 100 },
    connections: ['node_C'],
    state: 'collapsed'
  },
  
  // 探索节点 C
  {
    id: 'node_C',
    title: '探索节点 C',
    label: '探索节点 C',
    text: '这是探索节点C的内容',
    pos: { x: 500, y: 100 },
    connections: ['node_D', 'node_F', 'node_G'],
    state: 'collapsed',
    explorationData: {
      isExplorationNode: true,
      explorationText: '探索不同的情节发展方向',
      parentNodeId: 'node_B'
    }
  },
  
  // 分支节点 D (主线继续)
  {
    id: 'node_D',
    title: '分镜 D',
    label: '分镜 D',
    text: '这是分支D的内容，属于主线',
    pos: { x: 700, y: 100 },
    connections: ['node_E'],
    state: 'collapsed',
    branchData: {
      branchId: 'branch_C_0',
      parentNodeId: 'node_C',
      branchIndex: 0,
      branchLineIndex: 0,
      branchName: '主线'
    }
  },
  
  // 分支节点 E (主线继续)
  {
    id: 'node_E',
    title: '分镜 E',
    label: '分镜 E',
    text: '这是分支E的内容，属于主线',
    pos: { x: 900, y: 100 },
    connections: [],
    state: 'collapsed',
    branchData: {
      branchId: 'branch_C_0',
      parentNodeId: 'node_C',
      branchIndex: 0,
      branchLineIndex: 0,
      branchName: '主线'
    }
  },
  
  // 分支节点 F (第二个分支)
  {
    id: 'node_F',
    title: '分镜 F',
    label: '分镜 F',
    text: '这是分支F的内容，属于第二个分支',
    pos: { x: 700, y: 200 },
    connections: ['node_F1'],
    state: 'collapsed',
    branchData: {
      branchId: 'branch_C_1',
      parentNodeId: 'node_C',
      branchIndex: 1,
      branchLineIndex: 1,
      branchName: '分支 A'
    }
  },
  
  // 分支节点 F1 (第二个分支的子节点)
  {
    id: 'node_F1',
    title: '分镜 F1',
    label: '分镜 F1',
    text: '这是分支F1的内容，属于第二个分支',
    pos: { x: 900, y: 200 },
    connections: [],
    state: 'collapsed',
    branchData: {
      branchId: 'branch_C_1',
      parentNodeId: 'node_C',
      branchIndex: 1,
      branchLineIndex: 1,
      branchName: '分支 A'
    }
  },
  
  // 分支节点 G (第三个分支)
  {
    id: 'node_G',
    title: '分镜 G',
    label: '分镜 G',
    text: '这是分支G的内容，属于第三个分支',
    pos: { x: 700, y: 300 },
    connections: ['node_G1'],
    state: 'collapsed',
    branchData: {
      branchId: 'branch_C_2',
      parentNodeId: 'node_C',
      branchIndex: 2,
      branchLineIndex: 2,
      branchName: '分支 B'
    }
  },
  
  // 分支节点 G1 (第三个分支的子节点)
  {
    id: 'node_G1',
    title: '分镜 G1',
    label: '分镜 G1',
    text: '这是分支G1的内容，属于第三个分支',
    pos: { x: 900, y: 300 },
    connections: [],
    state: 'collapsed',
    branchData: {
      branchId: 'branch_C_2',
      parentNodeId: 'node_C',
      branchIndex: 2,
      branchLineIndex: 2,
      branchName: '分支 B'
    }
  }
];

// 预期的分支结构应该是：
// A -> B -> C (探索节点)
//           ├── D -> E (主线继续)
//           ├── F -> F1 (分支 A)
//           └── G -> G1 (分支 B) 