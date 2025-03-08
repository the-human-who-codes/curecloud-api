/* eslint-disable object-curly-spacing */
/* eslint-disable no-tabs */
/* eslint-disable indent */
/* disable es-lint */

const functions = require("firebase-functions");
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));

/**
 * Middleware to verify Firebase ID Token
 * @param {Object} req - The Express request object
 * @param {Object} res - The Express response object
 * @param {Function} next - The next middleware function to call
 * @return {void}
 */
async function verifyToken(req, res, next) {
	const token =
		req.headers.authorization &&
		req.headers.authorization.split("Bearer ")[1];

	if (!token) {
		return res.status(401).send("Authorization token required");
	}

	try {
		const decodedToken = await admin.auth().verifyIdToken(token);
		req.user = decodedToken; // Attach user info to the request object
		next(); // Token is valid, proceed with the request
	} catch (error) {
		return res.status(401).send("Unauthorized: Invalid or expired token");
	}
}

/**
 * Test route to fetch a user from Firestore (requires authentication)
 * @param {Object} req - The Express request object
 * @param {Object} res - The Express response object
 * @returns {void}
 */
app.get("/get-user", verifyToken, async (req, res) => {
	try {
		const userRef = db.collection("Users").doc(req.user.uid);
		const doc = await userRef.get();

		if (!doc.exists) {
			return res.status(404).send("User not found");
		}

		res.status(200).json(doc.data());
	} catch (error) {
		console.error("Error fetching user:", error);
		res.status(500).send("Failed to fetch user");
	}
});

app.get("/", verifyToken, async (req, res) => {
	res.send("Welcome to curecloud-api");
});

// Export the API as a Firebase function
/**
 * Firebase function to handle the API requests
 * @type {functions.HttpsFunction}
 */
exports.api = functions.https.onRequest(app);
