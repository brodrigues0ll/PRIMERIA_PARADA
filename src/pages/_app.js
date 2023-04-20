import { Box } from "@mui/material";

export default function App({ Component, pageProps }) {
  return (
    <Box
      sx={{
        maxWidth: "400px",
        margin: "0 auto",
        border: "1px solid #ccc",
      }}
    >
      <Component {...pageProps} />
    </Box>
  );
}
