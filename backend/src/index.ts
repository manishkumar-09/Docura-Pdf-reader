import express from "express";
import { configs } from "./config/env";
import helmet from "helmet";
import router from "./routes/api.routes";
import cors from "cors";
const app = express();
configs.PORT || 4000;

app.use(express.json());
app.use(helmet());
app.use(
  cors({
    origin: "https://docura-pdf-reader.vercel.app/",
    credentials: true,
  })
);

app.use("/api", router);

app.listen(configs.PORT, (): void => {
  console.log(`server is listening at Port ${configs.PORT}`);
});
