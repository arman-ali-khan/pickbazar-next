import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UiState {
  isSearchOpen: boolean
}

const initialState: UiState = {
  isSearchOpen: false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchOpen = action.payload
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen
    },
  },
})

export const { setSearchOpen, toggleSearch } = uiSlice.actions
export default uiSlice.reducer
