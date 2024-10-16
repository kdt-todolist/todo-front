import React from 'react';
import { FaGoogle } from "react-icons/fa";
import { FaGithubAlt } from 'react-icons/fa';
import { FaDiscord } from 'react-icons/fa';
import Button from "../Common/Button";

const LoginForm = () => {
  const handleGoogleLogin = () => {
    // 구글 OAuth 요청을 백엔드로 보냄
    window.location.href = 'http://localhost:1009/auth/google';
  };

  return (
    <div className="grid gap-5">
      <Button
        size="lg"
        color="green"
        border="pill"
        onClick={handleGoogleLogin} // 버튼 클릭 시 구글 로그인 요청
      >
        <FaGoogle style={{ width: '36px', height: '36px', marginRight: '10px' }}/>
        구글 로그인
      </Button>
      {/*
      <Button
        size="lg"
        color="indigo"
        border="pill"
      >
        <FaDiscord style={{ width: '36px', height: '36px', marginRight: '10px' }}/>
        디스코드 로그인
      </Button>
      <Button
        size="lg"
        color="gray"
        border="pill"
      >
        <FaGithubAlt style={{ width: '36px', height: '36px', marginRight: '10px' }}/>
        깃허브 로그인
      </Button>*/}
    </div>
  );
}

export default LoginForm;