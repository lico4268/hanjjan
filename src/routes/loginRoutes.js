const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/database');

const app = express.Router();
app.use(bodyParser.json());

// 회원가입 API
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 입력값 검증
    if (!password) res.status(400).json({ message: "PW를 입력하세요." });

    // 암호화된 비밀번호 생성
    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      'INSERT INTO user(userid, userpassword) VALUES(?,?);',
      [email,hashedPassword]
    );

    return res.status(201).json({message:"회원 가입 성공"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "서버 오류" });
  } finally{
    if (connection) connection.release();
  }
});


app.post("/login", async(req,res)=>{
  const { email ,password } = req.body;

  try{

  if (!email || !password) {
    return res.status(400).json({ message: "Email과 PW를 입력하세요." });
  }

  const connection = await pool.getConnection();

  const [results] = await connection.query(
    "SELECT * FROM  user WHERE  userid = ?;" ,[email]);

    if(results.length === 0 ){
      return res.status(401)({message : "존재하지 않는 사용자입니다."});
    }

    const user  = results[0];

    const check = await bcrypt.compare(password,user.userpassword);
    if (!check){
        return res.status(400).json({ message: "아이디 또는 비밀번호를 잘못입력하셨습니다." });
    }

    res.status(200).json({message : "로그인 성공"});
  } catch (err){
    console.log(err);
    return res.status(500).json({message:"서버 오류"});
  } finally{
    if (connection) connection.release();
  }
});

module.exports = app;
