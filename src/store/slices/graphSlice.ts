import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge } from 'reactflow';

export interface GraphState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  expandedCollectionIds: Set<string>;
}

const initialState: GraphState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  expandedCollectionIds: new Set<string>(),
};

const graphSlice = createSlice({
  name: 'graph',
  initialState,
  reducers: {
    setNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },
    setEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload;
    },
    setGraphData: (
      state,
      action: PayloadAction<{ nodes: Node[]; edges: Edge[] }>
    ) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
    },
    setSelectedNodeId: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
    },
    toggleCollectionExpanded: (state, action: PayloadAction<string>) => {
      const collectionId = action.payload;
      const newSet = new Set(state.expandedCollectionIds);
      
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      
      state.expandedCollectionIds = newSet;
    },
    clearGraph: (state) => {
      state.nodes = [];
      state.edges = [];
      state.selectedNodeId = null;
    },
  },
});

export const {
  setNodes,
  setEdges,
  setGraphData,
  setSelectedNodeId,
  toggleCollectionExpanded,
  clearGraph,
} = graphSlice.actions;

export default graphSlice.reducer;
