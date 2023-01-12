// import 'source-map-support/register'
import { AppModule } from './app.module'
import { platformRectangulr } from 'rectangulr'

platformRectangulr()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err))
