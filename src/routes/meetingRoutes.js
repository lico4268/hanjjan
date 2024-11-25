const express = require('express');
const pool = require('../config/database');
const router = express.Router();

router.post('/create', validateMeetingRequest, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { userId, content, maxParticipants } = req.body;
    const createdAt = new Date();
  
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(
        'INSERT INTO meeting_threads (user_id, content, created_at, max_participants) VALUES (?, ?, ?, ?)',
        [userId, content, createdAt, maxParticipants]
      );
      connection.release();
  
      res.status(201).json({
        message: '만남 요청 쓰레드가 성공적으로 생성되었습니다.',
        threadId: result.insertId
      });
    } catch (error) {
      console.error('쓰레드 생성 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  });
  
  module.exports = router;