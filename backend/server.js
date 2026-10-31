require('dns').setServers(['8.8.8.8', '1.1.1.1'])
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const State = mongoose.model('State', new mongoose.Schema({ data: Object }, { minimize: false }))

mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 8000 })
  .then(() => console.log('DB connected'))
  .catch((e) => console.log('DB error:', e.message))

mongoose.connection.on('disconnected', () => console.log('DB disconnected'))
const EMPTY = { clients: [], caregivers: [], bookings: [], audit: [], escrow: 0, session: { clientId: null, caregiverId: null } }

app.get('/api/state', async (req, res) => {
  const d = await State.findOne()
  res.json(d ? d.data : EMPTY)
})

app.put('/api/state', async (req, res) => {
  await State.findOneAndUpdate({}, { data: req.body }, { upsert: true })
  res.json({ ok: true })
})

app.listen(process.env.PORT || 5000, () => console.log('Server running'))