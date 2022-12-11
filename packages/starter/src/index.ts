// import 'source-map-support/register'
import * as rectangulr from "rectangulr";
import { AppModule } from "./app.module";

rectangulr
  .platform()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
