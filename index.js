const express = require('express');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const appointmentsRouter = require;
dotenv.config();

// Initialize Firebase admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
  databaseURL: `https://appointmentbookingsystem-30212.firebaseio.com`,
});

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

// Registration
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password,});
    res.json(userRecord);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const token = await admin.auth().createCustomToken(userRecord.uid);
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(401).json({ error: 'Invalid email or password.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Reference to the appointments collection in Firebase Realtime Database
const appointmentsRef = admin.database().ref('appointments');

// Function to validate appointment data
function validateAppointmentData(data) {
  if (!data.date || !data.time || !data.user || !data.status) 
    throw new Error('Missing appointment data.');
}

// Create a new appointment
async function createAppointment(appointmentData) {
  try {
    validateAppointmentData(appointmentData);
    const newAppointmentRef = appointmentsRef.push();
    await newAppointmentRef.set(appointmentData);
    return newAppointmentRef.key;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw new Error('Failed to create appointment.');
  }
}

// Retrieve all appointments
async function getAppointments() {
  try {
    const snapshot = await appointmentsRef.once('value');
    const appointments = snapshot.val();
    return appointments;
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw new Error('Failed to get appointments.');
  }
}

// Retrieve a specific appointment by ID
async function getAppointmentById(appointmentId) {
  try {
    const snapshot = await appointmentsRef.child(appointmentId).once('value');
    const appointment = snapshot.val();
    if (!appointment) 
      throw new Error('Appointment not found.');
    return appointment;
  } catch (error) {
    console.error('Error getting appointment:', error);
    throw new Error('Failed to get appointment.');
  }
}

// Update a specific appointment by ID
async function updateAppointmentById(appointmentId, updatedAppointmentData) {
  try {
    validateAppointmentData(updatedAppointmentData);
    await appointmentsRef.child(appointmentId).update(updatedAppointmentData);
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new Error('Failed to update appointment.');
  }
}

// Delete a specific appointment by ID
async function deleteAppointmentById(appointmentId) {
  try {
    await appointmentsRef.child(appointmentId).remove();
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw new Error('Failed to delete appointment.');
  }
}

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentById,
  deleteAppointmentById,
};