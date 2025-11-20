const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

exports.interview = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(400).send("Please send a POST request");
    }

    const { role, type, level, techstack, amount } = req.body;

    try {
      const docRef = await admin.firestore().collection("interviews").add({
        role,
        type,
        level,
        techstack,
        amount,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.status(200).send({ success: true, id: docRef.id });
    } catch (error) {
      return res.status(500).send({ success: false, error: error.message });
    }
  });
});
  