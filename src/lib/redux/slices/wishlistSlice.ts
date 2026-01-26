import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '../store';
import { getWishlistIds, toggleWishlistItem } from '@/app/actions/product';

export interface WishlistState {
  productIds: number[];
  loading: boolean;
  togglingProductId: number | null;
}

const initialState: WishlistState = {
  productIds: [],
  loading: true,
  togglingProductId: null,
}

// Async thunk to fetch initial wishlist
export const fetchWishlist = createAsyncThunk('wishlist/fetch', async () => {
    const ids = await getWishlistIds();
    return ids;
});

// Async thunk to toggle an item
export const toggleWishlist = createAsyncThunk(
    'wishlist/toggle',
    async (productId: number) => {
        const result = await toggleWishlistItem(productId);
        if (result.error) {
            throw new Error(result.error);
        }
        // Return the new status and product id to update the state
        return { productId, status: result.status };
    }
);

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
        .addCase(fetchWishlist.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchWishlist.fulfilled, (state, action: PayloadAction<number[]>) => {
            state.productIds = action.payload;
            state.loading = false;
        })
        .addCase(fetchWishlist.rejected, (state) => {
            state.loading = false;
        })
        .addCase(toggleWishlist.pending, (state, action) => {
            state.togglingProductId = action.meta.arg;
        })
        .addCase(toggleWishlist.fulfilled, (state, action) => {
            state.togglingProductId = null;
            const { productId, status } = action.payload as { productId: number, status: string };
            if (status === 'added') {
                if (!state.productIds.includes(productId)) {
                    state.productIds.push(productId);
                }
            } else if (status === 'removed') {
                state.productIds = state.productIds.filter(id => id !== productId);
            }
        })
        .addCase(toggleWishlist.rejected, (state) => {
            state.togglingProductId = null;
        });
  },
})

export const selectIsInWishlist = (productId: number) => (state: RootState) => state.wishlist.productIds.includes(productId);
export const selectIsTogglingWishlist = (productId: number) => (state: RootState) => state.wishlist.togglingProductId === productId;


export default wishlistSlice.reducer;
