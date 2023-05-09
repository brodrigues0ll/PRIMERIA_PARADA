import React from "react";
import styled, { keyframes } from "styled-components";
import Image from "next/image";
import logob from "../images/logoB.png";

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
  border: 5px solid #f95510;
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

    <Image src={logob} alt="Logo" width={100} height={100} />
  </div>
);

export default CircularProgress;
