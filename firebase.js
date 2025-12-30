// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGL6YSbFyMt0IiLzdYjP-dCq-SyztB7Gw",
  authDomain: "songguessinggamedata.firebaseapp.com",
  projectId: "songguessinggamedata",
  storageBucket: "songguessinggamedata.appspot.com",
  messagingSenderId: "924043746034",
  appId: "1:924043746034:web:840d05111b574464c38e6b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- Firebase Username Check ---
async function isUsernameTaken(username) {
    try {
        const querySnapshot = await db.collection("Scores").where("Username", "==", username).get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking username:', error);
        return true; // Assume username is taken to prevent issues
    }
}

// --- Firebase Submission ---
async function submitScore(username, score, timeTaken) {
    try {
        const usernameTaken = await isUsernameTaken(username);
        if (usernameTaken) {
            alert('This username is already taken. Please choose another one.');
            return;
        }

        await db.collection("Scores").add({
            Username: username,
            Score: score,
            "Time Taken": timeTaken,
            Timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Score submitted successfully!');
        // This function will be called from script.js, which has the button reference
        // We will disable the button from there.
    } catch (error) {
        console.error('Error submitting score to Firebase:', error);
        alert('Failed to submit score. Please check the console for details.');
    }
}
