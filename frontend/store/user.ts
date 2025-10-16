import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserState = {
  mobile: string;
  username?: string | null;
  upiId: string | null;
  qrCodeUrl: string | null;
  balance: number | null;
  signedIn: boolean;
  signedInUntil?: string | null;
};

export type UserActions = {
  setAuth: (payload: Partial<UserState>) => void;
  logout: () => void;
};

const initialState: UserState = {
  mobile: "",
  username: null,
  upiId: null,
  qrCodeUrl: null,
  balance: null,
  signedIn: false,
  signedInUntil: null,
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set) => ({
      ...initialState,
      setAuth: (payload) => set((state) => ({ ...state, ...payload })),
      logout: () => set(() => ({ ...initialState })),
    }),
    { name: "eyelens-user" }
  )
);


