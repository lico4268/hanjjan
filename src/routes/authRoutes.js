const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');
const { time } = require('console');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const pool = require('../config/database');
const { create } = require('domain');

// console.log(path.resolve(__dirname,"../../.env"))
dotenv.config({path:path.resolve(__dirname,"../../.env")});

//const app = express();
const router = express.Router();

async function checkTempid(email){
  const connection = await pool.getConnection();
  try{
    console.log('데이터베이스 연결 성공');

    const [rows] = await connection.execute(
      "select case when exists ( select 1 from authTemp where email = ?) then 1 else 0 end as result;"
      ,[email]);
      
      
      console.log(rows[0].result);
      return rows[0].result;


  } catch(err){
    console.log(err);
  } finally{
    connection.release();
  }
}

// 인증 코드 저장을 위한 임시 저장소 데이터 베이스로 구현 필요
const verificationCodes = {};

//nodemailer transporter 설정
const transporter = nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:587,
    secure:false,
    auth: {
      user: process.env.user,
      pass: process.env.pass
    }
  });

  // 인증 코드 생성 함수
function generateVerificationCode() {
    return crypto.randomBytes(3).toString('hex');
  }



  //이메일 인증 요청 route
router.post('/send-verification', async(req,res)=>{
    const {email} = req.body;
    console.log(req.body);

    const verificationCode = generateVerificationCode();
    const createdTime = Date.now(); // 저장된 시간
    //이메일 인증코드 저장 -> DB 연동 필요
    // verificationCodes[email] = {code:verificationCode, createdTime};


      // 이메일 옵션 설정
    const mailOptions = {
      from: process.env.user1,
      to: email,
      subject: '이메일 인증',
      text: `귀하의 인증 코드는 ${verificationCode} 입니다. 코드는 3분뒤에 만료됩니다`
    };

    try{
      await transporter.sendMail(mailOptions);
      // res.status(200).json({message:"인증 메일 전송 완료"});
      console.log(verificationCode);
    } catch(error){
      console.log("전송오류:", error);
      return res.status(500).json({message:"이메일 전송 중 오류가 발생했습니다."});
    }

    // 같은 이메일 인 경우 인증 코드 갱신
    if( await checkTempid(email)){
      // console.log("이미 존재하는 이메일");
      let connection;
      try{
        connection = await pool.getConnection();
        const [result] = await connection.query(
          'update authTemp set verificationCode = ?, createdAt = current_timestamp where email = ?;',[verificationCode,email]);
        
        res.status(200).json({message:"인증코드 갱신"});
      }catch(err){
        console.log(err);
        res.status(400).json({message:'인증코드가 존재하지 않습니다'});
      }finally{
        if(connection) connection.release();
      }
      return;
    }

    // db에 전송
    try{
      
      const connection = await pool.getConnection();
      console.log('데이터베이스 연결 성공');

      // 임시 아이디 생성
      let tempId;
      tempId = uuidv4();
      

        // db에 저장
      const [result] = await connection.query(
        'INSERT INTO authTemp(tempid,email,verificationCode) VALUES(?,?,?);',
        [tempId,email,verificationCode]
      );

      console.log(result);
      connection.release();
      return res.status(200).json({message:"메일 전송 완료"}) 
      
    } catch(err){
      console.log(err);
      return res.status(500).json({ error: '데이터베이스 연결 실패' });
    }
})

// 인증 코드 확인 route
router.post('/verify', async (req, res) => {
      const { email, code } = req.body;

      

      const storedData = verificationCodes[email];
      let res_row;
      console.log("asdf"+checkTempid(email))
      // 인증 코드를 받은적 있는지 검사
      if(! await checkTempid(email)){
        console.log("없음");
        return res.status(400).json({message:'인증코드가 존재하지 않습니다'});
      }
      // console.log(checkTempid(email));

      try{
        const conn = await pool.getConnection();

        const [result] = await conn.query("select * from authTemp where email = ?",[email]);
        [res_row] = result;
        conn.release();

      } catch(error){
        console.log(error);
      }

      const createdAt = moment(res_row.createdAt); 
      const now = moment();

      // db 에 저장된 시간과 현재 시간 차이 계산
      const diff = moment.duration(now.diff(createdAt)); 
      
      // 인증 코드 몇분 후 만료
      if(diff.asMinutes() >3){
        return res.status(400).json({message:"인증코드 만료"})
      }

      if (res_row.verificationCode === code) {
        // delete verificationCodes[email]; // 인증 후 코드 삭제
        
        try{
          const conn = await pool.getConnection();
  
          const [result] = await conn.query("update authTemp set verified = ? where email = ?",[1,email]);
          conn.release();
          return res.status(200).json({message:"인증완료"});

        } catch(error){
          console.log(error);
        }

      } else {
        return res.status(400).json({message:"잘못된 코드 입력"});
      }

  });


  /*           for test 
router.get('/test-db', async (req, res) => {
    try {
      const connection = await pool.getConnection();
      console.log('데이터베이스 연결 성공');
      
      const [result] = await connection.query('SELECT * from authTemp;');
      console.log(result);
      connection.release();
      
      res.json({ message: '데이터베이스 연결 성공' });
    } catch (error) {
      console.error('데이터베이스 연결 실패:', error);
      res.status(500).json({ error: '데이터베이스 연결 실패' });
    }
  }); //        test end                */ 

  module.exports = router