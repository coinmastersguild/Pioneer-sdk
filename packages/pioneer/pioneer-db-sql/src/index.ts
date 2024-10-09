const TAG = ' | Pioneer-db | ';

const sqlite3 = require('sqlite3').verbose();

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
  public getPubkeys: (filters: { networkIds?: string[] }) => Promise<any[]>;
  public createBalance: (balance: any) => Promise<any>;
  public getBalances: (filters?: {
    walletIds?: string[];
    blockchains?: string[];
  }) => Promise<any[]>;
  public addCustomToken: (token: any) => Promise<any>;
  public getCustomToken: (caip: string) => Promise<any | undefined>;
  public getAllCustomTokens: () => Promise<any[]>;

  constructor(config: any) {
    this.status = 'preInit';
    this.dbName = 'pioneer.db';
    this.db = typeof window === 'undefined' ? new sqlite3.Database(this.dbName) : null;

    this.init = async (setup: any) => {
      const tag = `${TAG} | init | `;
      try {
        if (typeof window !== 'undefined') {
          return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {
              const db = event.target.result;
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
                const pubkeyStore = db.createObjectStore('balances', {
                  keyPath: 'id',
                  autoIncrement: true,
                });
                pubkeyStore.createIndex('ref', 'ref', { unique: true });
              }
              if (!db.objectStoreNames.contains('customTokens')) {
                const customTokenStore = db.createObjectStore('customTokens', {
                  keyPath: 'caip',
                });
              }
            };

            request.onerror = () => {
              reject(request.error);
              console.error(tag, 'Database initialization error:', request.error);
            };

            request.onsuccess = () => {
              this.db = request.result;
              console.log(tag, 'Database initialized successfully.');
              resolve(this.db);
            };
          });
        } else {
          this.db.serialize(() => {
            this.db.run(`
          CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            txid TEXT NOT NULL,
            state TEXT NOT NULL
          );
        `, (err) => {
              if (err) {
                console.error(tag, 'Failed to create transactions table:', err);
                throw err;
              } else {
                console.log(tag, 'Transactions table created or already exists.');
              }
            });

            this.db.run(`
              CREATE TABLE IF NOT EXISTS pubkeys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                master TEXT,
                address TEXT,
                pubkey TEXT UNIQUE,
                type TEXT,
                path TEXT,
                pathMaster TEXT,
                context TEXT,
                contextType TEXT,
                networks TEXT
              );
            `, (err) => {
              if (err) {
                console.error(tag, 'Failed to create pubkeys table:', err);
                throw err;
              } else {
                console.log(tag, 'Pubkeys table created or already exists.');
              }
            });

            this.db.run(`
          CREATE TABLE IF NOT EXISTS balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chain TEXT,
            identifier TEXT,
            decimals INTEGER,
            type TEXT,
            networkId TEXT,
            caip TEXT,
            symbol TEXT,
            sourceList TEXT,
            assetId TEXT,
            chainId TEXT,
            name TEXT,
            networkName TEXT,
            precision INTEGER,
            color TEXT,
            icon TEXT,
            explorer TEXT,
            explorerAddressLink TEXT,
            explorerTxLink TEXT,
            relatedAssetKey TEXT,
            integrations TEXT,
            memoless BOOLEAN,
            balance TEXT,
            pubkey TEXT,
            address TEXT,
            master TEXT,
            context TEXT,
            contextType TEXT,
            ticker TEXT,
            priceUsd REAL,
            rank INTEGER,
            alias INTEGER,
            source TEXT,
            valueUsd TEXT
          );
        `, (err) => {
              if (err) {
                console.error(tag, 'Failed to create balances table:', err);
                throw err;
              } else {
                console.log(tag, 'Balances table created or already exists.');
              }
            });

            this.db.run(`
          CREATE TABLE IF NOT EXISTS customTokens (
            caip TEXT PRIMARY KEY,
            chain TEXT,
            identifier TEXT,
            decimals INTEGER,
            type TEXT,
            networkId TEXT,
            symbol TEXT,
            sourceList TEXT,
            assetId TEXT,
            chainId TEXT,
            name TEXT,
            networkName TEXT,
            precision INTEGER,
            color TEXT,
            icon TEXT,
            explorer TEXT,
            explorerAddressLink TEXT,
            explorerTxLink TEXT,
            integrations TEXT
          );
        `, (err) => {
              if (err) {
                console.error(tag, 'Failed to create customTokens table:', err);
                throw err;
              } else {
                console.log(tag, 'CustomTokens table created or already exists.');
              }
            });
          });
          return Promise.resolve(true);
        }
      } catch (e) {
        console.error(tag, 'Error during database initialization:', e);
        throw e;
      }
    };

    //txs
    this.createTransaction = async (tx: Omit<Transaction, 'id'>): Promise<number> => {
      if (typeof window !== 'undefined') {
        const db: IDBDatabase = await this.openIndexedDB();
        const txStore = db.transaction(this.storeName, 'readwrite').objectStore(this.storeName);
        const request = txStore.add(tx);
        return new Promise<number>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result as number);
          request.onerror = () => reject(request.error);
        });
      } else {
        return new Promise<number>((resolve, reject) => {
          this.db.run(
            'INSERT INTO transactions (txid, state) VALUES (?, ?)',
            [tx.txid, tx.state],
            function (this: sqlite3.RunResult, err: Error | null) {
              if (err) {
                reject(err);
              } else {
                resolve(this.lastID as number);
              }
            },
          );
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
      } else {
        return new Promise((resolve, reject) => {
          this.db.get(
            'SELECT * FROM transactions WHERE txid = ?',
            [txid],
            function (err: any, row: any) {
              if (err) reject(err);
              else resolve(row);
            },
          );
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
      } else {
        return new Promise((resolve, reject) => {
          this.db.run(
            'UPDATE transactions SET state = ? WHERE txid = ?',
            [newState, txid],
            function (err: any) {
              if (err) reject(err);
              else resolve();
            },
          );
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
      } else {
        return new Promise((resolve, reject) => {
          this.db.all('SELECT * FROM transactions', [], function (err: any, rows: any[]) {
            if (err) reject(err);
            else resolve(rows);
          });
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
      } else {
        return new Promise((resolve, reject) => {
          this.db.run('DELETE FROM transactions', function (err: any) {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    };

    //assets
    //chains
    //wallets
    //paths
    //pubkeys
    this.createPubkey = async (pubkey: any): Promise<any> => {
      return new Promise<number>((resolve, reject) => {
        this.db.run(
          'INSERT OR REPLACE INTO pubkeys (master, address, pubkey, type, path, pathMaster, context, contextType, networks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            pubkey.master,
            pubkey.address,
            pubkey.pubkey,
            pubkey.type,
            pubkey.path,
            pubkey.pathMaster,
            pubkey.context,
            pubkey.contextType,
            JSON.stringify(pubkey.networks),
          ],
          function (this: sqlite3.RunResult, err: Error | null) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID as number);
            }
          },
        );
      });
    };

    this.getPubkeys = async (
      filters: { walletIds?: string[]; blockchains?: string[] } = {},
    ): Promise<any[]> => {
      if (typeof window !== 'undefined') {
        const db = await this.openIndexedDB();
        const pubkeyStore = db.transaction('pubkeys', 'readonly').objectStore('pubkeys');
        const allKeys = await new Promise<any[]>((resolve, reject) => {
          const request = pubkeyStore.getAll();
          request.onsuccess = () => {
            const pubkeys = request.result.map((key) => {
              key.networks =
                typeof key.networks === 'string' ? JSON.parse(key.networks) : key.networks;
              return key;
            });
            resolve(pubkeys);
          };
          request.onerror = () => {
            if (request.error && request.error.name === 'ConstraintError') {
              console.log('Duplicate pubkey, not added.');
              resolve(true);
            } else {
              console.error('Error adding pubkey:', request.error);
              resolve(false);
            }
          };
        });
        return allKeys.filter(
          (key) =>
            (!filters.walletIds || filters.walletIds.includes(key.walletId)) &&
            (!filters.blockchains || filters.blockchains.includes(key.blockchain)),
        );
      } else {
        let query = 'SELECT * FROM pubkeys WHERE 1=1';
        const params = [];
        if (filters.walletIds && filters.walletIds.length > 0) {
          query += ' AND walletId IN (' + filters.walletIds.map(() => '?').join(',') + ')';
          params.push(...filters.walletIds);
        }
        if (filters.blockchains && filters.blockchains.length > 0) {
          query += ' AND blockchain IN (' + filters.blockchains.map(() => '?').join(',') + ')';
          params.push(...filters.blockchains);
        }
        return new Promise<any[]>((resolve, reject) => {
          this.db.all(query, params, (err: any, rows: any[]) => {
            if (err) {
              reject(err);
            } else {
              const pubkeys = rows.map((row) => {
                row.networks =
                  typeof row.networks === 'string' ? JSON.parse(row.networks) : row.networks;
                return row;
              });
              resolve(pubkeys);
            }
          });
        });
      }
    };

    //balances
    this.createBalance = async (balance: any): Promise<any> => {
      if (typeof window !== 'undefined') {
        const db: IDBDatabase = await this.openIndexedDB();
        const txStore = db.transaction('balances', 'readwrite').objectStore('balances');
        const request = txStore.add(balance);
        return new Promise<number>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result as number);
          request.onerror = () => {
            if (request.error && request.error.name === 'ConstraintError') {
              console.log('Duplicate pubkey, not added.');
              resolve(true);
            } else {
              console.error('Error adding pubkey:', request.error);
              resolve(false);
            }
          };
        });
      } else {
        return new Promise((resolve, reject) => {
          this.db.get(
            'SELECT * FROM balances WHERE caip = ? AND context = ?',
            [balance.caip, balance.context],
            (err, row) => {
              if (err) {
                reject(err);
              } else if (row) {
                this.db.run(
                  'UPDATE balances SET balance = ? WHERE id = ?',
                  [balance.balance, row.id],
                  function (err) {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(this.changes);
                    }
                  },
                );
              } else {
                this.db.run(
                  `INSERT INTO balances (
                chain, identifier, decimals, type, networkId, caip, symbol, assetId, chainId, name, networkName, 
                precision, color, icon, explorer, explorerAddressLink, explorerTxLink, relatedAssetKey, integrations, 
                memoless, balance, pubkey, address, master, context, contextType, ticker, priceUsd, rank, alias, source, valueUsd
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    balance.chain, balance.identifier, balance.decimals, balance.type, balance.networkId,
                    balance.caip, balance.symbol, balance.assetId, balance.chainId, balance.name, balance.networkName,
                    balance.precision, balance.color, balance.icon, balance.explorer, balance.explorerAddressLink,
                    balance.explorerTxLink, balance.relatedAssetKey, JSON.stringify(balance.integrations),
                    balance.memoless, balance.balance, balance.pubkey, balance.address, balance.master,
                    balance.context, balance.contextType, balance.ticker, balance.priceUsd, balance.rank,
                    balance.alias, balance.source, balance.valueUsd
                  ],
                  function (err) {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(this.lastID);
                    }
                  },
                );
              }
            },
          );
        });
      }
    };

    this.getBalances = async (
      filters: { walletIds?: string[]; blockchains?: string[] } = {},
    ): Promise<any[]> => {
      if (typeof window !== 'undefined') {
        const db = await this.openIndexedDB();
        const balanceStore = db.transaction('balances', 'readonly').objectStore('balances');
        const allKeys = await new Promise<any[]>((resolve, reject) => {
          const request = balanceStore.getAll();
          request.onsuccess = () => {
            resolve(request.result);
          };
          request.onerror = () => {
            console.error('Error retrieving balances:', request.error);
            reject(request.error);
          };
        });
        return allKeys.filter(
          (balance: any) =>
            (!filters.walletIds || filters.walletIds.includes(balance.address)) &&
            (!filters.blockchains || filters.blockchains.includes(balance.chain)),
        );
      } else {
        let query = 'SELECT * FROM balances WHERE 1=1';
        const params = [];
        if (filters.walletIds && filters.walletIds.length > 0) {
          query += ' AND address IN (' + filters.walletIds.map(() => '?').join(',') + ')';
          params.push(...filters.walletIds);
        }
        if (filters.blockchains && filters.blockchains.length > 0) {
          query += ' AND chain IN (' + filters.blockchains.map(() => '?').join(',') + ')';
          params.push(...filters.blockchains);
        }
        return new Promise<any[]>((resolve, reject) => {
          this.db.all(query, params, (err: any, rows: any[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          });
        });
      }
    };

    this.openIndexedDB = async function (): Promise<IDBDatabase> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, {
              keyPath: 'id',
              autoIncrement: true,
            });
            store.createIndex('txid', 'txid', { unique: true });
            store.createIndex('state', 'state', { unique: false });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
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
      } else {
        return new Promise((resolve, reject) => {
          this.db.run(
            `INSERT OR REPLACE INTO customTokens (
              caip, chain, identifier, decimals, type, networkId, symbol, sourceList, assetId, chainId,
              name, networkName, precision, color, icon, explorer, explorerAddressLink, explorerTxLink, integrations
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              token.caip.toLowerCase(), token.chain, token.identifier, token.decimals, token.type, token.networkId,
              token.symbol, token.sourceList, token.assetId, token.chainId, token.name, token.networkName,
              token.precision, token.color, token.icon, token.explorer, token.explorerAddressLink,
              token.explorerTxLink, JSON.stringify(token.integrations)
            ],
            function (err) {
              if (err) {
                reject(err);
              } else {
                resolve(this.lastID);
              }
            }
          );
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
      } else {
        return new Promise((resolve, reject) => {
          this.db.get(
            'SELECT * FROM customTokens WHERE caip = ?',
            [caip.toLowerCase()],
            (err, row) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
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
      } else {
        return new Promise<any[]>((resolve, reject) => {
          this.db.all('SELECT * FROM customTokens', [], (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          });
        });
      }
    };
  }
}

export default DB;
