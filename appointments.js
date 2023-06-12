const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const appointmentsRef = admin.database().ref('appointments');

// Check if the user is authenticated
function isAuthenticated(req, res, next) {
  const token = req.headers.authorization;
  if (!token) 
    return res.status(401).json({ error: 'Unauthorized.' });
  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      req.user = decodedToken;
      next();
    })
    .catch((error) => {
      console.error('Error verifying token:', error);
      res.status(401).json({ error: 'Unauthorized.' });
    });
}

// Retrieve all appointments
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const snapshot = await appointmentsRef.once('value');
    const appointments = snapshot.val();
    res.json(appointments);
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({ error: 'Failed to get appointments.' });
  }
});

// Create a new appointment
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const appointmentData = req.body;
    validateAppointmentData(appointmentData);
    const newAppointmentRef = appointmentsRef.push();
    await newAppointmentRef.set(appointmentData);
    res.json({ id: newAppointmentRef.key });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment.' });
  }
});

// Retrieve a specific appointment by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  const appointmentId = req.params.id;
  try {
    const snapshot = await appointmentsRef.child(appointmentId).once('value');
    const appointment = snapshot.val();
    if (!appointment) 
      res.status(404).json({ error: 'Appointment not found.' });
    else 
      res.json(appointment);
  } catch (error) {
    console.error('Error getting appointment:', error);
    res.status(500).json({ error: 'Failed to get appointment.' });
  }
});

// Update a specific appointment by ID
router.put('/:id', isAuthenticated, async (req, res) => {
  const appointmentId = req.params.id;
  const updatedAppointmentData = req.body;
  try {
    validateAppointmentData(updatedAppointmentData);
    await appointmentsRef.child(appointmentId).update(updatedAppointmentData);
    res.json({ message: 'Appointment updated successfully.' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment.' });
  }
});

// Delete a specific appointment by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
  const appointmentId = req.params.id;
  try {
    await appointmentsRef.child(appointmentId).remove();
    res.json({ message: 'Appointment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment.' });
  }
});
module.exports = router;