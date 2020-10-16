import firebase from 'firebase';
import 'firebase/firestore';
import config from '../config/firebaseConfig.json';

export default !firebase.apps.length
  ? firebase.initializeApp(config)
  : firebase.app();
