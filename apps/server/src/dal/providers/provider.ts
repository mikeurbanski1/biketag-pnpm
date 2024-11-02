// export const config = {
//     USER: {
//         customMapKeys
//     }
// }

// export class InMemoryRepository<T> {
//     private idMap = new Map<string, T>();
//     private customMaps = new Map<keyof T, Map<string, T>>();

//     constructor(customMapKeys: (keyof T)[] = []) {
//         for (const key of customMapKeys) {
//             this.customMaps.set(key, new Map());
//         }
//     }
// }

// export class InMemoryProvider {
//     private repositories = new Map<CacheKey, InMemoryRepository>();
// }

// export const provider = new InMemoryProvider();
