import { createMMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

import { deleteMMKV } from 'react-native-mmkv'
import { existsMMKV } from 'react-native-mmkv'

export const storage = createMMKV();


export const mmkvStorage: StateStorage = {
    setItem: (name, value) => {
        storage.set(name, value);
    },
    getItem: name => {
        return storage.getString(name) ?? null;
    },
    removeItem: name => {
        storage.set(name, null);
    }
};
