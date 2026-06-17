import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- PROFILE ENDPOINTS ---

// Get User Profile
app.get('/api/profile', async (req, res) => {
  try {
    const profile = await prisma.profile.findFirst();
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    
    // Parse JSON fields
    res.json({
      ...profile,
      oneRepMaxes: JSON.parse(profile.oneRepMaxes),
      injuryHistory: JSON.parse(profile.injuryHistory)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Save or Update Profile
app.post('/api/profile', async (req, res) => {
  try {
    const data = req.body;
    
    // Convert arrays/objects to JSON strings
    const payload = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      height: data.height,
      weight: data.weight,
      rhr: data.rhr,
      weeklyFrequency: data.weeklyFrequency,
      primarySport: data.primarySport,
      oneRepMaxes: JSON.stringify(data.oneRepMaxes || {}),
      injuryHistory: JSON.stringify(data.injuryHistory || [])
    };

    const existing = await prisma.profile.findFirst();
    if (existing) {
      const updated = await prisma.profile.update({
        where: { id: existing.id },
        data: payload
      });
      res.json(updated);
    } else {
      const created = await prisma.profile.create({ data: payload });
      res.json(created);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Delete Profile
app.delete('/api/profile', async (req, res) => {
  try {
    await prisma.profile.deleteMany();
    res.json({ message: 'Profile deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});


// --- LOGS ENDPOINTS ---

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'asc' }
    });
    
    const parsedLogs = logs.map((log: any) => ({
      ...log,
      timestamp: Number(log.timestamp),
      targetMuscles: JSON.parse(log.targetMuscles),
      injuredMuscles: JSON.parse(log.injuredMuscles)
    }));
    
    res.json(parsedLogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const data = req.body;
    const log = await prisma.activityLog.create({
      data: {
        id: data.id,
        timestamp: data.timestamp,
        activityType: data.activityType,
        duration: data.duration,
        intensity: data.intensity,
        targetMuscles: JSON.stringify(data.targetMuscles || []),
        nutrition: data.nutrition,
        sleep: data.sleep,
        stress: data.stress,
        hasInjury: data.hasInjury,
        injuredMuscles: JSON.stringify(data.injuredMuscles || []),
        painScale: data.painScale,
        notes: data.notes
      }
    });
    res.json({ ...log, timestamp: Number(log.timestamp) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

app.delete('/api/logs/:id', async (req, res) => {
  try {
    await prisma.activityLog.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Log deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

app.delete('/api/logs', async (req, res) => {
  try {
    await prisma.activityLog.deleteMany();
    res.json({ message: 'All logs deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete all logs' });
  }
});


// --- DOMS ENDPOINTS ---

app.get('/api/doms', async (req, res) => {
  try {
    const doms = await prisma.domsRecord.findMany();
    const domsMap: Record<string, number> = {};
    doms.forEach((d: any) => {
      domsMap[d.muscle] = d.value;
    });
    res.json(domsMap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch doms' });
  }
});

app.post('/api/doms', async (req, res) => {
  try {
    const domsMap = req.body; // Record<string, number>
    
    // Clear all existing
    await prisma.domsRecord.deleteMany();
    
    // Insert new
    const records = Object.entries(domsMap).map(([muscle, value]) => ({
      muscle,
      value: Number(value)
    }));
    
    if (records.length > 0) {
      await prisma.domsRecord.createMany({
        data: records
      });
    }
    
    res.json({ message: 'Doms updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save doms' });
  }
});

app.delete('/api/doms', async (req, res) => {
  try {
    await prisma.domsRecord.deleteMany();
    res.json({ message: 'All doms deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete all doms' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
