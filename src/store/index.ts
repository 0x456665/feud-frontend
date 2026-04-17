import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { playerApi } from './api/playerApi';
import { adminApi } from './api/adminApi';
import adminSessionReducer from './slices/adminSessionSlice';
import gameStateReducer from './slices/gameStateSlice';

export const store = configureStore({
  reducer: {
    // RTK Query API caches
    [playerApi.reducerPath]: playerApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,

    // App state slices
    adminSession: adminSessionReducer,
    gameState: gameStateReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(playerApi.middleware)
      .concat(adminApi.middleware),
});

// Enable refetchOnFocus / refetchOnReconnect
setupListeners(store.dispatch);

// Infer types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;