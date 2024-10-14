import React, { useState, useEffect } from "react";

import styled from "styled-components";
import Button from "./Button";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

const StyledDrawer = styled.div`
  width: ${(p) => p.width}px;
  color: #FFFFFF;
  font-weight: 600;
  padding: 0px 12px;
  background-color: rgb(59 130 246);
  transition-duration: 0.5s;
  box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
`;

function Drawer({ children }) {
  const [open, setOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // 창 크기에 맞춰 동적으로 너비를 설정
  const updateWindowWidth = () => {
    setWindowWidth(window.innerWidth);
  };

  // 창 크기 변경 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener('resize', updateWindowWidth);
    return () => window.removeEventListener('resize', updateWindowWidth);
  }, []);

  // Drawer 너비 설정: 창 너비에 비례하도록 설정
  const drawerWidth = open ? Math.max(windowWidth * 0.18, 250) : 70; // 창 너비의 30% 또는 최대 300px

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <StyledDrawer width={drawerWidth}>
      <Button size="sm" color="transparent" onClick={toggleDrawer}>
        <FontAwesomeIcon icon={faBars} />
      </Button>
      {open && children}
    </StyledDrawer>
  );
}

export default Drawer;