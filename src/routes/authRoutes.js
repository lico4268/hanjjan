const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise')
const { time } = require('console');
// console.log(path.resolve(__dirname,"../../.env"))
dotenv.config({path:path.resolve(__dirname,"../../.env")});

//const app = express();
const router = express.Router();
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


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
    verificationCodes[email] = {code:verificationCode, createdTime};

    // 이메일 옵션 설정
  const mailOptions = {
    from: process.env.user1,
    to: email,
    subject: '이메일 인증',
    text: `귀하의 인증 코드는 ${verificationCode} 입니다. 코드는 3분뒤에 만료됩니다`
  };

  try{
    await transporter.sendMail(mailOptions);
    res.status(200).json({message:"인증 메일 전송 완료"});
    console.log(verificationCode);
  } catch(error){
    console.log("전송오류:", error);
    res.status(500).json({message:"이메일 전송 중 오류가 발생했습니다."});
  }
})

// 인증 코드 확인 route
router.post('/verify', (req, res) => {
    const { email, code } = req.body;
    const storedData = verificationCodes[email];

    if(!storedData){
      return res.status(400).json({message:'인증코드가 존재하지 않습니다'})
    }

    const {code: storedCode,createdTime}= storedData;
    const currentTime = Date.now(); // 현재 시간 가져오기
    const timeDifference = (currentTime - createdTime)/1000/60; // 분단위 계산
  

    if(timeDifference >3){
      delete verificationCodes[email];
      return res.status(400).json({message:"인증코드 만료"})
    }

    if (storedCode === code) {
      delete verificationCodes[email]; // 인증 후 코드 삭제
      res.status(200).json({message:"인증완료"})
    } else {
      res.status(400).json({message:"잘못된 코드 입력"})
    }
  });

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
  });

  module.exports = router