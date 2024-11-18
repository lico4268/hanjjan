const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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


app.post('sendVerification', async(req,res)=>{
    const {email} = req.body;
    console.log(req.body)

    const verificationCode = generateVerificationCode();

    //이메일 인증코드 저장
    verificationCode[email] = verificationCode;

    // 이메일 옵션 설정
  const mailOptions = {
    from: process.env.user,
    to: "lico9663@naver.com",
    subject: '이메일 인증',
    text: `귀하의 인증 코드는 ${verificationCode} 입니다.`
  };

  try{
    await transporter.sendMail(mailOptions);
    res.status(200).json({message:"인증 메일 전송 완료"});
  } catch(error){
    console.log("전송오류:", error);
    res.status(500).json({message:"이메일 전송 중 오류가 발생했습니다."});
  }
})

// 인증 코드 확인
app.post('/verify', (req, res) => {
    const { email, code } = req.body;
  
    if (verificationCodes[email] === code) {
      delete verificationCodes[email]; // 인증 후 코드 삭제
      res.status(200).json({message:"인증완료"})
    } else {
      res.status(400).json({message:"잘못된 코드 입력"})
    }
  });