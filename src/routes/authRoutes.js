const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');
const { time } = require('console');
console.log(path.resolve(__dirname,"../../.env"))
dotenv.config({path:path.resolve(__dirname,"../../.env")});

//const app = express();
const router = express.Router();


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

/* for test 
router.get('/test',async(req,res)=>{
    // console.log(req.body);
    res.send('test')
    // res.status(200).json({message:"test"});
});*/

  //이메일 인증 요청 route
router.post('/sendVerification', async(req,res)=>{
    const {email} = req.body;
    console.log(req.body);

    const verificationCode = generateVerificationCode();
    const createdTime = Date.now(); // 저장된 시간
    //이메일 인증코드 저장
    verificationCode[email] = {code:verificationCode, createdTime};

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

  module.exports = router