import { configureStore } from '@reduxjs/toolkit';
import variablesReducer from './slices/variablesSlice';
import graphReducer from './slices/graphSlice';

export const store = configureStore({
  reducer: {
    variables: variablesReducer,
    graph: graphReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // React Flow nodes/edges may contain non-serializable data
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
