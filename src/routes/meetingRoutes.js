const express = require('express');
const pool = require('../config/database');
const router = express.Router();

router.post('/create', async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { userId, place, tag, content, threadtime, maxParticipants } = req.body;
    const createdAt = new Date();
  
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(
        'INSERT INTO threads(writerid, place, content, tag, threadtime, maxParticipants) VALUES (?, ?, ?, ?, ?, ?)',
        [userid, place, content, tag, threadtime, maxParticipants]
      );
      connection.release();
  
      res.status(200).json({
        message: '요청 쓰레드가 성공적으로 생성되었습니다.',
        threadId: result.insertId
      });
    } catch (error) {
      console.error('쓰레드 생성 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  });

  router.get("list",async(req,res)=>{
    try{
      const conn = await pool.getConnection();
      const [rows] = await conn.execute(
        'SELECT writerid, place,content, tag, threadtime, maxParticipants, creationTime FROM thread ORDER BY creationTime DESC'
      );
      conn.release();
      res.status(200).json({
        message:'요청 조회 성공',
        thread: rows
      })
    } catch(error){
      console.log("글 목록 조회 오류", error);
      res.status(500).json({message:'error on server'})
    }
  });
  
  module.exports = router;