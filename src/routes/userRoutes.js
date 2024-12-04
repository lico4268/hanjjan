const express = require('express');
const pool = require('../config/database');


const app = express.Router();

app.post('/update',async(req,res)=>{
    const {userid,username, userprofile} = req.body;
    const conn = await pool.getConnection();

    try{
        const [result] = await conn.query(
            "UPDATE user SET userprofile = ? WHERE userid = ?",
            [userprofile,userid] 
        );

        if (result.length === 0) {
            return res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
          }

        conn.release();
        res.status(200).json({ message: '프로필이 성공적으로 업데이트되었습니다.' });
    } catch (err){
        console.log(err);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });    
    }


});

module.exports = app;
