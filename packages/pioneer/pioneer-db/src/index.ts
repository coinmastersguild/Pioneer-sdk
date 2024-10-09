const TAG = ' | Pioneer-db | ';

// Import sqlite3 for Node.js environment
// let sqlite3: any;
// if (typeof window === 'undefined') {
//   sqlite3 = require('sqlite3').verbose();
// }

export enum TransactionState {
  Unsigned = 'unsigned',
  Signed = 'signed',
  Pending = 'pending',
  Completed = 'completed',
  Errored = 'errored',
}

export interface Transaction {
  id?: number;
  txid: string;
  state: TransactionState;
}

export class DB {
  public status: string;
  public init: (setup: any) => Promise<any>;
  public dbName: string;
  public storeName: string;
  public db: any;
  public createTransaction: (tx: Omit<Transaction, 'id'>) => Promise<number>;
  public getTransaction: (txid: string) => Promise<Transaction | undefined>;
  public updateTransaction: (txid: string, newState: TransactionState) => Promise<void>;
  public getAllTransactions: () => Promise<Transaction[]>;
  public clearAllTransactions: () => Promise<void>;
  public openIndexedDB: () => Promise<IDBDatabase>;
  public createPubkey: (pubkey: any) => Promise<any>;
  public getPubkeys: (filters?: { walletIds?: string[]; blockchains?: string[] }) => Promise<any[]>;
  public createBalance: (balance: any) => Promise<any>;
  public getBalances: (filters?: {
    walletIds?: string[];
    blockchains?: string[];
  }) => Promise<any[]>;
  public addCustomToken: (token: any) => Promise<any>;
  public getCustomToken: (caip: string) => Promise<any | undefined>;
  public getAllCustomTokens: () => Promise<any[]>;
  private createObjectStores: (db: IDBDatabase) => void;
  private checkObjectStores: (db: IDBDatabase) => boolean;

