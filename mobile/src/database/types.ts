// Repository pattern types for local SQLite storage.
// IMPORTANT: Never store session tokens, JWTs, or secrets in SQLite rows.
// Those belong exclusively in SecureStorage (react-native-keychain).

export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}
