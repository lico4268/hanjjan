const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
process.env.TZ = "Asia/Seoul";
// 라우트 파일 임포트
const authRoutes = require('./src/routes/authRoutes');
const loginRoutes = require('./src/routes/loginRoutes');
const userRoutes = require('./src/routes/userRoutes');
const meetingRoutes = require('./src/routes/meetingRoutes');
//const ratingRoutes = require('./src/routes/ratingRoutes');

// 환경 변수 설정
dotenv.config();

// Express 앱 생성
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 라우트 설정
app.use('/api/auth', authRoutes); // 이메일 인증
app.use('/api/users',loginRoutes);
app.use('/api/users', userRoutes); // 유저 정보 관련 api
app.use('/api/thread', meetingRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('API ');
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('error');
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`running on port ${PORT}`);
});