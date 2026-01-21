import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Collection, Variable, Group, Alias } from '@models/index';

export interface VariablesState {
  collections: Collection[];
  variables: Variable[];
  groups: Group[];
  aliases: Alias[];
  loading: boolean;
  error: string | null;
}

const initialState: VariablesState = {
  collections: [],
  variables: [],
  groups: [],
  aliases: [],
  loading: false,
  error: null,
};

const variablesSlice = createSlice({
  name: 'variables',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCollections: (state, action: PayloadAction<Collection[]>) => {
      state.collections = action.payload;
    },
    setVariables: (state, action: PayloadAction<Variable[]>) => {
      state.variables = action.payload;
    },
    setGroups: (state, action: PayloadAction<Group[]>) => {
      state.groups = action.payload;
    },
    setAliases: (state, action: PayloadAction<Alias[]>) => {
      state.aliases = action.payload;
    },
    loadVariablesData: (
      state,
      action: PayloadAction<{
        collections: Collection[];
        variables: Variable[];
        groups: Group[];
        aliases: Alias[];
      }>
    ) => {
      state.collections = action.payload.collections;
      state.variables = action.payload.variables;
      state.groups = action.payload.groups;
      state.aliases = action.payload.aliases;
      state.loading = false;
      state.error = null;
    },
    clearVariables: (state) => {
      state.collections = [];
      state.variables = [];
      state.groups = [];
      state.aliases = [];
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setCollections,
  setVariables,
  setGroups,
  setAliases,
  loadVariablesData,
  clearVariables,
} = variablesSlice.actions;

export default variablesSlice.reducer;