  constructor(config: any) {
    this.status = 'preInit';
    this.dbName = 'pioneer.db';
    // this.db = typeof window === 'undefined' ? new sqlite3.Database(this.dbName) : null;

    this.init = async (setup: any) => {
      const tag = `${TAG} | init | `;
      try {
        if (typeof window !== 'undefined') {
          return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              this.createObjectStores(db);
            };

            request.onerror = () => {
              reject(request.error);
              console.error(tag, 'Database initialization error:', request.error);
            };

            request.onsuccess = () => {
              this.db = request.result;
              if (!this.checkObjectStores(this.db)) {
                this.db.close();
                indexedDB.deleteDatabase(this.dbName);
                // Retry after deletion
                const retryRequest = indexedDB.open(this.dbName, 1);
                retryRequest.onupgradeneeded = (retryEvent: IDBVersionChangeEvent) => {
                  const retryDb = (retryEvent.target as IDBOpenDBRequest).result;
                  this.createObjectStores(retryDb);
                };
                retryRequest.onsuccess = () => resolve(retryRequest.result);
                retryRequest.onerror = () => reject(retryRequest.error);
              } else {
                resolve(this.db);
              }
            };
          });
        }
      } catch (e) {
        console.error(tag, 'Error during database initialization:', e);
        throw e;
      }
    };

    this.createObjectStores = (db: IDBDatabase) => {
      if (!db.objectStoreNames.contains(this.storeName)) {
        const store = db.createObjectStore(this.storeName, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('txid', 'txid', { unique: true });
        store.createIndex('state', 'state', { unique: false });
      }
      if (!db.objectStoreNames.contains('pubkeys')) {
        const pubkeyStore = db.createObjectStore('pubkeys', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pubkeyStore.createIndex('pubkey', 'pubkey', { unique: true });
      }
      if (!db.objectStoreNames.contains('balances')) {
        const balanceStore = db.createObjectStore('balances', {
          keyPath: 'id',
          autoIncrement: true,
        });
        balanceStore.createIndex('ref', 'ref', { unique: true });
      }
      if (!db.objectStoreNames.contains('customTokens')) {
        const tokenStore = db.createObjectStore('customTokens', {
          keyPath: 'caip',
        });
      }
    };

    this.checkObjectStores = (db: IDBDatabase): boolean => {
      const requiredStores = [this.storeName, 'pubkeys', 'balances', 'customTokens'];
      return requiredStores.every((store) => db.objectStoreNames.contains(store));
    };

    this.addCustomToken = async (token: any): Promise<any> => {
      if (typeof window !== 'undefined') {
        const db: IDBDatabase = await this.openIndexedDB();
        const txStore = db.transaction('customTokens', 'readwrite').objectStore('customTokens');
        const request = txStore.put({ ...token, caip: token.caip.toLowerCase() });
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    };

    this.getCustomToken = async (caip: string): Promise<any | undefined> => {
      if (typeof window !== 'undefined') {
        const db = await this.openIndexedDB();
        const tokenStore = db.transaction('customTokens', 'readonly').objectStore('customTokens');
        const request = tokenStore.get(caip.toLowerCase());
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    };

    this.getAllCustomTokens = async (): Promise<any[]> => {
      if (typeof window !== 'undefined') {
        const db = await this.openIndexedDB();
        const tokenStore = db.transaction('customTokens', 'readonly').objectStore('customTokens');
        const request = tokenStore.getAll();
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    };

    // Transaction-related methods

    this.createTransaction = async (tx: Omit<Transaction, 'id'>): Promise<number> => {
      if (typeof window !== 'undefined') {
        const db: IDBDatabase = await this.openIndexedDB();
        const txStore = db.transaction(this.storeName, 'readwrite').objectStore(this.storeName);
        const request = txStore.add(tx);
        return new Promise<number>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result as number);
          request.onerror = () => reject(request.error);
        });
      }
    };

    this.getTransaction = async function (txid: string): Promise<Transaction | undefined> {
      if (typeof window !== 'undefined') {
        const db = await this.openIndexedDB();
        const txStore = db.transaction(this.storeName, 'readonly').objectStore(this.storeName);
        const index = txStore.index('txid');
        const request = index.get(txid);
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result as Transaction | undefined);
          request.onerror = () => reject(request.error);
        });
      }
    };

    this.updateTransaction = async (txid: string, newState: TransactionState): Promise<void> => {
      if (typeof window !== 'undefined') {
        const db = await this.openIndexedDB();
        const txStore = db.transaction(this.storeName, 'readwrite').objectStore(this.storeName);
        const index = txStore.index('txid');
        const request = index.get(txid);
        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            const data = request.result;
            if (data) {
              data.state = newState;
              const updateRequest = txStore.put(data);
              updateRequest.onsuccess = () => resolve();
              updateRequest.onerror = () => reject(updateRequest.error);
            } else {
              reject(new Error('Transaction not found'));
            }
          };
          request.onerror = () => reject(request.error);
        });
      }
    };

    this.getAllTransactions = async function (): Promise<Transaction[]> {
      if (typeof window !== 'undefined') {
        const db = await this.openIndexedDB();
        const txStore = db.transaction(this.storeName, 'readonly').objectStore(this.storeName);
        const request = txStore.getAll();
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result as Transaction[]);
          request.onerror = () => reject(request.error);
        });
      }
    };

    this.clearAllTransactions = async function (): Promise<void> {
      if (typeof window !== 'undefined') {
        const db = await this.openIndexedDB();
        const txStore = db.transaction(this.storeName, 'readwrite').objectStore(this.storeName);
        const request = txStore.clear();
        return new Promise((resolve, reject) => {
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    };

    // Pubkey and balance-related methods remain unchanged

    this.createPubkey = async (pubkey: any): Promise<any> => {
      if (typeof window !== 'undefined') {
        const db: IDBDatabase = await this.openIndexedDB();
        const txStore = db.transaction('pubkeys', 'readwrite').objectStore('pubkeys');
        const request = txStore.add(pubkey);
        return new Promise<number>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result as number);
          request.onerror = () => reject(request.error);
        });
      }
    };

    this.getPubkeys = async (
      filters: { walletIds?: string[]; blockchains?: string[] } = {},
    ): Promise<any[]> => {
      if (typeof window !== 'undefined') {
        const db = await this.openIndexedDB();
        const pubkeyStore = db.transaction('pubkeys', 'readonly').objectStore('pubkeys');
        const request = pubkeyStore.getAll();
        return new Promise<any[]>((resolve, reject) => {
          request.onsuccess = () => {
            const pubkeys = request.result.map((key) => {
              key.networks = typeof key.networks === 'string' ? JSON.parse(key.networks) : key.networks;
              return key;
            });
            resolve(pubkeys);
          };
          request.onerror = () => reject(request.error);
        });
      }
    };

    this.createBalance = async (balance: any): Promise<any> => {
      if (typeof window !== 'undefined') {
        const db: IDBDatabase = await this.openIndexedDB();
        const txStore = db.transaction('balances', 'readwrite').objectStore('balances');
        const request = txStore.add(balance);
        return new Promise<number>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result as number);
          request.onerror = () => reject(request.error);
        });
      }
    };

    this.getBalances = async (
      filters: { walletIds?: string[]; blockchains?: string[] } = {},
    ): Promise<any[]> => {
      if (typeof window !== 'undefined') {
        const db = await this.openIndexedDB();
        const balanceStore = db.transaction('balances', 'readonly').objectStore('balances');
        const request = balanceStore.getAll();
        return new Promise<any[]>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    };

    this.openIndexedDB = async (): Promise<IDBDatabase> => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          this.createObjectStores(db);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    };
  }
}

export default DB;
