import React from "react";
import styled, { keyframes } from "styled-components";
import Image from "next/image";
import logo from "../../public/assets/images/LOGO-2.png";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Circle = styled.div`
  color: #ffffff;
  width: 200px;
  height: 200px;
  border-radius: 100px;
  border: 5px solid rgb(160, 31, 31);
  border-top-color: #ffffff;
  animation: ${rotate} 1s linear infinite;
  position: absolute;
  display: flex;
`;

const CircularProgress = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "99vh",
    }}
  >
    <Circle />

    <Image src={logo} alt="Logo" width={100} height={100} />
  </div>
);

export default CircularProgress;
