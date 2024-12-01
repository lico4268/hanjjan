const express = require('express');
const session = require('express-session');
const pool = require('../config/database');
const router = express.Router();

function toMysqlFormat(date) {
  return date.getUTCFullYear() + "-" + 
         twoDigits(1 + date.getUTCMonth()) + "-" + 
         twoDigits(date.getUTCDate()) + " " + 
         twoDigits(date.getHours()) + ":" + 
         twoDigits(date.getUTCMinutes()) + ":" + 
         twoDigits(date.getUTCSeconds());
}

async function executeQuery(sql, params, res) {
  try {
      const conn = await pool.getConnection();
      const [rows] = await conn.execute(sql, params);
      conn.release();
      res.status(200).json({
          message: "요청 조회 성공",
          thread: rows
      });
  } catch (error) {
      console.error("Database query error:", error);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
}

router.post('/create', async (req, res) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }
  
    const { userId, place, tag, content, threadtime, maxParticipants } = req.body;
    if (!userId || !place || !tag|| !content || !threadtime || !maxParticipants) {
      return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
  }
    console.log(typeof threadtime);
    const createdAt = new Date(threadtime);
  
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute(
        'INSERT INTO thread(writerid, place, content, tag, threadtime, maxParticipants) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, place, content, tag, createdAt, parseInt(maxParticipants)]
      );
      // console.log(result);
      connection.release();
  
      res.status(200).json({
        message: '요청 쓰레드가 성공적으로 생성되었습니다.',
        threadId: result.insertId,
        createdThread : req.body
      });
    } catch (error) {
      console.error('쓰레드 생성 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  });

  router.get("/list",async(req,res)=>{
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