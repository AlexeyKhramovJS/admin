import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    users: [],
    db: null
  },
  mutations: {
    setUser(state, user) {
    console.log('mutations');    
      // state.users.push(user);
      state.users = user;
    },
    setDb(state, link) {
      state.db = link;
    },
    createUsersStore(state) {
      state.db.createObjectStore('users', {keyPath: 'id'});
    }
  },
  actions: {
    initDb({dispatch, commit}) {
      //let db;
      let dbReq = indexedDB.open('DB', 1);
      dbReq.onupgradeneeded = (event) => {
        // Зададим переменной db ссылку на базу данных
        //db = event.target.result;
        dispatch('setLink', event.target.result);
        // Создадим хранилище объектов с именем user.
        //let user = db.createObjectStore('user', {autoIncrement: true});
        dispatch('createStore');
      }
      dbReq.onsuccess = (event) => {
        // db = event.target.result;
        dispatch('setLink', event.target.result);
        dispatch('getUsers');
      }
      dbReq.onerror = (event) => {
        alert('error opening database ' + event.target.errorCode);
      }
    },
    setLink({commit}, link) {
      commit('setDb', link);
    },
    createStore({commit}) {
      commit('createUsersStore');
    },
    addUser({commit, state, dispatch}, user) {
      let tx = state.db.transaction(['users'], 'readwrite');
      let store = tx.objectStore('users');
      // Добаляем user в хранилище объектов
      store.add(user);
      // Ожидаем завершения транзакции базы данных
      tx.oncomplete = () => {
        console.log('stored note!');
      }
      tx.onerror = (event) => {
        alert('error storing note ' + event.target.errorCode);
      }
    },
    getUsers({commit, state}) {
      let tx = state.db.transaction(['users'], 'readonly');
      let store = tx.objectStore('users');
      // Создать запрос курсора
      let req = store.openCursor();
      let users = [];
      req.onsuccess = (event) => {
        // Результатом req.onsuccess в запросах openCursor является
        // IDBCursor
        let cursor = event.target.result;
        if (cursor != null) {
          // Если курсор не нулевой, мы получили элемент.
          users.push(cursor.value);
          console.log('push');          
          //commit('setUser', cursor.value)
          cursor.continue();
        } else {
          commit('setUser', users);
        }
      }
      req.onerror = (event) => {
        alert('error in cursor request ' + event.target.errorCode);
      }
    },
    removeUsers({state}, id) {
      console.log(typeof id);
      
      // открываем транзакцию чтения/записи БД, готовую к удалению данных
      const tx = state.db.transaction(['users'], 'readwrite');
      // описываем обработчики на завершение транзакции
      tx.oncomplete = (event) => {
        console.log('Transaction completed.')
        //getAndDisplayNotes(db);
      };
      tx.onerror = function(event) {
        alert('error in cursor request ' + event.target.errorCode);
      };
      // создаем хранилище объектов по транзакции
      const store = tx.objectStore('users');
      console.dir(store);
      const index = store.index(id);
       // получаем ключ записи
      const req = index.getKey(id)
      req.onsuccess = (event) => {  
        const key = req.result;
        // выполняем запрос на удаление указанной записи из хранилища объектов
        let deleteRequest = store.delete(key);
        deleteRequest.onsuccess = (event) => {
          // обрабатываем успех нашего запроса на удаление
          console.log('Delete request successful')
        };    
      }

    }
  },
  getters: {
    users(state) {
      return state.users;
    }
  }
})