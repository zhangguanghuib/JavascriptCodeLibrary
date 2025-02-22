function openDB(dbName, version = 1) {
    return new Promise((resolve, reject) => {
        let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        let db;
        let request = indexedDB.open(dbName, version);
        request.onsuccess = function (event) {
            db = event.target.result;
            console.log("Database opened successfully.");
            resolve(db);
        };

        request.onerror = function (event) {
            console.error("Error opening database:", event.target.errorCode);
            reject(event.target.errorCode)  // return error code; 
        };

        request.onupgradeneeded = function (event) {
            console.log("Upgrading database...");
            db = event.target.result;
            let objectStore = db.createObjectStore("singleChat", { keyPath: "sequenceId", autoIncrement: true });
            objectStore.createIndex("sequenceId", "sequenceId", { unique: true });
            objectStore.createIndex("link", "link", { unique: false });
            objectStore.createIndex("messageType", "messageType", { unique: false });
        };
    });
}

function addData(db, storeName, data) {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(storeName, "readwrite");
        let objectStore = transaction.objectStore(storeName);
        
        // Check if data already exists
        let getRequest = objectStore.get(data.sequenceId);
        getRequest.onsuccess = function(event) {
            if (getRequest.result) {
                console.log("Data already exists.");
                resolve("Data already exists");
            } else {
                let addRequest = objectStore.add(data);
                addRequest.onsuccess = function(event) {
                    console.log("Data added successfully.");
                    resolve();
                };
                addRequest.onerror = function(event) {
                    console.error("Error adding data:", event.target.errorCode);
                    reject(event.target.errorCode);
                };
            }
        };
        getRequest.onerror = function(event) {
            console.error("Error checking data existence:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function getDataByKey(db, storeName, key){
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(storeName, "readonly");
        let objectStore = transaction.objectStore(storeName);
        let request = objectStore.get(key);

        request.onsuccess = function (event) {
            console.log("Data added successfully.");
            resolve(request.result);
        };
        request.onerror = function (event) {
            console.error("Error adding data:", event.target.errorCode);
            reject(event.target.errorCode); 
        }
    });
}

function getDataByIndex(db, storeName, indexName, indexValue){
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(storeName, "readonly");
        let objectStore = transaction.objectStore(storeName);
        let index = objectStore.index(indexName);
        let request = index.get(indexValue);

        request.onsuccess = function (event) {
            console.log("Data added successfully.");
            resolve(request.result);
        };
        request.onerror = function (event) {
            console.error("Error adding data:", event.target.errorCode);
            reject(event.target.errorCode); 
        }
    });
}

function getAllData(db, storeName){
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(storeName, "readonly");
        let objectStore = transaction.objectStore(storeName);
        let request = objectStore.getAll();

        request.onsuccess = function (event) {
            console.log("Data added successfully.");
            resolve(request.result);
        };
        request.onerror = function (event) {
            console.error("Error adding data:", event.target.errorCode);
            reject(event.target.errorCode); 
        }
    });
}

function cursorGetDataByIndex(db, storeName, indexName, indexValue){
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(storeName, "readonly");
        let objectStore = transaction.objectStore(storeName);
        let request = objectStore.index(indexName).openCursor(IDBKeyRange.only(indexValue));
        let result = [];
        request.onsuccess = function (event) {
            let cursor = event.target.result;
            if(cursor){
                result.push(cursor.value);
                cursor.continue();
            }else{
                resolve(result);
            }
        };
        request.onerror = function (event) {
            console.error("Error adding data:", event.target.errorCode);
            reject(event.target.errorCode); 
        }
    }); 
}

function cursorGetDataByIndexAndPage(db, storeName, indexName, indexValue, pageSize, pageNumber){
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(storeName, "readonly");
        let objectStore = transaction.objectStore(storeName);
        let request = objectStore.index(indexName).openCursor(IDBKeyRange.only(indexValue));
        let result = [];
        let count = 0;
        request.onsuccess = function (event) {
            let cursor = event.target.result;
            if(cursor){
                count++;
                if(count > pageSize * (pageNumber - 1) && count <= pageSize * pageNumber){
                    result.push(cursor.value);
                }
                cursor.continue();
            }else{
                resolve(result);
            }
        };
        request.onerror = function (event) {
            console.error("Error adding data:", event.target.errorCode);
            reject(event.target.errorCode); 
        }
    }); 
}

function updateDataByKey(db, storeName, key, data){
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(storeName, "readwrite");
        let objectStore = transaction.objectStore(storeName);
        let request = objectStore.put(data, key);

        request.onsuccess = function (event) {
            console.log("Data updated successfully.");
            resolve();
        };
        request.onerror = function (event) {
            console.error("Error adding data:", event.target.errorCode);
            reject(event.target.errorCode); 
        }
    });
}

function deleteData(db, storeName, key){
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(storeName, "readwrite");
        let objectStore = transaction.objectStore(storeName);
        let request = objectStore.delete(key);

        request.onsuccess = function (event) {
            console.log("Data deleted successfully.");
            resolve();
        };
        request.onerror = function (event) {
            console.error("Error adding data:", event.target.errorCode);
            reject(event.target.errorCode); 
        }
    });
}

function cursorDelete(db, storeName, indexName, indexValue){
    return new Promise((resolve, reject) => {
        let transaction = db.transaction(storeName, "readwrite");
        let objectStore = transaction.objectStore(storeName);
        let request = objectStore.index(indexName).openCursor(IDBKeyRange.only(indexValue));
        request.onsuccess = function (event) {
            let cursor = event.target.result;
            let deleteRequest;
            if(cursor){
                deleteRequest = cursor.delete();
                deleteRequest.onsuccess = function(event){
                    cursor.continue();
                }
                deleteRequest.onerror = function(event){
                    console.error("Error deleting data:", event.target.errorCode);
                }
                cursor.continue();
            }
        };
        request.onerror = function (event) {
            console.error("Error adding data:", event.target.errorCode);
            reject(event.target.errorCode); 
        };
    }); 
}

function closeDB(db){
    db.close();
    console.log("Database closed.");
}

function deleteDBAll(dbName){
    let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    let request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = function(event){
        console.log("Database deleted successfully.");
    }
    request.onerror = function(event){
        console.error("Error deleting database:", event.target.errorCode);
    }
}