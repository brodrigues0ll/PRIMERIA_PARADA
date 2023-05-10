import React, { useEffect, useState } from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import { database } from "@/services/firebase";
import comandas from "../orders/comandas.json";

import {
  collection,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";

const index = () => {
  return <div>index</div>;
};

export default index;
