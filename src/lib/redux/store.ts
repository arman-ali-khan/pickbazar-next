import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './slices/cartSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
    reducer: {
        cart: cartReducer,
        ui: uiReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
